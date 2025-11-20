package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type Message struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:",inline"`
}

type SessionConfig struct {
	Type    string  `json:"type"`
	Session Session `json:"session"`
}

type Session struct {
	Model              string         `json:"model"`
	Modalities         []string       `json:"modalities"`
	Voice              string         `json:"voice"`
	Instructions       string         `json:"instructions"`
	InputAudioFormat   string         `json:"input_audio_format"`
	OutputAudioFormat  string         `json:"output_audio_format"`
	TurnDetection      TurnDetection  `json:"turn_detection"`
	Temperature        float64        `json:"temperature"`
	MaxResponseTokens  int            `json:"max_response_output_tokens"`
}

type TurnDetection struct {
	Type              string `json:"type"`
	Threshold         float64 `json:"threshold"`
	SilenceDurationMs int    `json:"silence_duration_ms"`
}

func main() {
	// Load environment
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	apiKey := os.Getenv("AZURE_SPEECH_KEY")
	region := os.Getenv("AZURE_SPEECH_REGION")
	deployment := os.Getenv("DEPLOYMENT_NAME")
	if deployment == "" {
		deployment = "gpt-4o-realtime-preview"
	}

	fmt.Println("🎤 Starting Basic Voice Agent (Go)...")
	fmt.Println()

	// WebSocket connection
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
	config := SessionConfig{
		Type: "session.update",
		Session: Session{
			Model:              "gpt-4o-realtime-preview",
			Modalities:         []string{"text", "audio"},
			Voice:              "alloy",
			Instructions:       "You are a helpful assistant.",
			InputAudioFormat:   "pcm16",
			OutputAudioFormat:  "pcm16",
			TurnDetection: TurnDetection{
				Type:              "server_vad",
				Threshold:         0.5,
				SilenceDurationMs: 500,
			},
			Temperature:       0.8,
			MaxResponseTokens: 1024,
		},
	}

	if err := conn.WriteJSON(config); err != nil {
		log.Fatal("Failed to send config:", err)
	}

	// Channel for graceful shutdown
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	// Handle messages
	done := make(chan struct{})

	go func() {
		defer close(done)
		for {
			var event map[string]interface{}
			if err := conn.ReadJSON(&event); err != nil {
				log.Println("Read error:", err)
				return
			}

			eventType, ok := event["type"].(string)
			if !ok {
				continue
			}

			switch eventType {
			case "session.created":
				fmt.Printf("📡 Session created: %v\n", event["session"])
			case "session.updated":
				fmt.Println("✅ Session updated")
			case "input_audio_buffer.speech_started":
				fmt.Println("👂 User started speaking...")
			case "input_audio_buffer.speech_stopped":
				fmt.Println("🔇 User stopped speaking")
			case "input_audio_transcription.completed":
				if transcript, ok := event["transcript"].(string); ok && transcript != "" {
					fmt.Printf("📝 You: %s\n", transcript)
				}
			case "response.text.delta":
				if delta, ok := event["delta"].(string); ok {
					fmt.Print(delta)
				}
			case "response.text.done":
				if text, ok := event["text"].(string); ok {
					fmt.Printf("\n🤖 Assistant: %s\n\n", text)
				}
			case "response.done":
				fmt.Println("✅ Response complete")
			case "error":
				fmt.Printf("❌ Error: %v\n", event["error"])
			}
		}
	}()

	// Wait for interrupt
	<-interrupt
	fmt.Println("\n\n👋 Shutting down...")

	// Close connection
	err = conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	if err != nil {
		log.Println("Close error:", err)
		return
	}

	<-done
	fmt.Println("🎉 Disconnected!")
}
