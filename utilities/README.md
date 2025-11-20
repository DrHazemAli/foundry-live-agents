# Utilities Library

Shared utilities for Azure Speech Voice Live API development across TypeScript, Python, Go, C#, and Swift.

## Modules

### 📊 [Audio Utils](./audio-utils/)
Audio processing utilities including PCM16 encoding/decoding, sample rate conversion, silence detection, and volume normalization.

**Features:**
- PCM16 encoding/decoding
- Sample rate conversion (8kHz, 16kHz, 24kHz)
- Audio chunking
- Silence detection
- Volume normalization
- RMS calculation

**Languages:** TypeScript, Python

### 🔌 [WebSocket Client](./websocket-client/)
Production-ready WebSocket client with automatic reconnection, exponential backoff, and comprehensive error handling.

**Features:**
- Auto-reconnect with exponential backoff
- Connection health monitoring
- Keepalive ping/pong
- Event parsing and validation
- Metrics tracking
- Error recovery

**Languages:** TypeScript, Python

### 🎯 [Event Handlers](./event-handlers/)
Complete TypeScript type definitions, validators, mock generators, and filtering utilities for Voice Live API events.

**Features:**
- 40+ TypeScript event type definitions
- Event validation and parsing
- Mock event generators for testing
- Event filtering utilities
- Type guards and assertions

**Languages:** TypeScript (types), JavaScript (runtime)

### ⚙️ [Config Templates](./config-templates/)
Pre-built configuration templates for common use cases including customer support, healthcare, demo, and telephony scenarios.

**Features:**
- Customer support agent config
- Healthcare assistant config
- Demo/testing configs
- Telephony integration configs
- Voice presets (formal, casual, empathetic, multilingual)
- VAD profiles (sensitive, balanced, conservative)
- Audio format profiles
- Model defaults

**Languages:** TypeScript, Python, JSON

## Installation

### TypeScript/JavaScript

```bash
# Install all utilities
npm install @foundry-live-agents/audio-utils
npm install @foundry-live-agents/websocket-client
npm install @foundry-live-agents/event-handlers
npm install @foundry-live-agents/config-templates
```

### Python

```bash
# Install individual utilities
pip install -r audio-utils/requirements.txt
pip install -r websocket-client/requirements.txt
```

## Quick Start

### TypeScript Example

```typescript
import { AudioProcessor } from '@foundry-live-agents/audio-utils';
import { VoiceLiveClient } from '@foundry-live-agents/websocket-client';
import { customerSupportConfig } from '@foundry-live-agents/config-templates';
import type { ResponseTextDeltaEvent } from '@foundry-live-agents/event-handlers';

const client = new VoiceLiveClient({
  apiKey: process.env.AZURE_SPEECH_KEY!,
  region: process.env.AZURE_SPEECH_REGION!,
  deployment: 'gpt-4o-realtime-preview'
});

client.on('message', (event) => {
  if (event.type === 'response.text.delta') {
    const delta = event as ResponseTextDeltaEvent;
    process.stdout.write(delta.delta);
  }
});

await client.connect();
await client.sendMessage({
  type: 'session.update',
  session: customerSupportConfig
});
```

### Python Example

```python
from audio_utils import AudioProcessor
from websocket_client import VoiceLiveClient
from config_templates import customer_support_config

client = VoiceLiveClient(
    api_key=os.getenv("AZURE_SPEECH_KEY"),
    region=os.getenv("AZURE_SPEECH_REGION"),
    deployment="gpt-4o-realtime-preview"
)

@client.on('message')
async def on_message(event):
    if event['type'] == 'response.text.delta':
        print(event['delta'], end='', flush=True)

await client.connect()
await client.send_message({
    "type": "session.update",
    "session": customer_support_config
})
```

## Documentation

Each utility module has comprehensive documentation:
- [Audio Utils Documentation](./audio-utils/README.md)
- [WebSocket Client Documentation](./websocket-client/README.md)
- [Event Handlers Documentation](./event-handlers/README.md)
- [Config Templates Documentation](./config-templates/README.md)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.
