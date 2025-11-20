# Interactive Voice Live Playground

A modern, interactive web application built with Vite, React, and TypeScript for exploring Azure Speech Voice Live API capabilities.

## Features

- 🎙️ **Real-time Voice Interaction** - Full-duplex WebSocket voice communication
- 🎨 **Beautiful UI** - Modern, responsive interface with smooth animations
- 🗣️ **Voice Gallery** - Browse and preview 600+ voices with filters
- 🌍 **Multi-Language** - Support for 150+ languages with auto-detection
- ⚙️ **Configuration Explorer** - Visual configurator for all Voice Live settings
- 🤖 **Agent Scenarios** - Pre-built agent templates (customer support, travel, healthcare, etc.)
- 📊 **Real-time Visualization** - Audio waveforms, transcription, and event stream
- 💬 **Chat/Code View** - Toggle between conversation view and raw JSON events
- 🎛️ **Advanced Controls** - Fine-tune VAD, audio formats, model parameters
- 📝 **Export Config** - Generate code snippets for TypeScript, Python, Go, C#, Swift

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS 3
- **State:** Zustand
- **WebSocket:** Native WebSocket API
- **Audio:** Web Audio API
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 18 or later
- Azure Speech Services resource with Voice Live enabled
- Modern web browser with microphone access

### Installation

```bash
# From repository root
cd playground

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Azure credentials
```

### Configuration

Edit `.env.local`:

```bash
VITE_AZURE_RESOURCE_NAME=your-resource-name
VITE_AZURE_REGION=eastus
VITE_AZURE_SPEECH_API_KEY=your-api-key

# Optional: Azure Entra ID (recommended for production)
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_CLIENT_SECRET=your-client-secret
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy (example with Azure Static Web Apps)
npm run deploy
```

## Project Structure

```
playground/
├── src/
│   ├── components/           # React components
│   │   ├── Chat/            # Chat interface
│   │   ├── Configuration/   # Configuration panels
│   │   ├── VoiceGallery/    # Voice browser
│   │   ├── AudioVisualizer/ # Waveform visualization
│   │   ├── AgentSelector/   # Agent scenario picker
│   │   └── CodeExporter/    # Code snippet generator
│   ├── services/            # Business logic
│   │   ├── voiceLiveClient.ts    # WebSocket client
│   │   ├── audioCapture.ts       # Microphone capture
│   │   ├── audioPlayer.ts        # Audio playback
│   │   ├── audioAnalyzer.ts      # Waveform analysis
│   │   └── configGenerator.ts    # Config to code
│   ├── stores/              # Zustand state management
│   │   ├── configStore.ts        # Configuration state
│   │   ├── conversationStore.ts  # Chat history
│   │   └── connectionStore.ts    # Connection state
│   ├── data/                # Static data
│   │   ├── voices.ts            # Voice catalog
│   │   ├── agents.ts            # Agent templates
│   │   └── languages.ts         # Language list
│   ├── types/               # TypeScript types
│   │   └── voiceLive.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useVoiceLive.ts
│   │   ├── useAudioCapture.ts
│   │   └── useConfiguration.ts
│   ├── utils/               # Helper functions
│   │   ├── audioUtils.ts
│   │   ├── formatters.ts
│   │   └── validation.ts
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
│   ├── agent-avatars/      # Agent images
│   └── voice-samples/      # Sample audio files
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Key Features

### 1. Voice Gallery

Browse and filter 600+ voices:

```typescript
// Filter by language, gender, style
const voices = useVoiceGallery({
  language: 'en-US',
  gender: 'female',
  style: 'professional'
});

// Preview voice sample
<VoiceCard voice={voice} onPreview={playVoiceSample} />
```

### 2. Configuration Builder

Visual configuration editor:

```typescript
const config = useConfigStore((state) => ({
  model: state.model,
  voice: state.voice,
  turnDetection: state.turnDetection,
  audioEnhancements: state.audioEnhancements
}));

<ConfigPanel 
  config={config}
  onChange={updateConfig}
/>
```

### 3. Real-time Conversation

Full-duplex voice interaction:

```typescript
const { connect, disconnect, sendAudio } = useVoiceLive({
  onSpeechStarted: () => console.log('User speaking'),
  onResponseAudio: (audio) => playAudio(audio),
  onTranscript: (text) => addMessage(text)
});
```

### 4. Code Export

Generate implementation code:

```typescript
<CodeExporter 
  config={currentConfig}
  language="typescript" // or python, go, csharp, swift
  format="complete" // or snippet
/>

