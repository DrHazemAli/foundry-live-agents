# Session Management Sample (Python)

This sample demonstrates comprehensive session lifecycle management, reconnection strategies, and state persistence with Azure Speech Voice Live API in Python.

## Features

- Session creation and configuration
- Connection health monitoring
- Automatic reconnection with exponential backoff
- Session state persistence
- Graceful degradation
- Connection pooling

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

- Read [Production Deployment Guide](../../../docs/08-production-deployment.md)
