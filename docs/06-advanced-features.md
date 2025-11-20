# Module 06: Advanced Features & Production

> **Duration:** 120 minutes  
> **Level:** Advanced  
> **Prerequisites:** Modules 01-05, working agent implementation

## Learning Objectives

- Implement avatar integration for visual agents
- Build VoiceRAG (Retrieval Augmented Generation) systems
- Optimize for production deployment
- Implement advanced security measures
- Monitor and analyze performance
- Scale for enterprise workloads

## Avatar Integration

### Overview

Azure Speech Voice Live supports real-time avatar video generation, creating a complete visual + voice experience.

### Avatar Configuration

```typescript
{
  model: "gpt-4o",
  voice: {
    type: "azure-hd",
    name: "en-US-Ava-HD"
  },
  avatar: {
    character: "lisa",                    // Avatar character name
    style: "casual",                      // casual, business, technical
    background: {
      type: "color",                      // color, image, or transparent
      value: "#F0F0F0"
    },
    video_format: "h264",                 // Video codec
    video_resolution: "1920x1080",        // 720p, 1080p, or 4K
    video_bitrate: 2000000,               // 2 Mbps
    video_frame_rate: 30
  },
  output_audio_timestamp_types: ["word", "sentence"]  // For lip sync
}
```

### Available Avatars

| Character | Style | Gender | Best For |
|-----------|-------|--------|----------|
| **lisa** | Professional, casual | Female | Customer support, general |
| **mark** | Business, technical | Male | Technical support, B2B |
| **emma** | Friendly, warm | Female | Healthcare, education |
| **james** | Formal, authoritative | Male | Financial, legal |
| **sophia** | Modern, energetic | Female | Sales, marketing |

### Implementation Example

```typescript
import { VoiceLiveClient } from './voiceLiveClient';
import { AvatarRenderer } from './avatarRenderer';

const client = new VoiceLiveClient({
  resourceName: process.env.AZURE_RESOURCE_NAME,
  apiKey: process.env.AZURE_SPEECH_API_KEY,
  model: 'gpt-4o'
});

const avatarRenderer = new AvatarRenderer({
  container: document.getElementById('avatar-container'),
  width: 1920,
  height: 1080
});

await client.connect();

await client.configureSession({
  voice: {
    type: 'azure-hd',
    name: 'en-US-Ava-HD'
  },
  avatar: {
    character: 'lisa',
    style: 'business',
    video_format: 'h264',
    video_resolution: '1920x1080',
    video_frame_rate: 30
  },
  output_audio_timestamp_types: ['word', 'sentence']
});

// Handle avatar video frames
client.on('response.avatar.delta', (event) => {
  const videoData = Buffer.from(event.delta, 'base64');
  avatarRenderer.renderFrame(videoData);
});

// Synchronize audio with video
client.on('response.audio.delta', (event) => {
  const audioData = Buffer.from(event.delta, 'base64');
  const timestamp = event.timestamp;
  avatarRenderer.syncAudio(audioData, timestamp);
});
```

### Avatar Renderer Implementation

```typescript
export class AvatarRenderer {
  private video: HTMLVideoElement;
  private mediaSource: MediaSource;
  private sourceBuffer: SourceBuffer;
  
  constructor(options: { container: HTMLElement; width: number; height: number }) {
    this.video = document.createElement('video');
    this.video.width = options.width;
    this.video.height = options.height;
    this.video.autoplay = true;
    options.container.appendChild(this.video);
    
    this.mediaSource = new MediaSource();
    this.video.src = URL.createObjectURL(this.mediaSource);
    
    this.mediaSource.addEventListener('sourceopen', () => {
      this.sourceBuffer = this.mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E"');
    });
  }
  
  renderFrame(videoData: Buffer): void {
    if (this.sourceBuffer && !this.sourceBuffer.updating) {
      this.sourceBuffer.appendBuffer(videoData);
    }
  }
  
  syncAudio(audioData: Buffer, timestamp: number): void {
    // Synchronize audio playback with video frames
    const currentTime = this.video.currentTime;
    const targetTime = timestamp / 1000; // Convert ms to seconds
    
    if (Math.abs(currentTime - targetTime) > 0.1) {
      // Adjust if drift > 100ms
      this.video.currentTime = targetTime;
    }
  }
}
```

