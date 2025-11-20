import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

// Sample knowledge base (in production, use Azure AI Search or vector DB)
interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
  date: string;
}

const knowledgeBase: Document[] = [
  {
    id: '1',
    title: 'Employee Vacation Policy',
    content: 'Full-time employees accrue 15 days of paid time off (PTO) per year. Part-time employees accrue PTO prorated based on hours worked. PTO can be used for vacation, sick leave, or personal time. Unused PTO can be carried over up to 5 days per year.',
    source: 'employee_handbook_2024.pdf',
    category: 'HR',
    date: '2024-01-01'
  },
  {
    id: '2',
    title: 'Health Insurance Benefits',
    content: 'The company offers comprehensive health insurance including medical, dental, and vision coverage. Employees can enroll during open enrollment or within 30 days of hire. The company covers 80% of premiums for employees and 50% for dependents. Plans include PPO and HMO options.',
    source: 'benefits_guide_2024.pdf',
    category: 'HR',
    date: '2024-01-01'
  },
  {
    id: '3',
    title: 'Remote Work Policy',
    content: 'Employees may work remotely up to 3 days per week with manager approval. Remote work requires a dedicated workspace, reliable internet (minimum 25 Mbps), and availability during core hours (10am-3pm). Equipment stipend of $500 provided for home office setup.',
    source: 'remote_work_policy.pdf',
    category: 'HR',
    date: '2023-06-15'
  },
  {
    id: '4',
    title: 'Product API Documentation',
    content: 'The REST API uses OAuth 2.0 authentication. Base URL: https://api.example.com/v1. Rate limit: 1000 requests per hour. All endpoints return JSON. Common endpoints: GET /users, POST /orders, PUT /products/{id}. Error codes follow HTTP standards.',
    source: 'api_docs.md',
    category: 'Engineering',
    date: '2024-02-01'
  },
  {
    id: '5',
    title: 'Sales Commission Structure',
    content: 'Sales representatives earn 10% commission on all closed deals. Quarterly bonuses available for exceeding quota. Annual top performer receives additional 5% bonus. Commission paid monthly on the 15th. Chargebacks apply for cancellations within 90 days.',
    source: 'sales_compensation.pdf',
    category: 'Sales',
    date: '2024-01-01'
  },
  {
    id: '6',
    title: 'Product Return Policy',
    content: 'Customers can return products within 30 days of purchase for full refund. Items must be in original packaging and unused. Return shipping is free for defective items, otherwise customer pays. Refunds processed within 5-7 business days. Gift cards non-refundable.',
    source: 'return_policy.pdf',
    category: 'Customer Service',
    date: '2023-09-01'
  }
];

