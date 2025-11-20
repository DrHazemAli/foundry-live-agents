package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

var voiceMap = map[string]string{
	"en": "en-US-EmmaMultilingualNeural",
	"es": "es-ES-ElviraNeural",
	"fr": "fr-FR-DeniseNeural",
	"de": "de-DE-KatjaNeural",
	"it": "it-IT-ElsaNeural",
	"ja": "ja-JP-NanamiNeural",
	"ko": "ko-KR-SunHiNeural",
	"zh": "zh-CN-XiaoxiaoNeural",
	"pt": "pt-BR-FranciscaNeural",
	"ar": "ar-SA-ZariyahNeural",
	"hi": "hi-IN-SwaraNeural",
	"ru": "ru-RU-SvetlanaNeural",
}

var languageNames = map[string]string{
	"en": "English",
	"es": "Spanish",
	"fr": "French",
	"de": "German",
	"it": "Italian",
	"ja": "Japanese",
	"ko": "Korean",
	"zh": "Chinese",
	"pt": "Portuguese",
	"ar": "Arabic",
	"hi": "Hindi",
	"ru": "Russian",
}

type LanguageDetector struct {
	patterns map[string]*regexp.Regexp
}

func NewLanguageDetector() *LanguageDetector {
	return &LanguageDetector{
		patterns: map[string]*regexp.Regexp{
			"es": regexp.MustCompile(`\b(hola|gracias|por favor|buenos días)\b`),
			"fr": regexp.MustCompile(`\b(bonjour|merci|s'il vous plaît)\b`),
			"de": regexp.MustCompile(`\b(hallo|danke|bitte)\b`),
			"it": regexp.MustCompile(`\b(ciao|grazie|prego)\b`),
			"pt": regexp.MustCompile(`\b(olá|obrigado|por favor)\b`),
			"ja": regexp.MustCompile(`[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]`),
			"ko": regexp.MustCompile(`[\uAC00-\uD7AF]`),
			"zh": regexp.MustCompile(`[\u4E00-\u9FFF]`),
			"ar": regexp.MustCompile(`[\u0600-\u06FF]`),
			"hi": regexp.MustCompile(`[\u0900-\u097F]`),
			"ru": regexp.MustCompile(`[\u0400-\u04FF]`),
		},
	}
}

func (ld *LanguageDetector) Detect(text string) string {
	for lang, pattern := range ld.patterns {
		if pattern.MatchString(text) {
			return lang
		}
	}
	return "en"
}

type MultiLanguageAgent struct {
	conn            *websocket.Conn
	currentLanguage string
	detector        *LanguageDetector
	detectedLangs   map[string]bool
}

func NewMultiLanguageAgent(conn *websocket.Conn) *MultiLanguageAgent {
	return &MultiLanguageAgent{
		conn:            conn,
		currentLanguage: "en",
		detector:        NewLanguageDetector(),
		detectedLangs:   make(map[string]bool),
	}
}

func (agent *MultiLanguageAgent) SwitchLanguage(lang string) error {
	if lang == agent.currentLanguage {
		return nil
	}

	voice, ok := voiceMap[lang]
	if !ok {
		return fmt.Errorf("unsupported language: %s", lang)
	}

	agent.currentLanguage = lang
	agent.detectedLangs[lang] = true

	fmt.Printf("\n🌍 Switching to %s (voice: %s)\n\n", languageNames[lang], voice)

	return agent.conn.WriteJSON(map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"voice": voice,
		},
	})
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

	fmt.Println("🌍 Starting Multi-Language Sample (Go)...")
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

	agent := NewMultiLanguageAgent(conn)

	// Configure session
	config := map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"model":                      "gpt-4o-realtime-preview",
			"modalities":                 []string{"text", "audio"},
			"voice":                      voiceMap["en"],
			"instructions":               "You are a multilingual assistant. Respond in the same language as the user's input.",
			"input_audio_format":         "pcm16",
			"output_audio_format":        "pcm16",
			"turn_detection":             nil,
			"temperature":                0.8,
			"max_response_output_tokens": 1024,
		},
	}

	if err := conn.WriteJSON(config); err != nil {
		log.Fatal("Failed to send config:", err)
	}

	time.Sleep(time.Second)

	// Test messages
	testMessages := []struct {
		text string
		lang string
	}{
		{"Hello! How are you?", "en"},
		{"Hola, ¿cómo estás?", "es"},
		{"Bonjour, comment allez-vous?", "fr"},
		{"Hallo, wie geht es dir?", "de"},
		{"こんにちは", "ja"},
	}

	messageIndex := 0

	sendMessage := func(text, lang string) error {
		fmt.Printf("\n💬 You (%s): %s\n\n", languageNames[lang], text)

		if err := agent.SwitchLanguage(lang); err != nil {
			return err
		}

		return conn.WriteJSON(map[string]interface{}{
			"type": "response.create",
			"response": map[string]interface{}{
				"modalities":   []string{"text"},
				"instructions": fmt.Sprintf("Respond to: %s", text),
			},
		})
	}

	if err := sendMessage(testMessages[messageIndex].text, testMessages[messageIndex].lang); err != nil {
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
			fmt.Println("✅ Session updated")

		case "response.text.delta":
			if delta, ok := event["delta"].(string); ok {
				fmt.Print(delta)
			}

		case "response.text.done":
			fmt.Println()

		case "response.done":
			fmt.Println("✅ Response complete\n")

			if messageIndex < len(testMessages) {
				time.Sleep(2 * time.Second)
				msg := testMessages[messageIndex]
				if err := sendMessage(msg.text, msg.lang); err != nil {
					log.Println("Failed to send message:", err)
					break
				}
				messageIndex++
			} else {
				fmt.Println("\n📊 Summary:")
				fmt.Printf("   Languages detected: %d\n", len(agent.detectedLangs))
				for lang := range agent.detectedLangs {
					fmt.Printf("   - %s\n", languageNames[lang])
				}
				fmt.Println("\n🎉 Multi-language demo complete!\n")
				return
			}

		case "error":
			fmt.Printf("❌ Error: %v\n", event["error"])
		}
	}
}
