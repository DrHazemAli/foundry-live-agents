# Module 08: Production Deployment & Scaling

> **Duration:** 90 minutes  
> **Level:** Advanced  
> **Prerequisites:** Modules 01-07, cloud deployment experience

## Learning Objectives

By the end of this module, you will:

- Deploy Voice Live agents to production environments
- Implement high availability and disaster recovery
- Scale to handle thousands of concurrent connections
- Monitor performance and troubleshoot issues
- Secure production deployments
- Optimize costs at scale

## Deployment Architecture

### Basic Architecture

```
Internet
   ↓
Azure Front Door (CDN + WAF)
   ↓
Azure Application Gateway (Load Balancer)
   ↓
┌──────────────────────────────────────────┐
│  Azure Kubernetes Service (AKS)          │
│  ┌────────────┐  ┌────────────┐         │
│  │  Web App   │  │  Web App   │  ...    │
│  │  Pod 1     │  │  Pod 2     │         │
│  └────────────┘  └────────────┘         │
└──────────────────────────────────────────┘
   ↓
Azure Speech Voice Live API
Azure AI Search (Knowledge Base)
Azure Cosmos DB (Session State)
Azure Redis (Cache)
Azure Application Insights (Monitoring)
Azure Key Vault (Secrets)
```

### Reference Architecture

```typescript
// infrastructure/main.tf (Terraform)

// Resource Group
resource "azurerm_resource_group" "voice_live" {
  name     = "voice-live-production"
  location = "East US"
}

// Azure Speech Services
resource "azurerm_cognitive_account" "speech" {
  name                = "voice-live-speech"
  resource_group_name = azurerm_resource_group.voice_live.name
  location            = azurerm_resource_group.voice_live.location
  kind                = "SpeechServices"
  sku_name            = "S0"
}

// AKS Cluster
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "voice-live-aks"
  location            = azurerm_resource_group.voice_live.location
  resource_group_name = azurerm_resource_group.voice_live.name
  dns_prefix          = "voice-live"
  
  default_node_pool {
    name       = "default"
    node_count = 3
    vm_size    = "Standard_D4s_v3"
    
    auto_scaling_enabled = true
    min_count           = 3
    max_count           = 10
  }
  
  identity {
    type = "SystemAssigned"
  }
}

// Azure Cosmos DB
resource "azurerm_cosmosdb_account" "db" {
  name                = "voice-live-cosmos"
  resource_group_name = azurerm_resource_group.voice_live.name
  location            = azurerm_resource_group.voice_live.location
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"
  
  consistency_policy {
    consistency_level = "Session"
  }
  
  geo_location {
    location          = "East US"
    failover_priority = 0
  }
}

// Azure Redis Cache
resource "azurerm_redis_cache" "redis" {
  name                = "voice-live-redis"
  location            = azurerm_resource_group.voice_live.location
  resource_group_name = azurerm_resource_group.voice_live.name
  capacity            = 2
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
}

// Application Insights
resource "azurerm_application_insights" "insights" {
  name                = "voice-live-insights"
  location            = azurerm_resource_group.voice_live.location
  resource_group_name = azurerm_resource_group.voice_live.name
  application_type    = "web"
}
```

## Container Configuration

### Dockerfile

```dockerfile
# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node dist/healthcheck.js

CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voice-live-agent
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: voice-live-agent
  template:
    metadata:
      labels:
        app: voice-live-agent
    spec:
      containers:
      - name: voice-live-agent
        image: voiceregistry.azurecr.io/voice-live-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: AZURE_RESOURCE_NAME
          valueFrom:
            secretKeyRef:
              name: azure-secrets
              key: resource-name
        - name: AZURE_SPEECH_API_KEY
          valueFrom:
            secretKeyRef:
              name: azure-secrets
              key: speech-api-key
        - name: REDIS_CONNECTION_STRING
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: connection-string
        - name: COSMOS_ENDPOINT
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: cosmos-endpoint
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: voice-live-service
  namespace: production
spec:
  type: LoadBalancer
  selector:
    app: voice-live-agent
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: voice-live-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: voice-live-agent
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## High Availability Configuration

### Connection Pooling with Failover

```typescript
import { VoiceLiveClient } from './voiceLiveClient';

