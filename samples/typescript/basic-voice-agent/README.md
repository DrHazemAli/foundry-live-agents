# Basic Voice Agent - TypeScript

> **Difficulty:** Beginner  
> **Duration:** 15 minutes  
> **Prerequisites:** Node.js 18+, Azure Speech resource

## Overview

This sample demonstrates the fundamentals of Azure Speech Voice Live API:

- Establishing WebSocket connection
- Configuring session with voice and VAD
- Streaming audio input
- Receiving audio output
- Handling events

## Features

- ✅ Simple WebSocket connection
- ✅ Session configuration
- ✅ Basic voice interaction
- ✅ Audio streaming (PCM16)
- ✅ Server VAD
- ✅ Error handling
- ✅ Clean shutdown

## Prerequisites

1. **Azure Resource**
   - Speech Services or Microsoft Foundry resource
   - API key or Entra ID credentials
   - Supported region

2. **Development Environment**
   - Node.js 18 or later
   - npm or yarn
   - Terminal/command line

3. **Audio Setup**
   - Microphone access
   - Speaker/headphones

## Installation

```bash
# Navigate to this directory
cd samples/typescript/basic-voice-agent

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Azure credentials
nano .env
```

## Configuration

### Environment Variables

Edit `.env` file:

```bash
# Azure Resource Configuration
AZURE_RESOURCE_NAME=your-resource-name
AZURE_REGION=eastus
AZURE_SPEECH_API_KEY=your-api-key-here

# Voice Live Settings
DEFAULT_MODEL=gpt-realtime
DEFAULT_VOICE_TYPE=openai
DEFAULT_VOICE_NAME=alloy
DEFAULT_LANGUAGE=en-US

# VAD Configuration
VAD_TYPE=server_vad
VAD_THRESHOLD=0.5
VAD_SILENCE_DURATION_MS=500

# Audio Settings
INPUT_AUDIO_FORMAT=pcm16
INPUT_AUDIO_SAMPLING_RATE=24000
OUTPUT_AUDIO_FORMAT=pcm16

# Enhancements
ENABLE_NOISE_SUPPRESSION=true
ENABLE_ECHO_CANCELLATION=true
```

## Usage

### Run the Application

```bash
npm start
```

### Expected Flow

1. Application connects to Voice Live API
2. Session is configured with voice and VAD settings
3. Microphone starts capturing
4. Speak into your microphone
5. VAD detects speech start/stop
6. AI responds with audio
7. Press Ctrl+C to exit

### Example Interaction

```
🔌 Connecting to Voice Live API...
✅ Connected successfully

📝 Configuring session...
✅ Session created: sess_abc123
   Model: gpt-realtime
   Voice: openai/alloy
   Modalities: text, audio

🎤 Microphone started - speak now!
   (Press Ctrl+C to stop)

🗣️  Speech started
📤 Sending audio chunks...
🛑 Speech stopped

🤖 AI Response:
   📝 "Hello! How can I help you today?"
   🔊 Playing audio...
   ✅ Response complete

🗣️  Speech started
📤 Sending audio chunks...
```

## Code Structure

```
basic-voice-agent/
├── src/
│   ├── index.ts              # Main entry point
│   ├── voiceLiveClient.ts    # WebSocket client
│   ├── audioCapture.ts       # Microphone handling
│   ├── audioPlayer.ts        # Audio playback
│   ├── config.ts             # Configuration
│   └── types.ts              # TypeScript types
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Key Files

### src/index.ts

Main application logic:

```typescript
import { VoiceLiveClient } from './voiceLiveClient';
import { AudioCapture } from './audioCapture';
import { AudioPlayer } from './audioPlayer';
import { config } from './config';

