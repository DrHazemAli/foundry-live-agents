# Function Calling Sample

This sample demonstrates how to implement function calling with Azure Speech Voice Live API, allowing the AI agent to call functions to retrieve data or perform actions.

## Features

- Function definition and registration
- Function execution handling
- Results returned to the agent
- Error handling for function calls
- Multiple function support

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

### 1. Define Functions

Functions are defined with JSON Schema to describe parameters:

```typescript
const functions = [
  {
    type: 'function',
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or zip code'
        },
        units: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature units'
        }
      },
      required: ['location']
    }
  }
];
```

### 2. Register Functions

Functions are included in the session configuration:

```typescript
const config = {
  model: 'gpt-4o-realtime-preview',
  tools: functions,
  tool_choice: 'auto'
};
```

### 3. Handle Function Calls

When the AI decides to call a function, implement the logic:

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  if (event.type === 'response.function_call') {
    const { name, arguments: args, call_id } = event;
    
    // Execute function
    const result = executeFu nction(name, JSON.parse(args));
    
    // Return result to agent
    ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id,
        output: JSON.stringify(result)
      }
    }));
    
    // Trigger response
    ws.send(JSON.stringify({ type: 'response.create' }));
  }
});
```

## Example Conversation

**User**: "What's the weather in Seattle?"

**Agent**: *calls get_weather function*

**Function Result**: `{ "temperature": 62, "conditions": "Partly cloudy" }`

**Agent**: "It's currently 62°F and partly cloudy in Seattle."

## Best Practices

1. **Clear Descriptions**: Write detailed function and parameter descriptions
2. **Validation**: Validate parameters before executing functions
3. **Error Handling**: Return meaningful error messages
4. **Async Operations**: Handle async functions properly
5. **Timeouts**: Implement timeouts for long-running functions

## Common Issues

### Function Not Called

- Check function description is clear and specific
- Verify parameter schema is correct
- Ensure tool_choice is set appropriately

### Invalid Parameters

- Add validation before function execution
- Use enums for known values
- Include parameter descriptions

## Next Steps

- Explore [Multi-Language Sample](../multi-language/)
- Learn about [VoiceRAG Pattern](../voicerag-pattern/)
- Read [Function Calling Guide](../../docs/05-agent-scenarios.md#function-calling-deep-dive)
