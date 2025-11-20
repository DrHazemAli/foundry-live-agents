# Module 02: Getting Started

> **Duration:** 45 minutes  
> **Level:** Beginner  
> **Prerequisites:** Azure account, basic command line knowledge

## Learning Objectives

By the end of this module, you will:

- Create and configure Azure resources for Voice Live
- Set up authentication (API Key and Azure Entra ID)
- Understand regional availability and model support
- Make your first Voice Live WebSocket connection
- Test basic audio streaming

## Step 1: Azure Resource Setup

### Option A: Microsoft Foundry Resource (Recommended)

Microsoft Foundry resources support **all Voice Live features** including Agent Service integration.

#### Create via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Azure AI Foundry"** or **"Microsoft Foundry"**
4. Click **Create**
5. Configure:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Region**: Choose supported region (see below)
   - **Name**: Unique name (e.g., `my-voice-live-foundry`)
   - **Pricing Tier**: Select based on usage
6. Click **Review + Create** → **Create**

#### Create via Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name rg-voice-live \
  --location eastus

# Create Foundry resource
az cognitiveservices account create \
  --name my-voice-live-foundry \
  --resource-group rg-voice-live \
  --kind AIServices \
  --sku S0 \
  --location eastus \
  --yes
```

### Option B: Speech Services Resource

Standard Speech Services resources support Voice Live but **not** Agent Service integration.

#### Create via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Speech"**
4. Select **"Speech"** service
5. Click **Create**
6. Configure:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Region**: Choose supported region
   - **Name**: Unique name (e.g., `my-voice-live-speech`)
   - **Pricing Tier**: F0 (Free) or S0 (Standard)
7. Click **Review + Create** → **Create**

#### Create via Azure CLI

```bash
# Create Speech resource
az cognitiveservices account create \
  --name my-voice-live-speech \
  --resource-group rg-voice-live \
  --kind SpeechServices \
  --sku S0 \
  --location eastus \
  --yes
```

### Supported Regions

Voice Live is available in these regions:

| Region | Endpoint | HD Voices | Avatar Support |
|--------|----------|-----------|----------------|
| **East US** | eastus.api.cognitive.microsoft.com | ✅ | ✅ |
| **East US 2** | eastus2.api.cognitive.microsoft.com | ✅ | ✅ |
| **West US 2** | westus2.api.cognitive.microsoft.com | ✅ | Limited |
| **West Europe** | westeurope.api.cognitive.microsoft.com | ✅ | ✅ |
| **Southeast Asia** | southeastasia.api.cognitive.microsoft.com | ✅ | Limited |
| **Central India** | centralindia.api.cognitive.microsoft.com | ✅ | ❌ |
| **Sweden Central** | swedencentral.api.cognitive.microsoft.com | ✅ | ❌ |

**Recommendation:** Use **East US** or **West Europe** for full feature support.

### Get Resource Details

```bash
# Get resource details
az cognitiveservices account show \
  --name my-voice-live-foundry \
  --resource-group rg-voice-live

# Get endpoint
az cognitiveservices account show \
  --name my-voice-live-foundry \
  --resource-group rg-voice-live \
  --query properties.endpoint \
  --output tsv
```

## Step 2: Authentication Setup

### Option A: API Key (Quick Start)

Best for: Learning, development, testing

#### Get API Key from Portal

1. Navigate to your resource in Azure Portal
2. Go to **"Keys and Endpoint"** section
3. Copy **KEY 1** or **KEY 2**
4. Note your **Endpoint**

#### Get API Key via CLI

```bash
# Get API keys
az cognitiveservices account keys list \
  --name my-voice-live-foundry \
  --resource-group rg-voice-live

# Output:
# {
#   "key1": "your-api-key-here",
#   "key2": "your-backup-key-here"
# }
```

#### Store in Environment

```bash
# Create .env file
cat > .env << EOF
AZURE_RESOURCE_NAME=my-voice-live-foundry
AZURE_REGION=eastus
AZURE_SPEECH_API_KEY=your-api-key-here
EOF
```

### Option B: Azure Entra ID (Production Recommended)

Best for: Production, security, compliance

#### Prerequisites

- Azure Entra ID tenant
- User or service principal with `Cognitive Services User` role

#### Create Service Principal

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "voice-live-agent-sp" \
  --role "Cognitive Services User" \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-voice-live/providers/Microsoft.CognitiveServices/accounts/my-voice-live-foundry

# Output:
# {
#   "appId": "00000000-0000-0000-0000-000000000000",
#   "displayName": "voice-live-agent-sp",
#   "password": "your-client-secret",
#   "tenant": "00000000-0000-0000-0000-000000000000"
# }
```

#### Store Credentials

```bash
# Create .env file
cat > .env << EOF
AZURE_RESOURCE_NAME=my-voice-live-foundry
AZURE_REGION=eastus
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-id
AZURE_CLIENT_SECRET=your-client-secret
EOF
```

#### Test Authentication

**TypeScript:**
```typescript
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const token = await credential.getToken('https://cognitiveservices.azure.com/.default');
console.log('Token acquired:', token.token.substring(0, 20) + '...');
```

