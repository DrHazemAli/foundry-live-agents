# API Changelog

All notable changes to the Azure Speech Voice Live API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025-10-01] - Current Version

### Added
- **Azure Semantic VAD Multilingual**: Support for 10+ languages with optimized end-of-utterance detection
- **Azure HD Voices with Temperature Control**: 50+ premium voices with adjustable warmth (0.0-1.0)
- **Avatar Integration**: Real-time avatar video generation synchronized with audio
- **Enhanced Audio Processing**:
  - Azure Deep Noise Suppression for input audio
  - Server-side echo cancellation
  - Automatic gain control (AGC)
- **Advanced Turn Detection**:
  - Semantic detection with configurable thresholds
  - Filler word removal option
  - Auto-truncation for interruptions
  - Prefix padding for natural conversations
- **Multi-format Audio Support**:
  - PCM16 at 8kHz, 16kHz, 24kHz
  - G.711 μ-law and A-law
- **Function Calling Enhancements**:
  - Parallel function execution
  - Conditional tool selection
  - Streaming function results
- **Session Management**:
  - Mid-session voice switching
  - Dynamic instruction updates
  - Temperature adjustment during conversation

### Changed
- **Default VAD Behavior**: Semantic VAD now default (was server VAD)
- **Token Limits**: Increased max_response_output_tokens to 4096 (was 2048)
- **Audio Chunk Size**: Optimized to 100ms chunks (was 200ms)
- **Connection Timeout**: Extended to 30 minutes (was 15 minutes)

### Deprecated
- **server_vad** without semantic detection (use `azure_semantic_vad` instead)
- **Fixed voice-only sessions** (voice switching now supported)

### Security
- **Azure Entra ID**: Now recommended authentication method for production
- **API Key Rotation**: Support for zero-downtime key rotation
- **Request Signing**: Optional request signature validation

---

## [2025-06-01] - Previous Version

### Added
- **Multi-language Auto-detection**: Automatic language identification for 150+ locales
- **Custom Voice Support**: Integration with custom neural voices
- **OpenAI Voice Compatibility**: Support for OpenAI's alloy, echo, fable, onyx, nova, shimmer voices
- **Response Streaming**: Delta events for audio and text
- **Conversation History**: Client-managed conversation state

### Changed
- **Model Selection**: Expanded to include gpt-4.1, gpt-5, phi4-mm-realtime
- **Voice Catalog**: Added 200+ new Azure neural voices
- **Latency Improvements**: 30% faster response times

### Fixed
- Audio synchronization issues in multi-turn conversations
- VAD false positives in noisy environments
- Memory leaks in long-running sessions

---

## [2025-01-01] - Initial Release

### Added
- WebSocket-based real-time communication
- Speech-to-text transcription with timestamps
- Text-to-speech synthesis with neural voices
- Function calling for external integrations
- Server-side VAD for turn detection
- Session configuration and management
- Error handling and status events

### Supported
- **Models**: gpt-4o, gpt-realtime, gpt-4o-mini
- **Voices**: 400+ Azure neural voices
- **Languages**: 140+ languages and locales
- **Audio Formats**: PCM16 @ 16kHz, 24kHz
- **Authentication**: API key

---

## Upcoming Features (Roadmap)

### Q1 2026
- [ ] **Real-time Translation**: Live translation during conversations
- [ ] **Emotion Detection**: Voice emotion analysis
- [ ] **Speaker Diarization**: Multi-speaker identification
- [ ] **Background Music**: Optional ambient audio
- [ ] **Voice Cloning**: Rapid custom voice creation (< 5 min samples)

### Q2 2026
- [ ] **Video Avatar HD**: 4K avatar rendering
- [ ] **Gesture Control**: Avatar gestures synchronized with speech
- [ ] **Regional Accents**: Expanded accent options per language
- [ ] **Contextual Memory**: Long-term conversation memory
- [ ] **Multi-modal Input**: Camera + microphone integration

### Q3 2026
- [ ] **Offline Mode**: Local processing for sensitive data
- [ ] **Edge Deployment**: IoT and edge device support
- [ ] **Voice Biometrics**: Speaker verification
- [ ] **Sentiment Analysis**: Real-time sentiment tracking

---

## Migration Guides

### From 2025-06-01 to 2025-10-01

#### Breaking Changes

**None** - This is a backward-compatible release.

#### Recommended Updates

1. **Update VAD Configuration**:

```diff
{
  turn_detection: {
-   type: "server_vad"
+   type: "azure_semantic_vad",
+   threshold: 0.5,
+   silence_duration_ms: 700
  }
}
```

2. **Enable Audio Enhancements**:

```diff
{
+  input_audio_noise_reduction: {
+    type: "azure_deep_noise_suppression"
+  },
+  input_audio_echo_cancellation: {
+    type: "server_echo_cancellation"
+  }
}
```

3. **Switch to Azure Entra ID** (Production):

```diff
- headers: { "api-key": API_KEY }
+ headers: { "Authorization": `Bearer ${TOKEN}` }
```

### From 2025-01-01 to 2025-06-01

#### Breaking Changes

1. **Voice Name Format Changed**:

```diff
- voice: "jenny"
+ voice: { type: "azure-standard", name: "en-US-Jenny" }
```

2. **Model Parameter Required**:

```diff
- wss://{resource}.cognitiveservices.azure.com/voice-live/realtime
+ wss://{resource}.cognitiveservices.azure.com/voice-live/realtime?model=gpt-4o
```

#### Migration Steps

1. Update all voice references to new format
2. Add `model` parameter to WebSocket URL
3. Update event handlers for new event types
4. Test multi-language scenarios

---

## Deprecation Policy

### Timeline

- **Announcement**: Feature marked as deprecated
- **6 Months**: Feature continues to work with warnings
- **12 Months**: Feature disabled but backward compatibility maintained
- **18 Months**: Feature completely removed

### Currently Deprecated

| Feature | Deprecated | Removal Date | Alternative |
|---------|-----------|--------------|-------------|
| `server_vad` (basic) | 2025-10-01 | 2026-04-01 | `azure_semantic_vad` |
| API key auth (prod) | 2025-10-01 | 2026-10-01 | Azure Entra ID |
| Fixed voice sessions | 2025-10-01 | 2026-04-01 | Dynamic voice switching |

---

## Known Issues

### Current Version (2025-10-01)

1. **Avatar Rendering in Safari**: Limited to 1080p (4K support coming)
2. **Multi-language VAD**: Occasional false positives when switching between tonal and non-tonal languages
3. **WebSocket Reconnection**: Automatic reconnection not working in some mobile browsers

### Workarounds

**Issue 1**: Use Chrome/Edge for 4K avatar support  
**Issue 2**: Use `azure_semantic_vad_multilingual` type with adjusted threshold  
**Issue 3**: Implement manual reconnection logic

---

## Support

- **Documentation**: [docs/](../README.md)
- **GitHub Issues**: [github.com/your-repo/issues](https://github.com)
- **Community Forum**: [community.example.com](https://community.example.com)
- **Email Support**: support@example.com
- **Status Page**: [status.azure.com](https://status.azure.com)

---

## Version Support

| Version | Release Date | End of Support | Status |
|---------|--------------|----------------|--------|
| 2025-10-01 | Nov 2025 | Nov 2027 | ✅ Current |
| 2025-06-01 | Jun 2025 | Jun 2026 | ⚠️ Deprecated |
| 2025-01-01 | Jan 2025 | Jan 2026 | ❌ Unsupported |

---

**[← Back to API Reference](09-api-reference.md) | [Documentation Home →](../README.md)**
