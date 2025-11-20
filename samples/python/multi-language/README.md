# Multi-Language Sample (Python)

This sample demonstrates real-time language detection and multi-lingual conversation handling with Azure Speech Voice Live API in Python.

## Features

- Automatic language detection
- Multi-language voice selection
- Language-aware conversation handling
- Language switching mid-conversation
- Support for 150+ languages

## Prerequisites

- Python 3.8 or later
- Azure Speech Services resource with Voice Live enabled
- pip package manager

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```env
AZURE_SPEECH_KEY=your-api-key
AZURE_SPEECH_REGION=eastus
DEPLOYMENT_NAME=gpt-4o-realtime-preview
```

3. Run the sample:
```bash
python main.py
```

## How It Works

### Multi-Lingual VAD

Use Azure Semantic VAD Multilingual for automatic language detection:

```python
config = {
    "turn_detection": {
        "type": "azure_semantic_vad_multilingual",
        "threshold": 0.5,
        "silence_duration_ms": 700
    }
}
```

### Language-Specific Voices

Select appropriate voices based on detected language:

```python
VOICE_MAP = {
    'en': 'en-US-AndrewMultilingualNeural',
    'es': 'es-ES-ElviraNeural',
    'fr': 'fr-FR-DeniseNeural',
    'de': 'de-DE-KatjaNeural',
    'ja': 'ja-JP-NanamiNeural',
    'zh': 'zh-CN-XiaoxiaoNeural'
}
```

## Supported Languages

150+ languages including English, Spanish, French, German, Italian, Japanese, Korean, Chinese, Portuguese, Arabic, Hindi, Russian, and many more.

See [Voice Catalog](../../../docs/03-voice-catalog.md) for complete list.

## Next Steps

- Explore [Voice with Avatar](../voice-with-avatar/)
- Learn about [VoiceRAG Pattern](../voicerag-pattern/)
- Read [Multi-Language Guide](../../../docs/07-multi-language.md)
