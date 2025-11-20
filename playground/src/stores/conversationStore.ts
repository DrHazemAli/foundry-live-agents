import { create } from 'zustand';
import type { Message } from '../types';

interface ConversationState {
  messages: Message[];
  isAssistantSpeaking: boolean;
  currentTranscription: string;
  audioCache: Map<string, ArrayBuffer>;

  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setAssistantSpeaking: (speaking: boolean) => void;
  setCurrentTranscription: (text: string) => void;
  cacheAudio: (messageId: string, audioData: ArrayBuffer) => void;
  getAudioFromCache: (messageId: string) => ArrayBuffer | undefined;
  clearAudioCache: () => void;
  deleteMessage: (id: string) => void;
  getMessageCount: () => number;
  getTokenEstimate: () => number;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [],
  isAssistantSpeaking: false,
  currentTranscription: '',
  audioCache: new Map(),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  clearMessages: () =>
    set({
      messages: [],
      currentTranscription: '',
    }),

  setAssistantSpeaking: (speaking) =>
    set({ isAssistantSpeaking: speaking }),

  setCurrentTranscription: (text) =>
    set({ currentTranscription: text }),

  cacheAudio: (messageId, audioData) =>
    set((state) => {
      const newCache = new Map(state.audioCache);
      newCache.set(messageId, audioData);
      return { audioCache: newCache };
    }),

  getAudioFromCache: (messageId) => {
    return get().audioCache.get(messageId);
  },

  clearAudioCache: () =>
    set({ audioCache: new Map() }),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  getMessageCount: () => {
    return get().messages.length;
  },

  getTokenEstimate: () => {
    // Rough estimate: 4 characters per token
    const state = get();
    const totalChars = state.messages.reduce(
      (sum, msg) => sum + (msg.content?.length || 0),
      0
    );
    return Math.ceil(totalChars / 4);
  },
}));