class VoiceLiveConnectionPool {
  private pools: Map<string, VoiceLiveClient[]> = new Map();
  private readonly maxConnectionsPerPool = 100;
  private readonly regions = ['eastus', 'westus2', 'westeurope'];
  
  async getConnection(userId: string): Promise<VoiceLiveClient> {
    // Try primary region first
    for (const region of this.regions) {
      try {
        return await this.getConnectionFromRegion(region, userId);
      } catch (error) {
        console.error(`Failed to get connection from ${region}:`, error);
        // Try next region
      }
    }
    throw new Error('All regions unavailable');
  }
  
  private async getConnectionFromRegion(
    region: string,
    userId: string
  ): Promise<VoiceLiveClient> {
    const pool = this.pools.get(region) || [];
    
    // Find available connection
    for (const client of pool) {
      if (!client.isActive()) {
        await client.reconnect();
        return client;
      }
    }
    
    // Create new connection if under limit
    if (pool.length < this.maxConnectionsPerPool) {
      const client = new VoiceLiveClient({
        resourceName: `voice-live-${region}`,
        region,
        apiKey: await this.getApiKeyForRegion(region)
      });
      
      await client.connect();
      pool.push(client);
      this.pools.set(region, pool);
      
      return client;
    }
    
    throw new Error(`Connection pool exhausted for ${region}`);
  }
  
  private async getApiKeyForRegion(region: string): Promise<string> {
    // Retrieve from Key Vault
    const secretClient = getKeyVaultClient();
    const secret = await secretClient.getSecret(`speech-key-${region}`);
    return secret.value!;
  }
}
```

### Circuit Breaker Pattern

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failures detected, reject requests
  HALF_OPEN = 'HALF_OPEN'  // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private readonly failureThreshold = 5;
  private readonly timeout = 60000; // 1 minute
  private readonly halfOpenMaxCalls = 3;
  private halfOpenCalls = 0;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCalls = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        this.state = CircuitState.CLOSED;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.timeout;
  }
}

// Usage
const circuitBreaker = new CircuitBreaker();

async function callVoiceLive() {
  return await circuitBreaker.execute(async () => {
    return await client.sendAudio(audioData);
  });
}
```

## Session State Management

### Distributed Session Storage

```typescript
import { CosmosClient } from '@azure/cosmos';
import { createClient } from 'redis';

class SessionManager {
  private cosmosClient: CosmosClient;
  private redisClient: any;
  private container: any;
  
  constructor() {
    // Cosmos DB for persistent storage
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT!,
      key: process.env.COSMOS_KEY!
    });
    
    this.container = this.cosmosClient
      .database('voice-live')
      .container('sessions');
    
    // Redis for caching
    this.redisClient = createClient({
      url: process.env.REDIS_CONNECTION_STRING!
    });
    
    this.redisClient.connect();
  }
  
  async saveSession(sessionId: string, data: any): Promise<void> {
    const session = {
      id: sessionId,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to Cosmos DB (persistent)
    await this.container.items.upsert(session);
    
    // Cache in Redis (fast access)
    await this.redisClient.setEx(
      `session:${sessionId}`,
      3600, // 1 hour TTL
      JSON.stringify(session)
    );
  }
  
  async getSession(sessionId: string): Promise<any> {
    // Try Redis first (fast)
    const cached = await this.redisClient.get(`session:${sessionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fall back to Cosmos DB
    const { resource } = await this.container.item(sessionId, sessionId).read();
    
    if (resource) {
      // Repopulate cache
      await this.redisClient.setEx(
        `session:${sessionId}`,
        3600,
        JSON.stringify(resource)
      );
    }
    
    return resource;
  }
  
  async deleteSession(sessionId: string): Promise<void> {
    await Promise.all([
      this.container.item(sessionId, sessionId).delete(),
      this.redisClient.del(`session:${sessionId}`)
    ]);
  }
}
```

## Monitoring & Observability

### Application Insights Integration

```typescript
import * as appInsights from 'applicationinsights';

