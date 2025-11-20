# Customer Support Agent

> **Scenario:** Multi-channel customer support with sentiment detection and escalation handling  
> **Languages:** English, Spanish, French, German, Italian, Japanese, Portuguese, Chinese, Korean, Hindi  
> **Features:** Sentiment analysis, escalation triggers, CRM integration patterns, multi-turn conversations

## Overview

This agent provides automated first-line customer support across multiple channels (voice, web, mobile). It handles common inquiries, detects customer sentiment, and intelligently escalates complex issues to human agents.

## Use Cases

- **Product Support** - Troubleshooting, how-to guidance
- **Account Management** - Password resets, account updates
- **Order Status** - Tracking, delivery information
- **Billing Inquiries** - Invoice questions, payment issues
- **General Information** - Hours, locations, policies
- **Complaint Handling** - Issue logging, escalation

## Configuration

### Session Configuration

```json
{
  "model": "gpt-4o",
  "modalities": ["text", "audio"],
  "instructions": "You are a professional customer support agent for a technology company. Your name is Alex.\n\nYour responsibilities:\n1. Greet customers warmly and professionally\n2. Listen actively to their concerns\n3. Ask clarifying questions when needed\n4. Provide clear, step-by-step solutions\n5. Show empathy and understanding\n6. Escalate to human agents when appropriate\n\nGuidelines:\n- Be patient and friendly\n- Use simple language, avoid jargon\n- Confirm understanding before moving forward\n- Apologize sincerely for any inconvenience\n- Provide realistic timeframes\n- End calls with satisfaction confirmation\n\nEscalation triggers:\n- Customer requests to speak with a supervisor\n- Issue requires account access you don't have\n- Customer is extremely frustrated (3+ complaints)\n- Technical problem outside your knowledge base\n- Legal or compliance matters\n- Refund requests over $500\n\nWhen escalating:\n- Explain why you're escalating\n- Assure the customer they'll be helped\n- Summarize the issue for the next agent\n- Provide estimated wait time if known\n\nRemember: You're the customer's advocate. Always prioritize their satisfaction while following company policies.",
  "voice": {
    "type": "azure-standard",
    "name": "en-US-Jenny",
    "temperature": 0.7
  },
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16",
  "input_audio_sampling_rate": 24000,
  "turn_detection": {
    "type": "azure_semantic_vad_multilingual",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 700,
    "remove_filler_words": true,
    "interrupt_response": true,
    "auto_truncate": true,
    "end_of_utterance_detection": {
      "model": "semantic_detection_v1",
      "threshold_level": "default",
      "timeout_ms": 1500
    }
  },
  "input_audio_noise_reduction": {
    "type": "azure_deep_noise_suppression"
  },
  "input_audio_echo_cancellation": {
    "type": "server_echo_cancellation"
  },
  "input_audio_transcription": {
    "model": "azure-speech",
    "language": "auto-detect"
  },
  "temperature": 0.7,
  "max_response_output_tokens": 200,
  "tools": [
    {
      "type": "function",
      "name": "check_order_status",
      "description": "Check the status of a customer order by order number",
      "parameters": {
        "type": "object",
        "properties": {
          "order_number": {
            "type": "string",
            "description": "The customer's order number (e.g., ORD-123456)"
          }
        },
        "required": ["order_number"]
      }
    },
    {
      "type": "function",
      "name": "create_support_ticket",
      "description": "Create a support ticket for issues that need follow-up",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {
            "type": "string",
            "description": "Customer identifier"
          },
          "issue_category": {
            "type": "string",
            "enum": ["technical", "billing", "shipping", "product", "account", "other"],
            "description": "Category of the issue"
          },
          "description": {
            "type": "string",
            "description": "Detailed description of the issue"
          },
          "priority": {
            "type": "string",
            "enum": ["low", "medium", "high", "urgent"],
            "description": "Priority level"
          }
        },
        "required": ["customer_id", "issue_category", "description", "priority"]
      }
    },
    {
      "type": "function",
      "name": "escalate_to_human",
      "description": "Escalate the conversation to a human agent",
      "parameters": {
        "type": "object",
        "properties": {
          "reason": {
            "type": "string",
            "description": "Reason for escalation"
          },
          "summary": {
            "type": "string",
            "description": "Brief summary of the customer's issue"
          },
          "customer_sentiment": {
            "type": "string",
            "enum": ["positive", "neutral", "frustrated", "angry"],
            "description": "Customer's emotional state"
          }
        },
        "required": ["reason", "summary", "customer_sentiment"]
      }
    },
    {
      "type": "function",
      "name": "search_knowledge_base",
      "description": "Search the knowledge base for articles and solutions",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query"
          },
          "category": {
            "type": "string",
            "enum": ["troubleshooting", "how-to", "faq", "policy", "technical-specs"],
            "description": "Knowledge base category"
          }
        },
        "required": ["query"]
      }
    },
    {
      "type": "function",
      "name": "verify_account",
      "description": "Verify customer identity using account information",
      "parameters": {
        "type": "object",
        "properties": {
          "email": {
            "type": "string",
            "description": "Customer email address"
          },
          "last_four_digits": {
            "type": "string",
            "description": "Last 4 digits of payment method or phone"
          }
        },
        "required": ["email"]
      }
    }
  ],
  "tool_choice": "auto"
}
```

