# Function Calling Sample (Python)

This sample demonstrates how to implement function calling with Azure Speech Voice Live API in Python, allowing the AI agent to call functions to retrieve data or perform actions.

## Features

- Function definition and registration
- Function execution handling
- Results returned to the agent
- Error handling for function calls
- Multiple function support

## Prerequisites

- Python 3.8 or later
- Azure Speech Services resource with Voice Live enabled
- pip package manager

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```env
AZURE_SPEECH_KEY=your-api-key
AZURE_SPEECH_REGION=eastus
DEPLOYMENT_NAME=gpt-4o-realtime-preview
```

3. Run the sample:
```bash
python main.py
```

## How It Works

### 1. Define Functions

Functions are defined with JSON Schema to describe parameters:

```python
functions = [
    {
        "type": "function",
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name or zip code"
                },
                "units": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature units"
                }
            },
            "required": ["location"]
        }
    }
]
```

### 2. Register Functions

Functions are included in the session configuration:

```python
config = {
    "model": "gpt-4o-realtime-preview",
    "tools": functions,
    "tool_choice": "auto"
}
```

### 3. Handle Function Calls

When the AI decides to call a function, implement the logic:

```python
if event["type"] == "response.function_call":
    name = event["name"]
    args = json.loads(event["arguments"])
    
    # Execute function
    result = execute_function(name, args)
    
    # Return result to agent
    ws.send(json.dumps({
        "type": "conversation.item.create",
        "item": {
            "type": "function_call_output",
            "call_id": event["call_id"],
            "output": json.dumps(result)
        }
    }))
    
    # Trigger response
    ws.send(json.dumps({"type": "response.create"}))
```

## Example Functions

- `get_weather(location, units)` - Weather information
- `get_stock_price(symbol)` - Stock price data
- `schedule_meeting(title, datetime, attendees)` - Calendar integration

## Best Practices

1. **Clear Descriptions**: Write detailed function and parameter descriptions
2. **Validation**: Validate parameters before executing functions
3. **Error Handling**: Return meaningful error messages
4. **Async Operations**: Use asyncio for async functions
5. **Timeouts**: Implement timeouts for long-running functions

## Next Steps

- Explore [Multi-Language Sample](../multi-language/)
- Learn about [VoiceRAG Pattern](../voicerag-pattern/)
- Read [Function Calling Guide](../../../docs/05-agent-scenarios.md)