async function main() {
  console.log('🔌 Connecting to Voice Live API...');
  
  // Initialize client
  const client = new VoiceLiveClient({
    resourceName: config.azure.resourceName,
    apiKey: config.azure.apiKey,
    model: config.voiceLive.model
  });
  
  // Connect
  await client.connect();
  console.log('✅ Connected successfully\n');
  
  // Configure session
  console.log('📝 Configuring session...');
  await client.configureSession({
    modalities: ['text', 'audio'],
    instructions: 'You are a helpful assistant. Be concise and friendly.',
    voice: {
      type: config.voiceLive.voiceType,
      name: config.voiceLive.voiceName
    },
    turn_detection: {
      type: config.vad.type,
      threshold: config.vad.threshold,
      silence_duration_ms: config.vad.silenceDuration
    },
    input_audio_format: config.audio.inputFormat,
    output_audio_format: config.audio.outputFormat,
    input_audio_sampling_rate: config.audio.inputSamplingRate
  });
  
  console.log(`✅ Session created: ${client.sessionId}`);
  console.log(`   Model: ${config.voiceLive.model}`);
  console.log(`   Voice: ${config.voiceLive.voiceType}/${config.voiceLive.voiceName}`);
  console.log(`   Modalities: text, audio\n`);
  
  // Initialize audio
  const audioCapture = new AudioCapture(config.audio.inputSamplingRate);
  const audioPlayer = new AudioPlayer(config.audio.inputSamplingRate);
  
  // Handle audio chunks from microphone
  audioCapture.on('data', (audioData: Buffer) => {
    client.sendAudio(audioData);
  });
  
  // Handle events from Voice Live
  client.on('speech.started', () => {
    console.log('🗣️  Speech started');
  });
  
  client.on('speech.stopped', () => {
    console.log('🛑 Speech stopped\n');
  });
  
  client.on('response.started', () => {
    console.log('🤖 AI Response:');
  });
  
  client.on('response.text', (text: string) => {
    console.log(`   📝 "${text}"`);
  });
  
  client.on('response.audio', (audioData: Buffer) => {
    audioPlayer.play(audioData);
  });
  
  client.on('response.complete', () => {
    console.log('   ✅ Response complete\n');
  });
  
  client.on('error', (error: Error) => {
    console.error('❌ Error:', error.message);
  });
  
  // Start capturing
  console.log('🎤 Microphone started - speak now!');
  console.log('   (Press Ctrl+C to stop)\n');
  audioCapture.start();
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    audioCapture.stop();
    await client.disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
```

### src/voiceLiveClient.ts

WebSocket client implementation:

```typescript
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class VoiceLiveClient extends EventEmitter {
  private ws?: WebSocket;
  private resourceName: string;
  private apiKey: string;
  private model: string;
  public sessionId?: string;
  
  constructor(options: {
    resourceName: string;
    apiKey: string;
    model: string;
  }) {
    super();
    this.resourceName = options.resourceName;
    this.apiKey = options.apiKey;
    this.model = options.model;
  }
  
  async connect(): Promise<void> {
    const url = `wss://${this.resourceName}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model=${this.model}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url, {
        headers: {
          'api-key': this.apiKey
        }
      });
      
      this.ws.on('open', () => resolve());
      this.ws.on('message', (data) => this.handleMessage(data));
      this.ws.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
      this.ws.on('close', () => this.emit('closed'));
    });
  }
  
  async configureSession(config: any): Promise<void> {
    return new Promise((resolve) => {
      const handler = (event: any) => {
        if (event.type === 'session.created') {
          this.sessionId = event.session.id;
          this.off('event', handler);
          resolve();
        }
      };
      
      this.on('event', handler);
      
      this.send({
        type: 'session.update',
        session: config
      });
    });
  }
  
  sendAudio(audioData: Buffer): void {
    this.send({
      type: 'input_audio_buffer.append',
      audio: audioData.toString('base64')
    });
  }
  
  private handleMessage(data: WebSocket.Data): void {
    const event = JSON.parse(data.toString());
    this.emit('event', event);
    
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        this.emit('speech.started');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        this.emit('speech.stopped');
        break;
        
      case 'response.created':
        this.emit('response.started');
        break;
        
      case 'response.text.delta':
        this.emit('response.text', event.delta);
        break;
        
      case 'response.audio.delta':
        const audioData = Buffer.from(event.delta, 'base64');
        this.emit('response.audio', audioData);
        break;
        
      case 'response.done':
        this.emit('response.complete');
        break;
        
      case 'error':
        this.emit('error', new Error(event.error.message));
        break;
    }
  }
  
  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
```

### src/audioCapture.ts

Microphone capture:

```typescript
import { EventEmitter } from 'events';
import recorder from 'node-record-lpcm16';

export class AudioCapture extends EventEmitter {
  private recording?: any;
  private sampleRate: number;
  
  constructor(sampleRate: number = 24000) {
    super();
    this.sampleRate = sampleRate;
  }
  
  start(): void {
    this.recording = recorder.record({
      sampleRate: this.sampleRate,
      channels: 1,
      audioType: 'raw',
      recorder: 'sox', // or 'rec', 'arecord' on Linux
      silence: '0.0'
    });
    
    this.recording.stream().on('data', (data: Buffer) => {
      this.emit('data', data);
    });
    
    this.recording.stream().on('error', (error: Error) => {
      this.emit('error', error);
    });
  }
  
  stop(): void {
    if (this.recording) {
      this.recording.stop();
      this.recording = null;
    }
  }
}
```

### src/audioPlayer.ts

Audio playback:

```typescript
import Speaker from 'speaker';
import { Writable } from 'stream';

export class AudioPlayer {
  private speaker: Writable;
  
  constructor(sampleRate: number = 24000) {
    this.speaker = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: sampleRate
    });
  }
  
  play(audioData: Buffer): void {
    this.speaker.write(audioData);
  }
  
  stop(): void {
    this.speaker.end();
  }
}
```

## Dependencies

```json
{
  "name": "basic-voice-agent",
  "version": "1.0.0",
  "description": "Basic Azure Speech Voice Live agent",
  "main": "dist/index.js",
  "scripts": {
    "start": "ts-node src/index.ts",
    "build": "tsc",
    "dev": "nodemon --exec ts-node src/index.ts"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "node-record-lpcm16": "^1.3.0",
    "speaker": "^0.5.4",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.9.0",
    "@types/ws": "^8.5.8",
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1"
  }
}
```

## Troubleshooting

### Microphone Not Working

**macOS:**
```bash
# Grant microphone permission
# System Settings > Privacy & Security > Microphone
# Enable Terminal or your IDE

# Install sox
brew install sox
```

**Linux:**
```bash
# Install alsa-utils
sudo apt-get install alsa-utils

# Test microphone
arecord -l
```

**Windows:**
```bash
# Install sox
# Download from https://sourceforge.net/projects/sox/
# Add to PATH
```

### Audio Not Playing

Check speaker setup:
```bash
# Test speaker output
speaker-test -c 1 -t sine
```

### Connection Issues

Verify credentials:
```bash
# Test connection
curl -H "api-key: YOUR_KEY" \
  https://YOUR_RESOURCE.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model=gpt-realtime \
  -v
```

### No Response from AI

Check console for:
- `session.created` event
- `speech_started` and `speech_stopped` events
- Any error messages

Enable debug logging:
```typescript
client.on('event', (event) => {
  console.log('EVENT:', JSON.stringify(event, null, 2));
});
```

## Next Steps

Now that you have a basic voice agent running:

1. **[Multi-Language Voice Agent](../multi-language-voice-agent/)** - Add language support
2. **[Voice with Functions](../voice-with-functions/)** - Integrate tools
3. **[Advanced VAD Configuration](../advanced-vad-configuration/)** - Fine-tune detection
4. **[Customer Support Agent](../../../agents/customer-support/)** - Production example

## Additional Resources

- [Module 02: Getting Started](../../../docs/02-getting-started.md)
- [Module 04: Configuration](../../../docs/04-configuration.md)
- [Voice Live API Reference](https://learn.microsoft.com/azure/ai-services/speech-service/voice-live-api-reference)

---

**[← Back to TypeScript Samples](../) | [Next: Multi-Language →](../multi-language-voice-agent/)**