// Generates complete working code with comments
```

## Usage Examples

### Quick Start - Basic Chat

1. Click "Connect" to establish WebSocket connection
2. Click microphone button to start speaking
3. See your speech transcribed in real-time
4. Hear AI response with selected voice
5. Continue natural conversation

### Voice Exploration

1. Click "Voice Gallery" tab
2. Filter by language (e.g., "Spanish")
3. Filter by gender ("Female")
4. Click "Preview" to hear voice sample
5. Click "Use This Voice" to apply

### Configuration Tuning

1. Click "Configuration" tab
2. Select VAD type (Azure Semantic recommended)
3. Adjust threshold slider
4. Toggle audio enhancements
5. Click "Apply" to update session
6. Test with conversation

### Agent Scenarios

1. Click "Agent Scenarios" tab
2. Browse pre-built agents (Customer Support, Travel, Healthcare, etc.)
3. Click agent card to see details
4. Click "Load Agent" to apply configuration
5. Test agent conversation flow

### Advanced - Function Calling

1. Click "Tools" tab in configuration
2. Add function definitions
3. Implement function handlers
4. Test function calling in conversation

## Configuration Options

### Voice Settings

```typescript
interface VoiceConfig {
  type: 'openai' | 'azure-standard' | 'azure-hd' | 'custom';
  name: string;  // e.g., 'en-US-Jenny', 'alloy'
  temperature?: number;  // 0.0-1.0 (HD voices only)
}
```

### VAD Settings

```typescript
interface VADConfig {
  type: 'server_vad' | 'semantic_vad' | 'azure_semantic_vad' | 'azure_semantic_vad_multilingual';
  threshold: number;  // 0.0-1.0
  prefix_padding_ms: number;  // 0-1000
  silence_duration_ms: number;  // 0-5000
  remove_filler_words?: boolean;
  interrupt_response?: boolean;
  auto_truncate?: boolean;
}
```

### Audio Enhancement

```typescript
interface AudioEnhancements {
  noiseReduction: boolean;  // Azure Deep Noise Suppression
  echoCancellation: boolean;  // Server Echo Cancellation
}
```

### Model Parameters

```typescript
interface ModelConfig {
  model: string;  // gpt-4o, gpt-realtime, etc.
  temperature: number;  // 0.0-1.0
  max_response_output_tokens: number | 'inf';
}
```

## Keyboard Shortcuts

- `Space` - Push to talk (hold)
- `Ctrl+Enter` - Toggle continuous listening
- `Ctrl+D` - Disconnect
- `Ctrl+M` - Mute/Unmute microphone
- `Ctrl+K` - Open configuration panel
- `Ctrl+V` - Open voice gallery
- `Ctrl+,` - Open settings
- `Esc` - Close modals/panels

## Troubleshooting

### Microphone Not Working

1. Check browser permissions (allow microphone)
2. Ensure HTTPS connection (required for getUserMedia)
3. Try different browser (Chrome/Edge recommended)
4. Check system microphone settings

### No Audio Output

1. Check browser audio permissions
2. Verify system volume
3. Check audio output device
4. Try different audio format (PCM16 @ 24kHz)

### Connection Issues

1. Verify Azure credentials in `.env.local`
2. Check region matches your Azure resource
3. Ensure API key is valid
4. Check browser console for errors
5. Test with `curl` (see docs/02-getting-started.md)

### Poor Audio Quality

1. Enable noise reduction in configuration
2. Use PCM16 @ 24kHz (highest quality)
3. Ensure stable internet connection
4. Reduce background noise
5. Use headphones to prevent echo

## Performance Tips

1. **Use PCM16 @ 24kHz** for best quality
2. **Enable Audio Enhancements** in noisy environments
3. **Adjust VAD threshold** based on environment
4. **Use Azure Semantic VAD** for production
5. **Enable WebSocket compression** for bandwidth
6. **Limit max_response_tokens** for faster responses
7. **Use regional Azure resources** for lower latency

## Security Best Practices

1. **Never commit API keys** - Use `.env.local` (gitignored)
2. **Use Azure Entra ID** for production
3. **Implement CORS properly** on backend
4. **Rate limit requests** to prevent abuse
5. **Validate all user input** before sending
6. **Sanitize responses** before displaying
7. **Use HTTPS always** - Required for microphone access

## Browser Compatibility

| Browser | Version | Microphone | WebSocket | Audio Playback |
|---------|---------|-----------|-----------|----------------|
| Chrome | 90+ | ✅ | ✅ | ✅ |
| Edge | 90+ | ✅ | ✅ | ✅ |
| Firefox | 88+ | ✅ | ✅ | ✅ |
| Safari | 14+ | ✅ | ✅ | ✅ |
| Opera | 76+ | ✅ | ✅ | ✅ |

**Note:** HTTPS required for microphone access (except localhost)

## Deployment

### Azure Static Web Apps

```bash
# Install Azure CLI
az login

# Create static web app
az staticwebapp create \
  --name voice-live-playground \
  --resource-group your-rg \
  --location eastus2 \
  --source .

# Deploy
npm run build
az staticwebapp deploy \
  --name voice-live-playground \
  --app-location ./dist
```

### Netlify

```bash
# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_AZURE_RESOURCE_NAME` | Yes | Azure Speech resource name |
| `VITE_AZURE_REGION` | Yes | Azure region (e.g., eastus) |
| `VITE_AZURE_SPEECH_API_KEY` | Yes* | API key for authentication |
| `VITE_AZURE_TENANT_ID` | No | Azure AD tenant (for Entra ID) |
| `VITE_AZURE_CLIENT_ID` | No | App client ID (for Entra ID) |
| `VITE_AZURE_CLIENT_SECRET` | No | Client secret (for Entra ID) |
| `VITE_DEFAULT_MODEL` | No | Default model (default: gpt-4o) |
| `VITE_DEFAULT_VOICE` | No | Default voice (default: en-US-Jenny) |
| `VITE_ENABLE_ANALYTICS` | No | Enable analytics (default: false) |

*Required unless using Azure Entra ID

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE)

## Next Steps

- Explore [Voice Catalog](../docs/voice-catalog.md) for all available voices
- Read [Configuration Guide](../docs/04-configuration.md) for tuning tips
- Check [Agent Scenarios](../docs/05-agent-scenarios.md) for templates
- Build samples in [TypeScript](../samples/typescript/), [Python](../samples/python/), [Swift](../samples/swift/)

---

**[← Back to Repository](../README.md) | [Sample Code →](../samples/)**
