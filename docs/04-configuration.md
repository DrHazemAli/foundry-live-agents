# Module 04: Configuration Mastery

> **Duration:** 90 minutes  
> **Level:** Intermediate to Advanced  
> **Prerequisites:** Modules 01-03 completed, working voice agent

## Learning Objectives

By the end of this module, you will:

- Master Voice Activity Detection (VAD) configuration
- Fine-tune turn detection parameters
- Configure audio enhancement features
- Optimize session settings for your use case
- Implement advanced interruption handling
- Debug and troubleshoot configuration issues

## Session Configuration Overview

A complete Voice Live session has multiple configuration layers:

```typescript
const sessionConfig = {
  // Core Settings
  model: string,
  modalities: string[],
  instructions: string,
  
  // Voice Configuration
  voice: {
    type: string,
    name: string,
    temperature?: number  // HD voices only
  },
  
  // Audio Settings
  input_audio_format: string,
  output_audio_format: string,
  input_audio_sampling_rate: number,
  
  // VAD & Turn Detection
  turn_detection: {
    type: string,
    threshold: number,
    prefix_padding_ms: number,
    silence_duration_ms: number,
    remove_filler_words?: boolean,
    interrupt_response?: boolean,
    auto_truncate?: boolean,
    end_of_utterance_detection?: object
  },
  
  // Audio Enhancements
  input_audio_noise_reduction?: object,
  input_audio_echo_cancellation?: object,
  
  // Speech Recognition
  input_audio_transcription?: {
    model: string,
    language: string,
    phrase_list?: string[],
    custom_speech?: object
  },
  
  // Model Parameters
  temperature?: number,
  max_response_output_tokens?: number | "inf",
  
  // Advanced Features
  tools?: array,
  tool_choice?: string,
  output_audio_timestamp_types?: string[],
  animation?: object
};
```

## Voice Activity Detection (VAD)

### VAD Types Comparison

| Feature | Server VAD | OpenAI Semantic | Azure Semantic | Azure Multilingual |
|---------|------------|-----------------|----------------|--------------------|
| **Detection Method** | Volume | ML Model | ML Semantic | ML Multilingual |
| **Languages** | All | English | English | 10+ languages |
| **Background Noise** | Poor | Good | Excellent | Excellent |
| **Latency** | Lowest | Low | Low-Medium | Low-Medium |
| **Accuracy** | Medium | High | Very High | Very High |
| **Model Required** | Any | gpt-realtime | Any | Any |
| **Filler Word Removal** | No | Yes | Yes | Yes |
| **Interruption Support** | Basic | Advanced | Advanced | Advanced |

### Server VAD Configuration

Best for: Quiet environments, development, testing

```typescript
{
  turn_detection: {
    type: "server_vad",
    threshold: 0.5,              // Volume threshold (0.0-1.0)
    prefix_padding_ms: 300,      // Audio before detection
    silence_duration_ms: 500     // Silence to end turn
  }
}
```

**Tuning Guidelines:**

**Quiet Environment:**
```typescript
{
  threshold: 0.3,           // More sensitive
  silence_duration_ms: 500
}
```

**Noisy Environment:**
```typescript
{
  threshold: 0.7,           // Less sensitive
  silence_duration_ms: 800  // Longer silence needed
}
```

**Quick Responses:**
```typescript
{
  threshold: 0.5,
  silence_duration_ms: 300  // Faster turn-ending
}
```

### Azure Semantic VAD (Recommended)

Best for: Production, noisy environments, natural conversations

```typescript
{
  turn_detection: {
    type: "azure_semantic_vad",
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 700,
    remove_filler_words: true,
    interrupt_response: true,
    auto_truncate: true,
    end_of_utterance_detection: {
      model: "semantic_detection_v1",
      threshold_level: "default",     // aggressive, default, conservative
      timeout_ms: 1500
    }
  }
}
```

**Parameter Deep Dive:**

**threshold** (0.0 - 1.0)
- `0.3` - Very sensitive, catches whispers
- `0.5` - Balanced (recommended)
- `0.7` - Conservative, ignores faint speech

**prefix_padding_ms** (0 - 1000ms)
- `100ms` - Minimal buffering
- `300ms` - Standard (recommended)
- `500ms` - Extra safety for word clipping

