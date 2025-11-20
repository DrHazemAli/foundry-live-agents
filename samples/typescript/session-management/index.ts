import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

enum SessionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

interface SessionConfig {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  keepaliveInterval: number;
  connectionTimeout: number;
  stateFile: string;
}

interface PersistedState {
  sessionId: string | null;
  conversationHistory: any[];
  lastActivity: number;
  reconnectAttempts: number;
}

interface ConnectionMetrics {
  connectTime: number;
  reconnectCount: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  lastPingTime: number;
  lastPongTime: number;
  averageLatency: number;
}

class SessionManager {
  private ws: WebSocket | null = null;
  private state: SessionState = SessionState.DISCONNECTED;
  private keepaliveTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  
  private persistedState: PersistedState = {
    sessionId: null,
    conversationHistory: [],
    lastActivity: Date.now(),
    reconnectAttempts: 0
  };

  private metrics: ConnectionMetrics = {
    connectTime: 0,
    reconnectCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    lastPingTime: 0,
    lastPongTime: 0,
    averageLatency: 0
  };

  constructor(
    private apiKey: string,
    private region: string,
    private deployment: string,
    private config: SessionConfig
  ) {
    this.loadState();
  }

  async connect(): Promise<void> {
    if (this.state === SessionState.CONNECTING || this.state === SessionState.CONNECTED) {
      console.log('⚠️  Already connected or connecting');
      return;
    }

    this.state = SessionState.CONNECTING;
    console.log(`🔌 Connecting to Voice Live API... (attempt ${this.persistedState.reconnectAttempts + 1})`);

    return new Promise((resolve, reject) => {
      const url = `wss://${this.region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${this.deployment}`;
      
      this.ws = new WebSocket(url, {
        headers: { 'api-key': this.apiKey }
      });

      // Connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.log('❌ Connection timeout');
        this.ws?.terminate();
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      this.ws.on('open', () => {
        clearTimeout(this.connectionTimeout!);
        this.state = SessionState.CONNECTED;
        this.metrics.connectTime = Date.now();
        this.persistedState.reconnectAttempts = 0;
        
        console.log('✅ Connected successfully\n');
        
        this.configureSession();
        this.startKeepalive();
        this.saveState();
        
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.metrics.messagesReceived++;
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        clearTimeout(this.connectionTimeout!);
        this.metrics.errors++;
        console.error('❌ WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('close', (code, reason) => {
        clearTimeout(this.connectionTimeout!);
        this.stopKeepalive();
        
        const wasConnected = this.state === SessionState.CONNECTED;
        this.state = SessionState.DISCONNECTED;
        
        console.log(`\n👋 Connection closed (code: ${code}, reason: ${reason})`);
        
        if (wasConnected && code !== 1000) {
          // Abnormal closure - attempt reconnection
          this.scheduleReconnect();
        }
      });
    });
  }

  private configureSession(): void {
    if (!this.ws) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: 'You are a helpful assistant with session management.',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 500
        },
        temperature: 0.8,
        max_response_output_tokens: 1024
      }
    };

    this.send(sessionConfig);
    console.log('⚙️  Session configured\n');
  }

  private handleMessage(data: WebSocket.Data): void {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'session.created':
        this.persistedState.sessionId = event.session.id;
        console.log('📡 Session created:', event.session.id);
        this.saveState();
        break;

      case 'session.updated':
        console.log('✅ Session updated');
        break;

      case 'pong':
        this.metrics.lastPongTime = Date.now();
        const latency = this.metrics.lastPongTime - this.metrics.lastPingTime;
        this.metrics.averageLatency = (this.metrics.averageLatency * 0.9) + (latency * 0.1);
        console.log(`🏓 Pong received (latency: ${latency}ms, avg: ${this.metrics.averageLatency.toFixed(0)}ms)`);
        break;

      case 'response.text.delta':
        process.stdout.write(event.delta);
        break;

      case 'response.text.done':
        console.log('\n');
        break;

      case 'error':
        this.metrics.errors++;
        console.error('❌ Error:', event.error);
        break;

      default:
        // Uncomment to see all events
        // console.log('Event:', event.type);
        break;
    }

    this.persistedState.lastActivity = Date.now();
  }

  private startKeepalive(): void {
    this.stopKeepalive();
    
    this.keepaliveTimer = setInterval(() => {
      if (this.state === SessionState.CONNECTED) {
        this.metrics.lastPingTime = Date.now();
        console.log('🏓 Sending ping...');
        
        this.send({
          type: 'ping',
          timestamp: this.metrics.lastPingTime
        });
      }
    }, this.config.keepaliveInterval);

    console.log(`💓 Keepalive started (interval: ${this.config.keepaliveInterval}ms)\n`);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.persistedState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log(`\n❌ Max reconnection attempts (${this.config.maxReconnectAttempts}) reached`);
      this.state = SessionState.ERROR;
      return;
    }

    this.state = SessionState.RECONNECTING;
    this.persistedState.reconnectAttempts++;
    this.metrics.reconnectCount++;

    // Exponential backoff with jitter
    const baseDelay = this.config.reconnectDelay;
    const exponentialDelay = baseDelay * Math.pow(2, this.persistedState.reconnectAttempts - 1);
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponentialDelay + jitter, 30000);

    console.log(`\n🔄 Scheduling reconnection in ${delay.toFixed(0)}ms... (attempt ${this.persistedState.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  send(data: any): void {
    if (this.state !== SessionState.CONNECTED || !this.ws) {
      console.log('⚠️  Cannot send - not connected');
      return;
    }

    this.ws.send(JSON.stringify(data));
    this.metrics.messagesSent++;
  }

  sendMessage(text: string): void {
    console.log(`\n💬 You: ${text}\n`);
    
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    });

    this.send({ type: 'response.create' });

    // Add to history
    this.persistedState.conversationHistory.push({
      role: 'user',
      content: text,
      timestamp: Date.now()
    });
    this.saveState();
  }

  disconnect(): void {
    console.log('\n🛑 Disconnecting...');
    
    this.stopKeepalive();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }

    this.state = SessionState.DISCONNECTED;
    this.saveState();
  }

  getState(): SessionState {
    return this.state;
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  printMetrics(): void {
    const uptime = Date.now() - this.metrics.connectTime;
    const uptimeSeconds = (uptime / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('📊 SESSION METRICS');
    console.log('='.repeat(60));
    console.log(`State:              ${this.state}`);
    console.log(`Session ID:         ${this.persistedState.sessionId || 'N/A'}`);
    console.log(`Uptime:             ${uptimeSeconds}s`);
    console.log(`Reconnections:      ${this.metrics.reconnectCount}`);
    console.log(`Messages sent:      ${this.metrics.messagesSent}`);
    console.log(`Messages received:  ${this.metrics.messagesReceived}`);
    console.log(`Errors:             ${this.metrics.errors}`);
    console.log(`Average latency:    ${this.metrics.averageLatency.toFixed(0)}ms`);
    console.log(`Conversation turns: ${this.persistedState.conversationHistory.length}`);
    console.log('='.repeat(60) + '\n');
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.config.stateFile)) {
        const data = fs.readFileSync(this.config.stateFile, 'utf8');
        this.persistedState = JSON.parse(data);
        console.log(`📂 Loaded persisted state (${this.persistedState.conversationHistory.length} history items)`);
      }
    } catch (error) {
      console.log('ℹ️  No previous state found - starting fresh');
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.config.stateFile, JSON.stringify(this.persistedState, null, 2));
    } catch (error) {
      console.error('⚠️  Failed to save state:', error);
    }
  }
}

async function main() {
  const apiKey = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-realtime-preview';

  console.log('🎛️  Starting Session Management Sample...\n');

  const config: SessionConfig = {
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    keepaliveInterval: 15000,   // 15 seconds for demo
    connectionTimeout: 10000,
    stateFile: 'session-state.json'
  };

  const manager = new SessionManager(apiKey, region, deployment, config);

  try {
    // Initial connection
    await manager.connect();

    // Test conversation
    await new Promise(resolve => setTimeout(resolve, 2000));
    manager.sendMessage('Hello! This is a test message.');

    await new Promise(resolve => setTimeout(resolve, 5000));
    manager.sendMessage('Tell me a fun fact.');

    // Wait for keepalive demonstration
    await new Promise(resolve => setTimeout(resolve, 20000));

    // Print metrics
    manager.printMetrics();

    // Test reconnection by forcing disconnect
    console.log('\n🧪 Testing reconnection...');
    manager.disconnect();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await manager.connect();

    await new Promise(resolve => setTimeout(resolve, 3000));
    manager.sendMessage('Did the reconnection work?');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Final metrics
    manager.printMetrics();

    // Clean disconnect
    manager.disconnect();

    console.log('\n🎉 Session management demo complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    manager.disconnect();
    process.exit(1);
  }
}

main().catch(console.error);
