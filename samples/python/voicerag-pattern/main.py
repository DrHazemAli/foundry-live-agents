import asyncio
import json
import os
import websockets
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

# Sample knowledge base
KNOWLEDGE_BASE = [
    {
        "id": "1",
        "title": "Employee Vacation Policy",
        "content": "Full-time employees accrue 15 days of paid time off (PTO) per year. Part-time employees accrue PTO prorated based on hours worked. PTO can be used for vacation, sick leave, or personal time. Unused PTO can be carried over up to 5 days per year.",
        "source": "employee_handbook_2024.pdf",
        "category": "HR",
        "date": "2024-01-01"
    },
    {
        "id": "2",
        "title": "Health Insurance Benefits",
        "content": "The company offers comprehensive health insurance including medical, dental, and vision coverage. Employees can enroll during open enrollment or within 30 days of hire. The company covers 80% of premiums for employees and 50% for dependents. Plans include PPO and HMO options.",
        "source": "benefits_guide_2024.pdf",
        "category": "HR",
        "date": "2024-01-01"
    },
    {
        "id": "3",
        "title": "Remote Work Policy",
        "content": "Employees may work remotely up to 3 days per week with manager approval. Remote work requires a dedicated workspace, reliable internet (minimum 25 Mbps), and availability during core hours (10am-3pm). Equipment stipend of $500 provided for home office setup.",
        "source": "remote_work_policy.pdf",
        "category": "HR",
        "date": "2023-06-15"
    },
    {
        "id": "4",
        "title": "Product API Documentation",
        "content": "The REST API uses OAuth 2.0 authentication. Base URL: https://api.example.com/v1. Rate limit: 1000 requests per hour. All endpoints return JSON. Common endpoints: GET /users, POST /orders, PUT /products/{id}. Error codes follow HTTP standards.",
        "source": "api_docs.md",
        "category": "Engineering",
        "date": "2024-02-01"
    },
    {
        "id": "5",
        "title": "Sales Commission Structure",
        "content": "Sales representatives earn 10% commission on all closed deals. Quarterly bonuses available for exceeding quota. Annual top performer receives additional 5% bonus. Commission paid monthly on the 15th. Chargebacks apply for cancellations within 90 days.",
        "source": "sales_compensation.pdf",
        "category": "Sales",
        "date": "2024-01-01"
    },
    {
        "id": "6",
        "title": "Product Return Policy",
        "content": "Customers can return products within 30 days of purchase for full refund. Items must be in original packaging and unused. Return shipping is free for defective items, otherwise customer pays. Refunds processed within 5-7 business days. Gift cards non-refundable.",
        "source": "return_policy.pdf",
        "category": "Customer Service",
        "date": "2023-09-01"
    }
]

def search_documents(query: str, top_k: int = 3, category: str = None) -> List[Dict]:
    """Simple keyword-based search (replace with Azure AI Search in production)"""
    query_lower = query.lower()
    
    filtered_docs = KNOWLEDGE_BASE
    if category and category != 'All':
        filtered_docs = [doc for doc in KNOWLEDGE_BASE if doc['category'] == category]
    
    # Score documents
    scored_docs = []
    for doc in filtered_docs:
        score = 0
        title_lower = doc['title'].lower()
        content_lower = doc['content'].lower()
        
        if query_lower in title_lower:
            score += 2
        if query_lower in content_lower:
            score += 1
        
        # Count keyword occurrences
        keywords = query_lower.split()
        for keyword in keywords:
            if len(keyword) > 3:
                score += (title_lower + ' ' + content_lower).count(keyword) * 0.5
        
        if score > 0:
            scored_docs.append({**doc, 'score': score})
    
    # Sort by score and return top k
    scored_docs.sort(key=lambda x: x['score'], reverse=True)
    return scored_docs[:top_k]