// Initialize Application Insights
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .start();

const telemetryClient = appInsights.defaultClient;

// Custom metrics
class MetricsCollector {
  trackConversationStarted(data: {
    userId: string;
    language: string;
    agentType: string;
  }): void {
    telemetryClient.trackEvent({
      name: 'ConversationStarted',
      properties: data
    });
  }
  
  trackConversationEnded(data: {
    userId: string;
    duration: number;
    messageCount: number;
    resolved: boolean;
    satisfaction?: number;
  }): void {
    telemetryClient.trackEvent({
      name: 'ConversationEnded',
      properties: {
        userId: data.userId,
        resolved: data.resolved.toString(),
        satisfaction: data.satisfaction?.toString()
      },
      measurements: {
        duration: data.duration,
        messageCount: data.messageCount
      }
    });
    
    // Track duration metric
    telemetryClient.trackMetric({
      name: 'ConversationDuration',
      value: data.duration
    });
  }
  
  trackFunctionCall(data: {
    functionName: string;
    duration: number;
    success: boolean;
  }): void {
    telemetryClient.trackDependency({
      name: data.functionName,
      dependencyTypeName: 'Function',
      data: data.functionName,
      duration: data.duration,
      resultCode: data.success ? 200 : 500,
      success: data.success
    });
  }
  
  trackError(error: Error, context?: any): void {
    telemetryClient.trackException({
      exception: error,
      properties: context
    });
  }
}

export const metrics = new MetricsCollector();
```

### Custom Dashboard Queries (KQL)

```kusto
// Average conversation duration by agent type
customEvents
| where name == "ConversationEnded"
| extend agentType = tostring(customDimensions.agentType)
| summarize avg(todouble(customMeasurements.duration)) by agentType
| render columnchart

// Conversation resolution rate
customEvents
| where name == "ConversationEnded"
| extend resolved = tobool(customDimensions.resolved)
| summarize resolutionRate = todouble(countif(resolved)) / count() * 100
| render timechart

// Function call success rate
dependencies
| where type == "Function"
| summarize successRate = todouble(countif(success)) / count() * 100 by name
| render barchart

// Peak usage hours
customEvents
| where name == "ConversationStarted"
| summarize count() by bin(timestamp, 1h)
| render timechart
```

## Security Best Practices

### 1. API Key Rotation

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

class ApiKeyManager {
  private secretClient: SecretClient;
  private currentKey?: string;
  private keyVersion?: string;
  
  constructor() {
    const credential = new DefaultAzureCredential();
    const vaultUrl = `https://${process.env.KEYVAULT_NAME}.vault.azure.net`;
    this.secretClient = new SecretClient(vaultUrl, credential);
  }
  
  async getApiKey(): Promise<string> {
    if (this.currentKey) {
      return this.currentKey;
    }
    
    const secret = await this.secretClient.getSecret('azure-speech-api-key');
    this.currentKey = secret.value!;
    this.keyVersion = secret.properties.version;
    
    return this.currentKey;
  }
  
  async rotateKey(): Promise<void> {
    // Generate new key via Azure Speech API
    const newKey = await this.generateNewKey();
    
    // Store in Key Vault
    await this.secretClient.setSecret('azure-speech-api-key', newKey);
    
    // Wait for propagation
    await this.sleep(5000);
    
    // Update current key
    this.currentKey = newKey;
    
    console.log('API key rotated successfully');
  }
  
  private async generateNewKey(): Promise<string> {
    // Implementation depends on Azure Speech API
    // This is a placeholder
    throw new Error('Not implemented');
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Request Validation & Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Speed limiting (slow down, don't block)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500
});

// Apply to routes
app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Request validation
import { body, validationResult } from 'express-validator';