## VoiceRAG Implementation

### Architecture

```
User Query → Voice Live → RAG Function → Search Index → Context → AI Response
```

### Azure AI Search Integration

```typescript
import { SearchClient, AzureKeyCredential } from '@azure/search-documents';

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT!,
  'knowledge-base-index',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY!)
);

async function searchKnowledgeBase(params: {
  query: string;
  category?: string;
  top_k?: number;
}) {
  const searchResults = await searchClient.search(params.query, {
    filter: params.category ? `category eq '${params.category}'` : undefined,
    top: params.top_k || 3,
    searchFields: ['title', 'content', 'keywords'],
    select: ['title', 'content', 'url', 'category', 'last_updated'],
    scoringProfile: 'relevance',
    queryType: 'semantic',  // Use semantic ranking
    semanticConfiguration: 'default'
  });
  
  const results = [];
  for await (const result of searchResults.results) {
    results.push({
      title: result.document.title,
      content: result.document.content,
      url: result.document.url,
      category: result.document.category,
      relevance_score: result.score
    });
  }
  
  return { results };
}
```

### VoiceRAG Agent Configuration

```typescript
{
  model: "gpt-4o",
  instructions: `You are a knowledgeable assistant with access to a comprehensive knowledge base.

When answering questions:
1. Search the knowledge base for relevant information
2. Use the retrieved context to provide accurate answers
3. Cite sources when appropriate
4. Admit when you don't have information
5. Ask clarifying questions if needed

Search Function Usage:
- Use for: Product specs, policies, procedures, troubleshooting
- Don't use for: Greetings, small talk, personal opinions

When presenting search results:
- Synthesize information naturally
- Mention source if relevant: "According to our support documentation..."
- Offer to provide more details
- Suggest related topics`,

  tools: [
    {
      type: "function",
      name: "search_knowledge_base",
      description: "Search company knowledge base for information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query based on user's question"
          },
          category: {
            type: "string",
            enum: ["products", "policies", "technical", "billing", "general"],
            description: "Knowledge category to search within"
          },
          top_k: {
            type: "number",
            description: "Number of results to return",
            default: 3
          }
        },
        required: ["query"]
      }
    }
  ]
}
```

### Example VoiceRAG Conversation

```
User: "What's your return policy for electronics?"

Agent: "Let me check our return policy for you."

[Calls search_knowledge_base({ query: "return policy electronics", category: "policies", top_k: 3 })]

[Results: 
  - "Electronics Return Policy" (relevance: 0.95)
  - "Extended Return Period for Premium Members" (relevance: 0.78)
  - "Return Shipping Process" (relevance: 0.65)
]

Agent: "Our return policy for electronics allows returns within 30 days of purchase. The item must be in original condition with all accessories and packaging. For electronics over $500, there's a 15% restocking fee unless the item is defective.

Premium members get an extended 60-day return window with no restocking fees.

Would you like to know about the return shipping process?"
```

## Production Optimization

### 1. Connection Pooling

```typescript
class VoiceLiveConnectionPool {
  private connections: Map<string, VoiceLiveClient> = new Map();
  private maxConnections: number = 100;
  
  async getConnection(userId: string): Promise<VoiceLiveClient> {
    if (this.connections.has(userId)) {
      return this.connections.get(userId)!;
    }
    
    if (this.connections.size >= this.maxConnections) {
      // Remove oldest connection
      const oldestKey = this.connections.keys().next().value;
      await this.connections.get(oldestKey)?.disconnect();
      this.connections.delete(oldestKey);
    }
    
    const client = new VoiceLiveClient({...});
    await client.connect();
    this.connections.set(userId, client);
    
    return client;
  }
  
  async releaseConnection(userId: string): Promise<void> {
    const client = this.connections.get(userId);
    if (client) {
      await client.disconnect();
      this.connections.delete(userId);
    }
  }
}
```

### 2. Rate Limiting

```typescript
import { RateLimiter } from 'limiter';

const rateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute'
});

async function handleVoiceRequest(userId: string) {
  const allowed = await rateLimiter.removeTokens(1);
  
  if (!allowed) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Process request
}
```

### 3. Caching Strategy

