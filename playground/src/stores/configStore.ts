import { create } from 'zustand';
import type { SessionConfig, ModelType, VADType, AudioFormat, VoiceType } from '../types';

interface ConfigState {
  // Connection settings
  apiKey: string;
  region: string;
  deployment: string;

  // Session configuration
  config: SessionConfig;

  // Actions
  setApiKey: (apiKey: string) => void;
  setRegion: (region: string) => void;
  setDeployment: (deployment: string) => void;
  updateConfig: (updates: Partial<SessionConfig>) => void;
  setModel: (model: ModelType) => void;
  setVoice: (voice: VoiceType) => void;
  setInstructions: (instructions: string) => void;
  setVADType: (type: VADType) => void;
  setVADThreshold: (threshold: number) => void;
  setVADSilenceDuration: (duration: number) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (tokens: number) => void;
  setAudioFormat: (input: AudioFormat, output: AudioFormat) => void;
  enableDeepNoiseSuppression: (enabled: boolean) => void;
  enableEchoCancellation: (enabled: boolean) => void;
  resetConfig: () => void;
  loadPreset: (preset: 'customer-support' | 'healthcare' | 'demo' | 'telephony') => void;
}

const defaultConfig: SessionConfig = {
  model: 'gpt-4o-realtime-preview',
  modalities: ['text', 'audio'],
  voice: 'alloy',
  instructions: 'You are a helpful AI assistant. Speak naturally and conversationally.',
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  input_audio_transcription: {
    model: 'whisper-1',
  },
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
    create_response: true,
  },
  temperature: 0.8,
  max_response_output_tokens: 4096,
  tools: [],
  tool_choice: 'auto',
  audio_enhancements: {
    deep_noise_suppression: {
      enabled: true,
    },
    echo_cancellation: {
      enabled: true,
    },
  },
};

export const useConfigStore = create<ConfigState>((set) => ({
  apiKey: '',
  region: 'eastus',
  deployment: 'gpt-4o-realtime-preview',
  config: defaultConfig,

  setApiKey: (apiKey) => set({ apiKey }),
  setRegion: (region) => set({ region }),
  setDeployment: (deployment) => set({ deployment }),

  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates },
    })),

  setModel: (model) =>
    set((state) => ({
      config: { ...state.config, model },
    })),

  setVoice: (voice) =>
    set((state) => ({
      config: { ...state.config, voice },
    })),

  setInstructions: (instructions) =>
    set((state) => ({
      config: { ...state.config, instructions },
    })),

  setVADType: (type) =>
    set((state) => ({
      config: {
        ...state.config,
        turn_detection: {
          ...state.config.turn_detection!,
          type,
        },
      },
    })),

  setVADThreshold: (threshold) =>
    set((state) => ({
      config: {
        ...state.config,
        turn_detection: {
          ...state.config.turn_detection!,
          threshold,
        },
      },
    })),

  setVADSilenceDuration: (silence_duration_ms) =>
    set((state) => ({
      config: {
        ...state.config,
        turn_detection: {
          ...state.config.turn_detection!,
          silence_duration_ms,
        },
      },
    })),

  setTemperature: (temperature) =>
    set((state) => ({
      config: { ...state.config, temperature },
    })),

  setMaxTokens: (max_response_output_tokens) =>
    set((state) => ({
      config: { ...state.config, max_response_output_tokens },
    })),

  setAudioFormat: (input_audio_format, output_audio_format) =>
    set((state) => ({
      config: { ...state.config, input_audio_format, output_audio_format },
    })),

  enableDeepNoiseSuppression: (enabled) =>
    set((state) => ({
      config: {
        ...state.config,
        audio_enhancements: {
          ...state.config.audio_enhancements,
          deep_noise_suppression: { enabled },
        },
      },
    })),

  enableEchoCancellation: (enabled) =>
    set((state) => ({
      config: {
        ...state.config,
        audio_enhancements: {
          ...state.config.audio_enhancements,
          echo_cancellation: { enabled },
        },
      },
    })),

  resetConfig: () => set({ config: defaultConfig }),

  loadPreset: (preset) => {
    const presets: Record<string, Partial<SessionConfig>> = {
      'customer-support': {
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: 'You are a friendly customer support agent. Be helpful, patient, and professional.',
        turn_detection: {
          type: 'azure_semantic_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 700,
          create_response: true,
        },
        temperature: 0.7,
        max_response_output_tokens: 2048,
      },
      healthcare: {
        model: 'gpt-4o-realtime-preview',
        voice: 'echo',
        instructions: 'You are a healthcare triage assistant. Be empathetic, clear, and accurate. Never provide medical diagnoses.',
        turn_detection: {
          type: 'azure_semantic_vad',
          threshold: 0.6,
          prefix_padding_ms: 500,
          silence_duration_ms: 1000,
          create_response: true,
        },
        temperature: 0.3,
        max_response_output_tokens: 1500,
      },
      demo: {
        model: 'gpt-4o-mini-realtime-preview',
        voice: 'shimmer',
        instructions: 'You are an enthusiastic demo assistant. Be engaging and showcase features clearly.',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 200,
          silence_duration_ms: 400,
          create_response: true,
        },
        temperature: 0.9,
        max_response_output_tokens: 1024,
      },
      telephony: {
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: 'You are a phone system assistant. Speak clearly with appropriate pacing.',
        input_audio_format: 'g711_ulaw',
        output_audio_format: 'g711_ulaw',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.6,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
          create_response: true,
        },
        temperature: 0.7,
        max_response_output_tokens: 2048,
        audio_enhancements: {
          deep_noise_suppression: { enabled: true },
          echo_cancellation: { enabled: true },
        },
      },
    };

    set((state) => ({
      config: { ...state.config, ...presets[preset] },
    }));
  },
}));
