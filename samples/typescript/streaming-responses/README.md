# Streaming Responses Sample

This sample demonstrates advanced streaming techniques with Azure Speech Voice Live API, including partial responses, delta handling, and real-time output processing.

## Features

- Delta streaming for text and audio
- Partial response handling
- Real-time output processing
- Buffering strategies
- Progress indication

## Prerequisites

- Node.js 18 or later
- Azure Speech Services resource with Voice Live enabled
- TypeScript 5.0 or later

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
AZURE_SPEECH_KEY=your-api-key
AZURE_SPEECH_REGION=eastus
DEPLOYMENT_NAME=gpt-4o-realtime-preview
```

3. Run the sample:
```bash
npm start
```

## How It Works

### Text Delta Streaming

Receive text token by token:

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  if (event.type === 'response.text.delta') {
    // Stream token immediately
    process.stdout.write(event.delta);
  }
  
  if (event.type === 'response.text.done') {
    console.log(); // New line when complete
  }
});
```

### Audio Delta Streaming

Receive audio in small chunks for immediate playback:

```typescript
if (event.type === 'response.audio.delta') {
  const audioData = Buffer.from(event.delta, 'base64');
  
  // Play immediately (don't wait for complete response)
  audioPlayer.playChunk(audioData);
}
```

### Content Part Deltas

Handle structured content streaming:

```typescript
if (event.type === 'response.content_part.delta') {
  const { part_index, delta } = event;
  
  // Update specific content part
  responseParts[part_index] += delta;
  renderUpdate(responseParts);
}
```

## Streaming Patterns

### Immediate Echo
```typescript
// Stream directly to output
event.delta → stdout.write()
```

### Buffered Streaming
```typescript
// Accumulate and flush periodically
buffer += event.delta;
if (buffer.length > threshold || isComplete) {
  flush(buffer);
  buffer = '';
}
```

### Sentence Buffering
```typescript
// Buffer until sentence boundary
buffer += event.delta;
if (buffer.match(/[.!?]$/)) {
  emit(buffer);
  buffer = '';
}
```

## Best Practices

1. **Low Latency**: Process deltas immediately
2. **Buffering**: Balance smoothness vs. latency
3. **Error Handling**: Handle incomplete streams
4. **Cancellation**: Support mid-stream cancellation
5. **Progress**: Show streaming indicators

## Performance Tips

- Use binary formats (PCM16) over base64 when possible
- Minimize processing in the streaming path
- Buffer audio for smooth playback
- Use Web Workers for audio processing (browser)
- Implement backpressure handling

## Common Issues

### Choppy Audio

- Increase audio buffer size
- Reduce audio processing overhead
- Use dedicated audio thread

### Text Delays

- Check network latency
- Reduce max_tokens if responses too long
- Use temperature < 1 for faster generation

### Memory Leaks

- Clear buffers after use
- Unsubscribe from events properly
- Limit retention of historical deltas

## Next Steps

- Explore [Interruption Handling](../interruption-handling/)
- Learn about [Session Management](../session-management/)
- Read [Streaming Guide](../../docs/06-advanced-features.md#streaming-responses)
