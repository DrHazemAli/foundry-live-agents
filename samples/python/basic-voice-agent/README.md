# Basic Voice Agent - Python

> **Difficulty:** Beginner  
> **Duration:** 15 minutes  
> **Prerequisites:** Python 3.10+, Azure Speech resource

## Overview

Python implementation of Azure Speech Voice Live API demonstrating:

- WebSocket connection with `websockets` library
- Async/await patterns with `asyncio`
- Audio capture with `pyaudio`
- Real-time streaming
- Event-driven architecture

## Features

- ✅ Async WebSocket client
- ✅ Microphone capture with PyAudio
- ✅ Audio playback
- ✅ Server VAD
- ✅ Clean error handling
- ✅ Graceful shutdown

## Prerequisites

1. **Python Environment**
   - Python 3.10 or later
   - pip package manager

2. **Azure Resource**
   - Speech Services or Microsoft Foundry resource
   - API key or Entra ID credentials

3. **System Dependencies**
   - PortAudio (for microphone access)

## Installation

### macOS

```bash
# Install PortAudio
brew install portaudio

# Navigate to sample directory
cd samples/python/basic-voice-agent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env
```

### Linux (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install portaudio19-dev python3-pyaudio

# Navigate to sample directory
cd samples/python/basic-voice-agent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env
```

### Windows

```bash
# Install PortAudio (via pip will handle)
# Navigate to sample directory
cd samples\python\basic-voice-agent

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
notepad .env
```

## Configuration

### requirements.txt

```txt
websockets>=12.0
pyaudio>=0.2.14
python-dotenv>=1.0.0
azure-identity>=1.15.0
aiohttp>=3.9.0
```

### .env File

```bash
# Azure Configuration
AZURE_RESOURCE_NAME=your-resource-name
AZURE_REGION=eastus
AZURE_SPEECH_API_KEY=your-api-key

# Voice Live Settings
DEFAULT_MODEL=gpt-realtime
DEFAULT_VOICE_TYPE=openai
DEFAULT_VOICE_NAME=alloy

# Audio Settings
INPUT_SAMPLE_RATE=24000
OUTPUT_SAMPLE_RATE=24000
CHUNK_SIZE=4096
```

## Usage

### Run the Application

```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run
python main.py
```

### Expected Output

```
🔌 Connecting to Voice Live API...
✅ Connected successfully

📝 Configuring session...
✅ Session created: sess_abc123
   Model: gpt-realtime
   Voice: openai/alloy

🎤 Microphone started - speak now!
   (Press Ctrl+C to stop)

🗣️  Speech started
📤 Sending audio...
🛑 Speech stopped

🤖 AI Response:
   📝 Hello! How can I help you today?
   🔊 Playing audio...
   ✅ Response complete
```

## Code Structure

```
basic-voice-agent/
├── main.py                 # Entry point
├── voice_live_client.py    # WebSocket client
├── audio_capture.py        # Microphone handling
├── audio_player.py         # Audio playback
├── config.py               # Configuration
├── requirements.txt        # Dependencies
├── .env.example           # Environment template
└── README.md              # This file
```

## Implementation

### main.py

```python
"""
Main entry point for basic voice agent
"""
import asyncio
import signal
from voice_live_client import VoiceLiveClient
from audio_capture import AudioCapture
from audio_player import AudioPlayer
from config import Config

