# Module 03: Voices & Languages

> **Duration:** 60 minutes  
> **Level:** Beginner to Intermediate  
> **Prerequisites:** Module 02 completed, working Voice Live connection

## Learning Objectives

By the end of this module, you will:

- Navigate the 600+ voice options across 150+ languages
- Select optimal voices for your use case
- Configure voice parameters (temperature, style, pitch)
- Implement multi-language support with auto-detection
- Customize voice output for your brand
- Handle language switching in conversations

## Voice Types Overview

Azure Speech Voice Live supports four voice categories:

| Type | Count | Best For | Model Compatibility |
|------|-------|----------|---------------------|
| **OpenAI** | 10 | Real-time conversations | gpt-realtime only |
| **Azure Standard** | 500+ | Global applications | gpt-4o, gpt-5, phi4 |
| **Azure HD** | 50+ | Premium quality | gpt-4o, gpt-5 |
| **Custom** | Unlimited | Brand consistency | gpt-4o, gpt-5 |

## OpenAI Voices

### Available Voices

Natural, expressive voices optimized for `gpt-realtime` model:

```typescript
const openAIVoices = [
  'alloy',    // Balanced, professional
  'ash',      // Warm, friendly
  'ballad',   // Calm, soothing
  'coral',    // Bright, energetic
  'echo',     // Deep, authoritative
  'sage',     // Wise, mature
  'shimmer',  // Lively, enthusiastic
  'verse',    // Clear, articulate
  'marin',    // Professional, clear
  'cedar'     // Relaxed, conversational
];
```

### Configuration

```typescript
const sessionConfig = {
  model: 'gpt-realtime',
  voice: {
    type: 'openai',
    name: 'alloy'
  }
};
```

### Characteristics

**alloy** - Most versatile, neutral tone
- Use for: Customer support, general assistance
- Gender: Neutral
- Pace: Medium
- Emotion: Balanced

**coral** - Energetic and upbeat
- Use for: Sales, marketing, entertainment
- Gender: Female
- Pace: Fast
- Emotion: Enthusiastic

**echo** - Deep and authoritative
- Use for: News, announcements, professional content
- Gender: Male
- Pace: Slow-medium
- Emotion: Serious

**ballad** - Calm and soothing
- Use for: Healthcare, meditation, support
- Gender: Female
- Pace: Slow
- Emotion: Empathetic

### Limitations

- English only (en-US accent)
- No customization (temperature, pitch, rate)
- Requires `gpt-realtime` or `gpt-realtime-mini` model
- Cannot be used with Azure Speech recognition

## Azure Standard Voices

### Major Language Examples

**English (US):**
```typescript
const usVoices = {
  jenny: 'en-US-Jenny',        // Warm, friendly
  guy: 'en-US-Guy',            // Professional
  aria: 'en-US-Aria',          // Versatile
  davis: 'en-US-Davis',        // Authoritative
  amber: 'en-US-Amber',        // Conversational
};
```

**Spanish:**
```typescript
const spanishVoices = {
  spain: 'es-ES-Elvira',       // Castilian
  mexico: 'es-MX-Dalia',       // Mexican
  argentina: 'es-AR-Elena',    // Argentine
  colombia: 'es-CO-Salome',    // Colombian
};
```

**Chinese:**
```typescript
const chineseVoices = {
  mandarin: 'zh-CN-Xiaoxiao',  // Standard Mandarin
  taiwan: 'zh-TW-Hsiaoyou',    // Taiwanese
  cantonese: 'zh-HK-HiuMaan',  // Hong Kong
};
```

### Configuration

```typescript
const sessionConfig = {
  model: 'gpt-4o',
  voice: {
    type: 'azure-standard',
    name: 'en-US-Jenny'
  },
  input_audio_transcription: {
    model: 'azure-speech',
    language: 'en-US'
  }
};
```

### Voice Selection Guide

**Customer Support:**
```typescript
const supportVoices = {
  'en-US': 'en-US-Jenny',    // Warm, helpful
  'es-ES': 'es-ES-Elvira',   // Professional
  'fr-FR': 'fr-FR-Denise',   // Elegant
  'de-DE': 'de-DE-Katja',    // Friendly
  'ja-JP': 'ja-JP-Nanami',   // Polite
};
```

