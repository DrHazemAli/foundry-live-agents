# Interruption Handling Sample (Python)

This sample demonstrates how to handle user interruptions gracefully in real-time voice conversations with Azure Speech Voice Live API in Python.

## Features

- Detect user speech while assistant is speaking
- Cancel ongoing responses
- Queue management for interruptions
- Smooth conversation flow
- Barge-in support

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

## Next Steps

- Explore [Session Management](../session-management/)
- Read [Interruption Guide](../../../docs/06-advanced-features.md#interruption-handling)
