# Interruption Handling Sample

This sample demonstrates how to handle user interruptions gracefully in real-time voice conversations with Azure Speech Voice Live API.

## Features

- Detect user speech while assistant is speaking
- Cancel ongoing responses
- Queue management for interruptions
- Smooth conversation flow
- Barge-in support

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

### 1. Detect Speech While Speaking

Use `input_audio_buffer.speech_started` event:

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  if (event.type === 'input_audio_buffer.speech_started') {
    if (assistantIsSpeaking) {
      console.log('🚨 User interruption detected!');
      handleInterruption();
    }
  }
});
```

### 2. Cancel Current Response

Use `response.cancel` to stop the assistant:

```typescript
function handleInterruption() {
  if (currentResponseId) {
    ws.send(JSON.stringify({
      type: 'response.cancel',
      response_id: currentResponseId
    }));
    
    // Clear audio buffers
    audioPlayer.stop();
    audioPlayer.clear();
  }
}
```

### 3. Clear Audio Buffer

Remove queued user audio that may have accumulated:

```typescript
// Option 1: Commit and process
ws.send(JSON.stringify({
  type: 'input_audio_buffer.commit'
}));

// Option 2: Clear and discard
ws.send(JSON.stringify({
  type: 'input_audio_buffer.clear'
}));
```

### 4. Track Assistant State

Monitor when assistant is speaking:

```typescript
let assistantIsSpeaking = false;

if (event.type === 'response.audio.delta') {
  assistantIsSpeaking = true;
}

if (event.type === 'response.done') {
  assistantIsSpeaking = false;
}
```

## Interruption Strategies

### Immediate Cancel
```typescript
// Cancel as soon as speech detected
if (speech_started && assistantSpeaking) {
  cancel_response();
}
```

### Delayed Cancel
```typescript
// Wait for silence threshold before canceling
if (speech_continues_for(200ms)) {
  cancel_response();
}
```

### Smart Interruption
```typescript
// Only interrupt at sentence boundaries
if (speech_started && at_sentence_end()) {
  complete_current_sentence();
  cancel_remainder();
}
```

## Best Practices

1. **Fast Detection**: Use low VAD threshold for quick detection
2. **Clean Cancellation**: Stop audio immediately
3. **State Management**: Track conversation state carefully
4. **User Feedback**: Indicate interruption was detected
5. **Context Preservation**: Don't lose conversation history

## Configuration

### Sensitive Interruption
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.3,        // Lower = more sensitive
  silence_duration_ms: 300,
  prefix_padding_ms: 100
}
```

### Balanced Interruption
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,
  silence_duration_ms: 500,
  prefix_padding_ms: 300
}
```

## Common Issues

### False Interruptions

- Increase VAD threshold
- Add delay before canceling
- Filter out background noise

### Slow Cancellation

- Reduce audio buffer size
- Clear buffers immediately
- Stop audio playback sync

### Lost Context

- Preserve partial responses
- Include interruption in history
- Resume from last complete thought

## Next Steps

- Explore [Session Management](../session-management/)
- Learn about [Basic Voice Agent](../basic-voice-agent/)
- Read [Interruption Guide](../../docs/06-advanced-features.md#interruption-handling)