app.post('/api/connect',
  body('userId').isString().notEmpty(),
  body('language').isLocale().optional(),
  body('agentType').isIn(['customer-support', 'sales', 'technical']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Process request
  }
);
```

### 3. WebSocket Security

```typescript
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

const wss = new WebSocketServer({ 
  port: 8080,
  verifyClient: (info, callback) => {
    // Verify JWT token
    const token = info.req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      callback(false, 401, 'Unauthorized');
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      (info.req as any).user = decoded;
      callback(true);
    } catch (error) {
      callback(false, 401, 'Invalid token');
    }
  }
});

wss.on('connection', (ws, req) => {
  const user = (req as any).user;
  
  // Connection established
  console.log(`User ${user.sub} connected`);
  
  // Set connection timeout
  const timeout = setTimeout(() => {
    ws.close(1000, 'Connection timeout');
  }, 30 * 60 * 1000); // 30 minutes
  
  ws.on('close', () => {
    clearTimeout(timeout);
  });
});
```

## Cost Optimization

### 1. Request Batching

```typescript
class AudioBuffer {
  private buffer: Buffer[] = [];
  private readonly maxBufferSize = 10; // Batch 10 chunks
  private readonly maxWaitTime = 100; // Max 100ms wait
  private timer?: NodeJS.Timeout;
  
  add(chunk: Buffer): void {
    this.buffer.push(chunk);
    
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.maxWaitTime);
    }
  }
  
  private flush(): void {
    if (this.buffer.length === 0) return;
    
    const combined = Buffer.concat(this.buffer);
    this.sendToVoiceLive(combined);
    
    this.buffer = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
  
  private sendToVoiceLive(data: Buffer): void {
    // Send batched data
    client.sendAudio(data);
  }
}
```

### 2. Intelligent Caching

```typescript
// Cache frequent queries
const cache = new Map<string, { data: any; expires: number }>();

async function cachedSearch(query: string): Promise<any> {
  const cacheKey = `search:${query}`;
  const cached = cache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const result = await performSearch(query);
  
  cache.set(cacheKey, {
    data: result,
    expires: Date.now() + (15 * 60 * 1000) // 15 minutes
  });
  
  return result;
}
```

### 3. Resource Right-Sizing

```yaml
# Development
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

# Production
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Deployment Checklist

- [ ] **Infrastructure**
  - [ ] Multi-region deployment configured
  - [ ] Load balancer configured
  - [ ] Auto-scaling policies set
  - [ ] Disaster recovery plan tested

- [ ] **Security**
  - [ ] Secrets in Key Vault
  - [ ] API keys rotated
  - [ ] HTTPS/WSS enforced
  - [ ] Rate limiting enabled
  - [ ] Input validation implemented

- [ ] **Monitoring**
  - [ ] Application Insights configured
  - [ ] Custom metrics tracked
  - [ ] Alerts configured
  - [ ] Dashboard created

- [ ] **Performance**
  - [ ] Connection pooling implemented
  - [ ] Caching configured
  - [ ] CDN enabled for static assets
  - [ ] Database indexed

- [ ] **Reliability**
  - [ ] Circuit breaker implemented
  - [ ] Retry logic with backoff
  - [ ] Health checks configured
  - [ ] Graceful shutdown implemented

- [ ] **Testing**
  - [ ] Load testing completed
  - [ ] Chaos engineering tested
  - [ ] Multi-language tested
  - [ ] Edge cases verified

## Next Steps

You now understand:
- ✅ Production deployment architecture
- ✅ High availability patterns
- ✅ Monitoring and observability
- ✅ Security best practices
- ✅ Cost optimization
- ✅ Deployment checklist

**Congratulations!** You've completed the Voice Live Learning Path.

**Next:**
- Build your production agent
- Explore [sample applications](../../samples/)
- Join the community

---

**[← Previous: Multi-Language Support](07-multi-language.md) | [Back to Learning Path](../README.md#-learning-path)**