**Python:**
```python
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
token = credential.get_token('https://cognitiveservices.azure.com/.default')
print(f'Token acquired: {token.token[:20]}...')
```

## Step 3: Verify Setup

### Test Connectivity

Create a test script to verify your setup:

**TypeScript (Node.js):**

```typescript
// test-connection.ts
import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

const resourceName = process.env.AZURE_RESOURCE_NAME;
const apiKey = process.env.AZURE_SPEECH_API_KEY;
const model = 'gpt-realtime';

const wsUrl = `wss://${resourceName}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model=${model}`;

const ws = new WebSocket(wsUrl, {
  headers: {
    'api-key': apiKey
  }
});

ws.on('open', () => {
  console.log('✅ Connected to Voice Live API');
  
  // Send session update
  ws.send(JSON.stringify({
    type: 'session.update',
    session: {
      modalities: ['text', 'audio'],
      instructions: 'You are a helpful assistant.',
      voice: { type: 'openai', name: 'alloy' }
    }
  }));
});

ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  console.log('📥 Received:', event.type);
  
  if (event.type === 'session.created') {
    console.log('✅ Session created successfully');
    console.log('Session ID:', event.session.id);
    console.log('Model:', event.session.model);
    ws.close();
  }
});

ws.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

ws.on('close', () => {
  console.log('Connection closed');
});
```

**Run:**
```bash
npm install ws dotenv @types/ws @types/node
npx ts-node test-connection.ts
```

**Python:**

```python
# test_connection.py
import asyncio
import json
import os
from dotenv import load_dotenv
import websockets

load_dotenv()

resource_name = os.getenv('AZURE_RESOURCE_NAME')
api_key = os.getenv('AZURE_SPEECH_API_KEY')
model = 'gpt-realtime'

ws_url = f'wss://{resource_name}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model={model}'

async def test_connection():
    headers = {'api-key': api_key}
    
    async with websockets.connect(ws_url, extra_headers=headers) as ws:
        print('✅ Connected to Voice Live API')
        
        # Send session update
        await ws.send(json.dumps({
            'type': 'session.update',
            'session': {
                'modalities': ['text', 'audio'],
                'instructions': 'You are a helpful assistant.',
                'voice': {'type': 'openai', 'name': 'alloy'}
            }
        }))
        
        # Receive response
        response = await ws.recv()
        event = json.loads(response)
        print(f'📥 Received: {event["type"]}')
        
        if event['type'] == 'session.created':
            print('✅ Session created successfully')
            print(f'Session ID: {event["session"]["id"]}')
            print(f'Model: {event["session"]["model"]}')

asyncio.run(test_connection())
```

**Run:**
```bash
pip install websockets python-dotenv
python test_connection.py
```

### Expected Output

```
✅ Connected to Voice Live API
📥 Received: session.created
✅ Session created successfully
Session ID: sess_abc123...
Model: gpt-realtime
Connection closed
```

## Step 4: Understand the WebSocket URL

### URL Structure

```
wss://<resource-name>.<domain>/voice-live/realtime?api-version=<version>&model=<model>
```

**Components:**

| Component | Description | Example |
|-----------|-------------|---------|
| **Protocol** | WebSocket Secure | `wss://` |
| **Resource Name** | Your Azure resource | `my-voice-live-foundry` |
| **Domain** | Service endpoint | `cognitiveservices.azure.com` or `services.ai.azure.com` |
| **Path** | Voice Live endpoint | `/voice-live/realtime` |
| **API Version** | Version parameter | `2025-10-01` |
| **Model** | AI model to use | `gpt-realtime`, `gpt-4o`, etc. |

### Domain Variations

**Newer Resources:**
```
wss://<resource-name>.services.ai.azure.com/voice-live/realtime
```

**Older Resources:**
```
wss://<resource-name>.cognitiveservices.azure.com/voice-live/realtime
```

**Check your endpoint in the Azure Portal to confirm which domain to use.**

### Query Parameters

**Required:**
- `api-version` - API version (use `2025-10-01`)
- `model` - AI model name

**Optional (for Agent Service):**
- `agent_id` - Foundry agent ID
- `project_id` - Foundry project ID

**Example with Agent:**
```
wss://resource.services.ai.azure.com/voice-live/realtime?api-version=2025-10-01&agent_id=agent_123&project_id=proj_456
```

## Step 5: Understanding Models

### Available Models

| Model | Tier | Features | Best For |
|-------|------|----------|----------|
| **gpt-realtime** | Pro | Native audio I/O, OpenAI voices | Real-time conversations |
| **gpt-4o** | Pro | Azure Speech I/O, all voices | Production agents |
| **gpt-4.1** | Pro | Latest GPT-4, Azure voices | Advanced reasoning |
| **gpt-5** | Pro | Next-gen model, Azure voices | Cutting-edge features |
| **gpt-realtime-mini** | Basic | Faster, cheaper | Cost-sensitive apps |
| **gpt-4o-mini** | Basic | Balanced performance | Standard use cases |
| **phi4-mm-realtime** | Lite | Small model, efficient | Edge/mobile |

