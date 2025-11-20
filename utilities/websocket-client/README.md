# WebSocket Client Utility

Production-ready WebSocket client with auto-reconnect, exponential backoff, and event handling for Azure Speech Voice Live API.

## Features

- Automatic reconnection with exponential backoff
- Connection health monitoring
- Event parsing and validation
- Keepalive ping/pong
- Error recovery
- Metrics tracking

## Installation

### TypeScript
```bash
npm install
```

### Python
```bash
pip install -r requirements.txt
```

## Usage

### TypeScript
```typescript
import { VoiceLiveClient } from './voice-live-client';

const client = new VoiceLiveClient({
  apiKey: process.env.AZURE_SPEECH_KEY,
  region: process.env.AZURE_SPEECH_REGION,
  deployment: 'gpt-4o-realtime-preview',
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  keepaliveInterval: 15000
});

client.on('connected', () => console.log('Connected!'));
client.on('message', (event) => console.log('Event:', event));
client.on('error', (error) => console.error('Error:', error));

await client.connect();
await client.sendMessage({ type: 'session.update', session: {...} });
```

### Python
```python
from voice_live_client import VoiceLiveClient

client = VoiceLiveClient(
    api_key=os.getenv("AZURE_SPEECH_KEY"),
    region=os.getenv("AZURE_SPEECH_REGION"),
    deployment="gpt-4o-realtime-preview",
    max_reconnect_attempts=5,
    reconnect_delay=1000,
    keepalive_interval=15000
)

@client.on('connected')
async def on_connected():
    print('Connected!')

@client.on('message')
async def on_message(event):
    print(f'Event: {event}')

await client.connect()
await client.send_message({"type": "session.update", "session": {...}})
```

## API Reference

### VoiceLiveClient Class

#### Constructor Options
- `apiKey` - Azure Speech API key
- `region` - Azure region
- `deployment` - Model deployment name
- `maxReconnectAttempts` - Maximum reconnection attempts (default: 5)
- `reconnectDelay` - Base delay for exponential backoff in ms (default: 1000)
- `keepaliveInterval` - Ping interval in ms (default: 15000)

#### Methods
- `connect()` - Establish WebSocket connection
- `disconnect()` - Close connection gracefully
- `sendMessage(data)` - Send JSON message
- `on(event, handler)` - Register event handler
- `getMetrics()` - Get connection metrics

#### Events
- `connected` - Connection established
- `disconnected` - Connection closed
- `message` - Message received
- `error` - Error occurred
- `reconnecting` - Reconnection attempt
