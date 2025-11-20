package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type StreamingHandler struct {
	startTime  time.Time
	tokenCount int
	buffer     string
}

func NewStreamingHandler() *StreamingHandler {
	return &StreamingHandler{}
}

func (h *StreamingHandler) StartResponse() {
	h.startTime = time.Now()
	h.tokenCount = 0
	h.buffer = ""
	fmt.Println("🚀 Streaming started...\n")
}

func (h *StreamingHandler) HandleDelta(delta string) {
	fmt.Print(delta)
	h.buffer += delta
	h.tokenCount++
}

func (h *StreamingHandler) HandleDone(text string) {
	duration := time.Since(h.startTime).Milliseconds()
	tokensPerSec := float64(h.tokenCount) / (float64(duration) / 1000.0)

	fmt.Println("\n")
	fmt.Println("📊 Text metrics:")
	fmt.Printf("   Duration: %dms\n", duration)
	fmt.Printf("   Tokens: %d\n", h.tokenCount)
	fmt.Printf("   Speed: %.1f tokens/sec\n", tokensPerSec)
	fmt.Printf("   Length: %d characters\n\n", len(text))
}

type SentenceBuffer struct {
	buffer    string
	sentences []string
}

func NewSentenceBuffer() *SentenceBuffer {
	return &SentenceBuffer{
		sentences: []string{},
	}
}

func (sb *SentenceBuffer) Add(delta string) []string {
	sb.buffer += delta
	newSentences := []string{}

	// Extract complete sentences
	re := regexp.MustCompile(`([^.!?]+[.!?])\s*`)
	matches := re.FindAllString(sb.buffer, -1)

	for _, match := range matches {
		sentence := strings.TrimSpace(match)
		if sentence != "" {
			newSentences = append(newSentences, sentence)
			sb.sentences = append(sb.sentences, sentence)
		}
	}

	// Remove extracted sentences from buffer
	for _, sentence := range newSentences {
		sb.buffer = strings.Replace(sb.buffer, sentence, "", 1)
	}
	sb.buffer = strings.TrimSpace(sb.buffer)

	return newSentences
}

func (sb *SentenceBuffer) Flush() string {
	remaining := sb.buffer
	sb.buffer = ""
	return remaining
}

func demonstrateImmediateStreaming(conn *websocket.Conn) error {
	fmt.Println()
	fmt.Println(strings.Repeat("=", 70))
	fmt.Println("DEMO 1: Immediate Streaming (token-by-token)")
	fmt.Println(strings.Repeat("=", 70))
	fmt.Println()

	handler := NewStreamingHandler()
	isStreaming := false

	if err := conn.WriteJSON(map[string]interface{}{
		"type": "response.create",
		"response": map[string]interface{}{
			"modalities":   []string{"text"},
			"instructions": "Tell me a short story about a robot learning to paint.",
		},
	}); err != nil {
		return err
	}

	for {
		var event map[string]interface{}
		if err := conn.ReadJSON(&event); err != nil {
			return err
		}

		eventType := event["type"].(string)

		switch eventType {
		case "response.text.delta":
			if !isStreaming {
				handler.StartResponse()
				isStreaming = true
			}
			handler.HandleDelta(event["delta"].(string))
		case "response.text.done":
			handler.HandleDone(event["text"].(string))
			return nil
		}
	}
}

func demonstrateSentenceBuffering(conn *websocket.Conn) error {
	fmt.Println()
	fmt.Println(strings.Repeat("=", 70))
	fmt.Println("DEMO 2: Sentence Buffering (emit complete sentences)")
	fmt.Println(strings.Repeat("=", 70))
	fmt.Println()

	buffer := NewSentenceBuffer()
	sentenceCount := 0

	if err := conn.WriteJSON(map[string]interface{}{
		"type": "response.create",
		"response": map[string]interface{}{
			"modalities":   []string{"text"},
			"instructions": "Explain how photosynthesis works in three sentences.",
		},
	}); err != nil {
		return err
	}

	for {
		var event map[string]interface{}
		if err := conn.ReadJSON(&event); err != nil {
			return err
		}

		eventType := event["type"].(string)

		switch eventType {
		case "response.text.delta":
			sentences := buffer.Add(event["delta"].(string))
			for _, sentence := range sentences {
				sentenceCount++
				fmt.Printf("[Sentence %d] %s\n\n", sentenceCount, sentence)
			}
		case "response.text.done":
			remaining := buffer.Flush()
			if remaining != "" {
				fmt.Printf("[Remainder] %s\n\n", remaining)
			}
			fmt.Printf("📊 Total sentences emitted: %d\n\n", sentenceCount)
			return nil
		}
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

	fmt.Println("🌊 Starting Streaming Responses Sample (Go)...")
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

	// Configure session
	config := map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"model":                      "gpt-4o-realtime-preview",
			"modalities":                 []string{"text", "audio"},
			"voice":                      "alloy",
			"instructions":               "You are a helpful assistant. Be concise and clear.",
			"input_audio_format":         "pcm16",
			"output_audio_format":        "pcm16",
			"turn_detection":             nil,
			"temperature":                0.8,
			"max_response_output_tokens": 512,
		},
	}

	if err := conn.WriteJSON(config); err != nil {
		log.Fatal("Failed to send config:", err)
	}

	time.Sleep(time.Second)

	// Run demonstrations
	if err := demonstrateImmediateStreaming(conn); err != nil {
		log.Println("Demo 1 error:", err)
	}

	time.Sleep(2 * time.Second)

	if err := demonstrateSentenceBuffering(conn); err != nil {
		log.Println("Demo 2 error:", err)
	}

	fmt.Println("\n🎉 Streaming demonstrations complete!\n")
}