## Multi-Language Support

### Voice Configurations by Language

```json
{
  "en-US": {
    "voice": { "type": "azure-standard", "name": "en-US-Jenny" },
    "greeting": "Hello! I'm Alex, your customer support agent. How can I help you today?"
  },
  "es-ES": {
    "voice": { "type": "azure-standard", "name": "es-ES-Elvira" },
    "greeting": "¡Hola! Soy Alex, su agente de atención al cliente. ¿Cómo puedo ayudarle hoy?"
  },
  "fr-FR": {
    "voice": { "type": "azure-standard", "name": "fr-FR-Denise" },
    "greeting": "Bonjour! Je suis Alex, votre agent du service client. Comment puis-je vous aider aujourd'hui?"
  },
  "de-DE": {
    "voice": { "type": "azure-standard", "name": "de-DE-Katja" },
    "greeting": "Hallo! Ich bin Alex, Ihr Kundendienstmitarbeiter. Wie kann ich Ihnen heute helfen?"
  },
  "it-IT": {
    "voice": { "type": "azure-standard", "name": "it-IT-Isabella" },
    "greeting": "Ciao! Sono Alex, il tuo agente di assistenza clienti. Come posso aiutarti oggi?"
  },
  "ja-JP": {
    "voice": { "type": "azure-standard", "name": "ja-JP-Nanami" },
    "greeting": "こんにちは!カスタマーサポート担当のAlexです。本日はどのようなご用件でしょうか?"
  },
  "pt-BR": {
    "voice": { "type": "azure-standard", "name": "pt-BR-Francisca" },
    "greeting": "Olá! Sou Alex, seu agente de suporte ao cliente. Como posso ajudá-lo hoje?"
  },
  "zh-CN": {
    "voice": { "type": "azure-standard", "name": "zh-CN-Xiaoxiao" },
    "greeting": "您好!我是Alex，您的客户支持专员。今天我能帮您什么?"
  },
  "ko-KR": {
    "voice": { "type": "azure-standard", "name": "ko-KR-SunHi" },
    "greeting": "안녕하세요! 고객 지원 담당자 Alex입니다. 오늘 어떻게 도와드릴까요?"
  },
  "hi-IN": {
    "voice": { "type": "azure-standard", "name": "hi-IN-Swara" },
    "greeting": "नमस्ते! मैं Alex हूँ, आपका ग्राहक सहायता एजेंट। आज मैं आपकी कैसे मदद कर सकता हूँ?"
  }
}
```

## Example Conversations

### Scenario 1: Order Status Inquiry

```
Customer: "Hi, I'm calling about my order."

Agent: "Hello! I'd be happy to help you with your order. Can you please provide me with your order number?"

Customer: "It's ORD-789456"

Agent: [Calls check_order_status function]
"I've found your order! It's currently in transit and scheduled to arrive on Friday, November 22nd. You should receive a tracking number via email within the next hour. Is there anything else I can help you with?"

Customer: "No, that's perfect. Thank you!"

Agent: "You're very welcome! If you have any other questions, feel free to reach out. Have a great day!"
```

### Scenario 2: Technical Issue with Escalation

```
Customer: "My device won't turn on and I've tried everything!"

Agent: "I'm sorry to hear you're having trouble with your device. Let me help you troubleshoot this. Can you tell me what happens when you try to power it on?"

Customer: "Nothing at all. It's completely dead."

Agent: "I understand how frustrating that must be. Let's try a few things. First, can you confirm the device is plugged in or the battery is charged?"

Customer: "Yes, I've had it charging overnight."

Agent: "Thank you for checking. Let's try a hard reset by holding the power button for 15 seconds..."

Customer: [Tries it] "Still nothing. This is ridiculous! I need this fixed now!"

Agent: [Detects frustration, searches knowledge base, determines issue needs hardware inspection]
"I completely understand your frustration, and I apologize for the inconvenience. Based on what you've described, this may require a hardware inspection. Let me connect you with our technical support specialist who can arrange a repair or replacement for you. I'll brief them on everything we've tried so you don't have to repeat yourself. Is that okay?"

Customer: "Yes, please."

Agent: [Calls escalate_to_human function with summary]
"I'm transferring you now. They'll be with you in just a moment. Thank you for your patience."
```

### Scenario 3: Billing Question

```
Customer: "I was charged twice for my subscription."

Agent: "I apologize for the billing error. Let me look into that right away. Can you verify your account by providing your email address?"

Customer: "It's john.doe@email.com"

Agent: [Calls verify_account function]
"Thank you, John. I see your account here. To investigate the double charge, I'll need to escalate this to our billing department, as they have access to process refunds. I'll create a high-priority ticket for you right now."

[Calls create_support_ticket with priority: high]

"I've created ticket #SUP-12345 for you. Our billing team will review this within 24 hours and process the refund if confirmed. You'll receive email updates at john.doe@email.com. Is there anything else I can help with?"
```

## Integration Points

### CRM Integration

