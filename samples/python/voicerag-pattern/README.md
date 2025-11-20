# VoiceRAG Pattern Sample (Python)

This sample demonstrates the Voice Retrieval-Augmented Generation (VoiceRAG) pattern in Python - combining real-time voice conversation with document retrieval and knowledge bases.

## Features

- Document retrieval during conversation
- Knowledge base integration
- Context-aware responses
- Citation and source tracking
- Streaming with retrieval

## Prerequisites

- Python 3.8 or later
- Azure Speech Services resource with Voice Live enabled
- Azure AI Search (optional, for production)
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

Create a search function that retrieves relevant documents from your knowledge base and returns context to the AI agent for generating informed responses.

## Next Steps

- Explore [Streaming Responses](../streaming-responses/)
- Learn about [Interruption Handling](../interruption-handling/)
- Read [RAG Best Practices](../../../docs/06-advanced-features.md#voicerag-pattern)
