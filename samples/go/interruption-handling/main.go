package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type InterruptionHandler struct {
	conn                *websocket.Conn
	assistantIsSpeaking bool
	currentResponseID   string
	partialResponse     string
	interruptionCount   int
}

func NewInterruptionHandler(conn *websocket.Conn) *InterruptionHandler {
	return &InterruptionHandler{
		conn: conn,
	}
}

func (h *InterruptionHandler) HandleSpeechStarted() error {
	if h.assistantIsSpeaking {
		h.interruptionCount++
		fmt.Printf("\n\n🚨 INTERRUPTION DETECTED!\n")
		fmt.Printf("   (Total interruptions: %d)\n", h.interruptionCount)
		return h.CancelCurrentResponse()
	} else {
		fmt.Println("\n👂 User started speaking...")
	}
	return nil
}

func (h *InterruptionHandler) HandleSpeechStopped() {
	if !h.assistantIsSpeaking {
		fmt.Println("🔇 User stopped speaking\n")
	}
}

func (h *InterruptionHandler) HandleResponseStarted(responseID string) {
	h.assistantIsSpeaking = true
	h.currentResponseID = responseID
	h.partialResponse = ""
	fmt.Println("\n🤖 Assistant: ")
}

func (h *InterruptionHandler) HandleTextDelta(delta string) {
	fmt.Print(delta)
	h.partialResponse += delta
}

func (h *InterruptionHandler) HandleResponseDone() {
	fmt.Println()
	h.assistantIsSpeaking = false
	h.currentResponseID = ""

	if h.partialResponse != "" {
		fmt.Printf("📝 Complete response (%d chars)\n\n", len(h.partialResponse))
	}
}

func (h *InterruptionHandler) HandleResponseCanceled() {
	fmt.Println("\n❌ Response CANCELED")

	if h.partialResponse != "" {
		fmt.Printf("📄 Partial response before interruption:\n")
		fmt.Printf("   \"%s\"\n\n", h.partialResponse)
	}

	h.assistantIsSpeaking = false
	h.currentResponseID = ""
}

func (h *InterruptionHandler) CancelCurrentResponse() error {
	if h.currentResponseID == "" {
		fmt.Println("   ⚠️  No active response to cancel")
		return nil
	}

	fmt.Printf("   🛑 Canceling response: %s\n", h.currentResponseID)

	return h.conn.WriteJSON(map[string]interface{}{
		"type":        "response.cancel",
		"response_id": h.currentResponseID,
	})
}

func (h *InterruptionHandler) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"total_interruptions":     h.interruptionCount,
		"currently_interruptible": h.assistantIsSpeaking,
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	apiKey := os.Getenv("AZURE_SPEECH_KEY")
	region := os.Getenv("AZURE_SPEECH_REGION")
	deployment := os.Getenv("DEPLOYMENT_NAME")
	if deployment == "" {
		deployment = "gpt-4o-realtime-preview"
	}

	fmt.Println("🚨 Starting Interruption Handling Sample (Go)...")
	fmt.Println()

	url := fmt.Sprintf("wss://%s.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=%s", region, deployment)
	headers := map[string][]string{
		"api-key": {apiKey},
	}

	conn, _, err := websocket.DefaultDialer.Dial(url, headers)
	if err != nil {
		log.Fatal("Connection failed:", err)
	}
	defer conn.Close()

	fmt.Println("✅ Connected to Voice Live API")
	fmt.Println()

	handler := NewInterruptionHandler(conn)

	// Configure session
	config := map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"model":      "gpt-4o-realtime-preview",
			"modalities": []string{"text", "audio"},
			"voice":      "alloy",
			"instructions": `You are a helpful assistant in an interruptible conversation.
Keep your responses conversational. If interrupted, that's completely normal.`,
			"input_audio_format":  "pcm16",
			"output_audio_format": "pcm16",
			"input_audio_transcription": map[string]string{
				"model": "whisper-1",
			},
			"turn_detection": nil,
			"temperature":                0.8,
			"max_response_output_tokens": 1024,
		},
	}

	if err := conn.WriteJSON(config); err != nil {
		log.Fatal("Failed to send config:", err)
	}

	fmt.Println("⚙️  Session configured with interruption support")
	fmt.Println()

	time.Sleep(time.Second)

	// Test messages
	testMessages := []string{
		"Tell me a long story about space exploration.",
		"Actually, can you make it shorter?",
	}

	messageIndex := 0

	sendMessage := func(text string) error {
		fmt.Printf("\n💬 You: %s\n\n", text)
		return conn.WriteJSON(map[string]interface{}{
			"type": "response.create",
			"response": map[string]interface{}{
				"modalities":   []string{"text"},
				"instructions": text,
			},
		})
	}

	if err := sendMessage(testMessages[messageIndex]); err != nil {
		log.Fatal("Failed to send message:", err)
	}
	messageIndex++

	// Event loop
	for {
		var event map[string]interface{}
		if err := conn.ReadJSON(&event); err != nil {
			log.Println("Read error:", err)
			break
		}

		eventType, ok := event["type"].(string)
		if !ok {
			continue
		}

		switch eventType {
		case "session.updated":
			fmt.Println("✅ Session updated\n")

		case "input_audio_buffer.speech_started":
			handler.HandleSpeechStarted()

		case "input_audio_buffer.speech_stopped":
			handler.HandleSpeechStopped()

		case "response.created":
			if respID, ok := event["response"].(map[string]interface{})["id"].(string); ok {
				handler.HandleResponseStarted(respID)
			}

		case "response.text.delta":
			if delta, ok := event["delta"].(string); ok {
				handler.HandleTextDelta(delta)
			}

		case "response.done":
			handler.HandleResponseDone()

			if messageIndex < len(testMessages) {
				time.Sleep(2 * time.Second)
				if err := sendMessage(testMessages[messageIndex]); err != nil {
					log.Println("Failed to send message:", err)
					break
				}
				messageIndex++
			} else {
				time.Sleep(time.Second)
				stats := handler.GetStats()
				fmt.Println("\n📊 Final Statistics:")
				fmt.Printf("   Total interruptions handled: %d\n\n", stats["total_interruptions"])
				fmt.Println("🎉 Sample complete!\n")
				return
			}

		case "response.canceled":
			handler.HandleResponseCanceled()

		case "error":
			fmt.Printf("❌ Error: %v\n", event["error"])
		}
	}
}
