# Module 09: API Reference

> **Quick reference guide for Azure Speech Voice Live API**

## WebSocket Connection

### Connection URL

```
wss://{resourceName}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model={model}
```

**Parameters:**
- `resourceName` - Your Azure Speech resource name
- `api-version` - API version (currently `2025-10-01`)
- `model` - Model name (e.g., `gpt-4o`, `gpt-realtime`)

### Authentication

**API Key (Development):**
```http
api-key: YOUR_API_KEY
```

**Azure Entra ID (Production):**
```http
Authorization: Bearer YOUR_TOKEN
```

## Event Types

### Client → Server Events

#### session.update

Configure or update session settings.

```json
{
  "type": "session.update",
  "session": {
    "model": "gpt-4o",
    "modalities": ["text", "audio"],
    "instructions": "You are a helpful assistant...",
    "voice": {
      "type": "azure-standard",
      "name": "en-US-Jenny"
    },
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_sampling_rate": 24000,
    "turn_detection": {
      "type": "azure_semantic_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 700
    },
    "temperature": 0.7,
    "max_response_output_tokens": 200
  }
}
```

#### input_audio_buffer.append

Send audio data for speech recognition.

```json
{
  "type": "input_audio_buffer.append",
  "audio": "BASE64_ENCODED_AUDIO_DATA"
}
```

#### input_audio_buffer.commit

Commit buffered audio for processing.

```json
{
  "type": "input_audio_buffer.commit"
}
```

#### input_audio_buffer.clear

Clear the audio buffer.

```json
{
  "type": "input_audio_buffer.clear"
}
```

#### response.create

Request AI to generate a response.

```json
{
  "type": "response.create",
  "response": {
    "modalities": ["text", "audio"],
    "instructions": "Optional override instructions",
    "voice": {
      "type": "azure-standard",
      "name": "en-US-Jenny"
    }
  }
}
```

#### response.cancel

Cancel an in-progress response.

```json
{
  "type": "response.cancel"
}
```

#### conversation.item.create

Add a message to the conversation history.

```json
{
  "type": "conversation.item.create",
  "item": {
    "type": "message",
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Hello, how are you?"
      }
    ]
  }
}
```

### Server → Client Events

#### session.created

Sent when session is established.

```json
{
  "type": "session.created",
  "session": {
    "id": "sess_12345",
    "model": "gpt-4o",
    "modalities": ["text", "audio"],
    "voice": {
      "type": "azure-standard",
      "name": "en-US-Jenny"
    }
  }
}
```

#### session.updated

Sent when session configuration changes.

```json
{
  "type": "session.updated",
  "session": { /* updated session config */ }
}
```

#### input_audio_buffer.speech_started

User started speaking.

```json
{
  "type": "input_audio_buffer.speech_started",
  "audio_start_ms": 1234
}
```

#### input_audio_buffer.speech_stopped

User stopped speaking.

```json
{
  "type": "input_audio_buffer.speech_stopped",
  "audio_end_ms": 5678
}
```

#### input_audio_buffer.committed

Audio buffer committed successfully.

```json
{
  "type": "input_audio_buffer.committed"
}
```

#### input_audio_transcription.completed

Speech-to-text transcription result.

```json
{
  "type": "input_audio_transcription.completed",
  "text": "User's spoken text",
  "language": "en-US"
}
```

#### response.created

Response generation started.

```json
{
  "type": "response.created",
  "response": {
    "id": "resp_12345",
    "status": "in_progress"
  }
}
```

#### response.text.delta

Streaming text response chunk.

```json
{
  "type": "response.text.delta",
  "response_id": "resp_12345",
  "delta": "Hello, I'm here to help",
  "content_index": 0
}
```

#### response.text.done

Text response completed.

```json
{
  "type": "response.text.done",
  "response_id": "resp_12345",
  "text": "Complete response text",
  "content_index": 0
}
```

#### response.audio.delta

Streaming audio response chunk.

```json
{
  "type": "response.audio.delta",
  "response_id": "resp_12345",
  "delta": "BASE64_AUDIO_DATA",
  "content_index": 0
}
```

#### response.audio.done

Audio response completed.

```json
{
  "type": "response.audio.done",
  "response_id": "resp_12345",
  "content_index": 0
}
```

#### response.function_call

AI requesting function execution.

```json
{
  "type": "response.function_call",
  "call_id": "call_12345",
  "name": "search_products",
  "arguments": "{\"query\":\"laptop\",\"max_price\":1000}"
}
```

#### response.done

Complete response finished.

```json
{
  "type": "response.done",
  "response": {
    "id": "resp_12345",
    "status": "completed"
  }
}
```

#### error

Error occurred.

```json
{
  "type": "error",
  "error": {
    "code": "invalid_request",
    "message": "Invalid audio format",
    "param": "input_audio_format"
  }
}
```

## Configuration Options

### Models

| Model | Tier | Features | Best For |
|-------|------|----------|----------|
| `gpt-realtime` | Pro | OpenAI voices, low latency | Demos, fast responses |
| `gpt-4o` | Pro | Azure voices, functions | Production, complex tasks |
| `gpt-4.1` | Pro | Latest GPT-4, functions | Advanced reasoning |
| `gpt-5` | Pro | Next-gen model | Cutting edge |
| `gpt-4o-mini` | Basic | Balanced cost/performance | Cost-effective |
| `phi4-mm-realtime` | Lite | Lightweight, fast | Edge devices |