**Technical Support:**
```typescript
const techVoices = {
  'en-US': 'en-US-Brian',    // Precise, clear
  'en-GB': 'en-GB-Ryan',     // Authoritative
  'de-DE': 'de-DE-Conrad',   // Technical
  'ja-JP': 'ja-JP-Keita',    // Professional
};
```

**Healthcare:**
```typescript
const healthcareVoices = {
  'en-US': 'en-US-Ana',      // Gentle, caring
  'es-MX': 'es-MX-Dalia',    // Empathetic
  'pt-BR': 'pt-BR-Francisca', // Warm
  'it-IT': 'it-IT-Elsa',     // Comforting
};
```

## Azure HD (High-Definition) Voices

### What Makes HD Different

- **Enhanced Naturalness** - More human-like prosody
- **Better Expressiveness** - Wider emotional range
- **Temperature Control** - Adjustable variation
- **Premium Quality** - Higher audio fidelity

### Naming Convention

HD voices use the format: `{locale}-{name}:DragonHDLatestNeural`

```typescript
const hdVoices = {
  'en-US-Ava': 'en-US-Ava:DragonHDLatestNeural',
  'en-US-Andrew': 'en-US-Andrew:DragonHDLatestNeural',
  'es-ES-Elvira': 'es-ES-Elvira:DragonHDLatestNeural',
  'fr-FR-Denise': 'fr-FR-Denise:DragonHDLatestNeural',
  'de-DE-Katja': 'de-DE-Katja:DragonHDLatestNeural',
};
```

### Configuration with Temperature

```typescript
const sessionConfig = {
  model: 'gpt-4o',
  voice: {
    type: 'azure-standard',
    name: 'en-US-Ava:DragonHDLatestNeural',
    temperature: 0.8  // 0.0 = monotone, 1.0 = expressive
  }
};
```

### Temperature Examples

**Conservative (0.3):**
- Use for: Technical documentation, legal content
- Characteristics: Consistent, monotone, precise
- Example: "The system requires authentication before proceeding."

**Balanced (0.5-0.7):**
- Use for: Customer support, general conversation
- Characteristics: Natural variation, appropriate emotion
- Example: "I'd be happy to help you with that!"

**Expressive (0.8-1.0):**
- Use for: Storytelling, entertainment, sales
- Characteristics: Dynamic, emotional, engaging
- Example: "That's absolutely fantastic! Let me tell you more..."

### Regional Availability

HD voices are available in:
- ✅ East US, East US 2
- ✅ West US 2, West Europe
- ✅ Southeast Asia, Central India
- ✅ Sweden Central

Check availability: `az account list-locations`

## Multi-Language Support

### Auto-Detection

Let Voice Live automatically detect the user's language:

```typescript
const sessionConfig = {
  model: 'gpt-4o',
  voice: {
    type: 'azure-standard',
    name: 'en-US-Jenny'
  },
  input_audio_transcription: {
    model: 'azure-speech',
    language: 'auto-detect'  // Automatic detection
  }
};
```

### Supported Auto-Detect Languages

Priority languages for auto-detection:
- English (en-US, en-GB, en-AU, en-CA, en-IN)
- Spanish (es-ES, es-MX, es-AR)
- French (fr-FR, fr-CA)
- German (de-DE)
- Italian (it-IT)
- Portuguese (pt-BR, pt-PT)
- Japanese (ja-JP)
- Chinese (zh-CN)
- Korean (ko-KR)
- Hindi (hi-IN)

### Multi-Language Agent Pattern

```typescript
// Language-to-voice mapping
const voiceMap = {
  'en-US': 'en-US-Jenny',
  'es-ES': 'es-ES-Elvira',
  'fr-FR': 'fr-FR-Denise',
  'de-DE': 'de-DE-Katja',
  'it-IT': 'it-IT-Isabella',
  'ja-JP': 'ja-JP-Nanami',
  'zh-CN': 'zh-CN-Xiaoxiao',
  'pt-BR': 'pt-BR-Francisca',
};

// Detect language and switch voice
client.on('input_audio_transcription.completed', (event) => {
  const detectedLanguage = event.language;
  const newVoice = voiceMap[detectedLanguage];
  
  if (newVoice) {
    client.updateSession({
      voice: {
        type: 'azure-standard',
        name: newVoice
      }
    });
  }
});
```

### Language-Specific Instructions

