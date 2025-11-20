# Audio Utilities

Reusable audio processing utilities for Azure Speech Voice Live API.

## Features

- PCM16 encoding/decoding
- Sample rate conversion
- Audio format validation
- Chunking utilities
- Silence detection
- Volume normalization

## Installation

### TypeScript/JavaScript
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
import { AudioProcessor, pcm16Encode, detectSilence } from './audio-processor';

const processor = new AudioProcessor({
  sampleRate: 24000,
  channels: 1,
  bitDepth: 16
});

const encoded = pcm16Encode(audioData);
const hasSilence = detectSilence(encoded, 0.01, 500);
```

### Python
```python
from audio_processor import AudioProcessor, pcm16_encode, detect_silence

processor = AudioProcessor(sample_rate=24000, channels=1, bit_depth=16)
encoded = pcm16_encode(audio_data)
has_silence = detect_silence(encoded, threshold=0.01, duration_ms=500)
```

## API Reference

### AudioProcessor Class
- `encode(data)` - Encode audio to PCM16
- `decode(data)` - Decode PCM16 to raw audio
- `resample(data, target_rate)` - Convert sample rate
- `chunk(data, chunk_size)` - Split audio into chunks
- `normalize(data)` - Normalize volume

### Utility Functions
- `detectSilence(data, threshold, duration_ms)` - Detect silence periods
- `calculateRMS(data)` - Calculate RMS volume
- `applyGain(data, gain_db)` - Apply gain in decibels
