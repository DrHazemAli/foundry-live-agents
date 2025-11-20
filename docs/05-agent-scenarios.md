# Module 05: Agent Scenarios & Design Patterns

> **Duration:** 120 minutes  
> **Level:** Intermediate to Advanced  
> **Prerequisites:** Modules 01-04, understanding of function calling

## Learning Objectives

By the end of this module, you will:

- Design complete agent workflows
- Implement function calling for real-world integrations
- Handle complex conversation states
- Apply agent design patterns
- Build production-ready agents
- Handle edge cases and error scenarios

## Agent Design Framework

### 1. Define Your Agent's Purpose

Before writing any code, answer these questions:

**Core Identity:**
- What is the agent's role? (e.g., customer support, scheduler, advisor)
- What personality should it have? (professional, friendly, technical)
- What are the boundaries? (what it can/cannot do)

**Target Users:**
- Who will interact with it?
- What is their technical level?
- What languages do they speak?
- What are their expectations?

**Business Goals:**
- What problem does it solve?
- What metrics define success?
- How does it integrate with existing systems?

### 2. Agent Architecture Layers

```
┌─────────────────────────────────────────┐
│         Conversation Layer              │
│  (Instructions, personality, context)   │
├─────────────────────────────────────────┤
│           Function Layer                │
│  (Tools, integrations, capabilities)    │
├─────────────────────────────────────────┤
│          Configuration Layer            │
│  (Voice, VAD, audio, model settings)    │
├─────────────────────────────────────────┤
│          Infrastructure Layer           │
│  (WebSocket, auth, logging, errors)     │
└─────────────────────────────────────────┘
```

## Function Calling Deep Dive

### Function Definition Best Practices

**Good Function Definition:**
```typescript
{
  type: "function",
  name: "check_order_status",
  description: "Retrieve current status and tracking information for a customer order",
  parameters: {
    type: "object",
    properties: {
      order_id: {
        type: "string",
        description: "The order ID (format: ORD-XXXXXX)"
      },
      email: {
        type: "string",
        description: "Customer email for verification"
      }
    },
    required: ["order_id"]
  }
}
```

**Why This is Good:**
- Clear, action-oriented name
- Specific description of what it does
- Well-documented parameters
- Validation hints (format example)
- Only required params in `required` array

**Poor Function Definition:**
```typescript
{
  type: "function",
  name: "getData",  // Too vague
  description: "Get data",  // No details
  parameters: {
    type: "object",
    properties: {
      id: { type: "string" },  // No description
      stuff: { type: "string" }  // Unclear parameter
    },
    required: ["id", "stuff"]  // Too many required
  }
}
```

### Function Implementation Pattern

```typescript
// 1. Define function schema
const functions = [{
  type: "function",
  name: "search_products",
  description: "Search product catalog by name, category, or attributes",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search term or product name"
      },
      category: {
        type: "string",
        enum: ["electronics", "clothing", "home", "books"],
        description: "Product category to filter by"
      },
      max_price: {
        type: "number",
        description: "Maximum price in USD"
      },
      in_stock_only: {
        type: "boolean",
        description: "Only return products in stock",
        default: true
      }
    },
    required: ["query"]
  }
}];

// 2. Register function handler
functionHandlers.set("search_products", async (params) => {
  try {
    // Validate parameters
    if (!params.query || params.query.trim().length === 0) {
      return {
        error: "Search query cannot be empty",
        products: []
      };
    }
    
    // Call backend API
    const products = await productAPI.search({
      query: params.query,
      category: params.category,
      maxPrice: params.max_price,
      inStockOnly: params.in_stock_only ?? true
    });
    
    // Format response for agent
    return {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        in_stock: p.inventory > 0,
        url: `https://example.com/products/${p.id}`
      })),
      total_found: products.length
    };
    
  } catch (error) {
    console.error("Product search failed:", error);
    return {
      error: "Unable to search products. Please try again.",
      products: []
    };
  }
});

