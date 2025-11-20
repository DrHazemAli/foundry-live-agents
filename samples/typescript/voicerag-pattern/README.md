# VoiceRAG Pattern Sample

This sample demonstrates the Voice Retrieval-Augmented Generation (VoiceRAG) pattern - combining real-time voice conversation with document retrieval and knowledge bases.

## Features

- Document retrieval during conversation
- Knowledge base integration
- Context-aware responses
- Citation and source tracking
- Streaming with retrieval

## Prerequisites

- Node.js 18 or later
- Azure Speech Services resource with Voice Live enabled
- Azure AI Search (optional, for production)
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
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_KEY=your-search-key
AZURE_SEARCH_INDEX=documents
```

3. Run the sample:
```bash
npm start
```

## How It Works

### 1. Define Retrieval Function

Create a function that searches your knowledge base:

```typescript
const functions = [{
  type: 'function',
  name: 'search_documents',
  description: 'Search the knowledge base for relevant information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      top_k: {
        type: 'number',
        description: 'Number of results to return',
        default: 3
      }
    },
    required: ['query']
  }
}];
```

### 2. Implement Search

Connect to your document store:

```typescript
async function searchDocuments(query: string, topK: number = 3) {
  // Simple in-memory search (replace with Azure AI Search in production)
  const results = knowledgeBase
    .filter(doc => doc.content.toLowerCase().includes(query.toLowerCase()))
    .slice(0, topK);
  
  return results.map(doc => ({
    title: doc.title,
    content: doc.content,
    source: doc.source,
    relevance: calculateRelevance(doc, query)
  }));
}
```

### 3. Return Context

Provide retrieved context back to the agent:

```typescript
if (event.type === 'response.function_call' && event.name === 'search_documents') {
  const results = await searchDocuments(args.query, args.top_k);
  
  ws.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'function_call_output',
      call_id: event.call_id,
      output: JSON.stringify({
        documents: results,
        query: args.query,
        total_found: results.length
      })
    }
  }));
  
  ws.send(JSON.stringify({ type: 'response.create' }));
}
```

## Example Conversation

**User**: "What are the company's vacation policies?"

**Agent**: *calls search_documents("vacation policies")*

**Retrieved Context**:
```json
{
  "documents": [
    {
      "title": "Employee Handbook - Time Off",
      "content": "Full-time employees accrue 15 days of PTO per year...",
      "source": "handbook_2024.pdf"
    }
  ]
}
```

**Agent**: "Based on the employee handbook, full-time employees accrue 15 days of PTO per year. You can find more details in the handbook_2024.pdf document."

## Architecture Patterns

### Simple RAG
```
User Query → Retrieve Docs → Generate Response
```

### Conversational RAG
```
User Query → Check if Retrieval Needed → Retrieve → Generate → Follow-up
```

### Multi-Turn RAG
```
Query 1 → Retrieve A → Response 1
Query 2 → Retrieve B → Combine A+B → Response 2
```

## Integration Options

### Azure AI Search
- Full-text search
- Vector search
- Hybrid search
- Semantic ranking

### Vector Databases
- Azure Cosmos DB
- Pinecone
- Weaviate
- Qdrant

### Document Sources
- SharePoint
- OneDrive
- Azure Blob Storage
- Local files

## Best Practices

1. **Chunking**: Break documents into semantic chunks
2. **Metadata**: Include source, date, author
3. **Caching**: Cache frequent queries
4. **Fallback**: Handle no-results gracefully
5. **Citations**: Always cite sources
6. **Privacy**: Filter sensitive documents

## Common Issues

### Retrieval Too Slow

- Use vector search instead of full-text
- Implement caching layer
- Reduce top_k parameter
- Pre-index frequently accessed docs

### Irrelevant Results

- Improve query reformulation
- Use semantic ranking
- Implement re-ranking
- Filter by metadata

## Next Steps

- Explore [Streaming Responses](../streaming-responses/)
- Learn about [Interruption Handling](../interruption-handling/)
- Read [RAG Best Practices](../../docs/06-advanced-features.md#voicerag-pattern)
