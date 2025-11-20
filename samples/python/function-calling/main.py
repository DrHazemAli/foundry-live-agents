import asyncio
import json
import os
import websockets
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Function definitions
FUNCTIONS = [
    {
        "type": "function",
        "name": "get_weather",
        "description": "Get current weather information for a specific location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": 'City name or zip code (e.g., "Seattle" or "98101")'
                },
                "units": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature units to use",
                    "default": "fahrenheit"
                }
            },
            "required": ["location"]
        }
    },
    {
        "type": "function",
        "name": "get_stock_price",
        "description": "Get current stock price and information",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": 'Stock ticker symbol (e.g., "MSFT", "AAPL")'
                }
            },
            "required": ["symbol"]
        }
    },
    {
        "type": "function",
        "name": "schedule_meeting",
        "description": "Schedule a meeting on the calendar",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Meeting title"
                },
                "datetime": {
                    "type": "string",
                    "description": "Meeting date and time in ISO 8601 format"
                },
                "duration_minutes": {
                    "type": "number",
                    "description": "Meeting duration in minutes",
                    "default": 30
                },
                "attendees": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of attendee email addresses"
                }
            },
            "required": ["title", "datetime"]
        }
    }
]

# Function implementations
def get_weather(location: str, units: str = "fahrenheit") -> dict:
    """Simulate weather API call"""
    print(f"📍 Getting weather for {location} in {units}...")
    
    return {
        "location": location,
        "temperature": 17 if units == "celsius" else 62,
        "conditions": "Partly cloudy",
        "humidity": 65,
        "wind_speed": 15 if units == "celsius" else 9,
        "units": units
    }

def get_stock_price(symbol: str) -> dict:
    """Simulate stock API call"""
    print(f"📈 Getting stock price for {symbol}...")
    
    return {
        "symbol": symbol.upper(),
        "price": 380.50,
        "change": 5.25,
        "change_percent": 1.4,
        "volume": 25430000,
        "timestamp": datetime.now().isoformat()
    }

def schedule_meeting(title: str, datetime_str: str, duration_minutes: int = 30, attendees: list = None) -> dict:
    """Simulate calendar API call"""
    print(f"📅 Scheduling meeting: {title} at {datetime_str}...")
    
    return {
        "id": f"meeting_{int(datetime.now().timestamp())}",
        "title": title,
        "datetime": datetime_str,
        "duration_minutes": duration_minutes,
        "attendees": attendees or [],
        "status": "scheduled",
        "meeting_link": "https://teams.microsoft.com/meet/abc123"
    }

# Function executor
def execute_function(name: str, args: dict) -> dict:
    """Execute the appropriate function"""
    try:
        if name == "get_weather":
            return get_weather(args.get("location"), args.get("units", "fahrenheit"))
        elif name == "get_stock_price":
            return get_stock_price(args.get("symbol"))
        elif name == "schedule_meeting":
            return schedule_meeting(
                args.get("title"),
                args.get("datetime"),
                args.get("duration_minutes", 30),
                args.get("attendees", [])
            )
        else:
            return {"error": f"Unknown function: {name}"}
    except Exception as e:
        print(f"Error executing function {name}: {e}")
        return {"error": str(e)}

async def main():
    api_key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")
    deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o-realtime-preview")

    print("🚀 Starting Function Calling Sample...\n")

    url = f"wss://{region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment={deployment}"
    
    headers = {"api-key": api_key}

    async with websockets.connect(url, extra_headers=headers) as ws:
        print("✅ Connected to Voice Live API\n")

        # Configure session with functions
        session_config = {
            "type": "session.update",
            "session": {
                "model": "gpt-4o-realtime-preview",
                "modalities": ["text", "audio"],
                "voice": "alloy",
                "instructions": """You are a helpful assistant with access to tools.
You can check weather, get stock prices, and schedule meetings.
Be concise and use the tools when appropriate.""",
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
        print("⚙️  Session configured with function calling\n")

        # Test query
        await asyncio.sleep(1)
        print('💬 Sending test query: "What\'s the weather in Seattle?"\n')
        
        await ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": "What's the weather in Seattle?"
                }]
            }
        }))

        await ws.send(json.dumps({"type": "response.create"}))

        # Event loop
        test_count = 0
        async for message in ws:
            event = json.loads(message)
            event_type = event.get("type")

            if event_type == "session.created":
                print(f"📡 Session created: {event['session']['id']}")
            
            elif event_type == "session.updated":
                print("✅ Session updated with functions\n")
            
            elif event_type == "response.function_call":
                print("\n🔧 Function call requested:")
                print(f"   Function: {event['name']}")
                print(f"   Arguments: {event['arguments']}")
                print(f"   Call ID: {event['call_id']}\n")

                # Parse arguments
                args = json.loads(event['arguments'])

                # Execute function
                result = execute_function(event['name'], args)
                print(f"   Result: {json.dumps(result, indent=2)}\n")

                # Return result to agent
                await ws.send(json.dumps({
                    "type": "conversation.item.create",
                    "item": {
                        "type": "function_call_output",
                        "call_id": event['call_id'],
                        "output": json.dumps(result)
                    }
                }))

                # Trigger response with function result
                await ws.send(json.dumps({"type": "response.create"}))
            
            elif event_type == "response.text.delta":
                print(event['delta'], end='', flush=True)
            
            elif event_type == "response.text.done":
                print()
            
            elif event_type == "response.done":
                print("✅ Response complete\n")
                
                # Test another function
                if test_count == 0:
                    test_count += 1
                    await asyncio.sleep(2)
                    print('💬 Sending second query: "What about Microsoft stock?"\n')
                    
                    await ws.send(json.dumps({
                        "type": "conversation.item.create",
                        "item": {
                            "type": "message",
                            "role": "user",
                            "content": [{
                                "type": "input_text",
                                "text": "What about Microsoft stock?"
                            }]
                        }
                    }))

                    await ws.send(json.dumps({"type": "response.create"}))
                else:
                    # Done with tests
                    await asyncio.sleep(2)
                    print("🎉 Sample complete!\n")
                    break
            
            elif event_type == "error":
                print(f"❌ Error: {event['error']}")

if __name__ == "__main__":
    asyncio.run(main())
