import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

class StreamingHandler {
  private textBuffer: string = '';
  private audioBuffer: Buffer[] = [];
  private startTime: number = 0;
  private tokenCount: number = 0;
  private audioChunkCount: number = 0;

  startResponse(): void {
    this.startTime = Date.now();
    this.tokenCount = 0;
    this.audioChunkCount = 0;
    this.textBuffer = '';
    this.audioBuffer = [];
    
    console.log('🚀 Streaming started...\n');
  }

  handleTextDelta(delta: string): void {
    // Immediate streaming strategy
    process.stdout.write(delta);
    this.textBuffer += delta;
    this.tokenCount++;
  }

  handleTextDone(text: string): void {
    const duration = Date.now() - this.startTime;
    const tokensPerSecond = (this.tokenCount / duration * 1000).toFixed(1);
    
    console.log('\n');
    console.log(`📊 Text metrics:`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tokens: ${this.tokenCount}`);
    console.log(`   Speed: ${tokensPerSecond} tokens/sec`);
    console.log(`   Length: ${text.length} characters\n`);
  }

  handleAudioDelta(delta: string): void {
    // Convert base64 to buffer
    const audioData = Buffer.from(delta, 'base64');
    this.audioBuffer.push(audioData);
    this.audioChunkCount++;
    
    // In production, send to audio player immediately
    // audioPlayer.playChunk(audioData);
  }

  handleAudioDone(transcript: string): void {
    const totalBytes = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const duration = Date.now() - this.startTime;
    
    console.log(`📊 Audio metrics:`);
    console.log(`   Chunks: ${this.audioChunkCount}`);
    console.log(`   Size: ${totalBytes} bytes`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Transcript: "${transcript}"\n`);
  }

  getMetrics() {
    return {
      duration: Date.now() - this.startTime,
      tokenCount: this.tokenCount,
      audioChunkCount: this.audioChunkCount,
      textLength: this.textBuffer.length,
      audioSize: this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0)
    };
  }
}

class SentenceBuffer {
  private buffer: string = '';
  private sentences: string[] = [];
  
  add(delta: string): string[] {
    this.buffer += delta;
    const newSentences: string[] = [];
    
    // Extract complete sentences
    const sentenceEnds = /([.!?])\s+/g;
    let match;
    let lastIndex = 0;
    
    while ((match = sentenceEnds.exec(this.buffer)) !== null) {
      const sentence = this.buffer.substring(lastIndex, match.index + 1).trim();
      if (sentence) {
        newSentences.push(sentence);
        this.sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }
    
    // Keep remainder in buffer
    this.buffer = this.buffer.substring(lastIndex);
    
    return newSentences;
  }
  
  flush(): string {
    const remaining = this.buffer;
    this.buffer = '';
    return remaining;
  }
  
  getAllSentences(): string[] {
    return this.sentences;
  }
}

async function demonstrateImmediateStreaming(ws: WebSocket) {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 1: Immediate Streaming (token-by-token)');
  console.log('='.repeat(70) + '\n');

  const handler = new StreamingHandler();
  let isStreaming = false;

  const messageHandler = (data: WebSocket.Data) => {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'response.text.delta':
        if (!isStreaming) {
          handler.startResponse();
          isStreaming = true;
        }
        handler.handleTextDelta(event.delta);
        break;

      case 'response.text.done':
        handler.handleTextDone(event.text);
        isStreaming = false;
        break;

      case 'response.audio.delta':
        handler.handleAudioDelta(event.delta);
        break;

      case 'response.audio.done':
        if (event.transcript) {
          handler.handleAudioDone(event.transcript);
        }
        break;
    }
  };

  ws.on('message', messageHandler);

  // Send test message
  ws.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{
        type: 'input_text',
        text: 'Tell me a short story about a robot learning to paint.'
      }]
    }
  }));

  ws.send(JSON.stringify({ type: 'response.create' }));

  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  ws.off('message', messageHandler);
}

async function demonstrateSentenceBuffering(ws: WebSocket) {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 2: Sentence Buffering (emit complete sentences)');
  console.log('='.repeat(70) + '\n');

  const buffer = new SentenceBuffer();
  let sentenceCount = 0;

  const messageHandler = (data: WebSocket.Data) => {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'response.text.delta':
        const sentences = buffer.add(event.delta);
        sentences.forEach(sentence => {
          sentenceCount++;
          console.log(`[Sentence ${sentenceCount}] ${sentence}\n`);
        });
        break;

      case 'response.text.done':
        // Flush any remaining text
        const remaining = buffer.flush();
        if (remaining) {
          console.log(`[Remainder] ${remaining}\n`);
        }
        console.log(`📊 Total sentences emitted: ${sentenceCount}\n`);
        sentenceCount = 0;
        break;
    }
  };

  ws.on('message', messageHandler);

  // Send test message
  ws.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{
        type: 'input_text',
        text: 'Explain how photosynthesis works in three sentences.'
      }]
    }
  }));

  ws.send(JSON.stringify({ type: 'response.create' }));

  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  ws.off('message', messageHandler);
}

async function demonstrateContentPartStreaming(ws: WebSocket) {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 3: Content Part Streaming (structured content)');
  console.log('='.repeat(70) + '\n');

  const contentParts: string[] = [];

  const messageHandler = (data: WebSocket.Data) => {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'response.content_part.added':
        contentParts[event.part_index] = '';
        console.log(`📝 Content part ${event.part_index} added (type: ${event.part.type})`);
        break;

      case 'response.content_part.delta':
        if (event.delta) {
          const partIndex = event.part_index;
          contentParts[partIndex] = (contentParts[partIndex] || '') + event.delta;
          
          // Show progress
          process.stdout.write('.');
        }
        break;

      case 'response.content_part.done':
        console.log(`\n✅ Part ${event.part_index} complete`);
        console.log(`   Content: ${contentParts[event.part_index]?.substring(0, 100)}...\n`);
        break;

      case 'response.done':
        console.log(`📊 Total content parts: ${contentParts.length}\n`);
        break;
    }
  };

  ws.on('message', messageHandler);

  // Send test message
  ws.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{
        type: 'input_text',
        text: 'List three benefits of exercise.'
      }]
    }
  }));

  ws.send(JSON.stringify({ type: 'response.create' }));

  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  ws.off('message', messageHandler);
}

async function main() {
  const apiKey = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-realtime-preview';

  console.log('🌊 Starting Streaming Responses Sample...\n');

  const url = `wss://${region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${deployment}`;
  
  const ws = new WebSocket(url, {
    headers: { 'api-key': apiKey }
  });

  ws.on('open', async () => {
    console.log('✅ Connected to Voice Live API\n');

    // Configure session
    const sessionConfig = {
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: 'You are a helpful assistant. Be concise and clear.',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 500
        },
        temperature: 0.8,
        max_response_output_tokens: 512
      }
    };

    ws.send(JSON.stringify(sessionConfig));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run demonstrations
    await demonstrateImmediateStreaming(ws);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demonstrateSentenceBuffering(ws);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demonstrateContentPartStreaming(ws);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🎉 Streaming demonstrations complete!\n');
    ws.close();
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('👋 Disconnected from Voice Live API');
    process.exit(0);
  });
}

main().catch(console.error);
