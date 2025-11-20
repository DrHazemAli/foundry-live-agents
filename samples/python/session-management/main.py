import asyncio
import json
import os
import time
import websockets
from dotenv import load_dotenv
from enum import Enum
from typing import Optional

load_dotenv()

class SessionState(Enum):
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    ERROR = "error"

class SessionManager:
    def __init__(self, api_key: str, region: str, deployment: str, config: dict):
        self.api_key = api_key
        self.region = region
        self.deployment = deployment
        self.config = config
        
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.state = SessionState.DISCONNECTED
        
        self.session_id: Optional[str] = None
        self.reconnect_attempts = 0
        
        self.metrics = {
            "connect_time": 0,
            "reconnect_count": 0,
            "messages_sent": 0,
            "messages_received": 0,
            "errors": 0,
            "last_ping_time": 0,
            "last_pong_time": 0,
            "average_latency": 0
        }
    
    async def connect(self):
        if self.state in [SessionState.CONNECTING, SessionState.CONNECTED]:
            print("⚠️  Already connected or connecting")
            return
        
        self.state = SessionState.CONNECTING
        print(f"🔌 Connecting to Voice Live API... (attempt {self.reconnect_attempts + 1})")
        
        url = f"wss://{self.region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment={self.deployment}"
        headers = {"api-key": self.api_key}
        
        try:
            self.ws = await asyncio.wait_for(
                websockets.connect(url, extra_headers=headers),
                timeout=self.config["connection_timeout"]
            )
            
            self.state = SessionState.CONNECTED
            self.metrics["connect_time"] = time.time()
            self.reconnect_attempts = 0
            
            print("✅ Connected successfully\n")
            
            await self.configure_session()
            asyncio.create_task(self.keepalive_loop())
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            self.metrics["errors"] += 1
            raise
    
    async def configure_session(self):
        session_config = {
            "type": "session.update",
            "session": {
                "model": "gpt-4o-realtime-preview",
                "modalities": ["text", "audio"],
                "voice": "alloy",
                "instructions": "You are a helpful assistant with session management.",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "silence_duration_ms": 500
                },
                "temperature": 0.8,
                "max_response_output_tokens": 1024
            }
        }
        
        await self.send(session_config)
        print("⚙️  Session configured\n")
    
    async def send(self, data: dict):
        if self.state != SessionState.CONNECTED or not self.ws:
            print("⚠️  Cannot send - not connected")
            return
        
        await self.ws.send(json.dumps(data))
        self.metrics["messages_sent"] += 1
    
    async def send_message(self, text: str):
        print(f"\n💬 You: {text}\n")
        
        await self.send({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": text}]
            }
        })
        
        await self.send({"type": "response.create"})
    
    async def keepalive_loop(self):
        print(f"💓 Keepalive started (interval: {self.config['keepalive_interval']}ms)\n")
        
        while self.state == SessionState.CONNECTED:
            await asyncio.sleep(self.config["keepalive_interval"] / 1000)
            
            if self.state == SessionState.CONNECTED:
                self.metrics["last_ping_time"] = time.time()
                print("🏓 Sending ping...")
                
                await self.send({
                    "type": "ping",
                    "timestamp": int(self.metrics["last_ping_time"] * 1000)
                })
    
    async def handle_event(self, event: dict):
        self.metrics["messages_received"] += 1
        event_type = event.get("type")
        
        if event_type == "session.created":
            self.session_id = event["session"]["id"]
            print(f"📡 Session created: {self.session_id}")
        
        elif event_type == "session.updated":
            print("✅ Session updated")
        
        elif event_type == "pong":
            self.metrics["last_pong_time"] = time.time()
            latency = (self.metrics["last_pong_time"] - self.metrics["last_ping_time"]) * 1000
            self.metrics["average_latency"] = (self.metrics["average_latency"] * 0.9) + (latency * 0.1)
            print(f"🏓 Pong received (latency: {latency:.0f}ms, avg: {self.metrics['average_latency']:.0f}ms)")
        
        elif event_type == "response.text.delta":
            print(event['delta'], end='', flush=True)
        
        elif event_type == "response.text.done":
            print()
        
        elif event_type == "error":
            self.metrics["errors"] += 1
            print(f"❌ Error: {event['error']}")
    
    async def reconnect(self):
        if self.reconnect_attempts >= self.config["max_reconnect_attempts"]:
            print(f"\n❌ Max reconnection attempts ({self.config['max_reconnect_attempts']}) reached")
            self.state = SessionState.ERROR
            return
        
        self.state = SessionState.RECONNECTING
        self.reconnect_attempts += 1
        self.metrics["reconnect_count"] += 1
        
        # Exponential backoff with jitter
        base_delay = self.config["reconnect_delay"] / 1000
        exponential_delay = base_delay * (2 ** (self.reconnect_attempts - 1))
        jitter = __import__('random').random()
        delay = min(exponential_delay + jitter, 30)
        
        print(f"\n🔄 Scheduling reconnection in {delay:.1f}s... (attempt {self.reconnect_attempts}/{self.config['max_reconnect_attempts']})")
        await asyncio.sleep(delay)
        
        try:
            await self.connect()
        except Exception as e:
            print(f"Reconnection failed: {e}")
            await self.reconnect()
    
    def print_metrics(self):
        uptime = time.time() - self.metrics["connect_time"]
        
        print('\n' + '='*60)
        print('📊 SESSION METRICS')
        print('='*60)
        print(f"State:              {self.state.value}")
        print(f"Session ID:         {self.session_id or 'N/A'}")
        print(f"Uptime:             {uptime:.1f}s")
        print(f"Reconnections:      {self.metrics['reconnect_count']}")
        print(f"Messages sent:      {self.metrics['messages_sent']}")
        print(f"Messages received:  {self.metrics['messages_received']}")
        print(f"Errors:             {self.metrics['errors']}")
        print(f"Average latency:    {self.metrics['average_latency']:.0f}ms")
        print('='*60 + '\n')
    
    async def disconnect(self):
        print("\n🛑 Disconnecting...")
        
        if self.ws:
            await self.ws.close()
            self.ws = None
        
        self.state = SessionState.DISCONNECTED

async def main():
    api_key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")
    deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o-realtime-preview")

    print("🎛️  Starting Session Management Sample...\n")

    config = {
        "max_reconnect_attempts": 5,
        "reconnect_delay": 1000,
        "keepalive_interval": 15000,
        "connection_timeout": 10
    }

    manager = SessionManager(api_key, region, deployment, config)

    try:
        # Initial connection
        await manager.connect()

        # Test conversation
        await asyncio.sleep(2)
        await manager.send_message("Hello! This is a test message.")

        # Process events
        async for message in manager.ws:
            event = json.loads(message)
            await manager.handle_event(event)
            
            if event.get("type") == "response.done":
                break

        await asyncio.sleep(5)
        await manager.send_message("Tell me a fun fact.")

        # Process more events
        async for message in manager.ws:
            event = json.loads(message)
            await manager.handle_event(event)
            
            if event.get("type") == "response.done":
                break

        # Wait for keepalive demonstration
        await asyncio.sleep(20)

        # Print metrics
        manager.print_metrics()

        # Clean disconnect
        await manager.disconnect()

        print("\n🎉 Session management demo complete!\n")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        await manager.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
