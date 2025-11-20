# Voice Catalog

> **Last Updated:** November 2025 (Post MS Ignite 2025)  
> **Total Voices:** 600+  
> **Supported Languages:** 150+

## Voice Categories

Azure Speech Voice Live supports multiple voice types with different characteristics and use cases.

## OpenAI Voices (10)

Natural, expressive voices available with `gpt-realtime` model.

| Voice | Gender | Style | Best For | Sample |
|-------|--------|-------|----------|--------|
| **alloy** | Neutral | Balanced, professional | Customer support, general use | [Listen](https://aka.ms/openai-voice-alloy) |
| **ash** | Neutral/Male | Warm, friendly | Casual conversations | [Listen](https://aka.ms/openai-voice-ash) |
| **ballad** | Female | Calm, soothing | Healthcare, meditation | [Listen](https://aka.ms/openai-voice-ballad) |
| **coral** | Female | Bright, energetic | Sales, marketing | [Listen](https://aka.ms/openai-voice-coral) |
| **echo** | Male | Deep, authoritative | News, announcements | [Listen](https://aka.ms/openai-voice-echo) |
| **sage** | Female | Wise, mature | Education, advisory | [Listen](https://aka.ms/openai-voice-sage) |
| **shimmer** | Female | Lively, enthusiastic | Entertainment, youth | [Listen](https://aka.ms/openai-voice-shimmer) |
| **verse** | Male | Clear, articulate | Technical support | [Listen](https://aka.ms/openai-voice-verse) |
| **marin** | Female | Professional, clear | Corporate, business | Coming soon |
| **cedar** | Male | Relaxed, conversational | Podcasts, storytelling | Coming soon |

### Configuration

```json
{
  "voice": {
    "type": "openai",
    "name": "alloy"
  }
}
```

### Model Requirement

OpenAI voices **only** work with `gpt-realtime` and `gpt-realtime-mini` models.

---

## Azure Standard Neural Voices (500+)

High-quality neural voices across 150+ locales.

### Top Languages (20+ voices each)

#### English

| Locale | Voice | Gender | Style | Characteristics |
|--------|-------|--------|-------|-----------------|
| **en-US** | Jenny | F | Standard | Warm, friendly, general purpose |
| en-US | Guy | M | Standard | Professional, clear |
| en-US | Aria | F | Standard | Versatile, natural |
| en-US | Davis | M | Standard | Authoritative, news-style |
| en-US | Amber | F | Standard | Friendly, conversational |
| en-US | Ana | F | Standard | Soft, gentle |
| en-US | Andrew | M | Standard | Professional, business |
| en-US | Ashley | F | Standard | Young, enthusiastic |
| en-US | Brandon | M | Standard | Confident, strong |
| en-US | Brian | M | Standard | Technical, precise |
| en-US | Christopher | M | Standard | Mature, authoritative |
| en-US | Cora | F | Standard | Friendly, helpful |
| en-US | Elizabeth | F | Standard | Professional, elegant |
| en-US | Eric | M | Standard | Calm, measured |
| en-US | Jacob | M | Standard | Young, energetic |
| en-US | Jane | F | Standard | Professional, corporate |
| en-US | Jason | M | Standard | Confident, sales-oriented |
| en-US | Michelle | F | Standard | Warm, nurturing |
| en-US | Monica | F | Standard | Friendly, approachable |
| en-US | Nancy | F | Standard | Professional, news-style |
| en-US | Roger | M | Standard | Deep, authoritative |
| en-US | Sara | F | Standard | Clear, articulate |
| en-US | Steffan | M | Standard | Young, casual |
| en-US | Tony | M | Standard | Friendly, conversational |
| **en-GB** | Sonia | F | Standard | British, professional |
| en-GB | Ryan | M | Standard | British, authoritative |
| en-GB | Libby | F | Standard | British, friendly |
| en-GB | Mia | F | Standard | British, young |
| **en-AU** | Natasha | F | Standard | Australian, friendly |
| en-AU | William | M | Standard | Australian, professional |
| **en-CA** | Clara | F | Standard | Canadian, warm |
| en-CA | Liam | M | Standard | Canadian, professional |
| **en-IN** | Neerja | F | Standard | Indian English, clear |
| en-IN | Prabhat | M | Standard | Indian English, professional |

#### Spanish

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **es-ES** | Elvira | F | Castilian Spanish, professional |
| es-ES | Alvaro | M | Castilian Spanish, authoritative |
| **es-MX** | Dalia | F | Mexican Spanish, friendly |
| es-MX | Jorge | M | Mexican Spanish, confident |
| **es-AR** | Elena | F | Argentine Spanish, warm |
| es-AR | Tomas | M | Argentine Spanish, professional |
| **es-CO** | Salome | F | Colombian Spanish, clear |
| es-CO | Gonzalo | M | Colombian Spanish, friendly |

#### French

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **fr-FR** | Denise | F | Metropolitan French, elegant |
| fr-FR | Henri | M | Metropolitan French, authoritative |
| fr-FR | Brigitte | F | Metropolitan French, professional |
| fr-FR | Alain | M | Metropolitan French, mature |
| **fr-CA** | Sylvie | F | Canadian French, warm |
| fr-CA | Antoine | M | Canadian French, professional |
| fr-CA | Jean | M | Canadian French, friendly |

#### German

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **de-DE** | Katja | F | German, friendly |
| de-DE | Conrad | M | German, authoritative |
| de-DE | Amala | F | German, professional |
| de-DE | Bernd | M | German, mature |
| de-DE | Christoph | M | German, young |
| de-DE | Elke | F | German, warm |
| de-DE | Gisela | F | German, elderly |
| de-DE | Kasper | M | German, confident |
| **de-AT** | Ingrid | F | Austrian German, elegant |
| de-AT | Jonas | M | Austrian German, professional |
| **de-CH** | Leni | F | Swiss German, clear |
| de-CH | Jan | M | Swiss German, friendly |

#### Chinese

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **zh-CN** | Xiaoxiao | F | Mandarin, friendly |
| zh-CN | Yunyang | M | Mandarin, professional |
| zh-CN | Xiaoyi | F | Mandarin, young |
| zh-CN | Yunjian | M | Mandarin, authoritative |
| zh-CN | Yunxi | M | Mandarin, calm |
| zh-CN | Xiaomeng | F | Mandarin, child voice |
| zh-CN | Xiaomo | F | Mandarin, professional |
| zh-CN | Xiaoqiu | F | Mandarin, mature |
| zh-CN | Xiaorui | F | Mandarin, calm |
| zh-CN | Xiaoshuang | F | Mandarin, child voice |
| zh-CN | Xiaoxuan | F | Mandarin, gentle |
| zh-CN | Xiaoyan | F | Mandarin, standard |
| zh-CN | Xiaoyou | F | Mandarin, child voice |
| zh-CN | Yunhao | M | Mandarin, advertising |
| zh-CN | Yunxia | M | Mandarin, young |
| **zh-TW** | Hsiaoyou | F | Taiwanese Mandarin, friendly |
| zh-TW | Yunjhe | M | Taiwanese Mandarin, professional |
| **zh-HK** | HiuMaan | F | Cantonese, friendly |
| zh-HK | WanLung | M | Cantonese, professional |

#### Japanese

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **ja-JP** | Nanami | F | Japanese, friendly |
| ja-JP | Keita | M | Japanese, professional |
| ja-JP | Aoi | F | Japanese, young |
| ja-JP | Daichi | M | Japanese, authoritative |
| ja-JP | Mayu | F | Japanese, calm |
| ja-JP | Naoki | M | Japanese, energetic |
| ja-JP | Shiori | F | Japanese, elegant |

#### Korean

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **ko-KR** | SunHi | F | Korean, friendly |
| ko-KR | InJoon | M | Korean, professional |
| ko-KR | BongJin | M | Korean, authoritative |
| ko-KR | GookMin | M | Korean, news-style |
| ko-KR | JiMin | F | Korean, young |
| ko-KR | SeoHyeon | F | Korean, calm |
| ko-KR | SoonBok | F | Korean, elderly |
| ko-KR | YuJin | F | Korean, professional |

#### Portuguese

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **pt-BR** | Francisca | F | Brazilian Portuguese, friendly |
| pt-BR | Antonio | M | Brazilian Portuguese, professional |
| pt-BR | Brenda | F | Brazilian Portuguese, young |
| pt-BR | Donato | M | Brazilian Portuguese, authoritative |
| pt-BR | Elza | F | Brazilian Portuguese, mature |
| pt-BR | Fabio | M | Brazilian Portuguese, energetic |
| pt-BR | Giovanna | F | Brazilian Portuguese, elegant |
| pt-BR | Humberto | M | Brazilian Portuguese, calm |
| pt-BR | Julio | M | Brazilian Portuguese, confident |
| pt-BR | Leila | F | Brazilian Portuguese, warm |
| pt-BR | Leticia | F | Brazilian Portuguese, professional |
| pt-BR | Manuela | F | Brazilian Portuguese, friendly |
| pt-BR | Nicolau | M | Brazilian Portuguese, deep |
| pt-BR | Thalita | F | Brazilian Portuguese, cheerful |
| pt-BR | Valeria | F | Brazilian Portuguese, news-style |
| pt-BR | Yara | F | Brazilian Portuguese, casual |
| **pt-PT** | Raquel | F | European Portuguese, professional |
| pt-PT | Duarte | M | European Portuguese, authoritative |

#### Italian

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **it-IT** | Elsa | F | Italian, elegant |
| it-IT | Isabella | F | Italian, friendly |
| it-IT | Diego | M | Italian, professional |
| it-IT | Benigno | M | Italian, mature |
| it-IT | Calimero | M | Italian, young |
| it-IT | Cataldo | M | Italian, authoritative |
| it-IT | Fabiola | F | Italian, warm |
| it-IT | Fiamma | F | Italian, energetic |
| it-IT | Gianni | M | Italian, confident |
| it-IT | Imelda | F | Italian, professional |
| it-IT | Irma | F | Italian, elderly |
| it-IT | Lisandro | M | Italian, deep |
| it-IT | Palmira | F | Italian, calm |
| it-IT | Pierina | F | Italian, cheerful |
| it-IT | Rinaldo | M | Italian, friendly |

#### Hindi

| Locale | Voice | Gender | Characteristics |
|--------|-------|--------|-----------------|
| **hi-IN** | Swara | F | Hindi, friendly |
| hi-IN | Madhur | M | Hindi, professional |

### Additional Languages (15+ voices each)

- **Arabic**: ar-EG, ar-SA, ar-AE, ar-DZ, ar-BH, ar-IQ, ar-JO, ar-KW, ar-LB, ar-LY, ar-MA, ar-OM, ar-QA, ar-SY, ar-TN, ar-YE
- **Dutch**: nl-NL, nl-BE
- **Polish**: pl-PL
- **Russian**: ru-RU
- **Turkish**: tr-TR
- **Swedish**: sv-SE
- **Norwegian**: nb-NO
- **Danish**: da-DK
- **Finnish**: fi-FI
- **Greek**: el-GR
- **Czech**: cs-CZ
- **Hungarian**: hu-HU
- **Romanian**: ro-RO
- **Slovak**: sk-SK
- **Bulgarian**: bg-BG
- **Croatian**: hr-HR
- **Serbian**: sr-RS
- **Slovenian**: sl-SI
- **Ukrainian**: uk-UA
- **Vietnamese**: vi-VN
- **Thai**: th-TH
- **Indonesian**: id-ID
- **Malay**: ms-MY
- **Filipino**: fil-PH
- **Tamil**: ta-IN
- **Telugu**: te-IN
- **Bengali**: bn-IN
- **Marathi**: mr-IN
- **Gujarati**: gu-IN
- **Kannada**: kn-IN
- **Malayalam**: ml-IN
- **Urdu**: ur-PK
- **Hebrew**: he-IL
- **Persian**: fa-IR
- **Afrikaans**: af-ZA
- **Icelandic**: is-IS
- **Latvian**: lv-LV
- **Lithuanian**: lt-LT
- **Estonian**: et-EE
- **Maltese**: mt-MT
- **Welsh**: cy-GB
- **Irish**: ga-IE
- **Basque**: eu-ES
- **Catalan**: ca-ES
- **Galician**: gl-ES
- **Swahili**: sw-KE, sw-TZ
- **Amharic**: am-ET
- **Zulu**: zu-ZA

### Configuration

```json
{
  "voice": {
    "type": "azure-standard",
    "name": "en-US-Jenny"
  }
}
```

---

## Azure HD (High-Definition) Voices (50+)

Premium quality voices with enhanced naturalness. Available in select regions.

### Supported Locales

HD voices are available for major languages with suffix `:DragonHDLatestNeural`:

| Locale | Example Voice | Characteristics |
|--------|---------------|-----------------|
| **en-US** | `en-US-Ava:DragonHDLatestNeural` | Ultra-natural, expressive |
| en-US | `en-US-Andrew:DragonHDLatestNeural` | Professional, clear |
| en-US | `en-US-Brian:DragonHDLatestNeural` | Technical, precise |
| en-US | `en-US-Emma:DragonHDLatestNeural` | Warm, friendly |
| **es-ES** | `es-ES-Elvira:DragonHDLatestNeural` | Natural Castilian |
| **fr-FR** | `fr-FR-Denise:DragonHDLatestNeural` | Elegant French |
| **de-DE** | `de-DE-Katja:DragonHDLatestNeural` | Natural German |
| **it-IT** | `it-IT-Isabella:DragonHDLatestNeural` | Expressive Italian |
| **pt-BR** | `pt-BR-Francisca:DragonHDLatestNeural` | Natural Brazilian |
| **ja-JP** | `ja-JP-Nanami:DragonHDLatestNeural` | Natural Japanese |
| **zh-CN** | `zh-CN-Xiaoxiao:DragonHDLatestNeural` | Natural Mandarin |
| **ko-KR** | `ko-KR-SunHi:DragonHDLatestNeural` | Natural Korean |

### Configuration

```json
{
  "voice": {
    "type": "azure-standard",
    "name": "en-US-Ava:DragonHDLatestNeural",
    "temperature": 0.8
  }
}
```

### Temperature Control

HD voices support temperature adjustment (0.0 - 1.0):

- **0.0** - Monotone, consistent
- **0.5** - Balanced (default)
- **0.8** - More expressive
- **1.0** - Maximum variation

### Regional Availability

HD voices available in:
- East US
- East US 2
- West US 2
- West Europe
- Southeast Asia
- Central India
- Sweden Central

---

## Azure Personal Voices (3)

Latest-generation Azure voices with enhanced capabilities.

| Voice | Full Name | Characteristics |
|-------|-----------|-----------------|
| **Dragon** | DragonLatestNeural | Advanced, highly natural |
| **Phoenix** | PhoenixLatestNeural | Expressive, versatile |
| **Phoenix V2** | PhoenixV2Neural | Enhanced Phoenix variant |

### Configuration

```json
{
  "voice": {
    "type": "azure-personal",
    "name": "DragonLatestNeural"
  }
}
```

---

## Custom Voices

Create custom voice models trained on your audio data.

### Professional Custom Voice

**Requirements:**
- 30-60 minutes of training audio
- Professional recording environment
- Azure Speech Studio access
- Approval process required

**Use Cases:**
- Brand voice consistency
- Celebrity/spokesperson voices
- Specialized character voices
- Corporate identity

### Personal Voice (Voice Cloning)

**Requirements:**
- 1 minute of audio samples
- Consent recording required
- Limited to approved use cases

**Use Cases:**
- Accessibility (personal voice preservation)
- Educational content creators
- Internal corporate use

### Configuration

```json
{
  "voice": {
    "type": "azure-custom",
    "name": "YourCustomVoiceModel"
  }
}
```

### Setup Guide

See [Custom Voice Documentation](https://learn.microsoft.com/azure/ai-services/speech-service/custom-neural-voice) for training process.

---

## Voice Selection Guide

### By Use Case

| Use Case | Recommended Voice | Reason |
|----------|-------------------|--------|
| **Customer Support** | en-US-Jenny (Azure) | Warm, professional, clear |
| **Technical Support** | en-US-Brian (Azure) or verse (OpenAI) | Precise, technical |
| **Healthcare** | ballad (OpenAI) or en-US-Ana (Azure) | Calm, empathetic |
| **Sales** | coral (OpenAI) or en-US-Aria (Azure) | Energetic, persuasive |
| **News/Information** | echo (OpenAI) or en-US-Davis (Azure) | Authoritative, clear |
| **Education** | sage (OpenAI) or en-US-Sara (Azure) | Patient, articulate |
| **Entertainment** | shimmer (OpenAI) or en-US-Ashley (Azure) | Lively, engaging |
| **Corporate** | alloy (OpenAI) or en-US-Andrew (Azure) | Professional, neutral |

### By Language Support

| Priority | Voice Type | Notes |
|----------|-----------|-------|
| **English only** | OpenAI voices | Most expressive |
| **Major languages (10)** | Azure HD voices | Best quality |
| **Global (150+)** | Azure Standard | Widest coverage |
| **Brand consistency** | Custom voices | Unique identity |

### By Model Compatibility

| Model | Compatible Voices |
|-------|-------------------|
| **gpt-realtime** | OpenAI voices only |
| **gpt-4o, gpt-5** | Azure Standard, HD, Personal, Custom |
| **gpt-4.1** | Azure Standard, HD, Personal, Custom |
| **phi4-mm-realtime** | Azure Standard, HD, Personal, Custom |

---

## Voice Testing

### Try Voices Before Implementing

**Option 1: Azure Speech Studio**
1. Go to [Speech Studio](https://speech.microsoft.com/portal)
2. Navigate to "Text to Speech"
3. Select locale and voice
4. Enter sample text
5. Click "Play" to hear voice

**Option 2: Use Playground**

```bash
cd playground
npm run dev
# Select voices from the dropdown and test in real-time
```

**Option 3: Quick Test Script**

```typescript
// See samples/typescript/voice-testing/ for complete examples
```

---

## Voice Configuration Examples

### Basic Configuration

```json
{
  "voice": {
    "type": "openai",
    "name": "alloy"
  }
}
```

### HD Voice with Temperature

```json
{
  "voice": {
    "type": "azure-standard",
    "name": "en-US-Ava:DragonHDLatestNeural",
    "temperature": 0.8
  }
}
```

### Multi-lingual Agent

```json
{
  "voice": {
    "type": "azure-standard",
    "name": "en-US-Jenny"
  },
  "input_audio_transcription": {
    "model": "azure-speech",
    "language": "auto-detect"
  }
}
```

### Custom Voice

```json
{
  "voice": {
    "type": "azure-custom",
    "name": "MyCompanyVoice"
  }
}
```

---

## Additional Resources

- **[Azure Speech Gallery](https://speech.microsoft.com/portal/voicegallery)** - Listen to all voices
- **[Voice Samples](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts)** - Official samples
- **[Custom Voice](https://learn.microsoft.com/azure/ai-services/speech-service/custom-neural-voice)** - Create custom voices
- **[Voice Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/)** - Cost calculator

---

**[← Back to README](../README.md) | [Module 03: Voices & Languages →](docs/03-voices-languages.md)**