// 3. Handle function call from AI
client.on("response.function_call", async (event) => {
  const { call_id, name, arguments: args } = event;
  
  // Get handler
  const handler = functionHandlers.get(name);
  if (!handler) {
    await client.sendFunctionResult({
      call_id,
      output: JSON.stringify({ error: "Function not found" })
    });
    return;
  }
  
  // Execute function
  const result = await handler(JSON.parse(args));
  
  // Send result back to AI
  await client.sendFunctionResult({
    call_id,
    output: JSON.stringify(result)
  });
});

// 4. Handle function result in agent instructions
const instructions = `
When you receive product search results:
- If no products found, suggest alternative searches
- Present top 3-5 products with key details
- Mention total number found
- Ask if user wants more details or to refine search
- If error occurred, apologize and offer to try again
`;
```

### Function Calling Patterns

#### Pattern 1: Sequential Flow

Agent calls multiple functions in sequence:

```typescript
// User: "I want to book a flight to Paris next week"

// Step 1: Search flights
await callFunction("search_flights", {
  destination: "Paris",
  departure_date: "2025-11-26"
});

// Step 2: Check user preferences
await callFunction("get_user_preferences", {
  user_id: "user123"
});

// Step 3: Show personalized options
// Agent presents flights matching preferences

// Step 4: Book selected flight
await callFunction("book_flight", {
  flight_id: "FL456",
  user_id: "user123"
});
```

#### Pattern 2: Parallel Queries

Agent calls multiple functions simultaneously:

```typescript
// User: "Compare options for my trip"

// Call multiple functions in parallel
const [flights, hotels, cars] = await Promise.all([
  callFunction("search_flights", {...}),
  callFunction("search_hotels", {...}),
  callFunction("search_rental_cars", {...})
]);