```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

await redis.connect();

// Cache session configurations
async function getSessionConfig(agentType: string): Promise<object> {
  const cached = await redis.get(`config:${agentType}`);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const config = await loadConfigFromDatabase(agentType);
  await redis.setEx(`config:${agentType}`, 3600, JSON.stringify(config));
  
  return config;
}

// Cache knowledge base results
async function cachedKnowledgeSearch(query: string): Promise<any> {
  const cacheKey = `kb:${hashQuery(query)}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const results = await searchKnowledgeBase({ query });
  await redis.setEx(cacheKey, 1800, JSON.stringify(results)); // 30 min TTL
  
  return results;
}
```

### 4. Load Balancing

```typescript
// Azure Application Gateway or custom load balancer
const servers = [
  'wss://server1.example.com',
  'wss://server2.example.com',
  'wss://server3.example.com'
];

function getOptimalServer(): string {
  // Simple round-robin
  const index = Math.floor(Math.random() * servers.length);
  return servers[index];
  
  // Or implement:
  // - Least connections
  // - Geographic proximity
  // - Health-based routing
}
```

## Security Best Practices

### 1. Authentication & Authorization

```typescript
import { ClientSecretCredential } from '@azure/identity';
import jwt from 'jsonwebtoken';

// Azure Entra ID authentication
const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);

async function getAzureToken(): Promise<string> {
  const tokenResponse = await credential.getToken(
    'https://cognitiveservices.azure.com/.default'
  );
  return tokenResponse.token;
}

// JWT-based user authentication
function verifyUserToken(token: string): { userId: string; roles: string[] } {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: decoded.sub,
      roles: decoded.roles || []
    };
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}

// Authorization middleware
function requireRole(role: string) {
  return (user: { userId: string; roles: string[] }) => {
    if (!user.roles.includes(role)) {
      throw new Error('Insufficient permissions');
    }
  };
}
```

### 2. Input Validation & Sanitization

```typescript
import validator from 'validator';
import xss from 'xss';

function sanitizeUserInput(input: string): string {
  // Remove XSS attempts
  let cleaned = xss(input);
  
  // Limit length
  cleaned = cleaned.substring(0, 5000);
  
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  
  return cleaned.trim();
}

function validateConfiguration(config: any): void {
  if (config.temperature && (config.temperature < 0 || config.temperature > 1)) {
    throw new Error('Temperature must be between 0 and 1');
  }
  
  if (config.max_response_output_tokens && config.max_response_output_tokens < 1) {
    throw new Error('max_response_output_tokens must be positive');
  }
  
  // Validate voice name against allowed list
  const allowedVoices = [...]; // Load from config
  if (!allowedVoices.includes(config.voice?.name)) {
    throw new Error('Invalid voice selection');
  }
}
```

### 3. Secrets Management

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const vaultUrl = `https://${process.env.KEYVAULT_NAME}.vault.azure.net`;
const secretClient = new SecretClient(vaultUrl, credential);

async function getSecret(secretName: string): Promise<string> {
  const secret = await secretClient.getSecret(secretName);
  return secret.value!;
}

// Usage
const apiKey = await getSecret('azure-speech-api-key');
const searchKey = await getSecret('azure-search-api-key');
```

## Monitoring & Analytics

### 1. Application Insights Integration

```typescript
import { TelemetryClient } from 'applicationinsights';

const telemetry = new TelemetryClient(process.env.APPINSIGHTS_CONNECTION_STRING!);

// Track conversation metrics
telemetry.trackEvent({
  name: 'ConversationStarted',
  properties: {
    agentType: 'customer-support',
    userId: user.id,
    language: 'en-US'
  }
});

// Track function calls
telemetry.trackDependency({
  name: 'KnowledgeBaseSearch',
  dependencyTypeName: 'Azure AI Search',
  data: query,
  duration: duration,
  resultCode: 200,
  success: true
});

// Track errors
telemetry.trackException({
  exception: error,
  properties: {
    userId: user.id,
    sessionId: session.id
  }
});

// Custom metrics
telemetry.trackMetric({
  name: 'ResponseLatency',
  value: latencyMs
});
```

### 2. Custom Metrics Dashboard

```typescript
interface ConversationMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  messagesCount: number;
  functionsCallCount: number;
  averageResponseTime: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  resolved: boolean;
  escalated: boolean;
}