**silence_duration_ms** (0 - 5000ms)
- `300ms` - Quick, may cut off speakers
- `700ms` - Balanced for most conversations
- `1500ms` - Patient, good for thoughtful responses

**remove_filler_words** (boolean)
- `true` - Filters "um", "uh", "hmm" (recommended)
- `false` - Keeps all audio (for natural speech analysis)

**interrupt_response** (boolean)
- `true` - User can interrupt AI (recommended)
- `false` - AI completes response fully

**auto_truncate** (boolean)
- `true` - Stops AI output when interrupted
- `false` - Continues but doesn't play audio

### End-of-Utterance Detection

Advanced feature to reduce premature turn endings:

```typescript
end_of_utterance_detection: {
  model: "semantic_detection_v1",
  threshold_level: "default",
  timeout_ms: 1500
}
```

**threshold_level Options:**

**"aggressive"** - Fast-paced conversations
```typescript
{
  threshold_level: "aggressive",
  timeout_ms: 1000
}
// Use for: Quick Q&A, demos, games
```

**"default"** - Balanced (recommended)
```typescript
{
  threshold_level: "default",
  timeout_ms: 1500
}
// Use for: Customer support, general chat
```

**"conservative"** - Patient, thoughtful
```typescript
{
  threshold_level: "conservative",
  timeout_ms: 2000
}
// Use for: Healthcare, legal, elderly users
```

### Azure Semantic VAD Multilingual

For global applications supporting 10+ languages:

```typescript
{
  turn_detection: {
    type: "azure_semantic_vad_multilingual",
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 750,  // Slightly longer for language variations
    remove_filler_words: true,
    interrupt_response: true,
    auto_truncate: true
  },
  input_audio_transcription: {
    model: "azure-speech",
    language: "auto-detect"  // Or specific language
  }
}
```

## Audio Format Configuration

### Input Audio Format

```typescript
{
  input_audio_format: "pcm16",           // Recommended
  input_audio_sampling_rate: 24000       // 8000, 16000, or 24000
}
```

**Format Options:**

| Format | Quality | Bandwidth | Use Case |
|--------|---------|-----------|----------|
| **pcm16** @ 24kHz | Best | ~384 kbps | Default, highest quality |
| **pcm16** @ 16kHz | Good | ~256 kbps | Balanced |
| **pcm16** @ 8kHz | Basic | ~128 kbps | Telephony, low bandwidth |
| **g711_ulaw** | Phone quality | ~64 kbps | Phone systems |
| **g711_alaw** | Phone quality | ~64 kbps | International telephony |

**Recommendations:**

**High Quality Voice Agent:**
```typescript
{
  input_audio_format: "pcm16",
  input_audio_sampling_rate: 24000,
  output_audio_format: "pcm16"
}
```

**Phone/Telephony:**
```typescript
{
  input_audio_format: "g711_ulaw",    // or g711_alaw
  input_audio_sampling_rate: 8000,
  output_audio_format: "g711_ulaw"
}
```

**Bandwidth Constrained:**
```typescript
{
  input_audio_format: "pcm16",
  input_audio_sampling_rate: 16000,
  output_audio_format: "pcm16"
}
```

## Audio Enhancements

### Deep Noise Suppression

Removes background noise for clearer speech recognition:

```typescript
{
  input_audio_noise_reduction: {
    type: "azure_deep_noise_suppression"
  }
}
```

**When to Enable:**
- ✅ Call centers with background chatter
- ✅ Mobile users in public spaces
- ✅ Home environments (kids, pets, TV)
- ✅ Restaurant/retail environments
- ✅ Vehicles (road noise)

**When to Disable:**
- ❌ Professional recording studio
- ❌ Controlled environments
- ❌ When audio quality is already perfect
- ❌ When you need original audio preserved

**Impact:**
- Improves VAD accuracy by 30-50%
- Reduces false positives from background sounds
- Minimal latency impact (~10-20ms)

### Echo Cancellation

Prevents audio feedback and echo:

```typescript
{
  input_audio_echo_cancellation: {
    type: "server_echo_cancellation"
  }
}
```

**When to Enable:**
- ✅ Speaker-based applications (no headphones)
- ✅ Hands-free scenarios
- ✅ Conference rooms
- ✅ Smart speakers
- ✅ Kiosks