async def main():
    print('🔌 Connecting to Voice Live API...')
    
    # Load configuration
    config = Config()
    
    # Initialize client
    client = VoiceLiveClient(
        resource_name=config.azure_resource_name,
        api_key=config.azure_api_key,
        model=config.default_model
    )
    
    # Connect
    await client.connect()
    print('✅ Connected successfully\n')
    
    # Configure session
    print('📝 Configuring session...')
    await client.configure_session({
        'modalities': ['text', 'audio'],
        'instructions': 'You are a helpful assistant. Be concise and friendly.',
        'voice': {
            'type': config.voice_type,
            'name': config.voice_name
        },
        'turn_detection': {
            'type': 'server_vad',
            'threshold': 0.5,
            'silence_duration_ms': 500
        },
        'input_audio_format': 'pcm16',
        'output_audio_format': 'pcm16',
        'input_audio_sampling_rate': config.input_sample_rate
    })
    
    print(f'✅ Session created: {client.session_id}')
    print(f'   Model: {config.default_model}')
    print(f'   Voice: {config.voice_type}/{config.voice_name}\n')
    
    # Initialize audio
    audio_capture = AudioCapture(
        sample_rate=config.input_sample_rate,
        chunk_size=config.chunk_size
    )
    audio_player = AudioPlayer(sample_rate=config.output_sample_rate)
    
    # Event handlers
    async def on_audio_data(audio_data: bytes):
        await client.send_audio(audio_data)
    
    def on_speech_started():
        print('🗣️  Speech started')
    
    def on_speech_stopped():
        print('🛑 Speech stopped\n')
    
    def on_response_started():
        print('🤖 AI Response:')
    
    def on_response_text(text: str):
        print(f'   📝 {text}')
    
    def on_response_audio(audio_data: bytes):
        audio_player.play(audio_data)
    
    def on_response_complete():
        print('   ✅ Response complete\n')
    
    def on_error(error: Exception):
        print(f'❌ Error: {error}')
    
    # Register handlers
    audio_capture.on_data = on_audio_data
    client.on_speech_started = on_speech_started
    client.on_speech_stopped = on_speech_stopped
    client.on_response_started = on_response_started
    client.on_response_text = on_response_text
    client.on_response_audio = on_response_audio
    client.on_response_complete = on_response_complete
    client.on_error = on_error
    
    # Start audio capture
    print('🎤 Microphone started - speak now!')
    print('   (Press Ctrl+C to stop)\n')
    await audio_capture.start()
    
    # Setup shutdown handler
    shutdown_event = asyncio.Event()
    
    def signal_handler(sig, frame):
        print('\n\n🛑 Shutting down...')
        shutdown_event.set()
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Wait for shutdown
    await shutdown_event.wait()
    
    # Cleanup
    await audio_capture.stop()
    audio_player.stop()
    await client.disconnect()
    print('✅ Goodbye!')

if __name__ == '__main__':
    asyncio.run(main())
```

### voice_live_client.py

```python
"""
WebSocket client for Azure Speech Voice Live API
"""
import asyncio
import json
import base64
from typing import Callable, Optional
import websockets
from websockets.client import WebSocketClientProtocol

class VoiceLiveClient:
    def __init__(self, resource_name: str, api_key: str, model: str):
        self.resource_name = resource_name
        self.api_key = api_key
        self.model = model
        self.ws: Optional[WebSocketClientProtocol] = None
        self.session_id: Optional[str] = None
        
        # Event handlers
        self.on_speech_started: Optional[Callable] = None
        self.on_speech_stopped: Optional[Callable] = None
        self.on_response_started: Optional[Callable] = None
        self.on_response_text: Optional[Callable[[str], None]] = None
        self.on_response_audio: Optional[Callable[[bytes], None]] = None
        self.on_response_complete: Optional[Callable] = None
        self.on_error: Optional[Callable[[Exception], None]] = None
    
    async def connect(self):
        """Connect to Voice Live API"""
        url = f'wss://{self.resource_name}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model={self.model}'
        
        headers = {
            'api-key': self.api_key
        }
        
        self.ws = await websockets.connect(url, extra_headers=headers)
        
        # Start message handler
        asyncio.create_task(self._message_handler())
    
    async def configure_session(self, config: dict):
        """Configure the session"""
        await self._send({
            'type': 'session.update',
            'session': config
        })
        
        # Wait for session.created
        # (In production, use proper event waiting)
        await asyncio.sleep(0.5)
    
    async def send_audio(self, audio_data: bytes):
        """Send audio chunk"""
        await self._send({
            'type': 'input_audio_buffer.append',
            'audio': base64.b64encode(audio_data).decode('utf-8')
        })
    
    async def _send(self, data: dict):
        """Send message to server"""
        if self.ws:
            await self.ws.send(json.dumps(data))
    
    async def _message_handler(self):
        """Handle incoming messages"""
        try:
            async for message in self.ws:
                event = json.loads(message)
                await self._handle_event(event)
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            if self.on_error:
                self.on_error(e)
    
    async def _handle_event(self, event: dict):
        """Handle specific event types"""
        event_type = event.get('type')
        
        if event_type == 'session.created':
            self.session_id = event['session']['id']
        
        elif event_type == 'input_audio_buffer.speech_started':
            if self.on_speech_started:
                self.on_speech_started()
        
        elif event_type == 'input_audio_buffer.speech_stopped':
            if self.on_speech_stopped:
                self.on_speech_stopped()
        
        elif event_type == 'response.created':
            if self.on_response_started:
                self.on_response_started()
        
        elif event_type == 'response.text.delta':
            if self.on_response_text:
                self.on_response_text(event.get('delta', ''))
        
        elif event_type == 'response.audio.delta':
            if self.on_response_audio:
                audio_data = base64.b64decode(event.get('delta', ''))
                self.on_response_audio(audio_data)
        
        elif event_type == 'response.done':
            if self.on_response_complete:
                self.on_response_complete()
        
        elif event_type == 'error':
            if self.on_error:
                error_msg = event.get('error', {}).get('message', 'Unknown error')
                self.on_error(Exception(error_msg))
    
    async def disconnect(self):
        """Disconnect from server"""
        if self.ws:
            await self.ws.close()
            self.ws = None
