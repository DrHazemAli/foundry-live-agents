# Configuration Templates

Pre-built configuration templates for common use cases with Azure Speech Voice Live API.

## Features

- Customer support agent config
- Healthcare assistant config
- Demo/testing configs
- Telephony integration configs
- Voice presets (formal, casual, empathetic)
- VAD profiles (sensitive, balanced, conservative)
- Audio format profiles
- Model defaults

## Usage

### TypeScript
```typescript
import { 
  customerSupportConfig,
  healthcareConfig,
  voicePresets,
  vadProfiles
} from './config-templates';

// Use pre-built config
const config = {
  ...customerSupportConfig,
  voice: voicePresets.empathetic.voice
};

await client.configure(config);
```

### Python
```python
from config_templates import (
    customer_support_config,
    healthcare_config,
    voice_presets,
    vad_profiles
)

# Use pre-built config
config = {
    **customer_support_config,
    "voice": voice_presets["empathetic"]["voice"]
}

await client.configure(config)
```

## Available Templates

### Use Case Configs

#### Customer Support
```typescript
{
  voice: 'en-US-JennyNeural',
  instructions: 'Professional customer support assistant...',
  temperature: 0.7,
  turnDetection: vadProfiles.balanced,
  functions: [/* support functions */]
}
```

#### Healthcare Assistant
```typescript
{
  voice: 'en-US-AriaNeural',
  instructions: 'Healthcare assistant with HIPAA compliance...',
  temperature: 0.6,
  turnDetection: vadProfiles.sensitive,
  maxTokens: 2048
}
```

#### Demo/Testing
```typescript
{
  voice: 'alloy',
  instructions: 'Demo assistant for testing...',
  temperature: 0.8,
  turnDetection: vadProfiles.balanced,
  maxTokens: 1024
}
```

#### Telephony Integration
```typescript
{
  inputAudioFormat: 'g711_ulaw',
  outputAudioFormat: 'g711_ulaw',
  turnDetection: vadProfiles.conservative,
  maxTokens: 512
}
```

### Voice Presets

#### Formal
- Voice: `en-US-GuyNeural`
- Style: Professional, authoritative
- Use: Business, legal, corporate

#### Casual
- Voice: `en-US-JasonNeural`
- Style: Friendly, conversational
- Use: General chat, demos

#### Empathetic
- Voice: `en-US-JennyNeural`
- Style: Warm, caring, supportive
- Use: Customer support, healthcare

#### Multilingual
- Voice: `en-US-EmmaMultilingualNeural`
- Languages: 10+ languages
- VAD: `azure_semantic_vad_multilingual`

### VAD Profiles

#### Sensitive
```typescript
{
  type: 'server_vad',
  threshold: 0.3,
  prefixPaddingMs: 300,
  silenceDurationMs: 300
}
```
Best for: Quick responses, interactive conversations

#### Balanced (Recommended)
```typescript
{
  type: 'server_vad',
  threshold: 0.5,
  prefixPaddingMs: 200,
  silenceDurationMs: 500
}
```
Best for: Most use cases

#### Conservative
```typescript
{
  type: 'server_vad',
  threshold: 0.7,
  prefixPaddingMs: 100,
  silenceDurationMs: 800
}
```
Best for: Noisy environments, telephony

### Audio Format Profiles

#### High Quality
- Format: `pcm16`
- Sample Rate: 24kHz
- Channels: 1 (mono)

#### Telephony
- Format: `g711_ulaw` or `g711_alaw`
- Sample Rate: 8kHz
- Channels: 1

#### Streaming Optimized
- Format: `pcm16`
- Sample Rate: 16kHz
- Chunk Size: 4800 bytes

### Model Defaults

#### GPT-4o Realtime (Recommended)
```typescript
{
  model: 'gpt-4o-realtime-preview',
  temperature: 0.8,
  maxTokens: 1024,
  topP: 0.9
}
```

## Customization

All templates can be extended:

```typescript
import { customerSupportConfig } from './config-templates';

const myConfig = {
  ...customerSupportConfig,
  voice: 'en-GB-SoniaNeural',  // UK English
  temperature: 0.9,             // More creative
  instructions: 'Custom instructions...'
};
```

## Testing Utilities

```typescript
import { validateConfig } from './config-templates';

const config = {...};
const validation = validateConfig(config);

if (!validation.valid) {
  console.error('Config errors:', validation.errors);
}
```
