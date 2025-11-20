package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type Document struct {
	ID       string
	Title    string
	Content  string
	Category string
}

var knowledgeBase = []Document{
	{
		ID:       "doc_001",
		Title:    "Employee Vacation Policy",
		Content:  "Employees receive 15 days of paid vacation per year. Vacation days must be requested at least 2 weeks in advance. Unused vacation days roll over up to a maximum of 5 days.",
		Category: "HR",
	},
	{
		ID:       "doc_002",
		Title:    "Health Insurance Benefits",
		Content:  "The company offers comprehensive health insurance including medical, dental, and vision coverage. Employee contribution is 20% of premium cost. Family coverage is available.",
		Category: "HR",
	},
	{
		ID:       "doc_003",
		Title:    "Remote Work Policy",
		Content:  "Employees may work remotely up to 3 days per week with manager approval. Remote work equipment is provided. Core hours of 10 AM - 3 PM must be maintained.",
		Category: "HR",
	},
	{
		ID:       "doc_004",
		Title:    "API Authentication",
		Content:  "All API requests require authentication using an API key in the header: 'Authorization: Bearer YOUR_API_KEY'. API keys can be generated in the developer portal.",
		Category: "Engineering",
	},
	{
		ID:       "doc_005",
		Title:    "Sales Commission Structure",
		Content:  "Sales representatives earn a base salary plus 10% commission on all sales. Quarterly bonuses are available for exceeding targets by 20% or more.",
		Category: "Sales",
	},
	{
		ID:       "doc_006",
		Title:    "Customer Return Policy",
		Content:  "Products can be returned within 30 days of purchase for a full refund. Items must be in original condition with receipt. Shipping costs are non-refundable.",
		Category: "Customer Service",
	},
}

func searchDocuments(query string, topK int) []Document {
	queryLower := strings.ToLower(query)
	keywords := strings.Fields(queryLower)

	type ScoredDoc struct {
		doc   Document
		score float64
	}

	var scored []ScoredDoc

	for _, doc := range knowledgeBase {
		score := 0.0
		titleLower := strings.ToLower(doc.Title)
		contentLower := strings.ToLower(doc.Content)

		// Title match bonus
		for _, keyword := range keywords {
			if strings.Contains(titleLower, keyword) {
				score += 2.0
			}
			if strings.Contains(contentLower, keyword) {
				score += 1.0
			}
			// Keyword frequency
			score += float64(strings.Count(contentLower, keyword)) * 0.5
		}

		if score > 0 {
			scored = append(scored, ScoredDoc{doc, score})
		}
	}

	// Sort by score
	for i := 0; i < len(scored); i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].score > scored[i].score {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	// Return top K
	results := []Document{}
	limit := topK
	if limit > len(scored) {
		limit = len(scored)
	}
	for i := 0; i < limit; i++ {
		results = append(results, scored[i].doc)
	}

	return results
}

var functionDefinition = map[string]interface{}{
	"type":        "function",
	"name":        "search_documents",
	"description": "Search the knowledge base for relevant documents",
	"parameters": map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"query": map[string]string{
				"type":        "string",
				"description": "Search query",
			},
			"top_k": map[string]interface{}{
				"type":        "number",
				"description": "Number of results to return",
				"default":     3,
			},
		},
		"required": []string{"query"},
	},
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

	fmt.Println("📚 Starting VoiceRAG Pattern Sample (Go)...")
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

	// Configure session with RAG
	config := map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"model":      "gpt-4o-realtime-preview",
			"modalities": []string{"text", "audio"},
			"voice":      "alloy",
			"instructions": `You are a helpful assistant with access to a knowledge base.
When users ask questions, ALWAYS use the search_documents function to find relevant information.
Cite your sources by mentioning the document titles.`,
			"input_audio_format":         "pcm16",
			"output_audio_format":        "pcm16",
			"turn_detection":             nil,
			"tools":                      []interface{}{functionDefinition},
			"tool_choice":                "auto",
			"temperature":                0.8,
			"max_response_output_tokens": 1024,
		},
	}

	if err := conn.WriteJSON(config); err != nil {
		log.Fatal("Failed to send config:", err)
	}

	fmt.Printf("📖 Knowledge base: %d documents loaded\n\n", len(knowledgeBase))

	time.Sleep(time.Second)

	// Test queries
	queries := []string{
		"What's the vacation policy?",
		"Tell me about remote work options",
	}

	queryIndex := 0

	sendQuery := func(text string) error {
		fmt.Printf("\n💬 You: %s\n\n", text)
		return conn.WriteJSON(map[string]interface{}{
			"type": "response.create",
			"response": map[string]interface{}{
				"modalities":   []string{"text"},
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
			fmt.Println("✅ Session updated with RAG capabilities")

		case "response.function_call_arguments.done":
			funcName := event["name"].(string)
			argsJSON := event["arguments"].(string)
			callID := event["call_id"].(string)

			var args map[string]interface{}
			json.Unmarshal([]byte(argsJSON), &args)

			fmt.Printf("🔍 Searching knowledge base...\n")
			fmt.Printf("   Query: %s\n", args["query"])

			query := args["query"].(string)
			topK := 3
			if k, ok := args["top_k"].(float64); ok {
				topK = int(k)
			}

			results := searchDocuments(query, topK)

			fmt.Printf("   Found %d documents\n\n", len(results))

			// Format results
			var resultStrings []string
			for _, doc := range results {
				resultStrings = append(resultStrings, fmt.Sprintf(
					"Document: %s\nCategory: %s\nContent: %s",
					doc.Title, doc.Category, doc.Content,
				))
			}
			resultJSON, _ := json.Marshal(resultStrings)

			// Send results
			conn.WriteJSON(map[string]interface{}{
				"type": "conversation.item.create",
				"item": map[string]interface{}{
					"type":    "function_call_output",
					"call_id": callID,
					"output":  string(resultJSON),
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
				fmt.Println("🎉 VoiceRAG demo complete!\n")
				return
			}

		case "error":
			fmt.Printf("❌ Error: %v\n", event["error"])
		}
	}
}