```typescript
const instructions = {
  'en-US': 'You are a helpful assistant. Be concise and friendly.',
  'es-ES': 'Eres un asistente útil. Sé conciso y amigable.',
  'fr-FR': 'Vous êtes un assistant utile. Soyez concis et amical.',
  'de-DE': 'Sie sind ein hilfreicher Assistent. Seien Sie prägnant und freundlich.',
  'ja-JP': 'あなたは親切なアシスタントです。簡潔で親しみやすくしてください。',
};

// Update instructions based on language
function updateLanguage(language: string) {
  client.updateSession({
    instructions: instructions[language] || instructions['en-US'],
    voice: {
      type: 'azure-standard',
      name: voiceMap[language] || voiceMap['en-US']
    },
    input_audio_transcription: {
      model: 'azure-speech',
      language: language
    }
  });
}
```

## Custom Voices

### When to Use Custom Voices

✅ **Brand consistency** - Maintain unique voice identity  
✅ **Celebrity/spokesperson** - Use recognizable voices  
✅ **Character voices** - Gaming, entertainment applications  
✅ **Accessibility** - Preserve personal voices  
✅ **Specialized content** - Domain-specific pronunciation

### Professional Custom Voice

**Requirements:**
- 30-60 minutes of high-quality audio recordings
- Professional recording environment
- Script corpus provided by Microsoft
- Approval process (2-4 weeks)

**Process:**
1. Apply for access via Azure Portal
2. Record training data
3. Upload to Speech Studio
4. Train model (1-2 days)
5. Test and deploy

**Pricing:**
- Training: One-time fee
- Usage: Per-character pricing

### Personal Voice (Voice Cloning)

**Requirements:**
- 1 minute of audio samples (reading provided script)
- Consent recording required
- Approved use cases only

**Configuration:**

```typescript
const sessionConfig = {
  model: 'gpt-4o',
  voice: {
    type: 'azure-custom',
    name: 'MyCustomVoiceModel'  // From Speech Studio
  }
};
```

### Deployment

```typescript
// List custom voices
const customVoices = await speechClient.getCustomVoices();

// Select and use
const sessionConfig = {
  voice: {
    type: 'azure-custom',
    name: customVoices[0].name
  }
};
```

## Voice Customization

### Azure Standard Voice Parameters

Beyond temperature (HD only), you can customize:

**Speaking Styles** (select voices):
```typescript
const styledVoice = {
  type: 'azure-standard',
  name: 'en-US-Aria',
  style: 'cheerful'  // angry, cheerful, excited, friendly, hopeful, sad, shouting, terrified, unfriendly, whispering
};
```

**Note:** Styles are **not** directly supported in Voice Live session config but can be embedded in SSML if you use conversation items.

### Phrase Lists

Improve recognition of custom terms:

```typescript
const sessionConfig = {
  input_audio_transcription: {
    model: 'azure-speech',
    language: 'en-US',
    phrase_list: [
      'Contoso',
      'Azure Speech',
      'Voice Live API',
      'real-time agent',
      'semantic VAD'
    ]
  }
};
```

### Custom Speech Models

Use trained speech recognition models:

```typescript
const sessionConfig = {
  input_audio_transcription: {
    model: 'azure-speech',
    language: 'en-US',
    custom_speech: {
      'en-US': 'your-custom-model-guid'
    }
  }
};
```

## Voice Testing Workflow

### 1. Preview Voices in Speech Studio

```bash
# Open Speech Studio
open https://speech.microsoft.com/portal/voicegallery

# Navigate to Voice Gallery
# Select locale and voice
# Enter sample text
# Click "Play" to preview
```

### 2. Test in Playground

```bash
cd playground
npm run dev

# Use voice selector dropdown
# Test with different phrases
# Compare voices side-by-side
```

### 3. A/B Testing Script

```typescript
// test-voices.ts
const voicesToTest = [
  'en-US-Jenny',
  'en-US-Aria',
  'en-US-Ava:DragonHDLatestNeural'
];

const testPhrase = "Hello! I'm here to help you today.";

for (const voice of voicesToTest) {
  console.log(`\nTesting: ${voice}`);
  
  await client.updateSession({
    voice: { type: 'azure-standard', name: voice }
  });
  
  await client.sendMessage(testPhrase);
  await sleep(5000);
}
```

## Best Practices

### Voice Selection

1. **Match culture** - Use native voices for each language
2. **Consider context** - Formal vs casual scenarios
3. **Test with users** - Get feedback from target audience
4. **Consistency** - Use same voice family across touchpoints
5. **Accessibility** - Ensure clear articulation

### Performance

