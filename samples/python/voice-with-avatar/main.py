import asyncio
import json
import os
import websockets
from aiohttp import web
from dotenv import load_dotenv

load_dotenv()

class VoiceAvatarServer:
    def __init__(self, api_key: str, region: str, deployment: str):
        self.api_key = api_key
        self.region = region
        self.deployment = deployment
        self.ws = None
        self.viseme_queue = []
    
    async def connect_voice_live(self):
        url = f"wss://{self.region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment={self.deployment}"
        headers = {"api-key": self.api_key}
        
        self.ws = await websockets.connect(url, extra_headers=headers)
        print("✅ Connected to Voice Live API\n")
        
        await self.configure_session()
    
    async def configure_session(self):
        session_config = {
            "type": "session.update",
            "session": {
                "model": "gpt-4o-realtime-preview",
                "modalities": ["text", "audio"],
                "voice": "en-US-EmmaMultilingualNeural",
                "instructions": "You are a friendly AI assistant with a visual avatar. Keep responses conversational and engaging.",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "silence_duration_ms": 500
                },
                "temperature": 0.8,
                "max_response_output_tokens": 1024
            }
        }
        
        await self.ws.send(json.dumps(session_config))
        print("⚙️  Session configured with viseme support\n")
    
    async def handle_visemes(self):
        async for message in self.ws:
            event = json.loads(message)
            event_type = event.get("type")
            
            if event_type == "response.audio.viseme":
                viseme = {
                    "viseme_id": event["viseme_id"],
                    "audio_offset": event["audio_offset"],
                    "timestamp": asyncio.get_event_loop().time()
                }
                self.viseme_queue.append(viseme)
                print(f"👄 Viseme {viseme['viseme_id']} at {viseme['audio_offset']}ms")
            
            elif event_type == "response.text.delta":
                print(event['delta'], end='', flush=True)
            
            elif event_type == "response.text.done":
                print()
            
            elif event_type == "response.done":
                print(f"✅ Response complete - {len(self.viseme_queue)} visemes captured\n")
    
    async def send_message(self, text: str):
        print(f"\n💬 Speaking: \"{text}\"\n")
        self.viseme_queue = []
        
        await self.ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": text}]
            }
        }))
        
        await self.ws.send(json.dumps({"type": "response.create"}))

# HTTP server handlers
async def handle_visemes(request):
    server = request.app['voice_server']
    visemes = server.viseme_queue
    server.viseme_queue = []
    return web.json_response({"visemes": visemes})

async def handle_speak(request):
    server = request.app['voice_server']
    data = await request.json()
    text = data.get('text')
    
    if text:
        await server.send_message(text)
        return web.json_response({"status": "speaking"})
    else:
        return web.json_response({"error": "No text provided"}, status=400)

async def handle_index(request):
    html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Voice Live Avatar</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    h1 { color: white; margin-bottom: 30px; }
    #avatar-canvas {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .controls {
      margin-top: 30px;
      display: flex;
      gap: 15px;
    }
    input {
      padding: 12px 20px;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      width: 400px;
    }
    button {
      padding: 12px 30px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      cursor: pointer;
    }
    button:hover { background: #764ba2; }
    .status { margin-top: 20px; color: white; font-size: 14px; }
  </style>
</head>
<body>
  <h1>🎭 Voice Live Avatar Demo</h1>
  <canvas id="avatar-canvas" width="400" height="400"></canvas>
  <div class="controls">
    <input type="text" id="text-input" placeholder="Type something for the avatar to say..." />
    <button id="speak-btn">Speak</button>
  </div>
  <div class="status" id="status">Ready</div>
  <script>
    const canvas = document.getElementById('avatar-canvas');
    const ctx = canvas.getContext('2d');
    const textInput = document.getElementById('text-input');
    const speakBtn = document.getElementById('speak-btn');
    const status = document.getElementById('status');
    
    let currentViseme = 0;
    let isAnimating = false;
    
    const visemeShapes = {
      0: { width: 0.2, height: 0.1 },
      1: { width: 0.6, height: 0.4 },
      2: { width: 0.7, height: 0.5 },
      6: { width: 0.4, height: 0.2 },
      7: { width: 0.3, height: 0.3 },
      15: { width: 0.5, height: 0.15 },
      19: { width: 0.5, height: 0.3 },
      21: { width: 0.3, height: 0.2 }
    };
    
    function drawAvatar(visemeId = 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Head
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(200, 200, 120, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(160, 170, 12, 0, Math.PI * 2);
      ctx.arc(240, 170, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth
      const shape = visemeShapes[visemeId] || visemeShapes[0];
      const mouthWidth = 60 * shape.width;
      const mouthHeight = 40 * shape.height;
      
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.ellipse(200, 240, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyebrows
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(160, 150, 20, Math.PI, Math.PI * 1.5);
      ctx.arc(240, 150, 20, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();
    }
    
    function animateViseme(visemeId) {
      currentViseme = visemeId;
      drawAvatar(visemeId);
      setTimeout(() => {
        if (!isAnimating) drawAvatar(0);
      }, 100);
    }
    
    async function pollVisemes() {
      if (!isAnimating) return;
      
      try {
        const response = await fetch('/visemes');
        const data = await response.json();
        
        if (data.visemes && data.visemes.length > 0) {
          data.visemes.forEach((v, i) => {
            setTimeout(() => animateViseme(v.viseme_id), i * 50);
          });
        }
      } catch (error) {
        console.error('Error polling visemes:', error);
      }
      
      setTimeout(pollVisemes, 100);
    }
    
    async function speak() {
      const text = textInput.value.trim();
      if (!text) return;
      
      status.textContent = 'Speaking...';
      isAnimating = true;
      pollVisemes();
      
      try {
        await fetch('/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        setTimeout(() => {
          isAnimating = false;
          status.textContent = 'Ready';
          drawAvatar(0);
        }, 3000);
      } catch (error) {
        console.error('Error:', error);
        status.textContent = 'Error occurred';
        isAnimating = false;
      }
    }
    
    speakBtn.onclick = speak;
    textInput.onkeypress = (e) => {
      if (e.key === 'Enter') speak();
    };
    
    drawAvatar(0);
  </script>
</body>
</html>"""
    return web.Response(text=html, content_type='text/html')

async def main():
    api_key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")
    deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o-realtime-preview")

    print("🎭 Starting Voice Avatar Sample...\n")

    voice_server = VoiceAvatarServer(api_key, region, deployment)
    await voice_server.connect_voice_live()

    # Start HTTP server
    app = web.Application()
    app['voice_server'] = voice_server
    app.router.add_get('/', handle_index)
    app.router.add_get('/visemes', handle_visemes)
    app.router.add_post('/speak', handle_speak)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8000)
    await site.start()

    print("🌐 Avatar server running at http://localhost:8000")
    print("   Open in your browser to see the avatar\n")

    # Keep running
    await asyncio.Event().wait()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
