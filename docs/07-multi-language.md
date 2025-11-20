# Module 07: Multi-Language Support

> **Duration:** 60 minutes  
> **Level:** Intermediate  
> **Prerequisites:** Modules 01-04, understanding of voice configuration

## Learning Objectives

By the end of this module, you will:

- Implement multi-language voice agents
- Configure automatic language detection
- Map voices to languages appropriately
- Handle language switching mid-conversation
- Support 150+ locales effectively
- Optimize for multilingual VAD

## Language Support Overview

Azure Speech Voice Live supports **150+ languages and locales** through:

- **600+ Neural Voices** across all major languages
- **Automatic Language Detection** for seamless conversations
- **Multilingual VAD** optimized for 10+ languages
- **Real-time Translation** (with Azure Translator integration)
- **Custom Language Models** for domain-specific terminology

## Architecture Patterns

### Pattern 1: Fixed Language Agent

Agent operates in a single language:

```typescript
const config = {
  voice: {
    type: "azure-standard",
    name: "es-ES-Elvira"  // Spanish voice
  },
  input_audio_transcription: {
    model: "azure-speech",
    language: "es-ES"      // Transcribe Spanish only
  }
};
```

**Use Cases:**
- Regional customer support (Spain-only customers)
- Language-specific content (Spanish podcast assistant)
- Market-specific applications

### Pattern 2: Auto-Detect with Voice Mapping

Automatically detect language and switch voices:

```typescript
const voiceMap = {
  'en-US': 'en-US-Jenny',
  'es-ES': 'es-ES-Elvira',
  'fr-FR': 'fr-FR-Denise',
  'de-DE': 'de-DE-Katja',
  'it-IT': 'it-IT-Elsa',
  'pt-BR': 'pt-BR-Francisca',
  'ja-JP': 'ja-JP-Nanami',
  'zh-CN': 'zh-CN-Xiaoxiao',
  'ko-KR': 'ko-KR-SunHi',
  'hi-IN': 'hi-IN-Swara'
};

const config = {
  voice: {
    type: "azure-standard",
    name: voiceMap['en-US']  // Start with English
  },
  input_audio_transcription: {
    model: "azure-speech",
    language: "auto-detect",  // Detect automatically
    candidateLanguages: [
      "en-US", "es-ES", "fr-FR", "de-DE", "it-IT",
      "pt-BR", "ja-JP", "zh-CN", "ko-KR", "hi-IN"
    ]
  },
  turn_detection: {
    type: "azure_semantic_vad_multilingual"  // Multilingual VAD
  }
};

// Handle language detection
client.on('input_audio_transcription.completed', (event) => {
  const detectedLanguage = event.language;
  
  if (detectedLanguage !== currentLanguage) {
    currentLanguage = detectedLanguage;
    
    // Switch voice to match detected language
    const newVoice = voiceMap[detectedLanguage];
    if (newVoice) {
      client.updateSession({
        voice: {
          type: "azure-standard",
          name: newVoice
        }
      });
    }
  }
});
```

**Use Cases:**
- Global customer support
- Tourist information kiosks
- International e-commerce
- Multilingual helpdesks

### Pattern 3: User-Selected Language

User explicitly chooses language:

```typescript
function setLanguage(languageCode: string) {
  const voice = voiceMap[languageCode];
  
  client.updateSession({
    voice: {
      type: "azure-standard",
      name: voice
    },
    input_audio_transcription: {
      model: "azure-speech",
      language: languageCode
    }
  });
  
  // Update agent instructions for language
  const greeting = greetings[languageCode];
  console.log(`Language set to ${languageCode}: ${greeting}`);
}

// User interface
const languageSelector = document.getElementById('language-select');
languageSelector.addEventListener('change', (e) => {
  setLanguage(e.target.value);
});
```

**Use Cases:**
- User preference settings
- Accessibility applications
- Language learning tools

## Voice Selection by Language

### Top 20 Languages - Recommended Voices