### Voice Types

| Type | Description | Voices | Temperature |
|------|-------------|--------|-------------|
| `openai` | OpenAI voices | 10 voices | ❌ |
| `azure-standard` | Azure Neural | 500+ voices | ❌ |
| `azure-hd` | Azure HD | 50+ voices | ✅ (0.0-1.0) |
| `custom` | Custom voices | Your voices | ❌ |

### Audio Formats

| Format | Quality | Bandwidth | Sample Rates |
|--------|---------|-----------|--------------|
| `pcm16` | Best | High | 8000, 16000, 24000 Hz |
| `g711_ulaw` | Phone | Low | 8000 Hz |
| `g711_alaw` | Phone | Low | 8000 Hz |

### VAD Types

| Type | Detection | Languages | Latency | Accuracy |
|------|-----------|-----------|---------|----------|
| `server_vad` | Volume | All | Lowest | Medium |
| `semantic_vad` | ML Semantic | English | Low | High |
| `azure_semantic_vad` | ML Semantic | English | Low | Very High |
| `azure_semantic_vad_multilingual` | ML Semantic | 10+ | Low | Very High |

## Function Calling

### Function Definition

```json
{
  "type": "function",
  "name": "function_name",
  "description": "Clear description of what the function does",
  "parameters": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "Parameter description",
        "enum": ["option1", "option2"]
      },
      "param2": {
        "type": "number",
        "description": "Another parameter"
      }
    },
    "required": ["param1"]
  }
}
```

### Function Result

Send function result back to AI:

```json
{
  "type": "conversation.item.create",
  "item": {
    "type": "function_call_output",
    "call_id": "call_12345",
    "output": "{\"result\":\"Function execution result\"}"
  }
}
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `invalid_request` | Malformed request | Check JSON syntax |
| `invalid_api_key` | Bad API key | Verify credentials |
| `invalid_model` | Unknown model | Check model name |
| `rate_limit_exceeded` | Too many requests | Implement backoff |
| `connection_error` | Network issue | Retry connection |
| `audio_format_error` | Unsupported format | Use PCM16 |
| `session_expired` | Session timeout | Reconnect |

## Rate Limits

| Tier | Requests/Min | Concurrent | Audio/Min |
|------|--------------|------------|-----------|
| Free | 20 | 3 | 60 minutes |
| Standard | 100 | 10 | 300 minutes |
| Premium | 1000 | 50 | 1500 minutes |
| Enterprise | Custom | Custom | Custom |

## Best Practices

### Connection Management

```typescript
// Implement reconnection with exponential backoff
async function connectWithRetry(maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect();
      return;
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, i), 30000);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Audio Streaming

```typescript
// Buffer audio for efficient sending
const audioBuffer = [];
const BUFFER_SIZE = 10;

function sendAudio(chunk: Buffer) {
  audioBuffer.push(chunk);
  
  if (audioBuffer.length >= BUFFER_SIZE) {
    const combined = Buffer.concat(audioBuffer);
    client.sendAudio(combined);
    audioBuffer.length = 0;
  }
}
```

### Error Handling

```typescript
client.on('error', (event) => {
  switch (event.error.code) {
    case 'rate_limit_exceeded':
      // Implement backoff
      break;
    case 'session_expired':
      // Reconnect
      reconnect();
      break;
    case 'audio_format_error':
      // Switch to PCM16
      updateAudioFormat('pcm16');
      break;
    default:
      console.error('Unhandled error:', event.error);
  }
});
```

## Quick Start Examples

### TypeScript

```typescript
import WebSocket from 'ws';

const ws = new WebSocket(
  'wss://your-resource.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model=gpt-4o',
  {
    headers: {
      'api-key': process.env.AZURE_SPEECH_API_KEY
    }
  }
);

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'session.update',
    session: {
      voice: { type: 'azure-standard', name: 'en-US-Jenny' },
      turn_detection: { type: 'azure_semantic_vad' }
    }
  }));
});

ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  console.log(event.type);
});
```

### Python

```python
import asyncio
import websockets
import json

async def connect():
    uri = "wss://your-resource.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model=gpt-4o"
    
    async with websockets.connect(
        uri,
        extra_headers={"api-key": AZURE_API_KEY}
    ) as ws:
        # Configure session
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "voice": {"type": "azure-standard", "name": "en-US-Jenny"}
            }
        }))
        
        # Listen for events
        async for message in ws:
            event = json.loads(message)
            print(event["type"])

asyncio.run(connect())
```

## Additional Resources

- [Full Documentation](../README.md)
- [Sample Code](../../samples/)
- [Agent Templates](../../agents/)
- [Voice Catalog](voice-catalog.md)
- [Azure Speech Documentation](https://learn.microsoft.com/azure/cognitive-services/speech-service/)

---

**[← Back to Learning Path](../README.md#-learning-path) | [API Changelog →](api-changelog.md)**
