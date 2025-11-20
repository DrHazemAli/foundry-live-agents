package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"os"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type SessionState int

const (
	StateDisconnected SessionState = iota
	StateConnecting
	StateConnected
	StateReconnecting
	StateError
)

func (s SessionState) String() string {
	return []string{"disconnected", "connecting", "connected", "reconnecting", "error"}[s]
}

type Metrics struct {
	ConnectTime      time.Time
	ReconnectCount   int
	MessagesSent     int
	MessagesReceived int
	Errors           int
	LastPingTime     time.Time
	LastPongTime     time.Time
	AverageLatency   float64
}

type SessionManager struct {
	apiKey    string
	region    string
	deployment string
	config    map[string]interface{}

	conn            *websocket.Conn
	state           SessionState
	sessionID       string
	reconnectAttempts int

	metrics Metrics

	stopKeepalive chan struct{}
}

func NewSessionManager(apiKey, region, deployment string, config map[string]interface{}) *SessionManager {
	return &SessionManager{
		apiKey:     apiKey,
		region:     region,
		deployment: deployment,
		config:     config,
		state:      StateDisconnected,
	}
}

func (sm *SessionManager) Connect() error {
	if sm.state == StateConnecting || sm.state == StateConnected {
		fmt.Println("⚠️  Already connected or connecting")
		return nil
	}

	sm.state = StateConnecting
	fmt.Printf("🔌 Connecting to Voice Live API... (attempt %d)\n", sm.reconnectAttempts+1)

	url := fmt.Sprintf("wss://%s.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=%s", sm.region, sm.deployment)
	headers := map[string][]string{
		"api-key": {sm.apiKey},
	}

	var err error
	sm.conn, _, err = websocket.DefaultDialer.Dial(url, headers)
	if err != nil {
		fmt.Printf("❌ Connection failed: %v\n", err)
		sm.metrics.Errors++
		return err
	}

	sm.state = StateConnected
	sm.metrics.ConnectTime = time.Now()
	sm.reconnectAttempts = 0

	fmt.Println("✅ Connected successfully\n")

	if err := sm.ConfigureSession(); err != nil {
		return err
	}

	sm.StartKeepalive()

	return nil
}

func (sm *SessionManager) ConfigureSession() error {
	sessionConfig := map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"model":      "gpt-4o-realtime-preview",
			"modalities": []string{"text", "audio"},
			"voice":      "alloy",
			"instructions": "You are a helpful assistant with session management.",
			"input_audio_format":         "pcm16",
			"output_audio_format":        "pcm16",
			"turn_detection":             nil,
			"temperature":                0.8,
			"max_response_output_tokens": 1024,
		},
	}

	if err := sm.Send(sessionConfig); err != nil {
		return err
	}

	fmt.Println("⚙️  Session configured\n")
	return nil
}

func (sm *SessionManager) Send(data interface{}) error {
	if sm.state != StateConnected || sm.conn == nil {
		fmt.Println("⚠️  Cannot send - not connected")
		return fmt.Errorf("not connected")
	}

	if err := sm.conn.WriteJSON(data); err != nil {
		return err
	}

	sm.metrics.MessagesSent++
	return nil
}

func (sm *SessionManager) SendMessage(text string) error {
	fmt.Printf("\n💬 You: %s\n\n", text)

	if err := sm.Send(map[string]interface{}{
		"type": "response.create",
		"response": map[string]interface{}{
			"modalities":   []string{"text"},
			"instructions": text,
		},
	}); err != nil {
		return err
	}

	return nil
}

func (sm *SessionManager) StartKeepalive() {
	keepaliveInterval := time.Duration(sm.config["keepalive_interval"].(int)) * time.Millisecond
	sm.stopKeepalive = make(chan struct{})

	fmt.Printf("💓 Keepalive started (interval: %dms)\n\n", int(keepaliveInterval.Milliseconds()))

	go func() {
		ticker := time.NewTicker(keepaliveInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if sm.state == StateConnected {
					sm.metrics.LastPingTime = time.Now()
					fmt.Println("🏓 Sending ping...")

					sm.Send(map[string]interface{}{
						"type":      "ping",
						"timestamp": sm.metrics.LastPingTime.UnixMilli(),
					})
				}
			case <-sm.stopKeepalive:
				return
			}
		}
	}()
}