| Language | Locale | Male Voice | Female Voice | HD Available |
|----------|--------|------------|--------------|--------------|
| **English (US)** | en-US | Guy, Ryan | Jenny, Aria, Ava-HD | ✅ |
| **Spanish (Spain)** | es-ES | Alvaro | Elvira | ✅ |
| **Spanish (Mexico)** | es-MX | Jorge | Dalia | ✅ |
| **French (France)** | fr-FR | Henri | Denise | ✅ |
| **German** | de-DE | Conrad | Katja | ✅ |
| **Italian** | it-IT | Diego | Elsa | ✅ |
| **Portuguese (Brazil)** | pt-BR | Antonio | Francisca | ✅ |
| **Japanese** | ja-JP | Keita | Nanami | ✅ |
| **Chinese (Mandarin)** | zh-CN | Yunyang | Xiaoxiao | ✅ |
| **Korean** | ko-KR | InJoon | SunHi | ✅ |
| **Hindi** | hi-IN | Madhur | Swara | ❌ |
| **Arabic (Saudi)** | ar-SA | Hamed | Zariyah | ❌ |
| **Russian** | ru-RU | Dmitry | Svetlana | ❌ |
| **Dutch** | nl-NL | Maarten | Colette | ❌ |
| **Polish** | pl-PL | Marek | Zofia | ❌ |
| **Turkish** | tr-TR | Ahmet | Emel | ❌ |
| **Swedish** | sv-SE | Mattias | Sofie | ❌ |
| **Indonesian** | id-ID | Ardi | Gadis | ❌ |
| **Thai** | th-TH | Niwat | Premwadee | ❌ |
| **Vietnamese** | vi-VN | Nam | HoaiMy | ❌ |

### Voice Characteristics by Language

**English (en-US):**
- **Jenny** - Warm, professional, most popular
- **Aria** - Expressive, energetic, younger sound
- **Guy** - Trustworthy, calm, professional
- **Ava-HD** - Premium quality, expressive, adjustable warmth

**Spanish (es-ES):**
- **Elvira** - Clear, professional, Castilian accent
- **Alvaro** - Authoritative, business-appropriate

**French (fr-FR):**
- **Denise** - Elegant, professional Parisian accent
- **Henri** - Sophisticated, clear enunciation

**German (de-DE):**
- **Katja** - Friendly, clear High German
- **Conrad** - Professional, authoritative

**Japanese (ja-JP):**
- **Nanami** - Polite, clear Tokyo accent
- **Keita** - Professional, neutral formality

**Chinese (zh-CN):**
- **Xiaoxiao** - Young, friendly Mandarin
- **Yunyang** - Professional, clear pronunciation

## Multilingual Agent Implementation

### Complete Multi-Language Agent

```typescript
interface LanguageConfig {
  locale: string;
  voice: string;
  greeting: string;
  systemPrompt: string;
}

const languageConfigs: Record<string, LanguageConfig> = {
  'en-US': {
    locale: 'en-US',
    voice: 'en-US-Jenny',
    greeting: 'Hello! How can I help you today?',
    systemPrompt: 'You are a helpful customer support agent.'
  },
  'es-ES': {
    locale: 'es-ES',
    voice: 'es-ES-Elvira',
    greeting: '¡Hola! ¿Cómo puedo ayudarte hoy?',
    systemPrompt: 'Eres un agente de atención al cliente útil.'
  },
  'fr-FR': {
    locale: 'fr-FR',
    voice: 'fr-FR-Denise',
    greeting: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
    systemPrompt: 'Vous êtes un agent de support client utile.'
  },
  'de-DE': {
    locale: 'de-DE',
    voice: 'de-DE-Katja',
    greeting: 'Hallo! Wie kann ich Ihnen heute helfen?',
    systemPrompt: 'Sie sind ein hilfreicher Kundendienst-Agent.'
  },
  'ja-JP': {
    locale: 'ja-JP',
    voice: 'ja-JP-Nanami',
    greeting: 'こんにちは！今日はどのようにお手伝いできますか？',
    systemPrompt: 'あなたは親切なカスタマーサポート担当者です。'
  },
  'zh-CN': {
    locale: 'zh-CN',
    voice: 'zh-CN-Xiaoxiao',
    greeting: '你好！我今天能帮你什么？',
    systemPrompt: '你是一个乐于助人的客户支持代理。'
  }
};

class MultilingualAgent {
  private client: VoiceLiveClient;
  private currentLanguage: string = 'en-US';
  
  async initialize() {
    await this.client.connect();
    
    // Start with auto-detect
    await this.client.configureSession({
      model: 'gpt-4o',
      modalities: ['text', 'audio'],
      instructions: languageConfigs['en-US'].systemPrompt,
      voice: {
        type: 'azure-standard',
        name: languageConfigs['en-US'].voice
      },
      input_audio_transcription: {
        model: 'azure-speech',
        language: 'auto-detect',
        candidateLanguages: Object.keys(languageConfigs)
      },
      turn_detection: {
        type: 'azure_semantic_vad_multilingual',
        threshold: 0.5,
        silence_duration_ms: 750
      }
    });
    
    // Send initial greeting
    await this.sendGreeting('en-US');
    
    // Listen for language changes
    this.client.on('input_audio_transcription.completed', (event) => {
      this.handleLanguageChange(event.language);
    });
  }
  
  private async handleLanguageChange(detectedLanguage: string) {
    if (detectedLanguage === this.currentLanguage) {
      return; // No change
    }
    
    const config = languageConfigs[detectedLanguage];
    if (!config) {
      console.warn(`Unsupported language: ${detectedLanguage}`);
      return;
    }
    
    console.log(`Language changed: ${this.currentLanguage} → ${detectedLanguage}`);
    this.currentLanguage = detectedLanguage;
    
    // Update session for new language
    await this.client.updateSession({
      instructions: config.systemPrompt,
      voice: {
        type: 'azure-standard',
        name: config.voice
      }
    });
    
    // Optional: Send language switch acknowledgment
    await this.sendGreeting(detectedLanguage);
  }
  
  private async sendGreeting(language: string) {
    const config = languageConfigs[language];
    await this.client.sendTextMessage({
      role: 'assistant',
      content: config.greeting
    });
  }
}
```