**When to Disable:**
- ❌ Headphone users
- ❌ Devices with hardware echo cancellation
- ❌ One-way audio scenarios

## Model Parameters

### Temperature

Controls response creativity and variation:

```typescript
{
  temperature: 0.8  // 0.0 - 1.0
}
```

**Guidelines:**

| Temperature | Behavior | Use Case |
|-------------|----------|----------|
| **0.0 - 0.3** | Deterministic, consistent | Technical support, factual Q&A |
| **0.4 - 0.6** | Balanced | Customer support, general chat |
| **0.7 - 0.9** | Creative, varied | Sales, entertainment, storytelling |
| **1.0** | Maximum creativity | Creative writing, brainstorming |

**Examples:**

**Technical Documentation:**
```typescript
{
  temperature: 0.2,
  instructions: "Provide precise, consistent technical answers."
}
```

**Friendly Customer Support:**
```typescript
{
  temperature: 0.7,
  instructions: "Be warm, helpful, and personable."
}
```

**Entertainment:**
```typescript
{
  temperature: 0.9,
  instructions: "Be creative, playful, and engaging."
}
```

### Max Response Tokens

Limit response length:

```typescript
{
  max_response_output_tokens: 200  // or "inf"
}
```

**Recommendations:**

| Token Limit | ~Words | Use Case |
|-------------|--------|----------|
| **50** | ~40 words | Quick confirmations |
| **100** | ~75 words | Brief answers |
| **200** | ~150 words | Standard responses (recommended) |
| **500** | ~375 words | Detailed explanations |
| **"inf"** | Unlimited | Long-form content |

**Best Practices:**
- Shorter = faster, more focused
- Longer = more detailed, risk of rambling
- Match to conversation style
- Consider audio playback time

## Complete Configuration Examples

### Customer Support (Balanced)

```typescript
{
  model: "gpt-4o",
  modalities: ["text", "audio"],
  instructions: "Professional, helpful customer support agent.",
  voice: {
    type: "azure-standard",
    name: "en-US-Jenny"
  },
  input_audio_format: "pcm16",
  output_audio_format: "pcm16",
  input_audio_sampling_rate: 24000,
  turn_detection: {
    type: "azure_semantic_vad",
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 700,
    remove_filler_words: true,
    interrupt_response: true,
    auto_truncate: true,
    end_of_utterance_detection: {
      model: "semantic_detection_v1",
      threshold_level: "default",
      timeout_ms: 1500
    }
  },
  input_audio_noise_reduction: {
    type: "azure_deep_noise_suppression"
  },
  input_audio_echo_cancellation: {
    type: "server_echo_cancellation"
  },
  input_audio_transcription: {
    model: "azure-speech",
    language: "en-US"
  },
  temperature: 0.7,
  max_response_output_tokens: 200
}
```

### Healthcare (Conservative)

```typescript
{
  model: "gpt-4o",
  modalities: ["text", "audio"],
  instructions: "Empathetic healthcare triage nurse.",
  voice: {
    type: "azure-standard",
    name: "en-US-Ana",
    temperature: 0.6
  },
  input_audio_format: "pcm16",
  output_audio_format: "pcm16",
  input_audio_sampling_rate: 24000,
  turn_detection: {
    type: "azure_semantic_vad",
    threshold: 0.5,
    prefix_padding_ms: 400,
    silence_duration_ms: 1000,        // Patient, let them finish
    remove_filler_words: true,
    interrupt_response: false,         // Don't interrupt patient
    auto_truncate: false,
    end_of_utterance_detection: {
      model: "semantic_detection_v1",
      threshold_level: "conservative", // Wait for complete thoughts
      timeout_ms: 2000
    }
  },
  input_audio_noise_reduction: {
    type: "azure_deep_noise_suppression"
  },
  input_audio_echo_cancellation: {
    type: "server_echo_cancellation"
  },
  input_audio_transcription: {
    model: "azure-speech",
    language: "en-US",
    phrase_list: ["diabetes", "hypertension", "medication", "prescription"]
  },
  temperature: 0.6,                    // Balanced, not too creative
  max_response_output_tokens: 200
}
```

### Interactive Demo (Responsive)

