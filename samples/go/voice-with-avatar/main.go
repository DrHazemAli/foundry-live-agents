package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type Viseme struct {
	VisemeID    int       `json:"viseme_id"`
	AudioOffset int       `json:"audio_offset"`
	Timestamp   time.Time `json:"timestamp"`
}

type VoiceAvatarServer struct {
	apiKey     string
	region     string
	deployment string

	conn         *websocket.Conn
	visemeQueue  []Viseme
	visemeMutex  sync.Mutex
	httpUpgrader websocket.Upgrader
}

func NewVoiceAvatarServer(apiKey, region, deployment string) *VoiceAvatarServer {
	return &VoiceAvatarServer{
		apiKey:      apiKey,
		region:      region,
		deployment:  deployment,
		visemeQueue: []Viseme{},
		httpUpgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (s *VoiceAvatarServer) ConnectVoiceLive() error {
	url := fmt.Sprintf("wss://%s.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=%s", s.region, s.deployment)
	headers := http.Header{}
	headers.Add("api-key", s.apiKey)

	var err error
	s.conn, _, err = websocket.DefaultDialer.Dial(url, headers)
	if err != nil {
		return err
	}

	fmt.Println("✅ Connected to Voice Live API\n")

	return s.ConfigureSession()
}

func (s *VoiceAvatarServer) ConfigureSession() error {
	config := map[string]interface{}{
		"type": "session.update",
		"session": map[string]interface{}{
			"model":      "gpt-4o-realtime-preview",
			"modalities": []string{"text", "audio"},
			"voice":      "en-US-EmmaMultilingualNeural",
			"instructions": "You are a friendly AI assistant with a visual avatar. Keep responses conversational and engaging.",
			"input_audio_format":         "pcm16",
			"output_audio_format":        "pcm16",
			"turn_detection":             nil,
			"temperature":                0.8,
			"max_response_output_tokens": 1024,
		},
	}

	if err := s.conn.WriteJSON(config); err != nil {
		return err
	}

	fmt.Println("⚙️  Session configured with viseme support\n")
	return nil
}

func (s *VoiceAvatarServer) HandleVisemes() {
	go func() {
		for {
			var event map[string]interface{}
			if err := s.conn.ReadJSON(&event); err != nil {
				log.Println("Read error:", err)
				return
			}

			eventType, ok := event["type"].(string)
			if !ok {
				continue
			}

			switch eventType {
			case "response.audio.viseme":
				visemeID := int(event["viseme_id"].(float64))
				audioOffset := int(event["audio_offset"].(float64))

				viseme := Viseme{
					VisemeID:    visemeID,
					AudioOffset: audioOffset,
					Timestamp:   time.Now(),
				}

				s.visemeMutex.Lock()
				s.visemeQueue = append(s.visemeQueue, viseme)
				s.visemeMutex.Unlock()

				fmt.Printf("👄 Viseme %d at %dms\n", visemeID, audioOffset)

			case "response.text.delta":
				if delta, ok := event["delta"].(string); ok {
					fmt.Print(delta)
				}

			case "response.text.done":
				fmt.Println()

			case "response.done":
				s.visemeMutex.Lock()
				count := len(s.visemeQueue)
				s.visemeMutex.Unlock()
				fmt.Printf("✅ Response complete - %d visemes captured\n\n", count)
			}
		}
	}()
}

func (s *VoiceAvatarServer) SendMessage(text string) error {
	fmt.Printf("\n💬 Speaking: \"%s\"\n\n", text)

	s.visemeMutex.Lock()
	s.visemeQueue = []Viseme{}
	s.visemeMutex.Unlock()

	return s.conn.WriteJSON(map[string]interface{}{
		"type": "response.create",
		"response": map[string]interface{}{
			"modalities":   []string{"text"},
			"instructions": text,
		},
	})
}

func (s *VoiceAvatarServer) HandleHTTPVisemes(w http.ResponseWriter, r *http.Request) {
	s.visemeMutex.Lock()
	visemes := s.visemeQueue
	s.visemeQueue = []Viseme{}
	s.visemeMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]Viseme{
		"visemes": visemes,
	})
}