// Agent synthesizes all results
```

#### Pattern 3: Conditional Logic

Agent decides which function to call based on context:

```typescript
// Instructions include:
`
If user asks about order status:
  - Call check_order_status with order_id
  
If order has issues:
  - Call create_support_ticket
  - Call notify_customer_service
  
If order is delayed:
  - Call check_shipping_eta
  - Offer compensation options
`
```

#### Pattern 4: VoiceRAG (Retrieval Augmented Generation)

Agent searches knowledge base for contextual information:

```typescript
{
  type: "function",
  name: "search_knowledge_base",
  description: "Search company knowledge base for relevant information",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query based on user's question"
      },
      category: {
        type: "string",
        enum: ["products", "policies", "technical", "billing"],
        description: "Knowledge category"
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

// Implementation with Azure AI Search
async function searchKnowledgeBase(params) {
  const results = await azureSearchClient.search(params.query, {
    filter: params.category ? `category eq '${params.category}'` : null,
    top: params.top_k || 3,
    searchFields: ["title", "content"],
    select: ["title", "content", "url", "category"]
  });
  
  return {
    results: results.results.map(r => ({
      title: r.document.title,
      content: r.document.content,
      url: r.document.url,
      relevance_score: r.score
    }))
  };
}
```

## Complete Agent Example: E-Commerce Support

### Agent Configuration

```typescript
const ecommerceAgent = {
  model: "gpt-4o",
  modalities: ["text", "audio"],
  instructions: `You are Alex, a helpful e-commerce customer support agent for ShopSmart.

**Your Role:**
- Help customers find products
- Check order status and tracking
- Process returns and exchanges
- Answer product questions
- Resolve complaints professionally

**Your Personality:**
- Friendly and enthusiastic about helping
- Patient and understanding
- Proactive in offering solutions
- Knowledgeable about products and policies

**Guidelines:**
1. Always verify customer identity for account actions
2. Use customer's name when known
3. Be specific with product details (price, availability, features)
4. Offer alternatives if product unavailable
5. Explain policies clearly
6. Escalate to human if customer is frustrated

**Conversation Flow:**
1. Greet customer warmly
2. Ask how you can help
3. Gather necessary information
4. Use functions to retrieve data
5. Present options clearly
6. Confirm action before executing
7. Summarize and ask if anything else needed

**Important Limits:**
- Cannot process refunds over $500 (escalate)
- Cannot override return policy (escalate)
- Cannot access payment methods (escalate)
- Cannot change account email (escalate)

Remember: Customer satisfaction is priority #1!`,

  voice: {
    type: "azure-standard",
    name: "en-US-Jenny",
    temperature: 0.7
  },
  
  turn_detection: {
    type: "azure_semantic_vad",
    threshold: 0.5,
    silence_duration_ms: 700,
    remove_filler_words: true,
    interrupt_response: true,
    auto_truncate: true
  },
  
  temperature: 0.7,
  max_response_output_tokens: 250,
  
  tools: [
    {
      type: "function",
      name: "search_products",
      description: "Search product catalog",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term" },
          category: { 
            type: "string",
            enum: ["electronics", "clothing", "home", "books", "toys"],
            description: "Product category"
          },
          max_price: { type: "number", description: "Maximum price in USD" },
          min_rating: { type: "number", description: "Minimum customer rating (1-5)" }
        },
        required: ["query"]
      }
    },
    {
      type: "function",
      name: "check_order_status",
      description: "Get order status and tracking information",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Order ID (ORD-XXXXXX)" },
          email: { type: "string", description: "Customer email for verification" }
        },
        required: ["order_id", "email"]
      }
    },
    {
      type: "function",
      name: "initiate_return",
      description: "Start return or exchange process",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string" },
          item_id: { type: "string", description: "Product ID to return" },
          reason: { 
            type: "string",
            enum: ["defective", "wrong-item", "not-as-described", "changed-mind", "other"]
          },
          action: {
            type: "string",
            enum: ["refund", "exchange"],
            description: "Return or exchange"
          }
        },
        required: ["order_id", "item_id", "reason", "action"]
      }
    },
    {
      type: "function",
      name: "get_product_details",
      description: "Get detailed product information",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" }
        },
        required: ["product_id"]
      }
    },
    {
      type: "function",
      name: "check_inventory",
      description: "Check product availability and stock",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          zip_code: { type: "string", description: "Delivery zip code" }
        },
        required: ["product_id"]
      }
    },
    {
      type: "function",
      name: "escalate_to_human",
      description: "Transfer to human agent",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            enum: ["complex-issue", "customer-frustrated", "policy-exception", "high-value"],
            description: "Escalation reason"
          },
          summary: { type: "string", description: "Conversation summary" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            default: "medium"
          }
        },
        required: ["reason", "summary"]
      }
    }
  ]
};
```

### Function Implementations

```typescript
// Product Search
async function searchProducts(params) {
  const results = await shopAPI.products.search({
    q: params.query,
    category: params.category,
    maxPrice: params.max_price,
    minRating: params.min_rating || 0
  });
  
  return {
    products: results.items.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      rating: p.averageRating,
      reviews: p.reviewCount,
      in_stock: p.inventory > 0,
      url: `https://shopmart.com/p/${p.id}`
    })),
    total: results.totalCount,
    filters_applied: {
      category: params.category,
      max_price: params.max_price
    }
  };
}

// Order Status
async function checkOrderStatus(params) {
  // Verify email matches order
  const order = await shopAPI.orders.get(params.order_id);
  
  if (order.customerEmail !== params.email) {
    return {
      error: "Email does not match order records",
      verified: false
    };
  }
  
  return {
    order_id: order.id,
    status: order.status,
    items: order.items.map(i => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.price
    })),
    total: order.total,
    placed_date: order.createdAt,
    estimated_delivery: order.estimatedDelivery,
    tracking_number: order.trackingNumber,
    tracking_url: order.trackingUrl
  };
}

// Initiate Return
async function initiateReturn(params) {
  const returnRequest = await shopAPI.returns.create({
    orderId: params.order_id,
    itemId: params.item_id,
    reason: params.reason,
    action: params.action
  });
  
  return {
    return_id: returnRequest.id,
    status: "initiated",
    return_label_url: returnRequest.labelUrl,
    instructions: returnRequest.instructions,
    refund_amount: returnRequest.refundAmount,
    refund_method: returnRequest.refundMethod,
    expected_processing_days: 5-7
  };
}

