# Session Management Sample (Go)

This sample demonstrates comprehensive session lifecycle management, reconnection strategies, and connection health monitoring with Azure Speech Voice Live API in Go.

## Features

- Session lifecycle management
- Exponential backoff reconnection
- Connection health monitoring
- Keepalive ping/pong
- Metrics tracking
- Graceful degradation

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

## Next Steps

- Read [Production Deployment Guide](../../../docs/08-production-deployment.md)
