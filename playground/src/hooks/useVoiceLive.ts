import { useEffect, useRef, useState, useCallback } from 'react';
import { VoiceLiveClient } from '../services/voiceLiveClient';
import { useConnectionStore } from '../stores/connectionStore';
import { useConversationStore } from '../stores/conversationStore';
import { useConfigStore } from '../stores/configStore';
import type { VoiceLiveEvent } from '../types';

export function useVoiceLive() {
  const clientRef = useRef<VoiceLiveClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { apiKey, region, deployment } = useConfigStore();
  const { setStatus, setSessionId, setError, resetReconnectAttempts, incrementMessagesReceived, updateLatency, setLastEventTime } = useConnectionStore();
  const { addMessage, setAssistantSpeaking } = useConversationStore();

  const connect = useCallback(async () => {
    if (clientRef.current?.isConnected()) {
      console.log('Already connected');
      return;
    }

    if (!apiKey || !region || !deployment) {
      setError('Missing API key, region, or deployment');
      return;
    }

    setIsConnecting(true);
    setStatus('connecting');
    setError(undefined);

    try {
      const client = new VoiceLiveClient(apiKey, region, deployment);
      clientRef.current = client;

      // Setup event handlers
      client.on('session.created', (event: VoiceLiveEvent) => {
        console.log('Session created:', event);
        setStatus('connected');
        // @ts-ignore
        setSessionId(event.session?.id);
        resetReconnectAttempts();
        setLastEventTime(new Date());
      });

      client.on('connection.closed', () => {
        setStatus('disconnected');
        setLastEventTime(new Date());
      });

      client.on('error', (event: VoiceLiveEvent) => {
        console.error('Voice Live error:', event);
        // @ts-ignore
        setError(event.error?.message || 'Unknown error');
        setStatus('error');
        setLastEventTime(new Date());
      });

      client.on('input_audio_buffer.speech_started', () => {
        console.log('User started speaking');
        setLastEventTime(new Date());
      });

      client.on('input_audio_buffer.speech_stopped', () => {
        console.log('User stopped speaking');
        setLastEventTime(new Date());
      });

      client.on('input_audio_transcription.completed', (event: VoiceLiveEvent) => {
        // @ts-ignore
        const transcript = event.transcript;
        addMessage({
          id: `user-${Date.now()}`,
          role: 'user',
          content: transcript,
          timestamp: new Date(),
        });
        setLastEventTime(new Date());
      });

      client.on('response.text.delta', () => {
        setAssistantSpeaking(true);
        setLastEventTime(new Date());
      });

      client.on('response.done', (event: VoiceLiveEvent) => {
        console.log('Response done:', event);
        setAssistantSpeaking(false);
        incrementMessagesReceived();
        
        // Calculate latency if available
        // @ts-ignore
        const usage = event.response?.usage;
        if (usage) {
          updateLatency(100); // Placeholder latency
        }
        
        setLastEventTime(new Date());
      });

      client.on('*', () => {
        incrementMessagesReceived();
      });

      // Connect to WebSocket
      await client.connect();
      
      setIsConnecting(false);
    } catch (error) {
      console.error('Failed to connect:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setStatus('error');
      setIsConnecting(false);
    }
  }, [apiKey, region, deployment, setStatus, setSessionId, setError, resetReconnectAttempts, addMessage, setAssistantSpeaking, incrementMessagesReceived, updateLatency, setLastEventTime]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setStatus('disconnected');
  }, [setStatus]);

  const send = useCallback((event: any) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.send(event);
    }
  }, []);

  const updateSession = useCallback((config: any) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.updateSession(config);
    }
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.sendAudio(audioData);
    }
  }, []);

  const commitAudio = useCallback(() => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.commitAudio();
    }
  }, []);

  const createResponse = useCallback((instructions?: string) => {
    if (clientRef.current?.isConnected()) {
      clientRef.current.createResponse(instructions);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  return {
    client: clientRef.current,
    isConnecting,
    isConnected: clientRef.current?.isConnected() ?? false,
    connect,
    disconnect,
    send,
    updateSession,
    sendAudio,
    commitAudio,
    createResponse,
  };
}
