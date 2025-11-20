# Voice with Avatar Sample

This sample demonstrates how to synchronize Azure Speech Voice Live with a visual avatar using viseme data for realistic lip-sync.

## Features

- Real-time viseme data extraction
- Avatar lip-sync animation
- Facial expression mapping
- Audio-visual synchronization
- HTML5 Canvas avatar rendering

## Prerequisites

- Node.js 18 or later
- Azure Speech Services resource with Voice Live enabled
- TypeScript 5.0 or later
- Modern web browser

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

4. Open browser to `http://localhost:3000`

## How It Works

### 1. Viseme Events

The Voice Live API emits viseme events synchronized with audio:

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  if (event.type === 'response.audio.viseme') {
    // Update avatar mouth shape
    avatar.setViseme(event.viseme_id, event.audio_offset);
  }
});
```

### 2. Viseme IDs

Standard SSML viseme IDs map to mouth shapes:

- 0: Silence
- 1: ae, ax, ah (as in "bat")
- 2: aa (as in "father")
- 3: ao (as in "bought")
- 4: ey (as in "bait")
- 5: er (as in "bird")
- 6: y, iy, ih, ix (as in "beat")
- 7: w, uw (as in "boot")
- 8: ow (as in "boat")
- 9: aw (as in "bout")
- 10: oy (as in "boy")
- 11: ay (as in "bite")
- 12: h (as in "hello")
- 13: r (as in "red")
- 14: l (as in "lid")
- 15: s, z (as in "sit")
- 16: sh, ch, jh, zh (as in "ship")
- 17: th, dh (as in "thin")
- 18: f, v (as in "fork")
- 19: d, t, n (as in "dog")
- 20: k, g, ng (as in "cat")
- 21: p, b, m (as in "put")

### 3. Avatar Animation

Simple 2D avatar using Canvas:

```typescript
class Avatar {
  private visemeShapes = {
    0: [/* neutral */],
    1: [/* wide open */],
    // ... other visemes
  };
  
  setViseme(id: number, offset: number) {
    const shape = this.visemeShapes[id];
    this.animateMouth(shape, offset);
  }
  
  animateMouth(shape: number[], offset: number) {
    // Interpolate between current and target shape
    // Render to canvas with proper timing
  }
}
```

## Avatar Types

### 2D Canvas Avatar (Included)
- Simple facial rendering
- Viseme-based lip-sync
- Expression animations

### 3D Avatar Integration
- Ready Player Me
- Mixamo
- Custom 3D models

### Video Avatar
- Talking head video
- D-ID integration
- Synthesia

## Best Practices

1. **Buffer Visemes**: Queue visemes for smooth animation
2. **Timing Sync**: Use audio_offset for precise timing
3. **Interpolation**: Smooth transitions between visemes
4. **Expression**: Add blink, head movement for realism
5. **Performance**: Optimize canvas rendering

## Common Issues

### Visemes Not Received

- Ensure voice supports visemes (Neural voices)
- Check output_audio_format is pcm16
- Verify event listeners are set up

### Lip Sync Delay

- Reduce audio buffer size
- Pre-queue visemes before audio plays
- Adjust animation timing offset

## Next Steps

- Explore [VoiceRAG Pattern](../voicerag-pattern/)
- Learn about [Streaming Responses](../streaming-responses/)
- Read [Avatar Integration Guide](../../docs/06-advanced-features.md#avatar-integration)