```typescript
{
  model: "gpt-realtime",
  modalities: ["text", "audio"],
  instructions: "Enthusiastic, quick demo assistant.",
  voice: {
    type: "openai",
    name: "coral"
  },
  input_audio_format: "pcm16",
  output_audio_format: "pcm16",
  input_audio_sampling_rate: 24000,
  turn_detection: {
    type: "semantic_vad",               // OpenAI Semantic VAD
    threshold: 0.5,
    prefix_padding_ms: 200,
    silence_duration_ms: 400,           // Quick responses
    remove_filler_words: true,
    interrupt_response: true,
    auto_truncate: true
  },
  temperature: 0.8,                     // More energetic
  max_response_output_tokens: 150      // Concise
}
```

### Phone System (Telephony)

```typescript
{
  model: "gpt-4o",
  modalities: ["text", "audio"],
  instructions: "Clear, professional phone agent.",
  voice: {
    type: "azure-standard",
    name: "en-US-Guy"
  },
  input_audio_format: "g711_ulaw",
  output_audio_format: "g711_ulaw",
  input_audio_sampling_rate: 8000,
  turn_detection: {
    type: "azure_semantic_vad",
    threshold: 0.6,                     // Higher for phone noise
    prefix_padding_ms: 400,
    silence_duration_ms: 800,
    remove_filler_words: true,
    interrupt_response: true
  },
  input_audio_noise_reduction: {
    type: "azure_deep_noise_suppression"
  },
  temperature: 0.6,
  max_response_output_tokens: 150
}
```

## Troubleshooting Common Issues

### Issue: VAD triggers too easily

**Symptoms:** Agent responds to background noise

**Solutions:**
```typescript
// Increase threshold
turn_detection: {
  threshold: 0.7,  // From 0.5
  
  // Or switch to semantic VAD
  type: "azure_semantic_vad",
  
  // Enable noise suppression
}
input_audio_noise_reduction: {
  type: "azure_deep_noise_suppression"
}
```

### Issue: User gets cut off mid-sentence

**Symptoms:** Agent responds before user finishes

**Solutions:**
```typescript
turn_detection: {
  silence_duration_ms: 1000,  // Increase from 700
  end_of_utterance_detection: {
    threshold_level: "conservative",  // From "default"
    timeout_ms: 2000
  }
}
```

### Issue: Response feels slow

**Symptoms:** Long pauses after user speaks

**Solutions:**
```typescript
turn_detection: {
  silence_duration_ms: 500,  // Decrease from 700
  end_of_utterance_detection: {
    threshold_level: "aggressive",
    timeout_ms: 1000
  }
},
max_response_output_tokens: 150  // Shorter responses
```

### Issue: Poor audio quality

**Solutions:**
```typescript
// Increase sampling rate
input_audio_sampling_rate: 24000,  // From 16000

// Use PCM16 format
input_audio_format: "pcm16",

// Enable enhancements
input_audio_noise_reduction: {
  type: "azure_deep_noise_suppression"
}
```

## Testing Your Configuration

### Configuration Test Script

```typescript
const testConfigs = [
  { name: "Baseline", config: baseConfig },
  { name: "Sensitive VAD", config: {...baseConfig, turn_detection: {...baseConfig.turn_detection, threshold: 0.3 }}},
  { name: "Conservative VAD", config: {...baseConfig, turn_detection: {...baseConfig.turn_detection, threshold: 0.7 }}}
];

for (const test of testConfigs) {
  console.log(`\nTesting: ${test.name}`);
  await client.updateSession(test.config);
  
  // Test with sample audio or user input
  await testInteraction();
  
  // Measure metrics
  console.log(`- VAD triggers: ${metrics.vadTriggers}`);
  console.log(`- Response time: ${metrics.responseTime}ms`);
  console.log(`- Cut-offs: ${metrics.cutOffs}`);
}
```

## Next Steps

You now know how to:
- ✅ Configure all VAD types
- ✅ Fine-tune turn detection
- ✅ Enable audio enhancements
- ✅ Optimize for specific use cases
- ✅ Troubleshoot configuration issues

**Continue to [Module 05: Agent Scenarios](05-agent-scenarios.md)** to:
- Design production agent workflows
- Implement function calling
- Handle complex conversations
- Build complete agent solutions

---

**[← Previous: Voices & Languages](03-voices-languages.md) | [Back to Learning Path](../README.md#-learning-path) | [Next: Agent Scenarios →](05-agent-scenarios.md)**
