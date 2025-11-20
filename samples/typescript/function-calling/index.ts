import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

interface FunctionCall {
  name: string;
  arguments: string;
  call_id: string;
}

// Function definitions
const functions = [
  {
    type: 'function',
    name: 'get_weather',
    description: 'Get current weather information for a specific location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or zip code (e.g., "Seattle" or "98101")'
        },
        units: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature units to use',
          default: 'fahrenheit'
        }
      },
      required: ['location']
    }
  },
  {
    type: 'function',
    name: 'get_stock_price',
    description: 'Get current stock price and information',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (e.g., "MSFT", "AAPL")'
        }
      },
      required: ['symbol']
    }
  },
  {
    type: 'function',
    name: 'schedule_meeting',
    description: 'Schedule a meeting on the calendar',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Meeting title'
        },
        datetime: {
          type: 'string',
          description: 'Meeting date and time in ISO 8601 format'
        },
        duration_minutes: {
          type: 'number',
          description: 'Meeting duration in minutes',
          default: 30
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of attendee email addresses'
        }
      },
      required: ['title', 'datetime']
    }
  }
];

// Function implementations
function getWeather(location: string, units: string = 'fahrenheit'): object {
  // Simulate weather API call
  console.log(`📍 Getting weather for ${location} in ${units}...`);
  
  const weatherData = {
    location,
    temperature: units === 'celsius' ? 17 : 62,
    conditions: 'Partly cloudy',
    humidity: 65,
    wind_speed: units === 'celsius' ? 15 : 9,
    units
  };
  
  return weatherData;
}

function getStockPrice(symbol: string): object {
  // Simulate stock API call
  console.log(`📈 Getting stock price for ${symbol}...`);
  
  const stockData = {
    symbol: symbol.toUpperCase(),
    price: 380.50,
    change: 5.25,
    change_percent: 1.4,
    volume: 25430000,
    timestamp: new Date().toISOString()
  };
  
  return stockData;
}

function scheduleMeeting(
  title: string,
  datetime: string,
  duration_minutes: number = 30,
  attendees: string[] = []
): object {
  // Simulate calendar API call
  console.log(`📅 Scheduling meeting: ${title} at ${datetime}...`);
  
  const meeting = {
    id: `meeting_${Date.now()}`,
    title,
    datetime,
    duration_minutes,
    attendees,
    status: 'scheduled',
    meeting_link: 'https://teams.microsoft.com/meet/abc123'
  };
  
  return meeting;
}

// Function executor
function executeFunction(name: string, args: any): object {
  try {
    switch (name) {
      case 'get_weather':
        return getWeather(args.location, args.units);
      
      case 'get_stock_price':
        return getStockPrice(args.symbol);
      
      case 'schedule_meeting':
        return scheduleMeeting(
          args.title,
          args.datetime,
          args.duration_minutes,
          args.attendees
        );
      
      default:
        return {
          error: `Unknown function: ${name}`
        };
    }
  } catch (error) {
    console.error(`Error executing function ${name}:`, error);
    return {
      error: error instanceof Error ? error.message : 'Function execution failed'
    };
  }
}

async function main() {
  const apiKey = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-realtime-preview';

  console.log('🚀 Starting Function Calling Sample...\n');

  // Create WebSocket connection
  const url = `wss://${region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${deployment}`;
  
  const ws = new WebSocket(url, {
    headers: {
      'api-key': apiKey
    }
  });

  ws.on('open', () => {
    console.log('✅ Connected to Voice Live API\n');

    // Configure session with functions
    const sessionConfig = {
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: `You are a helpful assistant with access to tools. 
You can check weather, get stock prices, and schedule meetings.
Be concise and use the tools when appropriate.`,
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
        tool_choice: 'auto', // Let the model decide when to use tools
        temperature: 0.7,
        max_response_output_tokens: 1024
      }
    };

    ws.send(JSON.stringify(sessionConfig));
    console.log('⚙️  Session configured with function calling\n');

    // Test function calling with a text message
    setTimeout(() => {
      console.log('💬 Sending test query: "What\'s the weather in Seattle?"\n');
      
      ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: "What's the weather in Seattle?"
          }]
        }
      }));

      ws.send(JSON.stringify({ type: 'response.create' }));
    }, 1000);
  });

  ws.on('message', (data: WebSocket.Data) => {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'session.created':
        console.log('📡 Session created:', event.session.id);
        break;

      case 'session.updated':
        console.log('✅ Session updated with functions\n');
        break;

      case 'response.function_call':
        console.log('\n🔧 Function call requested:');
        console.log(`   Function: ${event.name}`);
        console.log(`   Arguments: ${event.arguments}`);
        console.log(`   Call ID: ${event.call_id}\n`);

        // Parse arguments
        const args = JSON.parse(event.arguments);

        // Execute function
        const result = executeFunction(event.name, args);
        console.log('   Result:', JSON.stringify(result, null, 2), '\n');

        // Return result to agent
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify(result)
          }
        }));

        // Trigger response with function result
        ws.send(JSON.stringify({ type: 'response.create' }));
        break;

      case 'response.text.delta':
        process.stdout.write(event.delta);
        break;

      case 'response.text.done':
        console.log('\n');
        break;

      case 'response.done':
        console.log('✅ Response complete\n');
        
        // Test another function
        if (event.response.output.some((item: any) => 
          item.content?.some((c: any) => c.text?.includes('Seattle'))
        )) {
          setTimeout(() => {
            console.log('💬 Sending second query: "What about Microsoft stock?"\n');
            
            ws.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{
                  type: 'input_text',
                  text: "What about Microsoft stock?"
                }]
              }
            }));

            ws.send(JSON.stringify({ type: 'response.create' }));
          }, 2000);
        } else {
          // Done with tests
          setTimeout(() => {
            console.log('🎉 Sample complete!\n');
            ws.close();
          }, 2000);
        }
        break;

      case 'error':
        console.error('❌ Error:', event.error);
        break;

      default:
        // Uncomment to see all events
        // console.log('Event:', event.type);
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