```

### audio_capture.py

```python
"""
Audio capture from microphone using PyAudio
"""
import asyncio
import pyaudio
from typing import Callable, Optional

class AudioCapture:
    def __init__(self, sample_rate: int = 24000, chunk_size: int = 4096):
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.on_data: Optional[Callable[[bytes], None]] = None
        self.stream = None
        self.audio = pyaudio.PyAudio()
        self.running = False
    
    async def start(self):
        """Start capturing audio"""
        self.running = True
        
        self.stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size,
            stream_callback=self._callback
        )
        
        self.stream.start_stream()
        
        # Keep running
        while self.running:
            await asyncio.sleep(0.1)
    
    def _callback(self, in_data, frame_count, time_info, status):
        """PyAudio callback"""
        if self.on_data:
            asyncio.create_task(self.on_data(in_data))
        return (None, pyaudio.paContinue)
    
    async def stop(self):
        """Stop capturing"""
        self.running = False
        
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
        
        self.audio.terminate()
```

### audio_player.py

```python
"""
Audio playback using PyAudio
"""
import pyaudio
from queue import Queue
import threading

class AudioPlayer:
    def __init__(self, sample_rate: int = 24000):
        self.sample_rate = sample_rate
        self.audio = pyaudio.PyAudio()
        self.queue = Queue()
        self.running = True
        
        self.stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            output=True,
            stream_callback=self._callback
        )
        
        self.stream.start_stream()
    
    def play(self, audio_data: bytes):
        """Queue audio for playback"""
        self.queue.put(audio_data)
    
    def _callback(self, in_data, frame_count, time_info, status):
        """PyAudio callback"""
        if not self.queue.empty():
            data = self.queue.get()
            return (data, pyaudio.paContinue)
        else:
            # Return silence
            return (b'\x00' * frame_count * 2, pyaudio.paContinue)
    
    def stop(self):
        """Stop playback"""
        self.running = False
        
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        
        self.audio.terminate()
```

### config.py

```python
"""
Configuration management
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    def __init__(self):
        # Azure
        self.azure_resource_name = os.getenv('AZURE_RESOURCE_NAME')
        self.azure_region = os.getenv('AZURE_REGION', 'eastus')
        self.azure_api_key = os.getenv('AZURE_SPEECH_API_KEY')
        
        # Voice Live
        self.default_model = os.getenv('DEFAULT_MODEL', 'gpt-realtime')
        self.voice_type = os.getenv('DEFAULT_VOICE_TYPE', 'openai')
        self.voice_name = os.getenv('DEFAULT_VOICE_NAME', 'alloy')
        
        # Audio
        self.input_sample_rate = int(os.getenv('INPUT_SAMPLE_RATE', '24000'))
        self.output_sample_rate = int(os.getenv('OUTPUT_SAMPLE_RATE', '24000'))
        self.chunk_size = int(os.getenv('CHUNK_SIZE', '4096'))
        
        # Validation
        if not self.azure_resource_name or not self.azure_api_key:
            raise ValueError('Missing required environment variables')
```

## Troubleshooting

### PyAudio Installation Issues

**macOS:**
```bash
# If pip install fails
brew install portaudio
pip install --global-option='build_ext' --global-option='-I/opt/homebrew/include' --global-option='-L/opt/homebrew/lib' pyaudio
```

**Linux:**
```bash
# Install dev packages
sudo apt-get install portaudio19-dev python3-dev
pip install pyaudio
```

**Windows:**
```bash
# Use pre-built wheel
pip install pipwin
pipwin install pyaudio
```

### Microphone Permission

**macOS:**
- System Settings > Privacy & Security > Microphone
- Enable Python or Terminal

**Linux:**
```bash
# Test microphone
arecord -l
```

### No Audio Output

```bash
# Test system audio
python -c "import pyaudio; p=pyaudio.PyAudio(); print(p.get_default_output_device_info())"
```

## Next Steps

1. **[Multi-Language Agent](../multi-language-voice-agent/)** - Add language detection
2. **[Voice with Functions](../voice-with-functions/)** - Integrate tools
3. **[VoiceRAG Pattern](../voicerag-pattern/)** - Knowledge base integration

## Additional Resources

- [asyncio Documentation](https://docs.python.org/3/library/asyncio.html)
- [websockets Library](https://websockets.readthedocs.io/)
- [PyAudio Documentation](https://people.csail.mit.edu/hubert/pyaudio/docs/)

---

**[← Back to Python Samples](../) | [Next: Multi-Language →](../multi-language-voice-agent/)**
