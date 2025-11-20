import type { SessionConfig, VoiceLiveEvent } from '../types';

export type EventHandler = (event: VoiceLiveEvent) => void;

export class VoiceLiveClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private region: string;
  private model: string;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private keepaliveInterval: number | null = null;
  private isIntentionalClose = false;

  constructor(apiKey: string, region: string, model: string) {
    this.apiKey = apiKey;
    this.region = region;
    this.model = model;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionalClose = false;
        
        const url = `wss://${this.region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${this.model}&api-key=${this.apiKey}`;
        
        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startKeepalive();
          this.emit({ type: 'connection.open' });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit({ 
            type: 'error', 
            error: { 
              type: 'connection_error',
              code: 'websocket_error',
              message: 'WebSocket connection error' 
            }
          });
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.stopKeepalive();
          
          this.emit({ 
            type: 'connection.closed',
            code: event.code,
            reason: event.reason 
          });

          // Attempt reconnection if not intentional
          if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
              this.connect().catch(err => {
                console.error('Reconnection failed:', err);
              });
            }, delay);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Max reconnection attempts reached'));
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopKeepalive();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  send(event: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, cannot send:', event);
    }
  }

  updateSession(config: Partial<SessionConfig>): void {
    this.send({
      type: 'session.update',
      session: config,
    });
  }

  sendAudio(audioData: ArrayBuffer): void {
    const base64Audio = this.arrayBufferToBase64(audioData);
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  }

  commitAudio(): void {
    this.send({
      type: 'input_audio_buffer.commit',
    });
  }

  clearAudio(): void {
    this.send({
      type: 'input_audio_buffer.clear',
    });
  }

  createResponse(instructions?: string): void {
    this.send({
      type: 'response.create',
      response: instructions ? { instructions } : undefined,
    });
  }

  cancelResponse(responseId?: string): void {
    this.send({
      type: 'response.cancel',
      response_id: responseId,
    });
  }

  createConversationItem(item: any): void {
    this.send({
      type: 'conversation.item.create',
      item,
    });
  }

  sendFunctionResult(callId: string, output: string): void {
    this.createConversationItem({
      type: 'function_call_output',
      call_id: callId,
      output,
    });
    this.createResponse();
  }

  on(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: VoiceLiveEvent): void {
    // Emit to specific event type handlers
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // Emit to wildcard handlers
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler(event));
    }
  }

  private startKeepalive(): void {
    // Send ping every 30 seconds to keep connection alive
    this.keepaliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000) as unknown as number;
  }

  private stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
