# Voice with Avatar Sample (Go)

This sample demonstrates synchronizing Azure Speech Voice Live with a visual avatar using viseme data for realistic lip-sync in Go.

## Features

- Real-time viseme extraction
- HTTP server for avatar frontend
- WebSocket integration
- Audio-visual synchronization
- Canvas-based avatar rendering

## Prerequisites

- Go 1.21 or later
- Azure Speech Services resource with Voice Live enabled

## Setup

1. Install dependencies:
```bash
go mod download
```

2. Create `.env` file and run:
```bash
go run main.go
```

3. Open browser to `http://localhost:8000`

## How It Works

The Voice Live API emits viseme events (ID 0-21) synchronized with audio output, which can be used to animate an avatar's lips in real-time.

## Next Steps

- Read [Avatar Integration Guide](../../../docs/06-advanced-features.md#avatar-integration)
