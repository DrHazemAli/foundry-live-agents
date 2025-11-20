import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

interface ConversationState {
  assistantIsSpeaking: boolean;
  currentResponseId: string | null;
  partialResponse: string;
  interruptionCount: number;
}

class InterruptionHandler {
  private state: ConversationState = {
    assistantIsSpeaking: false,
    currentResponseId: null,
    partialResponse: '',
    interruptionCount: 0
  };

  constructor(private ws: WebSocket) {}

  handleSpeechStarted(): void {
    if (this.state.assistantIsSpeaking) {
      this.state.interruptionCount++;
      console.log('\n\n🚨 INTERRUPTION DETECTED!');
      console.log(`   (Total interruptions: ${this.state.interruptionCount})`);
      this.cancelCurrentResponse();
    } else {
      console.log('\n👂 User started speaking...');
    }
  }

  handleSpeechStopped(): void {
    if (!this.state.assistantIsSpeaking) {
      console.log('🔇 User stopped speaking\n');
    }
  }

  handleResponseStarted(responseId: string): void {
    this.state.assistantIsSpeaking = true;
    this.state.currentResponseId = responseId;
    this.state.partialResponse = '';
    console.log('\n🤖 Assistant: ');
  }

  handleTextDelta(delta: string): void {
    process.stdout.write(delta);
    this.state.partialResponse += delta;
  }

  handleResponseDone(): void {
    console.log('\n');
    this.state.assistantIsSpeaking = false;
    this.state.currentResponseId = null;
    
    if (this.state.partialResponse) {
      console.log(`📝 Complete response (${this.state.partialResponse.length} chars)\n`);
    }
  }

  handleResponseCanceled(): void {
    console.log('\n❌ Response CANCELED');
    
    if (this.state.partialResponse) {
      console.log(`📄 Partial response before interruption:`);
      console.log(`   "${this.state.partialResponse}"\n`);
    }
    
    this.state.assistantIsSpeaking = false;
    this.state.currentResponseId = null;
  }

  private cancelCurrentResponse(): void {
    if (!this.state.currentResponseId) {
      console.log('   ⚠️  No active response to cancel');
      return;
    }

    console.log(`   🛑 Canceling response: ${this.state.currentResponseId}`);
    
    // Cancel the current response
    this.ws.send(JSON.stringify({
      type: 'response.cancel',
      response_id: this.state.currentResponseId
    }));

    // Clear any buffered audio (optional - depends on strategy)
    // this.ws.send(JSON.stringify({
    //   type: 'input_audio_buffer.clear'
    // }));
  }

  getStats() {
    return {
      totalInterruptions: this.state.interruptionCount,
      currentlyInterruptible: this.state.assistantIsSpeaking
    };
  }

  isAssistantSpeaking(): boolean {
    return this.state.assistantIsSpeaking;
  }
}

async function runInteractiveDemo(ws: WebSocket, handler: InterruptionHandler) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n' + '='.repeat(70));
  console.log('INTERACTIVE MODE');
  console.log('='.repeat(70));
  console.log('\nType messages to send. Type "interrupt" to test interruption.');
  console.log('Type "stats" to see interruption statistics.');
  console.log('Type "exit" to quit.\n');

  const prompt = () => {
    if (!handler.isAssistantSpeaking()) {
      rl.question('You: ', (input) => {
        const text = input.trim();
        
        if (text === 'exit') {
          console.log('\n👋 Goodbye!\n');
          rl.close();
          ws.close();
          return;
        }
        
        if (text === 'stats') {
          const stats = handler.getStats();
          console.log(`\n📊 Statistics:`);
          console.log(`   Total interruptions: ${stats.totalInterruptions}`);
          console.log(`   Assistant speaking: ${stats.currentlyInterruptible}\n`);
          prompt();
          return;
        }
        
        if (text === 'interrupt') {
          console.log('\n🧪 Simulating interruption...\n');
          handler.handleSpeechStarted();
          prompt();
          return;
        }
        
        if (text) {
          ws.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text }]
            }
          }));
          
          ws.send(JSON.stringify({ type: 'response.create' }));
        }
        
        prompt();
      });
    }
  };

  prompt();
}

async function main() {
  const apiKey = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-realtime-preview';

  console.log('🚨 Starting Interruption Handling Sample...\n');

  const url = `wss://${region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${deployment}`;
  
  const ws = new WebSocket(url, {
    headers: { 'api-key': apiKey }
  });

  let handler: InterruptionHandler;

  ws.on('open', () => {
    console.log('✅ Connected to Voice Live API\n');

    handler = new InterruptionHandler(ws);

    // Configure session with interruption-friendly settings
    const sessionConfig = {
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: `You are a helpful assistant in an interruptible conversation.
Keep your responses conversational. If interrupted, that's completely normal.`,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.4,           // Sensitive for quick detection
          silence_duration_ms: 400,  // Moderate silence requirement
          prefix_padding_ms: 200,    // Capture beginning of speech
          create_response: true
        },
        temperature: 0.8,
        max_response_output_tokens: 1024
      }
    };

    ws.send(JSON.stringify(sessionConfig));
    console.log('⚙️  Session configured with interruption support');
    console.log('   VAD threshold: 0.4 (sensitive)');
    console.log('   Silence duration: 400ms\n');

    // Start interactive demo after brief delay
    setTimeout(() => {
      runInteractiveDemo(ws, handler);
    }, 1000);
  });

  ws.on('message', (data: WebSocket.Data) => {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'session.created':
        console.log('📡 Session created:', event.session.id);
        break;

      case 'session.updated':
        console.log('✅ Session updated\n');
        break;

      case 'input_audio_buffer.speech_started':
        handler.handleSpeechStarted();
        break;

      case 'input_audio_buffer.speech_stopped':
        handler.handleSpeechStopped();
        break;

      case 'input_audio_transcription.completed':
        if (event.transcript) {
          console.log(`📝 Transcription: "${event.transcript}"\n`);
        }
        break;

      case 'response.created':
        handler.handleResponseStarted(event.response.id);
        break;

      case 'response.text.delta':
        handler.handleTextDelta(event.delta);
        break;

      case 'response.text.done':
        // Text streaming complete
        break;

      case 'response.done':
        handler.handleResponseDone();
        break;

      case 'response.canceled':
        handler.handleResponseCanceled();
        break;

      case 'error':
        console.error('❌ Error:', event.error);
        break;

      default:
        // Uncomment to see all events
        // console.log('Event:', event.type);
        break;
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('\n👋 Disconnected from Voice Live API');
    
    if (handler) {
      const stats = handler.getStats();
      console.log(`\n📊 Final Statistics:`);
      console.log(`   Total interruptions handled: ${stats.totalInterruptions}\n`);
    }
    
    process.exit(0);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n\n⚠️  Shutting down...');
    ws.close();
  });
}

main().catch(console.error);