1. **Cache voice configs** - Don't recreate on every call
2. **Pre-load common voices** - Reduce latency
3. **Monitor quality** - Track audio clarity metrics
4. **Regional deployment** - Use closest Azure region

### Multi-Language

1. **Auto-detect first** - Then allow manual override
2. **Persist preference** - Remember user's language
3. **Graceful fallback** - Default to English if unsupported
4. **Clear communication** - Announce language switches
5. **Cultural sensitivity** - Adapt greetings and phrases

## Complete Example

### Multi-Language Customer Support

```typescript
import { VoiceLiveClient } from './voiceLiveClient';

const VOICE_MAP = {
  'en-US': { voice: 'en-US-Jenny', greeting: 'Hello! How can I help you?' },
  'es-ES': { voice: 'es-ES-Elvira', greeting: '¡Hola! ¿Cómo puedo ayudarte?' },
  'fr-FR': { voice: 'fr-FR-Denise', greeting: 'Bonjour! Comment puis-je vous aider?' },
  'de-DE': { voice: 'de-DE-Katja', greeting: 'Hallo! Wie kann ich Ihnen helfen?' },
  'ja-JP': { voice: 'ja-JP-Nanami', greeting: 'こんにちは！どのようにお手伝いできますか？' },
};

class MultiLanguageAgent {
  private client: VoiceLiveClient;
  private currentLanguage: string = 'en-US';
  
  async initialize() {
    this.client = new VoiceLiveClient({...});
    await this.client.connect();
    
    // Start with auto-detection
    await this.client.configureSession({
      model: 'gpt-4o',
      voice: {
        type: 'azure-standard',
        name: VOICE_MAP['en-US'].voice
      },
      input_audio_transcription: {
        model: 'azure-speech',
        language: 'auto-detect'
      },
      turn_detection: {
        type: 'azure_semantic_vad_multilingual'
      }
    });
    
    // Listen for language detection
    this.client.on('language.detected', (language) => {
      this.switchLanguage(language);
    });
  }
  
  private async switchLanguage(language: string) {
    if (language === this.currentLanguage) return;
    
    const config = VOICE_MAP[language] || VOICE_MAP['en-US'];
    this.currentLanguage = language;
    
    console.log(`Switching to ${language}`);
    
    await this.client.updateSession({
      voice: {
        type: 'azure-standard',
        name: config.voice
      },
      input_audio_transcription: {
        model: 'azure-speech',
        language: language
      }
    });
    
    // Optional: Announce language switch
    await this.client.sendMessage(config.greeting);
  }
  
  async start() {
    await this.initialize();
    console.log('Multi-language agent ready!');
  }
}

// Usage
const agent = new MultiLanguageAgent();
await agent.start();
```

## Troubleshooting

### Voice Not Available

**Error:** "Voice not found" or "Unsupported voice"

**Solutions:**
1. Check voice name spelling
2. Verify voice type matches model
3. Confirm region supports voice
4. Use voice gallery to find valid names

### Quality Issues

**Problem:** Robotic or unclear speech

**Solutions:**
1. Try HD voice variant
2. Increase audio sampling rate (24kHz)
3. Enable noise suppression
4. Check network bandwidth
5. Adjust temperature (HD voices)

### Language Not Detected

**Problem:** Auto-detection fails

**Solutions:**
1. Verify language is in supported list
2. Ensure clear audio input
3. Enable noise suppression
4. Use manual language selection
5. Provide phrase lists for uncommon terms

## Next Steps

You now know how to:
- ✅ Select voices from 600+ options
- ✅ Configure voice parameters
- ✅ Implement multi-language support
- ✅ Use custom voices
- ✅ Test and optimize voice quality

**Continue to [Module 04: Configuration](04-configuration.md)** to:
- Master VAD configuration
- Fine-tune audio settings
- Optimize turn detection
- Configure advanced features

## Additional Resources

- **[Voice Catalog](voice-catalog.md)** - Complete voice reference
- **[Speech Studio](https://speech.microsoft.com/portal)** - Test voices
- **[Custom Voice](https://learn.microsoft.com/azure/ai-services/speech-service/custom-neural-voice)** - Create custom voices
- **[Language Support](https://learn.microsoft.com/azure/ai-services/speech-service/language-support)** - Full language list

---

**[← Previous: Getting Started](02-getting-started.md) | [Back to Learning Path](../README.md#-learning-path) | [Next: Configuration →](04-configuration.md)**
