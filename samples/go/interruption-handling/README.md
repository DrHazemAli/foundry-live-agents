# Interruption Handling Sample (Go)

This sample demonstrates graceful interruption handling in real-time voice conversations with Azure Speech Voice Live API in Go.

## Features

- User interruption detection
- Response cancellation
- Barge-in support
- Conversation flow management
- Statistics tracking

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

- Explore [Session Management](../session-management/)
- Read [Interruption Guide](../../../docs/06-advanced-features.md#interruption-handling)
