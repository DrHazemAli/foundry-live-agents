import asyncio
import json
import os
import time
import websockets
from dotenv import load_dotenv

load_dotenv()

class StreamingHandler:
    def __init__(self):
        self.text_buffer = ""
        self.start_time = 0
        self.token_count = 0
        
    def start_response(self):
        self.start_time = time.time()
        self.token_count = 0
        self.text_buffer = ""
        print("🚀 Streaming started...\n")
    
    def handle_text_delta(self, delta: str):
        print(delta, end='', flush=True)
        self.text_buffer += delta
        self.token_count += 1
    
    def handle_text_done(self, text: str):
        duration = (time.time() - self.start_time) * 1000
        tokens_per_sec = (self.token_count / duration * 1000) if duration > 0 else 0
        
        print('\n')
        print(f"📊 Text metrics:")
        print(f"   Duration: {duration:.0f}ms")
        print(f"   Tokens: {self.token_count}")
        print(f"   Speed: {tokens_per_sec:.1f} tokens/sec")
        print(f"   Length: {len(text)} characters\n")

class SentenceBuffer:
    def __init__(self):
        self.buffer = ""
        self.sentences = []
    
    def add(self, delta: str):
        self.buffer += delta
        new_sentences = []
        
        # Extract complete sentences
        import re
        parts = re.split(r'([.!?])\s+', self.buffer)
        
        i = 0
        while i < len(parts) - 1:
            if i + 1 < len(parts) and parts[i + 1] in '.!?':
                sentence = (parts[i] + parts[i + 1]).strip()
                if sentence:
                    new_sentences.append(sentence)
                    self.sentences.append(sentence)
                i += 2
            else:
                i += 1
        
        # Keep remainder
        if parts:
            self.buffer = parts[-1] if len(parts) % 2 == 1 else ""
        
        return new_sentences
    
    def flush(self):
        remaining = self.buffer
        self.buffer = ""
        return remaining

async def demonstrate_immediate_streaming(ws):
    print('\n' + '='*70)
    print('DEMO 1: Immediate Streaming (token-by-token)')
    print('='*70 + '\n')

    handler = StreamingHandler()
    is_streaming = False

    await ws.send(json.dumps({
        "type": "conversation.item.create",
        "item": {
            "type": "message",
            "role": "user",
            "content": [{
                "type": "input_text",
                "text": "Tell me a short story about a robot learning to paint."
            }]
        }
    }))
    await ws.send(json.dumps({"type": "response.create"}))

    async for message in ws:
        event = json.loads(message)
        event_type = event.get("type")

        if event_type == "response.text.delta":
            if not is_streaming:
                handler.start_response()
                is_streaming = True
            handler.handle_text_delta(event['delta'])
        elif event_type == "response.text.done":
            handler.handle_text_done(event['text'])
            break

async def demonstrate_sentence_buffering(ws):
    print('\n' + '='*70)
    print('DEMO 2: Sentence Buffering (emit complete sentences)')
    print('='*70 + '\n')

    buffer = SentenceBuffer()
    sentence_count = 0

    await ws.send(json.dumps({
        "type": "conversation.item.create",
        "item": {
            "type": "message",
            "role": "user",
            "content": [{
                "type": "input_text",
                "text": "Explain how photosynthesis works in three sentences."
            }]
        }
    }))
    await ws.send(json.dumps({"type": "response.create"}))

    async for message in ws:
        event = json.loads(message)
        event_type = event.get("type")

        if event_type == "response.text.delta":
            sentences = buffer.add(event['delta'])
            for sentence in sentences:
                sentence_count += 1
                print(f"[Sentence {sentence_count}] {sentence}\n")
        elif event_type == "response.text.done":
            remaining = buffer.flush()
            if remaining:
                print(f"[Remainder] {remaining}\n")
            print(f"📊 Total sentences emitted: {sentence_count}\n")
            break

async def main():
    api_key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")
    deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o-realtime-preview")

    print("🌊 Starting Streaming Responses Sample...\n")

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
                "instructions": "You are a helpful assistant. Be concise and clear.",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "silence_duration_ms": 500
                },
                "temperature": 0.8,
                "max_response_output_tokens": 512
            }
        }

        await ws.send(json.dumps(session_config))
        await asyncio.sleep(1)

        # Run demonstrations
        await demonstrate_immediate_streaming(ws)
        await asyncio.sleep(2)
        
        await demonstrate_sentence_buffering(ws)
        await asyncio.sleep(2)

        print("\n🎉 Streaming demonstrations complete!\n")

if __name__ == "__main__":
    asyncio.run(main())