func (s *VoiceAvatarServer) HandleHTTPSpeak(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Text string `json:"text"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if request.Text == "" {
		http.Error(w, "No text provided", http.StatusBadRequest)
		return
	}

	if err := s.SendMessage(request.Text); err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "speaking",
	})
}

func (s *VoiceAvatarServer) HandleHTTPIndex(w http.ResponseWriter, r *http.Request) {
	html := `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Voice Live Avatar</title><style>body{margin:0;padding:20px;font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;flex-direction:column;align-items:center;min-height:100vh}h1{color:white;margin-bottom:30px}#avatar-canvas{background:white;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}.controls{margin-top:30px;display:flex;gap:15px}input{padding:12px 20px;border:none;border-radius:25px;font-size:16px;width:400px}button{padding:12px 30px;background:#667eea;color:white;border:none;border-radius:25px;font-size:16px;cursor:pointer}button:hover{background:#764ba2}.status{margin-top:20px;color:white;font-size:14px}</style></head><body><h1>🎭 Voice Live Avatar Demo</h1><canvas id="avatar-canvas" width="400" height="400"></canvas><div class="controls"><input type="text" id="text-input" placeholder="Type something for the avatar to say..."/><button id="speak-btn">Speak</button></div><div class="status" id="status">Ready</div><script>const canvas=document.getElementById('avatar-canvas');const ctx=canvas.getContext('2d');const textInput=document.getElementById('text-input');const speakBtn=document.getElementById('speak-btn');const status=document.getElementById('status');let currentViseme=0;let isAnimating=false;const visemeShapes={0:{width:0.2,height:0.1},1:{width:0.6,height:0.4},2:{width:0.7,height:0.5},6:{width:0.4,height:0.2},7:{width:0.3,height:0.3},15:{width:0.5,height:0.15},19:{width:0.5,height:0.3},21:{width:0.3,height:0.2}};function drawAvatar(visemeId=0){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(200,200,120,0,Math.PI*2);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(160,170,12,0,Math.PI*2);ctx.arc(240,170,12,0,Math.PI*2);ctx.fill();const shape=visemeShapes[visemeId]||visemeShapes[0];const mouthWidth=60*shape.width;const mouthHeight=40*shape.height;ctx.fillStyle='#FF6B6B';ctx.beginPath();ctx.ellipse(200,240,mouthWidth,mouthHeight,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.arc(160,150,20,Math.PI,Math.PI*1.5);ctx.arc(240,150,20,Math.PI*1.5,Math.PI*2);ctx.stroke()}function animateViseme(visemeId){currentViseme=visemeId;drawAvatar(visemeId);setTimeout(()=>{if(!isAnimating)drawAvatar(0)},100)}async function pollVisemes(){if(!isAnimating)return;try{const response=await fetch('/visemes');const data=await response.json();if(data.visemes&&data.visemes.length>0){data.visemes.forEach((v,i)=>{setTimeout(()=>animateViseme(v.viseme_id),i*50)})}}catch(error){console.error('Error polling visemes:',error)}setTimeout(pollVisemes,100)}async function speak(){const text=textInput.value.trim();if(!text)return;status.textContent='Speaking...';isAnimating=true;pollVisemes();try{await fetch('/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});setTimeout(()=>{isAnimating=false;status.textContent='Ready';drawAvatar(0)},3000)}catch(error){console.error('Error:',error);status.textContent='Error occurred';isAnimating=false}}speakBtn.onclick=speak;textInput.onkeypress=(e)=>{if(e.key==='Enter')speak()};drawAvatar(0);</script></body></html>`
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
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

	fmt.Println("🎭 Starting Voice Avatar Sample (Go)...")
	fmt.Println()

	server := NewVoiceAvatarServer(apiKey, region, deployment)

	if err := server.ConnectVoiceLive(); err != nil {
		log.Fatal("Failed to connect:", err)
	}

	server.HandleVisemes()

	// HTTP server
	http.HandleFunc("/", server.HandleHTTPIndex)
	http.HandleFunc("/visemes", server.HandleHTTPVisemes)
	http.HandleFunc("/speak", server.HandleHTTPSpeak)

	fmt.Println("🌐 Avatar server running at http://localhost:8000")
	fmt.Println("   Open in your browser to see the avatar\n")

	if err := http.ListenAndServe(":8000", nil); err != nil {
		log.Fatal("HTTP server error:", err)
	}
}