## Language-Specific Considerations

### 1. Formality Levels

Some languages have formal/informal distinctions:

**Spanish:**
```typescript
const spanishInstructions = {
  formal: 'Usted es un agente profesional. Use "usted" para dirigirse al cliente.',
  informal: 'Eres un agente amigable. Usa "tú" para dirigirte al cliente.'
};
```

**Japanese:**
```typescript
const japaneseInstructions = {
  keigo: 'お客様に対して丁寧語・尊敬語を使用してください。', // Polite/honorific
  tameguchi: 'フレンドリーな口調で話してください。'  // Casual
};
```

**German:**
```typescript
const germanInstructions = {
  formal: 'Verwenden Sie "Sie" für die Ansprache des Kunden.',  // Sie
  informal: 'Verwenden Sie "du" für die Ansprache des Kunden.'  // Du
};
```

### 2. Cultural Adaptations

**Greetings:**
```typescript
const culturalGreetings = {
  'en-US': 'Hi! How can I help you?',
  'ja-JP': 'いらっしゃいませ。' + // Welcome (retail greeting)
           'どのようにお手伝いできますか？',
  'ar-SA': 'السلام عليكم! كيف يمكنني مساعدتك؟',  // As-salamu alaykum
  'zh-CN': '您好！请问有什么可以帮到您的？'  // Formal Chinese greeting
};
```

**Numbers & Currency:**
```typescript
function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: getCurrencyForLocale(locale)
  }).format(amount);
}

// Examples:
formatPrice(1234.56, 'en-US');  // $1,234.56
formatPrice(1234.56, 'fr-FR');  // 1 234,56 €
formatPrice(1234.56, 'ja-JP');  // ¥1,235
```

**Dates & Times:**
```typescript
function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date);
}

// Examples:
formatDateTime(new Date(), 'en-US');  // November 19, 2025 at 2:30 PM
formatDateTime(new Date(), 'fr-FR');  // 19 novembre 2025 à 14:30
formatDateTime(new Date(), 'ja-JP');  // 2025年11月19日 14:30
```

### 3. Measurement Systems

```typescript
const measurementSystems = {
  'en-US': 'imperial',     // miles, pounds, Fahrenheit
  'en-GB': 'mixed',        // miles, but metric for most else
  'es-ES': 'metric',       // kilometers, kilograms, Celsius
  'ja-JP': 'metric'
};

function convertTemperature(celsius: number, locale: string): string {
  if (measurementSystems[locale] === 'imperial') {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${fahrenheit.toFixed(0)}°F`;
  }
  return `${celsius}°C`;
}
```

## Multilingual VAD Configuration

### Azure Semantic VAD Multilingual

Optimized for 10 languages with language-aware detection:

```typescript
{
  turn_detection: {
    type: "azure_semantic_vad_multilingual",
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 750,  // Slightly longer for language variations
    remove_filler_words: true,
    interrupt_response: true,
    end_of_utterance_detection: {
      model: "semantic_detection_v1",
      threshold_level: "default"
    }
  }
}
```

### Language-Specific VAD Tuning

Different languages have different speaking patterns:

```typescript
const vadConfigs = {
  // English: Moderate pace
  'en-US': { silence_duration_ms: 700 },
  
  // Spanish: Faster pace, shorter pauses
  'es-ES': { silence_duration_ms: 650 },
  
  // Japanese: Longer pauses culturally appropriate
  'ja-JP': { silence_duration_ms: 900 },
  
  // German: Compound words, need patience
  'de-DE': { silence_duration_ms: 800 },
  
  // Chinese: Tonal, may need more sensitive threshold
  'zh-CN': { 
    silence_duration_ms: 700,
    threshold: 0.45  // Slightly more sensitive
  }
};
```

## Real-Time Translation Integration

For languages beyond the 150+ supported by Voice Live:

```typescript
import { TextTranslationClient } from '@azure/ai-translation-text';