// Escalation
async function escalateToHuman(params) {
  const ticket = await customerServiceAPI.createTicket({
    type: "escalation",
    reason: params.reason,
    summary: params.summary,
    priority: params.priority,
    source: "voice-ai-agent"
  });
  
  // Notify available agents
  await notificationService.alert({
    channel: "customer-service",
    priority: params.priority,
    ticketId: ticket.id
  });
  
  return {
    ticket_id: ticket.id,
    estimated_wait_time_minutes: 5,
    status: "queued"
  };
}
```

### Example Conversation Flow

```
Customer: "Hi, I'm looking for a laptop under $1000."

Agent: "Hi! I'd be happy to help you find a laptop under $1000. Let me search our catalog for you."

[Calls search_products({ query: "laptop", category: "electronics", max_price: 1000 })]

Agent: "Great! I found several options:

1. Dell Inspiron 15 - $849
   - 15.6" display, 8GB RAM, 256GB SSD
   - 4.2 stars from 324 reviews
   
2. HP Pavilion 14 - $699
   - 14" display, 8GB RAM, 512GB SSD  
   - 4.5 stars from 189 reviews
   
3. Lenovo IdeaPad 3 - $579
   - 15.6" display, 8GB RAM, 256GB SSD
   - 4.0 stars from 456 reviews

Would you like more details about any of these?"

Customer: "Tell me more about the HP Pavilion."

Agent: "Let me get the full details for you."

[Calls get_product_details({ product_id: "HP-PAV14-001" })]

Agent: "The HP Pavilion 14 is a great choice! Here are the full specs:

- Processor: Intel Core i5-11th gen
- RAM: 8GB DDR4
- Storage: 512GB NVMe SSD
- Display: 14" Full HD touchscreen
- Battery: Up to 8 hours
- Weight: 3.5 pounds
- Color: Natural Silver

It's currently in stock and can ship today. Would you like me to check delivery time to your area?"

Customer: "Yes, I'm in zip code 90210."

[Calls check_inventory({ product_id: "HP-PAV14-001", zip_code: "90210" })]

Agent: "Perfect! We have this in stock at our Los Angeles warehouse. You can get it delivered to 90210 by November 22nd with standard shipping, or November 20th with express shipping for $15 extra. Would you like me to help you with the purchase?"
```

## Agent Design Patterns

### Pattern 1: Guided Workflow

Lead user through multi-step process:

```typescript
const instructions = `
You are a loan application assistant. Guide users through this workflow:

Step 1: Personal Information
  - Full name
  - Date of birth
  - Social Security Number (last 4 digits only)
  
Step 2: Employment Information
  - Current employer
  - Job title
  - Annual income
  - Years employed
  
Step 3: Loan Details
  - Loan amount requested
  - Loan purpose
  - Preferred term
  
Step 4: Review & Submit
  - Confirm all details
  - Submit application

After each step:
1. Confirm information is correct
2. Move to next step
3. Use progress indicator ("We're on step 2 of 4")

Do not skip steps. Be patient and thorough.
`;
```

### Pattern 2: Contextual Memory

Maintain conversation context:

```typescript
// Store context in conversation items
await client.sendConversationItem({
  type: "message",
  role: "system",
  content: `User preferences for this session:
- Customer: John Smith (ID: CUST-12345)
- Preferred language: English
- Account type: Premium
- Recent orders: ORD-78901, ORD-78902
- Known issue: Package delayed`
});

