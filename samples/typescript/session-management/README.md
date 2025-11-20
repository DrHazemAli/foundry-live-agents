# Session Management Sample

This sample demonstrates comprehensive session lifecycle management, reconnection strategies, and state persistence with Azure Speech Voice Live API.

## Features

- Session creation and configuration
- Connection health monitoring
- Automatic reconnection with exponential backoff
- Session state persistence
- Graceful degradation
- Connection pooling

## Prerequisites

- Node.js 18 or later
- Azure Speech Services resource with Voice Live enabled
- TypeScript 5.0 or later

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
AZURE_SPEECH_KEY=your-api-key
AZURE_SPEECH_REGION=eastus
DEPLOYMENT_NAME=gpt-4o-realtime-preview
```

3. Run the sample:
```bash
npm start
```

## How It Works

### 1. Session Lifecycle

Track session through all states:

```typescript
enum SessionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}
```

### 2. Health Monitoring

Send periodic keepalive messages:

```typescript
setInterval(() => {
  if (isConnected()) {
    ws.send(JSON.stringify({
      type: 'ping',
      timestamp: Date.now()
    }));
  }
}, 30000); // Every 30 seconds
```

### 3. Automatic Reconnection

Implement exponential backoff:

```typescript
async function reconnect(attempt: number = 0) {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  
  console.log(`Reconnecting in ${delay}ms (attempt ${attempt + 1})...`);
  await sleep(delay);
  
  try {
    await connect();
  } catch (error) {
    if (attempt < maxRetries) {
      await reconnect(attempt + 1);
    }
  }
}
```

### 4. State Persistence

Save conversation state:

```typescript
interface SessionState {
  sessionId: string;
  conversationHistory: Message[];
  config: SessionConfig;
  lastActivity: number;
}

function saveState(state: SessionState) {
  fs.writeFileSync('session-state.json', JSON.stringify(state));
}

function loadState(): SessionState | null {
  try {
    const data = fs.readFileSync('session-state.json', 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}
```

## Reconnection Strategies

### Simple Retry
```typescript
// Fixed delay between attempts
await sleep(5000);
connect();
```

### Exponential Backoff
```typescript
// Increasing delays: 1s, 2s, 4s, 8s, ...
const delay = 1000 * Math.pow(2, attempt);
await sleep(delay);
```

### Jittered Backoff
```typescript
// Add randomness to prevent thundering herd
const jitter = Math.random() * 1000;
const delay = baseDelay * Math.pow(2, attempt) + jitter;
```

## Best Practices

1. **Connection Pooling**: Reuse connections when possible
2. **Keepalive**: Ping every 30 seconds
3. **Graceful Shutdown**: Clean up resources
4. **Error Recovery**: Handle transient failures
5. **State Management**: Preserve important context
6. **Timeout Handling**: Set reasonable timeouts

## Configuration

### Production Settings
```typescript
{
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  keepaliveInterval: 30000,
  connectionTimeout: 10000,
  healthCheckInterval: 60000
}
```

### Development Settings
```typescript
{
  maxReconnectAttempts: 3,
  reconnectDelay: 2000,
  keepaliveInterval: 10000,
  connectionTimeout: 5000,
  healthCheckInterval: 30000
}
```

## Common Issues

### Connection Drops

- Implement automatic reconnection
- Use keepalive messages
- Handle network changes

### Session Expiry

- Refresh sessions before expiry
- Implement session renewal
- Cache authentication tokens

### State Loss

- Persist important state
- Use transaction logs
- Implement checkpointing

## Monitoring Metrics

- Connection uptime
- Reconnection count
- Average latency
- Error rate
- Message throughput

## Next Steps

- Explore [Function Calling](../function-calling/)
- Learn about [Multi-Language](../multi-language/)
- Read [Production Deployment Guide](../../docs/08-production-deployment.md)
