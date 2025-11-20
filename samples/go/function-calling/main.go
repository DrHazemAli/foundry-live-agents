package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type FunctionDefinition struct {
	Type       string                 `json:"type"`
	Name       string                 `json:"name"`
	Description string                `json:"description"`
	Parameters map[string]interface{} `json:"parameters"`
}

var functions = []FunctionDefinition{
	{
		Type:        "function",
		Name:        "get_weather",
		Description: "Get current weather for a location",
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"location": map[string]string{
					"type":        "string",
					"description": "City name",
				},
			},
			"required": []string{"location"},
		},
	},
	{
		Type:        "function",
		Name:        "get_stock_price",
		Description: "Get current stock price",
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol": map[string]string{
					"type":        "string",
					"description": "Stock symbol (e.g., AAPL)",
				},
			},
			"required": []string{"symbol"},
		},
	},
	{
		Type:        "function",
		Name:        "schedule_meeting",
		Description: "Schedule a meeting",
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"title": map[string]string{
					"type":        "string",
					"description": "Meeting title",
				},
				"time": map[string]string{
					"type":        "string",
					"description": "Meeting time",
				},
			},
			"required": []string{"title", "time"},
		},
	},
}

func executeFunction(name string, args map[string]interface{}) string {
	switch name {
	case "get_weather":
		location := args["location"].(string)
		temps := []string{"72°F", "68°F", "75°F", "70°F"}
		conditions := []string{"sunny", "partly cloudy", "clear", "cloudy"}
		return fmt.Sprintf("The weather in %s is %s and %s",
			location, temps[rand.Intn(len(temps))], conditions[rand.Intn(len(conditions))])

	case "get_stock_price":
		symbol := args["symbol"].(string)
		price := 100 + rand.Float64()*50
		change := -5 + rand.Float64()*10
		return fmt.Sprintf("%s is trading at $%.2f (%.2f%%)", symbol, price, change)

	case "schedule_meeting":
		title := args["title"].(string)
		meetingTime := args["time"].(string)
		return fmt.Sprintf("Scheduled '%s' for %s", title, meetingTime)

	default:
		return fmt.Sprintf("Unknown function: %s", name)
	}
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

	fmt.Println("📞 Starting Function Calling Sample (Go)...")
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

	// Configure session with functions
	config := map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"model":                        "gpt-4o-realtime-preview",
			"modalities":                   []string{"text", "audio"},
			"voice":                        "alloy",
			"instructions":                 "You are a helpful assistant with access to functions. When users ask about weather, stocks, or scheduling, use the appropriate function.",
			"input_audio_format":           "pcm16",
			"output_audio_format":          "pcm16",
			"turn_detection":               nil,
			"tools":                        functions,
			"tool_choice":                  "auto",
			"temperature":                  0.8,
			"max_response_output_tokens":   1024,
		},
	}

	if err := conn.WriteJSON(config); err != nil {
		log.Fatal("Failed to send config:", err)
	}

	time.Sleep(time.Second)

	// Test queries
	queries := []string{
		"What's the weather in San Francisco?",
		"Get me the stock price for MSFT",
	}

	queryIndex := 0

	// Send first query
	sendQuery := func(text string) error {
		fmt.Printf("\n💬 You: %s\n\n", text)
		return conn.WriteJSON(map[string]interface{}{
			"type": "response.create",
			"response": map[string]interface{}{
				"modalities": []string{"text"},
				"instructions": fmt.Sprintf("User query: %s", text),
			},
		})
	}

	if err := sendQuery(queries[queryIndex]); err != nil {
		log.Fatal("Failed to send query:", err)
	}
	queryIndex++

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
			fmt.Println("✅ Session updated with functions")
			fmt.Printf("   Available: get_weather, get_stock_price, schedule_meeting\n\n")

		case "response.function_call_arguments.delta":
			if delta, ok := event["delta"].(string); ok {
				fmt.Print(delta)
			}

		case "response.function_call_arguments.done":
			funcName := event["name"].(string)
			argsJSON := event["arguments"].(string)
			callID := event["call_id"].(string)

			var args map[string]interface{}
			json.Unmarshal([]byte(argsJSON), &args)

			fmt.Printf("\n🔧 Calling function: %s\n", funcName)
			fmt.Printf("   Arguments: %v\n", args)

			result := executeFunction(funcName, args)
			fmt.Printf("   Result: %s\n\n", result)

			// Send result back
			conn.WriteJSON(map[string]interface{}{
				"type": "conversation.item.create",
				"item": map[string]interface{}{
					"type":    "function_call_output",
					"call_id": callID,
					"output":  result,
				},
			})
			conn.WriteJSON(map[string]interface{}{"type": "response.create"})

		case "response.text.delta":
			if delta, ok := event["delta"].(string); ok {
				fmt.Print(delta)
			}

		case "response.text.done":
			fmt.Println()

		case "response.done":
			fmt.Println("✅ Response complete\n")

			if queryIndex < len(queries) {
				time.Sleep(2 * time.Second)
				if err := sendQuery(queries[queryIndex]); err != nil {
					log.Println("Failed to send query:", err)
					break
				}
				queryIndex++
			} else {
				fmt.Println("🎉 Function calling demo complete!\n")
				return
			}

		case "error":
			fmt.Printf("❌ Error: %v\n", event["error"])
		}
	}
}
