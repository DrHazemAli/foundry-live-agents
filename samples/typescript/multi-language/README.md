# Multi-Language Sample

This sample demonstrates real-time language detection and multi-lingual conversation handling with Azure Speech Voice Live API.

## Features

- Automatic language detection
- Multi-language voice selection
- Language-aware conversation handling
- Language switching mid-conversation
- Support for 150+ languages

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

### Multi-Lingual VAD

Use Azure Semantic VAD Multilingual for automatic language detection:

```typescript
const config = {
  turn_detection: {
    type: 'azure_semantic_vad_multilingual',
    threshold: 0.5,
    silence_duration_ms: 700
  }
};
```

### Language-Specific Voices

Select appropriate voices based on detected language:

```typescript
const voiceMap = {
  'en': 'en-US-AndrewMultilingualNeural',
  'es': 'es-ES-ElviraNeural',
  'fr': 'fr-FR-DeniseNeural',
  'de': 'de-DE-KatjaNeural',
  'ja': 'ja-JP-NanamiNeural',
  'zh': 'zh-CN-XiaoxiaoNeural'
};
```

### Language Instructions

Provide language-agnostic instructions:

```typescript
const instructions = `You are a multilingual assistant.
Respond in the same language the user speaks.
If you detect a language switch, respond in the new language.`;
```

## Example Conversation

**User** (English): "Hello, how are you?"  
**Agent** (English): "I'm doing well, thank you! How can I help you today?"

**User** (Spanish): "¿Puedes ayudarme en español?"  
**Agent** (Spanish): "¡Por supuesto! Puedo ayudarte en español."

**User** (French): "Parlez-vous français?"  
**Agent** (French): "Oui, je parle français. Comment puis-je vous aider?"

## Supported Languages

The Voice Live API supports 150+ languages including:

- English (multiple variants)
- Spanish, French, German, Italian
- Chinese (Mandarin, Cantonese), Japanese, Korean
- Arabic, Hindi, Russian, Portuguese
- And many more

See [Voice Catalog](../../../docs/03-voice-catalog.md) for complete list.

## Best Practices

1. **Use Multilingual VAD**: For automatic language detection
2. **Multilingual Voices**: Use voices that support multiple languages
3. **Clear Instructions**: Tell the agent to match user's language
4. **Language Hints**: Provide context for better detection
5. **Testing**: Test with native speakers when possible

## Common Issues

### Language Not Detected

- Ensure sufficient audio for detection
- Use azure_semantic_vad_multilingual
- Increase silence_duration_ms for better detection

### Wrong Language Response

- Check voice supports target language
- Verify instructions mention language matching
- Test with clear speech samples

## Next Steps

- Explore [Voice with Avatar](../voice-with-avatar/)
- Learn about [VoiceRAG Pattern](../voicerag-pattern/)
- Read [Multi-Language Guide](../../docs/07-multi-language.md)