# Function definition for RAG
FUNCTIONS = [
    {
        "type": "function",
        "name": "search_documents",
        "description": """Search the company knowledge base for relevant information. 
Use this to answer questions about company policies, procedures, products, or documentation.
Always search before answering questions that require specific factual information.""",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query - use natural language to describe what you're looking for"
                },
                "top_k": {
                    "type": "number",
                    "description": "Number of documents to return (default: 3, max: 5)",
                    "default": 3
                },
                "category": {
                    "type": "string",
                    "enum": ["HR", "Engineering", "Sales", "Customer Service", "All"],
                    "description": "Filter results by category (optional)"
                }
            },
            "required": ["query"]
        }
    }
]

async def main():
    api_key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")
    deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o-realtime-preview")

    print("📚 Starting VoiceRAG Pattern Sample...\n")
    print(f"📖 Knowledge Base: {len(KNOWLEDGE_BASE)} documents loaded\n")

    url = f"wss://{region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment={deployment}"
    headers = {"api-key": api_key}

    async with websockets.connect(url, extra_headers=headers) as ws:
        print("✅ Connected to Voice Live API\n")

        # Configure session
        session_config = {
            "type": "session.update",
            "session": {
                "model": "gpt-4o-realtime-preview",
                "modalities": ["text", "audio"],
                "voice": "alloy",
                "instructions": """You are a knowledgeable assistant with access to company documentation.

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
- Customer service policies""",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "silence_duration_ms": 500,
                    "create_response": True
                },
                "tools": FUNCTIONS,
                "tool_choice": "auto",
                "temperature": 0.7,
                "max_response_output_tokens": 1024
            }
        }

        await ws.send(json.dumps(session_config))
        print("⚙️  Session configured with RAG capabilities\n")

        # Test queries
        test_queries = [
            "What's the vacation policy?",
            "How does the remote work policy work?",
            "Tell me about our health insurance"
        ]

        query_index = 0

        async def ask_next_question():
            nonlocal query_index
            if query_index < len(test_queries):
                query = test_queries[query_index]
                query_index += 1
                
                print(f"\n{'='*60}")
                print(f"💬 Query: \"{query}\"")
                print('='*60 + '\n')
                
                await ws.send(json.dumps({
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message",
                        "role": "user",
                        "content": [{"type": "input_text", "text": query}]
                    }
                }))

                await ws.send(json.dumps({"type": "response.create"}))

        await asyncio.sleep(1)
        await ask_next_question()

        # Event loop
        async for message in ws:
            event = json.loads(message)
            event_type = event.get("type")

            if event_type == "session.created":
                print(f"📡 Session created: {event['session']['id']}")
            
            elif event_type == "response.function_call":
                print("\n🔍 Searching documents...")
                print(f"   Function: {event['name']}")
                
                args = json.loads(event['arguments'])
                print(f"   Query: {args['query']}\n")

                # Search documents
                results = search_documents(
                    args['query'],
                    args.get('top_k', 3),
                    args.get('category')
                )

                print(f"📄 Found {len(results)} relevant documents:\n")
                for i, doc in enumerate(results, 1):
                    print(f"   {i}. {doc['title']}")
                    print(f"      Source: {doc['source']}")
                    print(f"      Category: {doc['category']}")
                    print(f"      Excerpt: {doc['content'][:100]}...\n")

                # Return results
                await ws.send(json.dumps({
                    "type": "conversation.item.create",
                    "item": {
                        "type": "function_call_output",
                        "call_id": event['call_id'],
                        "output": json.dumps({
                            "documents": [{
                                "title": doc['title'],
                                "content": doc['content'],
                                "source": doc['source'],
                                "category": doc['category']
                            } for doc in results],
                            "query": args['query'],
                            "total_found": len(results)
                        })
                    }
                }))

                await ws.send(json.dumps({"type": "response.create"}))
            
            elif event_type == "response.text.delta":
                print(event['delta'], end='', flush=True)
            
            elif event_type == "response.text.done":
                print()
            
            elif event_type == "response.done":
                await asyncio.sleep(2)
                await ask_next_question()
                
                if query_index >= len(test_queries):
                    print("\n🎉 VoiceRAG demo complete!\n")
                    break
            
            elif event_type == "error":
                print(f"❌ Error: {event['error']}")

if __name__ == "__main__":
    asyncio.run(main())
