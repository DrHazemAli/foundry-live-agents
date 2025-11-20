import { create } from 'zustand';
import type { ConnectionState } from '../types';

interface ConnectionStore extends ConnectionState {
  // Metrics
  messagesSent: number;
  messagesReceived: number;
  audioBytesSent: number;
  audioBytesReceived: number;
  averageLatency: number;
  lastEventTime: Date | null;

  // Actions
  setStatus: (status: ConnectionState['status']) => void;
  setSessionId: (sessionId: string) => void;
  setError: (error: string | undefined) => void;
  setLatency: (latency: number) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  incrementMessagesSent: () => void;
  incrementMessagesReceived: () => void;
  addAudioBytesSent: (bytes: number) => void;
  addAudioBytesReceived: (bytes: number) => void;
  updateLatency: (latency: number) => void;
  setLastEventTime: (time: Date) => void;
  reset: () => void;
  getConnectionQuality: () => 'excellent' | 'good' | 'fair' | 'poor';
}

const initialState: ConnectionState & {
  messagesSent: number;
  messagesReceived: number;
  audioBytesSent: number;
  audioBytesReceived: number;
  averageLatency: number;
  lastEventTime: Date | null;
} = {
  status: 'disconnected',
  sessionId: undefined,
  error: undefined,
  latency: undefined,
  reconnectAttempts: 0,
  messagesSent: 0,
  messagesReceived: 0,
  audioBytesSent: 0,
  audioBytesReceived: 0,
  averageLatency: 0,
  lastEventTime: null,
};

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setSessionId: (sessionId) => set({ sessionId }),

  setError: (error) => set({ error }),

  setLatency: (latency) => set({ latency }),

  incrementReconnectAttempts: () =>
    set((state) => ({
      reconnectAttempts: (state.reconnectAttempts || 0) + 1,
    })),

  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

  incrementMessagesSent: () =>
    set((state) => ({
      messagesSent: state.messagesSent + 1,
    })),

  incrementMessagesReceived: () =>
    set((state) => ({
      messagesReceived: state.messagesReceived + 1,
    })),

  addAudioBytesSent: (bytes) =>
    set((state) => ({
      audioBytesSent: state.audioBytesSent + bytes,
    })),

  addAudioBytesReceived: (bytes) =>
    set((state) => ({
      audioBytesReceived: state.audioBytesReceived + bytes,
    })),

  updateLatency: (latency) => {
    const state = get();
    const count = state.messagesReceived || 1;
    const newAverage = (state.averageLatency * (count - 1) + latency) / count;
    
    set({
      latency,
      averageLatency: newAverage,
    });
  },

  setLastEventTime: (time) => set({ lastEventTime: time }),

  reset: () => set(initialState),

  getConnectionQuality: () => {
    const state = get();
    const latency = state.averageLatency || state.latency || 0;

    if (latency < 200) return 'excellent';
    if (latency < 500) return 'good';
    if (latency < 1000) return 'fair';
    return 'poor';
  },
}));