// Reference in future responses
const instructions = `
You have access to user's context including:
- Customer ID and name
- Order history
- Current issues
- Preferences

Reference this information naturally:
- "I see you're a Premium member..."
- "Looking at your recent order..."
- "I know we're working on your delayed package..."
`;
```

### Pattern 3: Sentiment-Based Routing

Adapt based on customer emotion:

```typescript
const instructions = `
Monitor customer sentiment throughout conversation:

If customer shows FRUSTRATION:
  - Acknowledge their feelings: "I understand this is frustrating"
  - Take ownership: "Let me fix this right away"
  - Escalate if needed
  - Offer compensation when appropriate
  
If customer shows CONFUSION:
  - Slow down and clarify
  - Use simpler language
  - Ask if they need more explanation
  - Offer step-by-step guidance
  
If customer shows SATISFACTION:
  - Reinforce positive experience
  - Ask if anything else needed
  - Thank them for being a customer
`;
```

### Pattern 4: Multi-Intent Handling

Handle multiple requests in one query:

```typescript
// User: "Check my order ORD-12345 and also I want to return the blue shirt"

const instructions = `
When user mentions multiple requests:

1. Acknowledge all requests:
   "I can help with both checking your order and processing the return."

2. Handle sequentially:
   "Let me first check your order status..."
   [Check order]
   "Great, now about that return..."
   [Process return]

3. Or ask preference:
   "Would you like me to check your order first, or start with the return?"

4. Confirm both completed:
   "I've checked your order status and started the return. Anything else?"
`;
```

## Production Considerations

### Error Handling

```typescript
const instructions = `
When errors occur:

Function call fails:
  - "I'm having trouble accessing that information right now."
  - Offer alternative: "I can transfer you to a specialist who can help."
  - Don't reveal technical details

Timeout or network issues:
  - "Let me try that again for you."
  - If repeated: "Our system is running slowly. Would you like me to call you back?"

Invalid user input:
  - Politely ask for clarification
  - Provide examples: "Your order ID should look like ORD-123456"
  - Don't make user feel bad

Cannot fulfill request:
  - Explain why clearly
  - Offer alternatives
  - Escalate if needed
`;
```

### Security & Privacy

```typescript
const instructions = `
NEVER share or ask for:
  - Full credit card numbers
  - Full Social Security Numbers
  - Passwords
  - Security questions/answers
  
Only ask for verification:
  - Email address
  - Last 4 digits of card
  - Last 4 of SSN
  - Order ID
  
If user shares sensitive info:
  - "For security, please don't share that over this channel."
  - Redirect to secure method
`;
```

### Performance Monitoring

```typescript
// Track key metrics
const metrics = {
  conversationDuration: 0,
  functionCallsCount: 0,
  functionCallsSuccess: 0,
  escalationRate: 0,
  resolutionRate: 0,
  sentiment: "positive"
};

// Log important events
analytics.track("agent.conversation_start", {
  agentType: "ecommerce-support",
  language: "en-US"
});

analytics.track("agent.function_call", {
  functionName: "search_products",
  duration_ms: 234,
  success: true
});

analytics.track("agent.conversation_end", {
  duration_seconds: 180,
  resolved: true,
  sentiment: "positive",
  functionsUsed: ["search_products", "check_order_status"]
});
```

## Testing Your Agent

### Test Checklist

- [ ] **Happy Path** - Common successful scenarios
- [ ] **Error Handling** - Function failures, timeouts
- [ ] **Edge Cases** - Invalid input, missing data
- [ ] **Escalation** - When to transfer to human
- [ ] **Multi-turn** - Complex conversations
- [ ] **Interruption** - User changes topic mid-conversation
- [ ] **Multiple Languages** - All supported locales
- [ ] **Performance** - Response times, token usage
- [ ] **Security** - No sensitive data leakage

## Next Steps

You now understand:
- ✅ Agent design framework
- ✅ Function calling patterns
- ✅ Complete agent implementation
- ✅ Design patterns for common scenarios
- ✅ Production considerations

**Continue to [Module 06: Advanced Features](06-advanced-features.md)** to:
- Implement avatar integration
- Add custom speech models
- Build VoiceRAG systems
- Optimize for production

---

**[← Previous: Configuration](04-configuration.md) | [Back to Learning Path](../README.md#-learning-path) | [Next: Advanced Features →](06-advanced-features.md)**