// Simple search function (replace with Azure AI Search in production)
function searchDocuments(query: string, topK: number = 3, category?: string): Document[] {
  const queryLower = query.toLowerCase();
  
  let filteredDocs = knowledgeBase;
  if (category) {
    filteredDocs = knowledgeBase.filter(doc => doc.category === category);
  }
  
  // Simple keyword matching with scoring
  const scoredDocs = filteredDocs.map(doc => {
    const titleMatch = doc.title.toLowerCase().includes(queryLower);
    const contentMatch = doc.content.toLowerCase().includes(queryLower);
    
    let score = 0;
    if (titleMatch) score += 2;
    if (contentMatch) score += 1;
    
    // Count keyword occurrences
    const keywords = queryLower.split(' ');
    keywords.forEach(keyword => {
      if (keyword.length > 3) {
        const regex = new RegExp(keyword, 'gi');
        const matches = (doc.content + ' ' + doc.title).match(regex);
        if (matches) score += matches.length * 0.5;
      }
    });
    
    return { ...doc, score };
  });
  
  // Sort by score and return top k
  return scoredDocs
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// Function definitions for RAG
const functions = [
  {
    type: 'function',
    name: 'search_documents',
    description: `Search the company knowledge base for relevant information. 
Use this to answer questions about company policies, procedures, products, or documentation.
Always search before answering questions that require specific factual information.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query - use natural language to describe what you\'re looking for'
        },
        top_k: {
          type: 'number',
          description: 'Number of documents to return (default: 3, max: 5)',
          default: 3
        },
        category: {
          type: 'string',
          enum: ['HR', 'Engineering', 'Sales', 'Customer Service', 'All'],
          description: 'Filter results by category (optional)'
        }
      },
      required: ['query']
    }
  }
];

async function main() {
  const apiKey = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-realtime-preview';

  console.log('📚 Starting VoiceRAG Pattern Sample...\n');
  console.log(`📖 Knowledge Base: ${knowledgeBase.length} documents loaded\n`);

  const url = `wss://${region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${deployment}`;
  
  const ws = new WebSocket(url, {
    headers: { 'api-key': apiKey }
  });

  ws.on('open', () => {
    console.log('✅ Connected to Voice Live API\n');

    const sessionConfig = {
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: `You are a knowledgeable assistant with access to company documentation.

When answering questions:
1. ALWAYS use the search_documents function to find relevant information
2. Base your answers on the retrieved documents
3. Cite your sources (mention the document name)
4. If information isn't found, say so clearly
5. Be conversational but accurate

You have access to:
- HR policies (vacation, benefits, remote work)
- Engineering documentation
- Sales information
- Customer service policies`,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 500,
          create_response: true
        },
        tools: functions,
        tool_choice: 'auto',
        temperature: 0.7,
        max_response_output_tokens: 1024
      }
    };

    ws.send(JSON.stringify(sessionConfig));
    console.log('⚙️  Session configured with RAG capabilities\n');

    // Test queries
    const testQueries = [
      "What's the vacation policy?",
      "How does the remote work policy work?",
      "Tell me about our health insurance"
    ];

    let queryIndex = 0;
    const askNextQuestion = () => {
      if (queryIndex < testQueries.length) {
        const query = testQueries[queryIndex++];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`💬 Query: "${query}"`);
        console.log('='.repeat(60) + '\n');
        
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: query }]
          }
        }));

        ws.send(JSON.stringify({ type: 'response.create' }));
      } else {
        console.log('\n🎉 VoiceRAG demo complete!\n');
        ws.close();
      }
    };

    setTimeout(askNextQuestion, 1000);

    // Setup response handler to ask next question
    ws.on('message', (data: WebSocket.Data) => {
      const event = JSON.parse(data.toString());

      if (event.type === 'response.done') {
        setTimeout(askNextQuestion, 2000);
      }
    });
  });

  ws.on('message', (data: WebSocket.Data) => {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'session.created':
        console.log('📡 Session created:', event.session.id);
        break;

      case 'response.function_call':
        console.log('\n🔍 Searching documents...');
        console.log(`   Function: ${event.name}`);
        console.log(`   Query: ${JSON.parse(event.arguments).query}\n`);

        const args = JSON.parse(event.arguments);
        const results = searchDocuments(
          args.query,
          args.top_k || 3,
          args.category !== 'All' ? args.category : undefined
        );

        console.log(`📄 Found ${results.length} relevant documents:\n`);
        results.forEach((doc, i) => {
          console.log(`   ${i + 1}. ${doc.title}`);
          console.log(`      Source: ${doc.source}`);
          console.log(`      Category: ${doc.category}`);
          console.log(`      Excerpt: ${doc.content.substring(0, 100)}...\n`);
        });

        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify({
              documents: results.map(doc => ({
                title: doc.title,
                content: doc.content,
                source: doc.source,
                category: doc.category
              })),
              query: args.query,
              total_found: results.length
            })
          }
        }));

        ws.send(JSON.stringify({ type: 'response.create' }));
        break;

      case 'response.text.delta':
        process.stdout.write(event.delta);
        break;

      case 'response.text.done':
        console.log('\n');
        break;

      case 'error':
        console.error('❌ Error:', event.error);
        break;
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('👋 Disconnected from Voice Live API');
    process.exit(0);
  });
}

main().catch(console.error);