```typescript
// Function implementation example
async function checkOrderStatus(orderNumber: string) {
  // Call your CRM/order management system
  const order = await crmClient.orders.get(orderNumber);
  
  return {
    order_number: order.id,
    status: order.status,
    tracking_number: order.tracking,
    estimated_delivery: order.deliveryDate,
    items: order.items.map(i => ({ name: i.name, quantity: i.qty }))
  };
}
```

### Knowledge Base Integration (VoiceRAG)

```typescript
async function searchKnowledgeBase(query: string, category?: string) {
  // Use Azure AI Search or your knowledge base
  const results = await aiSearchClient.search(query, {
    filter: category ? `category eq '${category}'` : undefined,
    top: 3
  });
  
  return results.map(r => ({
    title: r.title,
    content: r.content,
    url: r.url,
    relevance: r.score
  }));
}
```

### Escalation Workflow

```typescript
async function escalateToHuman(reason: string, summary: string, sentiment: string) {
  // Route to available human agent
  const agent = await routingService.findAvailableAgent({
    department: 'customer-support',
    skills: ['technical', 'billing'],
    priority: sentiment === 'angry' ? 'urgent' : 'normal'
  });
  
  // Transfer call with context
  await callService.transfer({
    agentId: agent.id,
    context: {
      reason,
      summary,
      sentiment,
      conversationHistory: getHistory()
    }
  });
  
  return { transferred: true, agent: agent.name, estimatedWait: agent.queueTime };
}
```

## Metrics & Analytics

### Track These KPIs

- **First Contact Resolution (FCR)** - Issues resolved without escalation
- **Average Handle Time (AHT)** - Duration of customer interactions
- **Customer Satisfaction (CSAT)** - Post-call ratings
- **Escalation Rate** - % of calls transferred to humans
- **Sentiment Distribution** - Positive/neutral/negative percentages
- **Top Issues** - Most common problem categories
- **Language Distribution** - Calls by language

### Implementation

```typescript
// Log interaction metrics
await analyticsService.logInteraction({
  sessionId: session.id,
  duration: session.duration,
  resolved: !session.escalated,
  sentiment: detectSentiment(session.transcript),
  language: session.language,
  issueCategory: session.category,
  satisfactionRating: session.rating
});
```

## Customization

### Adjust Personality

Modify the `instructions` field to change agent personality:

**More Formal:**
```
"You are a professional customer service representative. Maintain a courteous and formal tone..."
```

**More Casual:**
```
"You're a friendly customer support buddy. Be warm, conversational, and use casual language..."
```

**Industry-Specific:**
```
"You are a healthcare support specialist. Use empathetic language and prioritize patient privacy..."
```

### Modify Escalation Rules

```json
{
  "escalation_rules": {
    "auto_escalate_keywords": ["lawsuit", "lawyer", "legal action", "supervisor now"],
    "sentiment_threshold": -0.7,
    "repeat_issue_count": 2,
    "max_duration_minutes": 15
  }
}
```

## Deployment

### Environment Variables

```bash
# Copy from .env.example
AZURE_RESOURCE_NAME=your-resource
AZURE_SPEECH_API_KEY=your-key
DEFAULT_MODEL=gpt-4o
AGENT_CONFIG=agents/customer-support/config.json

# Optional integrations
CRM_API_URL=https://your-crm.com/api
CRM_API_KEY=your-crm-key
KNOWLEDGE_BASE_ENDPOINT=https://your-kb-search.com
```

### Quick Start

```bash
cd samples/typescript/agent-service-integration
npm install
cp .env.example .env
# Edit .env with your settings
npm start -- --agent=customer-support
```

## Testing

### Test Scenarios

1. **Happy Path** - Simple order status check
2. **Escalation** - Complex technical issue
3. **Multi-Language** - Switch languages mid-conversation
4. **Sentiment** - Test frustration detection
5. **Function Calling** - Verify all tools work
6. **Edge Cases** - Profanity, silence, background noise

### Sample Test Script

See `agents/customer-support/test-scenarios.md` for detailed test cases.

## Best Practices

1. **Keep responses concise** - Max 2-3 sentences per turn
2. **Use active listening** - Acknowledge customer concerns
3. **Set expectations** - Provide realistic timeframes
4. **Personalize** - Use customer name when available
5. **Stay positive** - Focus on solutions, not problems
6. **Document everything** - Log interactions for analysis
7. **Monitor sentiment** - Intervene when frustration detected
8. **Update knowledge base** - Add solutions for recurring issues

## Limitations

- Cannot access actual customer accounts (requires integration)
- Cannot process payments (escalate to secure system)
- Cannot make binding commitments (policy decisions)
- Limited to configured knowledge base
- No visual interface access (for troubleshooting)

## Next Steps

- **[Technical Support Agent](../technical-support/)** - IT troubleshooting focus
- **[Sales Assistant Agent](../sales-assistant/)** - Lead qualification
- **[Healthcare Triage Agent](../healthcare-triage/)** - Medical screening

---

**[← Back to Agents](../README.md#-pre-built-agent-scenarios) | [View All Agents](../) | [Deploy Guide →](../../docs/09-production.md)**
