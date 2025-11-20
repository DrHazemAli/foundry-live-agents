// Voice Live API Types

export type VADType = 
  | 'server_vad' 
  | 'semantic_vad' 
  | 'azure_semantic_vad' 
  | 'azure_semantic_vad_multilingual';

export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw';

export type VoiceType = 'alloy' | 'echo' | 'shimmer' | 'string';

export type ModelType = 
  | 'gpt-4o-realtime-preview' 
  | 'gpt-4o-mini-realtime-preview'
  | 'gpt-4o-realtime-preview-2024-10-01';

export type ToolChoice = 'auto' | 'none' | 'required';

export interface Voice {
  id: string;
  name: string;
  locale: string;
  gender: 'Male' | 'Female' | 'Neutral';
  category: 'OpenAI' | 'Azure Standard' | 'Azure HD' | 'Custom';
  type: string;
  description?: string;
  audioSample?: string;
}

export interface SessionConfig {
  model: ModelType;
  modalities: ('text' | 'audio')[];
  voice: VoiceType;
  instructions: string;
  input_audio_format: AudioFormat;
  output_audio_format: AudioFormat;
  input_audio_transcription?: {
    model: string;
  };
  turn_detection?: {
    type: VADType;
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    create_response?: boolean;
  };
  tools?: FunctionTool[];
  tool_choice?: ToolChoice;
  temperature?: number;
  max_response_output_tokens?: number;
  audio_enhancements?: {
    deep_noise_suppression?: {
      enabled: boolean;
    };
    echo_cancellation?: {
      enabled: boolean;
    };
  };
}

export interface FunctionTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioData?: ArrayBuffer;
  transcription?: string;
}

export interface ConversationItem {
  id: string;
  type: 'message' | 'function_call' | 'function_call_output';
  role?: 'user' | 'assistant' | 'system';
  content?: Array<{
    type: 'input_text' | 'input_audio' | 'text' | 'audio';
    text?: string;
    audio?: string;
    transcript?: string;
  }>;
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
  status?: 'completed' | 'in_progress' | 'incomplete';
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  sessionId?: string;
  error?: string;
  latency?: number;
  reconnectAttempts?: number;
}

export interface AudioMetrics {
  volume: number;
  frequency: number[];
  isSpeaking: boolean;
  duration: number;
}

export interface AgentScenario {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Partial<SessionConfig>;
  languages: string[];
  icon: string;
}

// Voice Live Events
export interface VoiceLiveEvent {
  type: string;
  event_id?: string;
  [key: string]: any;
}

export interface SessionCreatedEvent extends VoiceLiveEvent {
  type: 'session.created';
  session: {
    id: string;
    object: 'realtime.session';
    model: string;
    modalities: string[];
    voice: string;
    turn_detection: any;
  };
}

export interface AudioDeltaEvent extends VoiceLiveEvent {
  type: 'response.audio.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // base64 encoded audio
}

export interface TextDeltaEvent extends VoiceLiveEvent {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface FunctionCallEvent extends VoiceLiveEvent {
  type: 'response.function_call';
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  name: string;
  arguments: string;
}

export interface ErrorEvent extends VoiceLiveEvent {
  type: 'error';
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
  };
}

export interface SpeechStartedEvent extends VoiceLiveEvent {
  type: 'input_audio_buffer.speech_started';
  audio_start_ms: number;
  item_id: string;
}

export interface SpeechStoppedEvent extends VoiceLiveEvent {
  type: 'input_audio_buffer.speech_stopped';
  audio_end_ms: number;
  item_id: string;
}

export interface TranscriptionCompletedEvent extends VoiceLiveEvent {
  type: 'input_audio_transcription.completed';
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface ResponseDoneEvent extends VoiceLiveEvent {
  type: 'response.done';
  response_id: string;
  response: {
    id: string;
    object: 'realtime.response';
    status: 'completed' | 'cancelled' | 'failed' | 'incomplete';
    status_details?: any;
    output: ConversationItem[];
    usage?: {
      total_tokens: number;
      input_tokens: number;
      output_tokens: number;
    };
  };
}
