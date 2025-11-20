import asyncio
import json
import os
import websockets
from dotenv import load_dotenv

load_dotenv()

class InterruptionHandler:
    def __init__(self, ws):
        self.ws = ws
        self.assistant_is_speaking = False
        self.current_response_id = None
        self.partial_response = ""
        self.interruption_count = 0
    
    async def handle_speech_started(self):
        if self.assistant_is_speaking:
            self.interruption_count += 1
            print(f"\n\n🚨 INTERRUPTION DETECTED!")
            print(f"   (Total interruptions: {self.interruption_count})")
            await self.cancel_current_response()
        else:
            print("\n👂 User started speaking...")
    
    def handle_speech_stopped(self):
        if not self.assistant_is_speaking:
            print("🔇 User stopped speaking\n")
    
    def handle_response_started(self, response_id: str):
        self.assistant_is_speaking = True
        self.current_response_id = response_id
        self.partial_response = ""
        print("\n🤖 Assistant: ")
    
    def handle_text_delta(self, delta: str):
        print(delta, end='', flush=True)
        self.partial_response += delta
    
    def handle_response_done(self):
        print()
        self.assistant_is_speaking = False
        self.current_response_id = None
        
        if self.partial_response:
            print(f"📝 Complete response ({len(self.partial_response)} chars)\n")
    
    def handle_response_canceled(self):
        print("\n❌ Response CANCELED")
        
        if self.partial_response:
            print(f"📄 Partial response before interruption:")
            print(f'   "{self.partial_response}"\n')
        
        self.assistant_is_speaking = False
        self.current_response_id = None
    
    async def cancel_current_response(self):
        if not self.current_response_id:
            print("   ⚠️  No active response to cancel")
            return
        
        print(f"   🛑 Canceling response: {self.current_response_id}")
        
        await self.ws.send(json.dumps({
            "type": "response.cancel",
            "response_id": self.current_response_id
        }))
    
    def get_stats(self):
        return {
            "total_interruptions": self.interruption_count,
            "currently_interruptible": self.assistant_is_speaking
        }

async def main():
    api_key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")
    deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o-realtime-preview")

    print("🚨 Starting Interruption Handling Sample...\n")

    url = f"wss://{region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment={deployment}"
    headers = {"api-key": api_key}

    async with websockets.connect(url, extra_headers=headers) as ws:
        print("✅ Connected to Voice Live API\n")

        handler = InterruptionHandler(ws)

        # Configure session
        session_config = {
            "type": "session.update",
            "session": {
                "model": "gpt-4o-realtime-preview",
                "modalities": ["text", "audio"],
                "voice": "alloy",
                "instructions": """You are a helpful assistant in an interruptible conversation.
Keep your responses conversational. If interrupted, that's completely normal.""",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.4,
                    "silence_duration_ms": 400,
                    "prefix_padding_ms": 200,
                    "create_response": True
                },
                "temperature": 0.8,
                "max_response_output_tokens": 1024
            }
        }

        await ws.send(json.dumps(session_config))
        print("⚙️  Session configured with interruption support")
        print("   VAD threshold: 0.4 (sensitive)")
        print("   Silence duration: 400ms\n")

        # Test messages
        test_messages = [
            "Tell me a long story about space exploration.",
            "Actually, can you make it shorter?"
        ]

        message_index = 0

        await asyncio.sleep(1)
        
        # Send first message
        print(f"💬 You: {test_messages[message_index]}\n")
        await ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": test_messages[message_index]
                }]
            }
        }))
        await ws.send(json.dumps({"type": "response.create"}))
        message_index += 1

        # Event loop
        async for message in ws:
            event = json.loads(message)
            event_type = event.get("type")

            if event_type == "session.created":
                print(f"📡 Session created: {event['session']['id']}")
            
            elif event_type == "session.updated":
                print("✅ Session updated\n")
            
            elif event_type == "input_audio_buffer.speech_started":
                await handler.handle_speech_started()
            
            elif event_type == "input_audio_buffer.speech_stopped":
                handler.handle_speech_stopped()
            
            elif event_type == "input_audio_transcription.completed":
                if event.get("transcript"):
                    print(f"📝 Transcription: \"{event['transcript']}\"\n")
            
            elif event_type == "response.created":
                handler.handle_response_started(event['response']['id'])
            
            elif event_type == "response.text.delta":
                handler.handle_text_delta(event['delta'])
            
            elif event_type == "response.done":
                handler.handle_response_done()
                
                # Send interruption after first response
                if message_index < len(test_messages):
                    await asyncio.sleep(2)
                    print(f"💬 You: {test_messages[message_index]}\n")
                    await ws.send(json.dumps({
                        "type": "conversation.item.create",
                        "item": {
                            "type": "message",
                            "role": "user",
                            "content": [{
                                "type": "input_text",
                                "text": test_messages[message_index]
                            }]
                        }
                    }))
                    await ws.send(json.dumps({"type": "response.create"}))
                    message_index += 1
                else:
                    await asyncio.sleep(1)
                    stats = handler.get_stats()
                    print(f"\n📊 Final Statistics:")
                    print(f"   Total interruptions handled: {stats['total_interruptions']}\n")
                    print("🎉 Sample complete!\n")
                    break
            
            elif event_type == "response.canceled":
                handler.handle_response_canceled()
            
            elif event_type == "error":
                print(f"❌ Error: {event['error']}")

if __name__ == "__main__":
    asyncio.run(main())
