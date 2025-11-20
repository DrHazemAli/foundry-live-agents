import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

// Voice mapping for different languages
const VOICE_MAP: Record<string, string> = {
  'en': 'en-US-AndrewMultilingualNeural',
  'es': 'es-ES-ElviraNeural',
  'fr': 'fr-FR-DeniseNeural',
  'de': 'de-DE-KatjaNeural',
  'it': 'it-IT-ElsaNeural',
  'ja': 'ja-JP-NanamiNeural',
  'ko': 'ko-KR-SunHiNeural',
  'zh': 'zh-CN-XiaoxiaoNeural',
  'pt': 'pt-BR-FranciscaNeural',
  'ar': 'ar-SA-ZariyahNeural',
  'hi': 'hi-IN-SwaraNeural',
  'ru': 'ru-RU-SvetlanaNeural'
};

interface LanguageInfo {
  code: string;
  name: string;
  voice: string;
}

class MultiLanguageAgent {
  private ws: WebSocket | null = null;
  private currentLanguage: string = 'en';
  private detectedLanguages: Set<string> = new Set(['en']);

  constructor(
    private apiKey: string,
    private region: string,
    private deployment: string
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `wss://${this.region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${this.deployment}`;
      
      this.ws = new WebSocket(url, {
        headers: { 'api-key': this.apiKey }
      });

      this.ws.on('open', () => {
        console.log('✅ Connected to Voice Live API\n');
        this.configureSession();
        resolve();
      });

      this.ws.on('error', reject);
      this.setupEventHandlers();
    });
  }

  private configureSession(): void {
    if (!this.ws) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        voice: VOICE_MAP[this.currentLanguage],
        instructions: `You are a multilingual AI assistant fluent in many languages.

IMPORTANT RULES:
1. ALWAYS respond in the SAME language the user speaks
2. If the user switches languages, immediately switch to that language
3. Be natural and conversational in each language
4. Adapt cultural context appropriately for each language
5. Never translate unless explicitly asked

You can communicate fluently in:
- English, Spanish, French, German, Italian
- Japanese, Korean, Chinese (Mandarin)
- Portuguese, Arabic, Hindi, Russian
- And many other languages

Respond with cultural awareness and natural expressions for each language.`,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'azure_semantic_vad_multilingual', // Automatic language detection
          threshold: 0.5,
          silence_duration_ms: 700,
          prefix_padding_ms: 300,
          create_response: true
        },
        temperature: 0.8,
        max_response_output_tokens: 1024
      }
    };

    this.ws.send(JSON.stringify(sessionConfig));
    console.log('⚙️  Session configured with multilingual support\n');
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data: WebSocket.Data) => {
      const event = JSON.parse(data.toString());

      switch (event.type) {
        case 'session.created':
          console.log('📡 Session created:', event.session.id);
          break;

        case 'session.updated':
          console.log(`✅ Session updated - Voice: ${VOICE_MAP[this.currentLanguage]}\n`);
          break;

        case 'input_audio_transcription.completed':
          const transcript = event.transcript;
          console.log(`\n👤 User (transcribed): ${transcript}`);
          
          // Detect language from transcription
          const detectedLang = this.detectLanguage(transcript);
          if (detectedLang && detectedLang !== this.currentLanguage) {
            console.log(`🌍 Language detected: ${this.getLanguageName(detectedLang)}`);
            this.switchLanguage(detectedLang);
          }
          break;

        case 'response.text.delta':
          process.stdout.write(event.delta);
          break;

        case 'response.text.done':
          console.log('\n');
          break;

        case 'response.done':
          const languagesList = Array.from(this.detectedLanguages)
            .map(code => this.getLanguageName(code))
            .join(', ');
          console.log(`📊 Languages used in conversation: ${languagesList}\n`);
          break;

        case 'error':
          console.error('❌ Error:', event.error);
          break;
      }
    });
  }

  private detectLanguage(text: string): string | null {
    // Simple language detection based on common words and patterns
    const patterns: Record<string, RegExp[]> = {
      'es': [/\b(hola|gracias|por favor|sí|no|buenos días)\b/i],
      'fr': [/\b(bonjour|merci|s'il vous plaît|oui|non|salut)\b/i],
      'de': [/\b(hallo|danke|bitte|ja|nein|guten tag)\b/i],
      'it': [/\b(ciao|grazie|per favore|sì|no|buongiorno)\b/i],
      'pt': [/\b(olá|obrigado|por favor|sim|não|bom dia)\b/i],
      'ja': [/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/], // Hiragana, Katakana, Kanji
      'ko': [/[\uAC00-\uD7AF]/], // Hangul
      'zh': [/[\u4E00-\u9FFF]/], // Chinese characters
      'ar': [/[\u0600-\u06FF]/], // Arabic
      'hi': [/[\u0900-\u097F]/], // Devanagari
      'ru': [/[\u0400-\u04FF]/]  // Cyrillic
    };

    for (const [lang, regexes] of Object.entries(patterns)) {
      if (regexes.some(regex => regex.test(text))) {
        this.detectedLanguages.add(lang);
        return lang;
      }
    }

    return null;
  }

  private switchLanguage(newLang: string): void {
    if (this.currentLanguage === newLang) return;
    
    this.currentLanguage = newLang;
    console.log(`🔄 Switching to ${this.getLanguageName(newLang)} voice...\n`);

    if (!this.ws) return;

    // Update session with new voice
    this.ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        voice: VOICE_MAP[newLang]
      }
    }));
  }

  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'pt': 'Portuguese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'ru': 'Russian'
    };
    return names[code] || code;
  }

  sendTextMessage(text: string): void {
    if (!this.ws) return;

    console.log(`\n💬 Sending: "${text}"\n`);

    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    }));

    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

async function runDemo() {
  const apiKey = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-realtime-preview';

  console.log('🌍 Starting Multi-Language Sample...\n');

  const agent = new MultiLanguageAgent(apiKey, region, deployment);

  try {
    await agent.connect();

    // Test different languages
    const testMessages = [
      { lang: 'English', text: 'Hello! Can you help me?' },
      { lang: 'Spanish', text: '¿Puedes hablar español?' },
      { lang: 'French', text: 'Parlez-vous français?' },
      { lang: 'German', text: 'Sprechen Sie Deutsch?' },
      { lang: 'Japanese', text: 'こんにちは、日本語が話せますか？' }
    ];

    for (let i = 0; i < testMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 4000));
      
      const msg = testMessages[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing ${msg.lang}`);
      console.log('='.repeat(60));
      
      agent.sendTextMessage(msg.text);
    }

    // Cleanup after all tests
    setTimeout(() => {
      console.log('\n🎉 Multi-language demo complete!\n');
      agent.disconnect();
      process.exit(0);
    }, 20000);

  } catch (error) {
    console.error('❌ Error:', error);
    agent.disconnect();
    process.exit(1);
  }
}

runDemo().catch(console.error);