### Model Selection Guide

**Choose `gpt-realtime` if:**
- You want OpenAI voices (alloy, echo, etc.)
- You need semantic VAD
- Real-time audio processing is priority

**Choose `gpt-4o` or `gpt-5` if:**
- You need 600+ Azure voices
- Custom voice support required
- Azure Semantic VAD needed
- Avatar integration planned

**Choose mini/lite models if:**
- Budget is constrained
- Simple conversations sufficient
- Edge deployment needed

## Step 6: Test Audio Streaming

Create a simple audio test:

**TypeScript:**

```typescript
// test-audio.ts
import WebSocket from 'ws';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const resourceName = process.env.AZURE_RESOURCE_NAME;
const apiKey = process.env.AZURE_SPEECH_API_KEY;

const ws = new WebSocket(
  `wss://${resourceName}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model=gpt-realtime`,
  { headers: { 'api-key': apiKey } }
);

ws.on('open', () => {
  console.log('Connected');
  
  // Configure session
  ws.send(JSON.stringify({
    type: 'session.update',
    session: {
      modalities: ['text', 'audio'],
      instructions: 'You are a helpful assistant. Be concise.',
      voice: { type: 'openai', name: 'alloy' },
      turn_detection: { type: 'server_vad' }
    }
  }));
  
  // Send text message instead of audio for testing
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: 'Say hello!' }]
      }
    }));
    
    ws.send(JSON.stringify({ type: 'response.create' }));
  }, 1000);
});

const audioChunks: Buffer[] = [];

ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  if (event.type === 'response.audio.delta') {
    // Audio chunk received
    const audioData = Buffer.from(event.delta, 'base64');
    audioChunks.push(audioData);
    console.log('📢 Received audio chunk:', audioData.length, 'bytes');
  }
  
  if (event.type === 'response.done') {
    console.log('✅ Response complete');
    
    // Save audio file
    const audioBuffer = Buffer.concat(audioChunks);
    fs.writeFileSync('output.pcm', audioBuffer);
    console.log('💾 Saved audio to output.pcm');
    
    ws.close();
  }
});

ws.on('error', (error) => console.error('Error:', error));
```

**Run:**
```bash
npx ts-node test-audio.ts
```

**Play audio (macOS):**
```bash
# Convert PCM to WAV and play
ffmpeg -f s16le -ar 24000 -ac 1 -i output.pcm output.wav
afplay output.wav
```

## Troubleshooting

### Common Issues

**Issue: "Connection refused" or "401 Unauthorized"**

Solution:
- Verify API key is correct
- Check resource name matches
- Ensure resource is in supported region
- Verify endpoint domain (`.cognitiveservices.azure.com` vs `.services.ai.azure.com`)

**Issue: "Model not found"**

Solution:
- Check model name spelling
- Verify model is available in your region
- Try `gpt-realtime` or `gpt-4o`

**Issue: "No audio received"**

Solution:
- Verify audio format configuration
- Check modalities include `'audio'`
- Ensure `response.create` is called
- Check for error events

**Issue: "WebSocket closes immediately"**

Solution:
- Add error and close event listeners
- Check Azure resource status in portal
- Verify network/firewall settings
- Test with `curl` or Postman first

### Debug Mode

Enable verbose logging:

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  console.log('EVENT:', JSON.stringify(event, null, 2));
});
```

### Check Resource Status

```bash
# Verify resource is running
az cognitiveservices account show \
  --name my-voice-live-foundry \
  --resource-group rg-voice-live \
  --query provisioningState
```

## Next Steps

You now have:
- ✅ Azure resource configured
- ✅ Authentication set up
- ✅ WebSocket connection tested
- ✅ Basic audio streaming working

**Continue to [Module 03: Voices & Languages](03-voices-languages.md)** to:
- Explore 600+ available voices
- Configure multi-language support
- Customize voice parameters
- Choose optimal voices for your use case

## Quick Reference

### Environment Variables

```bash
AZURE_RESOURCE_NAME=my-voice-live-foundry
AZURE_REGION=eastus
AZURE_SPEECH_API_KEY=your-key-here

# OR for Entra ID:
AZURE_TENANT_ID=tenant-id
AZURE_CLIENT_ID=client-id
AZURE_CLIENT_SECRET=client-secret
```

### WebSocket URL Template

```
wss://{resource}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model={model}
```

### Authentication Headers

**API Key:**
```
api-key: your-api-key
```

**Entra ID:**
```
Authorization: Bearer <token>
```

## Additional Resources

- [Azure Portal](https://portal.azure.com)
- [Azure CLI Documentation](https://learn.microsoft.com/cli/azure/)
- [Voice Live Regions](https://learn.microsoft.com/azure/ai-services/speech-service/regions#speech-service)
- [Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

---

**[← Previous: Foundations](01-foundations.md) | [Back to Learning Path](../README.md#-learning-path) | [Next: Voices & Languages →](03-voices-languages.md)**
