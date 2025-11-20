# Voice with Avatar Sample (Python)

This sample demonstrates how to synchronize Azure Speech Voice Live with a visual avatar using viseme data for realistic lip-sync in Python.

## Features

- Real-time viseme data extraction
- Avatar lip-sync animation
- Facial expression mapping
- Audio-visual synchronization
- Web-based avatar rendering

## Prerequisites

- Python 3.8 or later
- Azure Speech Services resource with Voice Live enabled

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file and run:
```bash
python main.py
```

3. Open browser to `http://localhost:8000`

## How It Works

The Voice Live API emits viseme events synchronized with audio output. These viseme IDs (0-21) correspond to different mouth shapes that can be used to animate an avatar's lips in real-time.

## Next Steps

- Explore [VoiceRAG Pattern](../voicerag-pattern/)
- Read [Avatar Integration Guide](../../../docs/06-advanced-features.md#avatar-integration)