class MetricsCollector {
  async recordConversation(metrics: ConversationMetrics): Promise<void> {
    await database.metrics.insert({
      ...metrics,
      timestamp: new Date()
    });
    
    // Real-time analytics
    await analyticsStream.publish('conversation-complete', metrics);
  }
  
  async getAggregatedMetrics(timeRange: { start: Date; end: Date }): Promise<any> {
    return await database.metrics.aggregate([
      {
        $match: {
          startTime: { $gte: timeRange.start, $lte: timeRange.end }
        }
      },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          avgResponseTime: { $avg: '$averageResponseTime' },
          resolutionRate: {
            $avg: { $cond: ['$resolved', 1, 0] }
          },
          escalationRate: {
            $avg: { $cond: ['$escalated', 1, 0] }
          }
        }
      }
    ]);
  }
}
```

## Performance Benchmarks

### Target Metrics

| Metric | Target | Excellent | Poor |
|--------|--------|-----------|------|
| **Connection Time** | < 500ms | < 300ms | > 1000ms |
| **First Response (VAD detect)** | < 800ms | < 500ms | > 1500ms |
| **Audio Playback Start** | < 200ms | < 100ms | > 500ms |
| **Function Call Execution** | < 500ms | < 300ms | > 1000ms |
| **End-to-End Latency** | < 1.5s | < 1s | > 2.5s |
| **WebSocket Throughput** | > 384 kbps | > 576 kbps | < 256 kbps |

### Optimization Techniques

1. **Regional Deployment** - Deploy near users
2. **CDN for Static Assets** - Faster resource loading
3. **Audio Compression** - Reduce bandwidth
4. **Preloading** - Load configs before connection
5. **Batch Operations** - Group function calls
6. **Streaming Responses** - Don't wait for completion
7. **Client-side Buffering** - Smooth playback

## Disaster Recovery

```typescript
class ResilientVoiceLiveClient {
  private client: VoiceLiveClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.reconnectAttempts = 0; // Reset on success
    } catch (error) {
      await this.handleConnectionError(error);
    }
  }
  
  private async handleConnectionError(error: Error): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('Max reconnection attempts exceeded');
    }
    
    this.reconnectAttempts++;
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await this.connect();
  }
  
  // Graceful degradation
  async sendAudioWithFallback(audioData: Buffer): Promise<void> {
    try {
      await this.client.sendAudio(audioData);
    } catch (error) {
      // Fall back to batch send
      await this.bufferAndSendInBatch(audioData);
    }
  }
}
```

## Cost Optimization

### 1. Token Usage Optimization

```typescript
{
  max_response_output_tokens: 200,  // Limit response length
  temperature: 0.6,                 // Lower = more deterministic = less retries
  tools: [...],                     // Only include needed functions
}

// Compress instructions
const compressedInstructions = `
You are a support agent. Be concise.
Key rules:
- Greet warmly
- Ask clarifying questions
- Use functions for data
- Escalate if unresolved after 3 attempts
`;
```

### 2. Audio Format Selection

```typescript
// High quality (expensive)
{ input_audio_format: "pcm16", input_audio_sampling_rate: 24000 }  // ~384 kbps

// Balanced (recommended)
{ input_audio_format: "pcm16", input_audio_sampling_rate: 16000 }  // ~256 kbps

// Economy (telephony)
{ input_audio_format: "g711_ulaw", input_audio_sampling_rate: 8000 }  // ~64 kbps
```

### 3. Caching & Reuse

- Cache session configurations
- Reuse WebSocket connections when possible
- Cache knowledge base results
- Preload common responses

## Next Steps

You've now mastered:
- ✅ Avatar integration for visual experiences
- ✅ VoiceRAG implementation with Azure AI Search
- ✅ Production optimization (pooling, caching, load balancing)
- ✅ Security best practices (auth, validation, secrets)
- ✅ Monitoring and analytics
- ✅ Performance optimization
- ✅ Disaster recovery
- ✅ Cost optimization

**Explore Complete Samples:**
- [TypeScript Advanced Sample](../../samples/typescript/voice-with-avatar/)
- [Python VoiceRAG Sample](../../samples/python/voicerag-pattern/)
- [Enterprise Deployment Guide](../../docs/production-deployment.md)

---

**[← Previous: Agent Scenarios](05-agent-scenarios.md) | [Back to Learning Path](../README.md#-learning-path)**