func (sm *SessionManager) HandleEvent(event map[string]interface{}) {
	sm.metrics.MessagesReceived++

	eventType, ok := event["type"].(string)
	if !ok {
		return
	}

	switch eventType {
	case "session.created":
		if session, ok := event["session"].(map[string]interface{}); ok {
			if id, ok := session["id"].(string); ok {
				sm.sessionID = id
				fmt.Printf("📡 Session created: %s\n", sm.sessionID)
			}
		}

	case "session.updated":
		fmt.Println("✅ Session updated")

	case "pong":
		sm.metrics.LastPongTime = time.Now()
		latency := sm.metrics.LastPongTime.Sub(sm.metrics.LastPingTime).Milliseconds()
		sm.metrics.AverageLatency = sm.metrics.AverageLatency*0.9 + float64(latency)*0.1
		fmt.Printf("🏓 Pong received (latency: %dms, avg: %.0fms)\n", latency, sm.metrics.AverageLatency)

	case "response.text.delta":
		if delta, ok := event["delta"].(string); ok {
			fmt.Print(delta)
		}

	case "response.text.done":
		fmt.Println()

	case "error":
		sm.metrics.Errors++
		fmt.Printf("❌ Error: %v\n", event["error"])
	}
}

func (sm *SessionManager) Reconnect() error {
	maxAttempts := sm.config["max_reconnect_attempts"].(int)

	if sm.reconnectAttempts >= maxAttempts {
		fmt.Printf("\n❌ Max reconnection attempts (%d) reached\n", maxAttempts)
		sm.state = StateError
		return fmt.Errorf("max reconnect attempts reached")
	}

	sm.state = StateReconnecting
	sm.reconnectAttempts++
	sm.metrics.ReconnectCount++

	// Exponential backoff with jitter
	baseDelay := float64(sm.config["reconnect_delay"].(int)) / 1000.0
	exponentialDelay := baseDelay * math.Pow(2, float64(sm.reconnectAttempts-1))
	jitter := rand.Float64()
	delay := math.Min(exponentialDelay+jitter, 30)

	fmt.Printf("\n🔄 Scheduling reconnection in %.1fs... (attempt %d/%d)\n", delay, sm.reconnectAttempts, maxAttempts)
	time.Sleep(time.Duration(delay * float64(time.Second)))

	return sm.Connect()
}

func (sm *SessionManager) PrintMetrics() {
	uptime := time.Since(sm.metrics.ConnectTime).Seconds()

	fmt.Println()
	fmt.Println(strings.Repeat("=", 60))
	fmt.Println("📊 SESSION METRICS")
	fmt.Println(strings.Repeat("=", 60))
	fmt.Printf("State:              %s\n", sm.state)
	fmt.Printf("Session ID:         %s\n", sm.sessionID)
	fmt.Printf("Uptime:             %.1fs\n", uptime)
	fmt.Printf("Reconnections:      %d\n", sm.metrics.ReconnectCount)
	fmt.Printf("Messages sent:      %d\n", sm.metrics.MessagesSent)
	fmt.Printf("Messages received:  %d\n", sm.metrics.MessagesReceived)
	fmt.Printf("Errors:             %d\n", sm.metrics.Errors)
	fmt.Printf("Average latency:    %.0fms\n", sm.metrics.AverageLatency)
	fmt.Println(strings.Repeat("=", 60))
	fmt.Println()
}

func (sm *SessionManager) Disconnect() {
	fmt.Println("\n🛑 Disconnecting...")

	if sm.stopKeepalive != nil {
		close(sm.stopKeepalive)
	}

	if sm.conn != nil {
		sm.conn.Close()
		sm.conn = nil
	}

	sm.state = StateDisconnected
}

func main() {
	rand.Seed(time.Now().UnixNano())

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	apiKey := os.Getenv("AZURE_SPEECH_KEY")
	region := os.Getenv("AZURE_SPEECH_REGION")
	deployment := os.Getenv("DEPLOYMENT_NAME")
	if deployment == "" {
		deployment = "gpt-4o-realtime-preview"
	}

	fmt.Println("🎛️  Starting Session Management Sample (Go)...")
	fmt.Println()

	config := map[string]interface{}{
		"max_reconnect_attempts": 5,
		"reconnect_delay":        1000,
		"keepalive_interval":     15000,
		"connection_timeout":     10,
	}

	manager := NewSessionManager(apiKey, region, deployment, config)

	if err := manager.Connect(); err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer manager.Disconnect()

	time.Sleep(2 * time.Second)

	// Test conversation
	if err := manager.SendMessage("Hello! This is a test message."); err != nil {
		log.Fatal("Failed to send message:", err)
	}

	// Process events
	done := make(chan bool)
	go func() {
		count := 0
		for {
			var event map[string]interface{}
			if err := manager.conn.ReadJSON(&event); err != nil {
				log.Println("Read error:", err)
				done <- true
				return
			}

			manager.HandleEvent(event)

			if eventType, ok := event["type"].(string); ok && eventType == "response.done" {
				count++
				if count >= 2 {
					done <- true
					return
				}

				time.Sleep(5 * time.Second)
				manager.SendMessage("Tell me a fun fact.")
			}
		}
	}()

	// Wait for responses and keepalive demonstration
	<-done

	time.Sleep(20 * time.Second)

	manager.PrintMetrics()

	fmt.Println("\n🎉 Session management demo complete!\n")
}
