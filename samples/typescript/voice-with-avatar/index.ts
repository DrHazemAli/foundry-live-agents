import WebSocket from 'ws';
import express from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VisemeEvent {
  viseme_id: number;
  audio_offset: number;
  timestamp: number;
}

class VoiceAvatarServer {
  private app = express();
  private ws: WebSocket | null = null;
  private visemeQueue: VisemeEvent[] = [];

  constructor(
    private apiKey: string,
    private region: string,
    private deployment: string
  ) {
    this.setupExpress();
  }

  private setupExpress(): void {
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Serve viseme data
    this.app.get('/visemes', (req, res) => {
      res.json({ visemes: this.visemeQueue });
      this.visemeQueue = []; // Clear after sending
    });

    // Test endpoint
    this.app.post('/speak', express.json(), (req, res) => {
      const { text } = req.body;
      if (text) {
        this.sendTextMessage(text);
        res.json({ status: 'speaking' });
      } else {
        res.status(400).json({ error: 'No text provided' });
      }
    });
  }

  async start(port: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`🌐 Avatar server running at http://localhost:${port}`);
        resolve();
      });
    });
  }

  async connectVoiceLive(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `wss://${this.region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${this.deployment}`;
      
      this.ws = new WebSocket(url, {
        headers: { 'api-key': this.apiKey }
      });

      this.ws.on('open', () => {
        console.log('✅ Connected to Voice Live API\n');
        this.configureSession();
        resolve();
      });

      this.ws.on('error', reject);
      this.setupVoiceEventHandlers();
    });
  }

  private configureSession(): void {
    if (!this.ws) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        voice: 'en-US-EmmaMultilingualNeural', // Neural voice with viseme support
        instructions: 'You are a friendly AI assistant with a visual avatar. Keep responses conversational and engaging.',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 500
        },
        temperature: 0.8,
        max_response_output_tokens: 1024
      }
    };

    this.ws.send(JSON.stringify(sessionConfig));
    console.log('⚙️  Session configured with viseme support\n');
  }

  private setupVoiceEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data: WebSocket.Data) => {
      const event = JSON.parse(data.toString());

      switch (event.type) {
        case 'session.created':
          console.log('📡 Session created:', event.session.id);
          break;

        case 'response.audio.viseme':
          // Viseme event with mouth shape data
          const viseme: VisemeEvent = {
            viseme_id: event.viseme_id,
            audio_offset: event.audio_offset,
            timestamp: Date.now()
          };
          
          this.visemeQueue.push(viseme);
          console.log(`👄 Viseme ${viseme.viseme_id} at ${viseme.audio_offset}ms`);
          break;

        case 'response.audio.delta':
          // Audio data for playback
          console.log(`🔊 Audio chunk: ${event.delta.length} bytes`);
          break;

        case 'response.text.delta':
          process.stdout.write(event.delta);
          break;

        case 'response.text.done':
          console.log('\n');
          break;

        case 'response.done':
          console.log(`✅ Response complete - ${this.visemeQueue.length} visemes captured\n`);
          break;

        case 'error':
          console.error('❌ Error:', event.error);
          break;
      }
    });
  }

  sendTextMessage(text: string): void {
    if (!this.ws) return;

    console.log(`\n💬 Speaking: "${text}"\n`);
    this.visemeQueue = []; // Clear previous visemes

    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    }));

    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create public/index.html for avatar display
const htmlContent = `<!DOCTYPE html>
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
    
    h1 {
      color: white;
      margin-bottom: 30px;
    }
    
    #avatar-canvas {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      cursor: pointer;
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
      transition: background 0.3s;
    }
    
    button:hover {
      background: #764ba2;
    }
    
    .status {
      margin-top: 20px;
      color: white;
      font-size: 14px;
    }
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
    
    // Viseme mouth shapes (simplified)
    const visemeShapes = {
      0: { width: 0.2, height: 0.1 },    // Silence
      1: { width: 0.6, height: 0.4 },    // ae, ax, ah
      2: { width: 0.7, height: 0.5 },    // aa
      6: { width: 0.4, height: 0.2 },    // y, iy, ih
      7: { width: 0.3, height: 0.3 },    // w, uw
      15: { width: 0.5, height: 0.15 },  // s, z
      19: { width: 0.5, height: 0.3 },   // d, t, n
      21: { width: 0.3, height: 0.2 }    // p, b, m
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
      
      // Mouth (based on viseme)
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
      
      // Return to neutral after short delay
      setTimeout(() => {
        if (!isAnimating) {
          drawAvatar(0);
        }
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
    
    // Initial draw
    drawAvatar(0);
  </script>
</body>
</html>`;

async function main() {
  const apiKey = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-realtime-preview';

  console.log('🎭 Starting Voice Avatar Sample...\n');

  const server = new VoiceAvatarServer(apiKey, region, deployment);

  try {
    // Create public directory and HTML file
    const fs = await import('fs');
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);

    // Start server
    await server.start(3000);
    
    // Connect to Voice Live
    await server.connectVoiceLive();

    console.log('\n✨ Avatar demo ready!');
    console.log('   Open http://localhost:3000 in your browser');
    console.log('   Type a message and click "Speak" to see the avatar\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