const translationClient = new TextTranslationClient(
  process.env.AZURE_TRANSLATOR_KEY!,
  process.env.AZURE_TRANSLATOR_REGION!
);

async function translateAndRespond(text: string, targetLanguage: string) {
  // Translate to English for AI processing
  const translated = await translationClient.translate([{
    text,
    to: ['en']
  }]);
  
  const englishText = translated[0].translations[0].text;
  
  // Process with AI
  const aiResponse = await processWithAI(englishText);
  
  // Translate response back
  const responseTranslation = await translationClient.translate([{
    text: aiResponse,
    to: [targetLanguage]
  }]);
  
  return responseTranslation[0].translations[0].text;
}
```

## Testing Multi-Language Agents

```typescript
const testScenarios = [
  {
    language: 'en-US',
    input: 'I need help with my order',
    expectedVoice: 'en-US-Jenny'
  },
  {
    language: 'es-ES',
    input: 'Necesito ayuda con mi pedido',
    expectedVoice: 'es-ES-Elvira'
  },
  {
    language: 'fr-FR',
    input: 'J\'ai besoin d\'aide avec ma commande',
    expectedVoice: 'fr-FR-Denise'
  }
];

for (const scenario of testScenarios) {
  console.log(`Testing ${scenario.language}...`);
  
  // Send input
  await client.sendAudio(audioData);
  
  // Verify language detection
  const detected = await waitForLanguageDetection();
  assert.equal(detected, scenario.language);
  
  // Verify voice switch
  const currentVoice = client.getCurrentVoice();
  assert.equal(currentVoice, scenario.expectedVoice);
  
  console.log(`✓ ${scenario.language} test passed`);
}
```

## Best Practices

1. **Start with Auto-Detect** - Let users speak naturally
2. **Provide Language Selector** - As backup option
3. **Match Voice to Language** - Don't use English voice for Spanish
4. **Adjust VAD by Language** - Different languages have different patterns
5. **Consider Formality** - Japanese/Korean need appropriate politeness
6. **Localize Everything** - Currency, dates, measurements
7. **Test with Native Speakers** - Verify natural conversation flow
8. **Handle Unknown Languages** - Gracefully fall back to default
9. **Update Instructions** - Translate system prompts properly
10. **Monitor Detection Accuracy** - Track and improve false detections

## Common Pitfalls

❌ **Using Same Voice for All Languages**
```typescript
// Bad
voice: { name: 'en-US-Jenny' }  // For Spanish user
```

✅ **Language-Matched Voices**
```typescript
// Good
voice: { name: voiceMap[detectedLanguage] }
```

❌ **Hard-Coded Strings**
```typescript
// Bad
const greeting = "Hello! How can I help?";
```

✅ **Localized Strings**
```typescript
// Good
const greeting = greetings[currentLanguage];
```

❌ **Ignoring Cultural Norms**
```typescript
// Bad - Too informal for Japanese business
instructions: "Hey there! What's up?"
```

✅ **Culturally Appropriate**
```typescript
// Good
instructions: japaneseInstructions.keigo  // Polite Japanese
```

## Next Steps

You now understand:
- ✅ Multi-language architecture patterns
- ✅ Voice selection by language
- ✅ Auto-detection configuration
- ✅ Language-specific adaptations
- ✅ Multilingual VAD optimization
- ✅ Cultural considerations

**Continue to [Module 08: Production Deployment](08-production-deployment.md)** to:
- Deploy at scale
- Implement monitoring
- Ensure reliability
- Optimize costs

---

**[← Previous: Advanced Features](06-advanced-features.md) | [Back to Learning Path](../README.md#-learning-path) | [Next: Production Deployment →](08-production-deployment.md)**
