# Troubleshooting & FAQ

> **Common issues, solutions, and frequently asked questions for Azure Speech Voice Live**

## Table of Contents

- [Connection Issues](#connection-issues)
- [Audio Problems](#audio-problems)
- [VAD Issues](#vad-issues)
- [Voice & Language](#voice--language)
- [Function Calling](#function-calling)
- [Performance](#performance)
- [Error Codes](#error-codes)
- [FAQ](#frequently-asked-questions)

---

## Connection Issues

### WebSocket Connection Fails

**Symptom:** Cannot establish WebSocket connection to Voice Live API

**Common Causes:**

1. **Invalid API Key or Token**
   ```
   Error: 401 Unauthorized
   ```
   **Solution:**
   - Verify API key in Azure Portal
   - Check token expiration for Azure Entra ID
   - Ensure key hasn't been regenerated
   
   ```typescript
   // Test your credentials
   const response = await fetch(
     `https://${REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
     {
       method: 'POST',
       headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
     }
   );
   console.log(response.status); // Should be 200
   ```

2. **Incorrect Region**
   ```
   Error: Cannot resolve host
   ```
   **Solution:**
   - Verify your resource region in Azure Portal
   - Supported regions: eastus, westus2, northeurope, westeurope, etc.
   - Update endpoint: `wss://{REGION}.voice.speech.microsoft.com/`

3. **Missing Model Parameter**
   ```
   Error: 400 Bad Request - Model parameter required
   ```
   **Solution:**
   - Add model to WebSocket URL
   ```typescript
   const url = `wss://${REGION}.voice.speech.microsoft.com/voice-live/realtime?model=gpt-4o`;
   ```

4. **Network/Firewall Issues**
   **Solution:**
   - Whitelist `*.speech.microsoft.com` in firewall
   - Check corporate proxy settings
   - Test with: `curl -I https://{REGION}.api.cognitive.microsoft.com`
   - Allow WebSocket (ws/wss) protocols

### Connection Drops Unexpectedly

**Symptom:** WebSocket closes after establishing

**Solutions:**

1. **Implement Reconnection Logic**
   ```typescript
   let reconnectAttempts = 0;
   const maxAttempts = 5;
   
   ws.onclose = async (event) => {
     if (reconnectAttempts < maxAttempts) {
       reconnectAttempts++;
       const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
       await new Promise(resolve => setTimeout(resolve, delay));
       connectWebSocket();
     }
   };
   ```

2. **Send Keepalive Messages**
   ```typescript
   // Send ping every 30 seconds
   setInterval(() => {
     if (ws.readyState === WebSocket.OPEN) {
       ws.send(JSON.stringify({ type: 'ping' }));
     }
   }, 30000);
   ```

3. **Check Session Timeout**
   - Default timeout: 30 minutes
   - Solution: Refresh session before timeout

### CORS Errors (Browser)

**Symptom:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**

1. **Use Proxy for API Key Protection**
   ```typescript
   // Don't expose API key in browser
   // Use backend proxy:
   const ws = new WebSocket('wss://your-backend.com/voice-proxy');
   ```

2. **Azure Entra ID with Backend Token Exchange**
   ```typescript
   // Frontend gets token from backend
   const token = await fetch('/api/get-token').then(r => r.json());
   const ws = new WebSocket(url, {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

---

## Audio Problems

### No Audio Output

**Symptom:** Connection works but no audio heard

**Checklist:**

1. **Verify Audio Format Compatibility**
   ```typescript
   // Use PCM16 for best compatibility
   {
     output_audio_format: "pcm16",
     output_audio_sampling_rate: 24000
   }
   ```

2. **Check Browser Audio Permissions**
   ```typescript
   // Request microphone permission
   try {
     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
     console.log('Audio permission granted');
   } catch (err) {
     console.error('Audio permission denied:', err);
   }
   ```

3. **Verify Web Audio API Setup**
   ```typescript
   const audioContext = new (window.AudioContext || window.webkitAudioContext)();
   
   // iOS requires user interaction to start
   document.addEventListener('click', () => {
     if (audioContext.state === 'suspended') {
       audioContext.resume();
     }
   }, { once: true });
   ```

4. **Check Audio Data Reception**
   ```typescript
   ws.onmessage = (event) => {
     const message = JSON.parse(event.data);
     if (message.type === 'response.audio.delta') {
       console.log('Audio chunk received:', message.delta.length);
     }
   };
   ```

### Poor Audio Quality

**Symptom:** Audio sounds distorted, choppy, or robotic

**Solutions:**

1. **Increase Sample Rate**
   ```typescript
   {
     output_audio_sampling_rate: 24000  // Use 24kHz instead of 16kHz
   }
   ```

2. **Use Better Voice**
   ```typescript
   {
     voice: {
       type: "azure-hd",
       name: "en-US-Ava-HD"  // HD voices have superior quality
     }
   }
   ```

3. **Check Network Bandwidth**
   ```typescript
   // Monitor WebSocket message sizes
   let bytesReceived = 0;
   let lastCheck = Date.now();
   
   ws.onmessage = (event) => {
     bytesReceived += event.data.length;
     const now = Date.now();
     if (now - lastCheck > 1000) {
       const kbps = (bytesReceived * 8) / 1000;
       console.log(`Bandwidth: ${kbps.toFixed(1)} kbps`);
       bytesReceived = 0;
       lastCheck = now;
     }
   };
   ```

4. **Adjust Audio Buffer Size**
   ```typescript
   // Increase buffer for unstable connections
   const bufferSize = 4096; // Try 2048, 4096, or 8192
   const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
   ```

### Echo or Feedback

**Symptom:** Hear your own voice or feedback loop

**Solutions:**

1. **Enable Echo Cancellation**
   ```typescript
   {
     input_audio_echo_cancellation: {
       type: "server_echo_cancellation"
     }
   }
   ```

2. **Use Headphones**
   - Eliminates acoustic feedback loop
   - Prevents speaker output from reaching microphone

3. **Browser-Level Echo Cancellation**
   ```typescript
   const constraints = {
     audio: {
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true
     }
   };
   const stream = await navigator.mediaDevices.getUserMedia(constraints);
   ```

### Microphone Not Working

**Symptom:** Agent doesn't hear user speech

**Solutions:**

1. **Check Permissions**
   ```typescript
   const permissions = await navigator.permissions.query({ name: 'microphone' });
   console.log('Microphone permission:', permissions.state);
   ```

2. **Verify Audio Input**
   ```typescript
   // Test microphone
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => {
       const audioContext = new AudioContext();
       const analyser = audioContext.createAnalyser();
       const microphone = audioContext.createMediaStreamSource(stream);
       microphone.connect(analyser);
       
       const dataArray = new Uint8Array(analyser.frequencyBinCount);
       setInterval(() => {
         analyser.getByteFrequencyData(dataArray);
         const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
         console.log('Audio level:', average);
       }, 100);
     });
   ```

3. **Check Input Audio Format**
   ```typescript
   {
     input_audio_format: "pcm16",
     input_audio_sampling_rate: 24000
   }
   ```

---

## VAD Issues

### Agent Cuts Off User Speech

**Symptom:** Response starts before user finishes speaking

**Solutions:**

1. **Increase Silence Duration**
   ```typescript
   {
     turn_detection: {
       type: "azure_semantic_vad",
       silence_duration_ms: 1000  // Increase from 700ms
     }
   }
   ```

2. **Lower VAD Threshold**
   ```typescript
   {
     turn_detection: {
       threshold: 0.4  // Decrease from 0.5 for more sensitivity
     }
   }
   ```

3. **Disable Interruption**
   ```typescript
   {
     turn_detection: {
       interrupt_response: false  // Agent won't interrupt ongoing response
     }
   }
   ```

### Agent Doesn't Detect End of Speech

**Symptom:** Long pause before agent responds

**Solutions:**

1. **Decrease Silence Duration**
   ```typescript
   {
     turn_detection: {
       silence_duration_ms: 500  // Decrease from 700ms
     }
   }
   ```

2. **Use More Sensitive VAD**
   ```typescript
   {
     turn_detection: {
       type: "azure_semantic_vad",  // More sensitive than server_vad
       threshold: 0.6
     }
   }
   ```

### False Triggers from Background Noise

**Symptom:** Agent responds to background noise, not speech

**Solutions:**

1. **Enable Noise Suppression**
   ```typescript
   {
     input_audio_noise_reduction: {
       type: "azure_deep_noise_suppression"
     }
   }
   ```

2. **Increase VAD Threshold**
   ```typescript
   {
     turn_detection: {
       threshold: 0.7  // Higher = less sensitive to noise
     }
   }
   ```

3. **Remove Filler Words**
   ```typescript
   {
     turn_detection: {
       remove_filler_words: true  // Reduces false triggers from "um", "uh"
     }
   }
   ```

---

## Voice & Language

### Voice Not Available

**Symptom:** `Error: Voice not found` or incorrect voice used

**Solutions:**

1. **Check Voice Catalog**
   - Verify voice name spelling
   - See [Voice Catalog](voice-catalog.md) for complete list
   - Test with basic voice:
   ```typescript
   { voice: { type: "azure-standard", name: "en-US-Jenny" } }
   ```

2. **Verify Voice Type**
   ```typescript
   // Correct format:
   {
     voice: {
       type: "azure-standard",  // or "azure-hd", "openai"
       name: "en-US-Jenny"
     }
   }
   
   // Not this:
   { voice: "Jenny" }  // ❌ Wrong format
   ```

3. **Check Region Availability**
   - HD voices only in select regions
   - Some voices region-specific
   - See [Voice Catalog](voice-catalog.md#regional-availability)

### Language Not Detected

**Symptom:** Agent responds in wrong language

**Solutions:**

1. **Enable Language Auto-Detection**
   ```typescript
   {
     input_audio_transcription: {
       model: "azure-speech",
       language: "auto-detect",
       candidateLanguages: ["en-US", "es-ES", "fr-FR"]
     }
   }
   ```

2. **Use Multilingual VAD**
   ```typescript
   {
     turn_detection: {
       type: "azure_semantic_vad_multilingual",
       languages: ["en", "es", "fr", "de", "it", "pt", "ja", "zh", "ko", "hi"]
     }
   }
   ```

3. **Set Explicit Language**
   ```typescript
   {
     input_audio_transcription: {
       language: "es-ES"  // Force Spanish
     }
   }
   ```

### Voice Switching Not Working

**Symptom:** Cannot change voice mid-conversation

**Solution:**

```typescript
// Send session.update event
ws.send(JSON.stringify({
  type: 'session.update',
  session: {
    voice: {
      type: "azure-standard",
      name: "es-ES-Elvira"
    }
  }
}));
```

---

## Function Calling

### Functions Not Being Called

**Symptom:** Agent ignores available functions

**Solutions:**

1. **Improve Function Descriptions**
   ```typescript
   {
     name: "get_weather",
     // ❌ Vague description
     description: "Gets weather"
     
     // ✅ Clear description
     description: "Get current weather conditions and forecast for a specific city and date"
   }
   ```

2. **Add Function Examples to Instructions**
   ```typescript
   instructions: `When users ask about weather, use the get_weather function.
   
   Examples:
   - "What's the weather in Seattle?" → call get_weather(city="Seattle")
   - "Will it rain tomorrow?" → call get_weather(date="tomorrow")
   `
   ```

3. **Check Tool Choice Setting**
   ```typescript
   {
     tool_choice: "auto"  // Let model decide
     // or
     tool_choice: "required"  // Force function use
     // or
     tool_choice: { type: "function", name: "specific_function" }
   }
   ```

### Function Parameters Incorrect

**Symptom:** Function called with wrong or missing parameters

**Solutions:**

1. **Define Clear Schema**
   ```typescript
   {
     name: "book_flight",
     parameters: {
       type: "object",
       properties: {
         departure: { 
           type: "string",
           description: "Departure city (e.g., 'Seattle', 'New York')"
         },
         destination: {
           type: "string",
           description: "Destination city"
         },
         date: {
           type: "string",
           description: "Travel date in YYYY-MM-DD format"
         }
       },
       required: ["departure", "destination", "date"]
     }
   }
   ```

2. **Add Enums for Constrained Values**
   ```typescript
   {
     cabin_class: {
       type: "string",
       enum: ["economy", "premium", "business", "first"],
       description: "Cabin class preference"
     }
   }
   ```

3. **Handle Missing Parameters**
   ```typescript
   async function handleFunctionCall(call: FunctionCall) {
     const args = JSON.parse(call.arguments);
     
     // Validate required parameters
     if (!args.city) {
       return {
         error: "Missing required parameter: city",
         message: "Please specify which city you'd like weather for"
       };
     }
     
     // Call actual function
     return await getWeather(args.city, args.date);
   }
   ```

### Function Response Not Used

**Symptom:** Agent doesn't incorporate function results

**Solution:**

```typescript
// After function execution, send result back
ws.send(JSON.stringify({
  type: 'conversation.item.create',
  item: {
    type: 'function_call_output',
    call_id: functionCall.call_id,
    output: JSON.stringify({
      temperature: 72,
      conditions: "Sunny",
      humidity: 45
    })
  }
}));

// Trigger response with function output
ws.send(JSON.stringify({
  type: 'response.create'
}));
```

---

## Performance

### High Latency

**Symptom:** Slow response times (>2 seconds)

**Solutions:**

1. **Choose Nearest Region**
   ```typescript
   // Measure latency to different regions
   const regions = ['eastus', 'westus2', 'westeurope'];
   for (const region of regions) {
     const start = Date.now();
     await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`);
     console.log(`${region}: ${Date.now() - start}ms`);
   }
   ```

2. **Optimize Audio Buffering**
   ```typescript
   // Send smaller chunks more frequently
   const CHUNK_SIZE = 4800; // 100ms at 24kHz PCM16
   const SEND_INTERVAL = 100; // ms
   ```

3. **Use Faster Model**
   ```typescript
   {
     model: "gpt-4o-mini"  // Faster than gpt-4o
   }
   ```

4. **Limit Response Length**
   ```typescript
   {
     max_response_output_tokens: 200  // Shorter responses = faster
   }
   ```

### High Token Usage

**Symptom:** Consuming tokens too quickly

**Solutions:**

1. **Shorten Instructions**
   ```typescript
   // ❌ 5000 token instructions
   instructions: "You are a helpful assistant... [very long prompt]"
   
   // ✅ 500 token instructions
   instructions: "You are a helpful customer support agent. Be concise and friendly."
   ```

2. **Limit Conversation History**
   ```typescript
   // Keep only last N messages
   const MAX_HISTORY = 20;
   if (conversationHistory.length > MAX_HISTORY) {
     conversationHistory = conversationHistory.slice(-MAX_HISTORY);
   }
   ```

3. **Use Truncation**
   ```typescript
   {
     turn_detection: {
       auto_truncate: true  // Truncate old messages automatically
     }
   }
   ```

### Memory Issues

**Symptom:** Application crashes or slows over time

**Solutions:**

1. **Clean Up Audio Buffers**
   ```typescript
   // Release audio resources
   audioContext.close();
   stream.getTracks().forEach(track => track.stop());
   ```

2. **Limit Message Storage**
   ```typescript
   // Don't store all audio data
   ws.onmessage = (event) => {
     const message = JSON.parse(event.data);
     if (message.type === 'response.audio.delta') {
       playAudio(message.delta);
       // Don't store: audioHistory.push(message.delta)
     }
   };
   ```

---

## Error Codes

### Common HTTP Errors

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format, required parameters |
| 401 | Unauthorized | Verify API key or token |
| 403 | Forbidden | Check resource permissions, subscription |
| 404 | Not Found | Verify endpoint URL, region |
| 429 | Too Many Requests | Implement rate limiting, backoff |
| 500 | Internal Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | Check Azure status, try different region |

### WebSocket Close Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 1000 | Normal Closure | Expected - no action needed |
| 1001 | Going Away | Server shutting down - reconnect |
| 1006 | Abnormal Closure | Network issue - check connection |
| 1008 | Policy Violation | Check request format, authentication |
| 1011 | Internal Error | Retry with backoff |
| 4000 | Custom Error | Check error message for details |

### Voice Live Specific Errors

```typescript
{
  type: "error",
  error: {
    code: "invalid_voice",
    message: "Voice 'xyz' not found",
    details: {}
  }
}
```

**Common Error Codes:**

- `invalid_voice` - Voice name incorrect
- `invalid_model` - Model not available in region
- `rate_limit_exceeded` - Too many requests
- `token_limit_exceeded` - Conversation too long
- `invalid_audio_format` - Unsupported audio format
- `authentication_failed` - Invalid credentials
- `quota_exceeded` - Subscription quota reached

---

## Frequently Asked Questions

### General

**Q: What's the difference between Voice Live Pro, Basic, and Lite?**

A: 
- **Pro**: Most capable models (gpt-4o, gpt-5), highest quality
- **Basic**: Balanced performance (gpt-4o-mini, gpt-5-mini), lower cost
- **Lite**: Fastest responses (gpt-5-nano, phi4), lowest latency

**Q: Can I use Voice Live for production applications?**

A: Yes! Voice Live is production-ready. Follow our [Production Deployment Guide](08-production-deployment.md) for best practices.

**Q: How much does Voice Live cost?**

A: Pricing varies by:
- Model tier (Pro/Basic/Lite)
- Voice type (Standard/HD/Custom)
- Region
- Volume

See [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) for estimates.

**Q: What's the maximum conversation length?**

A: 
- Token limit: Varies by model (typically 4096-8192 tokens)
- Time limit: 30 minutes per session
- Use `auto_truncate` to manage long conversations

### Technical

**Q: Can I host Voice Live on-premises?**

A: No, Voice Live is a cloud service. However, you can:
- Use Azure Arc for hybrid scenarios
- Deploy your application on-premises with cloud API calls
- Consider Azure Stack for edge computing

**Q: Does Voice Live support streaming?**

A: Yes! Voice Live streams both:
- Audio output (delta events)
- Text transcriptions (delta events)
- Real-time, low-latency streaming

**Q: Can I fine-tune Voice Live models?**

A: You can:
- Customize system instructions
- Create custom voices
- Use phrase lists for better recognition
- Cannot fine-tune underlying GPT models

**Q: What audio formats are supported?**

A:
- **Input**: PCM16, G.711 μ-law, G.711 A-law
- **Output**: PCM16, G.711 μ-law, G.711 A-law
- **Sample Rates**: 8kHz, 16kHz, 24kHz

**Q: Can I use Voice Live with Twilio/telephony?**

A: Yes! Use:
- G.711 μ-law format (telephony standard)
- 8kHz sample rate
- See [Telephony Integration Sample](../samples/typescript/telephony-integration/)

### Features

**Q: Does Voice Live support multiple languages in one conversation?**

A: Yes! Enable auto-detection:
```typescript
{
  input_audio_transcription: {
    language: "auto-detect",
    candidateLanguages: ["en-US", "es-ES", "fr-FR"]
  }
}
```

**Q: Can the agent switch voices during conversation?**

A: Yes! Send `session.update` event with new voice configuration.

**Q: Does Voice Live support avatars?**

A: Yes! See [Advanced Features - Avatar Integration](06-advanced-features.md#avatar-integration).

**Q: Can I integrate my own knowledge base?**

A: Yes! Use the VoiceRAG pattern:
1. Define function to search knowledge base
2. Agent calls function when needed
3. Inject results into response

See [VoiceRAG Sample](../samples/typescript/voicerag-pattern/).

**Q: Is there a rate limit?**

A: Yes:
- **Requests**: 100 per minute per subscription (default)
- **Concurrent connections**: 20 per resource
- **Token throughput**: Varies by tier

Request increase via Azure Support.

### Security

**Q: Is Voice Live HIPAA compliant?**

A: Azure Cognitive Services (including Speech) can be HIPAA compliant when:
- Using BAA-covered Azure subscription
- Proper configuration and policies
- See [Healthcare Compliance Guide](../agents/healthcare-triage/README.md#hipaa-compliance)

**Q: How is my data used?**

A: 
- Voice data processed in real-time
- No data stored for model training (with proper configuration)
- See [Azure Privacy Statement](https://privacy.microsoft.com/privacystatement)

**Q: Can I use Voice Live in Europe (GDPR)?**

A: Yes! 
- Use European regions (westeurope, northeurope)
- Data residency within EU
- GDPR-compliant processing

**Q: Should I use API Key or Azure Entra ID?**

A:
- **API Key**: Quick start, simpler
- **Azure Entra ID**: Production recommended, more secure, granular permissions

---

## Still Having Issues?

### Check Azure Status

[Azure Status Page](https://status.azure.com) - Check for service outages

### Enable Debug Logging

```typescript
// Log all WebSocket messages
ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
};
```

### Contact Support

- **GitHub Issues**: [Report a bug](https://github.com/DrHazemAli/foundry-live-agents/issues)
- **Azure Support**: [Open ticket](https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade)
- **Community**: [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-speech)

---

**[← Back to API Reference](09-api-reference.md) | [Documentation Home →](../README.md)**
