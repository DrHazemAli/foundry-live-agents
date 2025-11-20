import asyncio
import json
import os
import re
import websockets
from dotenv import load_dotenv

load_dotenv()

# Voice mapping for different languages
VOICE_MAP = {
    'en': 'en-US-AndrewMultilingualNeural',
    'es': 'es-ES-ElviraNeural',
    'fr': 'fr-FR-DeniseNeural',
    'de': 'de-DE-KatjaNeural',
    'it': 'it-IT-ElsaNeural',
    'ja': 'ja-JP-NanamiNeural',
    'ko': 'ko-KR-SunHiNeural',
    'zh': 'zh-CN-XiaoxiaoNeural',
    'pt': 'pt-BR-FranciscaNeural',
    'ar': 'ar-SA-ZariyahNeural',
    'hi': 'hi-IN-SwaraNeural',
    'ru': 'ru-RU-SvetlanaNeural'
}

LANGUAGE_NAMES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian'
}

class MultiLanguageAgent:
    def __init__(self, api_key: str, region: str, deployment: str):
        self.api_key = api_key
        self.region = region
        self.deployment = deployment
        self.ws = None
        self.current_language = 'en'
        self.detected_languages = set(['en'])

    def detect_language(self, text: str) -> str:
        """Simple language detection based on patterns"""
        patterns = {
            'es': [r'\b(hola|gracias|por favor|sí|no|buenos días)\b'],
            'fr': [r"\b(bonjour|merci|s'il vous plaît|oui|non|salut)\b"],
            'de': [r'\b(hallo|danke|bitte|ja|nein|guten tag)\b'],
            'it': [r'\b(ciao|grazie|per favore|sì|no|buongiorno)\b'],
            'pt': [r'\b(olá|obrigado|por favor|sim|não|bom dia)\b'],
            'ja': [r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]'],
            'ko': [r'[\uAC00-\uD7AF]'],
            'zh': [r'[\u4E00-\u9FFF]'],
            'ar': [r'[\u0600-\u06FF]'],
            'hi': [r'[\u0900-\u097F]'],
            'ru': [r'[\u0400-\u04FF]']
        }

        for lang, regex_list in patterns.items():
            for pattern in regex_list:
                if re.search(pattern, text, re.IGNORECASE):
                    self.detected_languages.add(lang)
                    return lang
        
        return None

    async def switch_language(self, new_lang: str):
        """Switch to a different language voice"""
        if self.current_language == new_lang:
            return
        
        self.current_language = new_lang
        print(f"🔄 Switching to {LANGUAGE_NAMES.get(new_lang, new_lang)} voice...\n")

        await self.ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "voice": VOICE_MAP[new_lang]
            }
        }))

    async def connect(self):
        """Connect to Voice Live API"""
        url = f"wss://{self.region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment={self.deployment}"
        headers = {"api-key": self.api_key}
        
        self.ws = await websockets.connect(url, extra_headers=headers)
        print("✅ Connected to Voice Live API\n")
        
        await self.configure_session()

    async def configure_session(self):
        """Configure session with multilingual support"""
        session_config = {
            "type": "session.update",
            "session": {
                "model": "gpt-4o-realtime-preview",
                "modalities": ["text", "audio"],
                "voice": VOICE_MAP[self.current_language],
                "instructions": """You are a multilingual AI assistant fluent in many languages.

IMPORTANT RULES:
1. ALWAYS respond in the SAME language the user speaks
2. If the user switches languages, immediately switch to that language
3. Be natural and conversational in each language
4. Adapt cultural context appropriately for each language
5. Never translate unless explicitly asked

You can communicate fluently in:
- English, Spanish, French, German, Italian
- Japanese, Korean, Chinese (Mandarin)
- Portuguese, Arabic, Hindi, Russian
- And many other languages

Respond with cultural awareness and natural expressions for each language.""",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": {
                    "type": "azure_semantic_vad_multilingual",
                    "threshold": 0.5,
                    "silence_duration_ms": 700,
                    "prefix_padding_ms": 300,
                    "create_response": True
                },
                "temperature": 0.8,
                "max_response_output_tokens": 1024
            }
        }

        await self.ws.send(json.dumps(session_config))
        print("⚙️  Session configured with multilingual support\n")

    async def send_message(self, text: str):
        """Send a text message"""
        print(f"\n💬 Sending: \"{text}\"\n")

        # Detect language and switch if needed
        detected_lang = self.detect_language(text)
        if detected_lang and detected_lang != self.current_language:
            print(f"🌍 Language detected: {LANGUAGE_NAMES.get(detected_lang, detected_lang)}")
            await self.switch_language(detected_lang)

        await self.ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": text
                }]
            }
        }))

        await self.ws.send(json.dumps({"type": "response.create"}))

    async def handle_events(self):
        """Handle incoming WebSocket events"""
        async for message in self.ws:
            event = json.loads(message)
            event_type = event.get("type")

            if event_type == "session.created":
                print(f"📡 Session created: {event['session']['id']}")
            
            elif event_type == "session.updated":
                print(f"✅ Session updated - Voice: {VOICE_MAP[self.current_language]}\n")
            
            elif event_type == "input_audio_transcription.completed":
                transcript = event.get("transcript")
                print(f"\n👤 User (transcribed): {transcript}")
                
                # Detect language
                detected_lang = self.detect_language(transcript)
                if detected_lang and detected_lang != self.current_language:
                    print(f"🌍 Language detected: {LANGUAGE_NAMES.get(detected_lang, detected_lang)}")
                    await self.switch_language(detected_lang)
            
            elif event_type == "response.text.delta":
                print(event['delta'], end='', flush=True)
            
            elif event_type == "response.text.done":
                print()
            
            elif event_type == "response.done":
                languages_list = ', '.join(LANGUAGE_NAMES.get(code, code) for code in self.detected_languages)
                print(f"📊 Languages used in conversation: {languages_list}\n")
                return True  # Signal completion
            
            elif event_type == "error":
                print(f"❌ Error: {event['error']}")
        
        return False

    async def disconnect(self):
        """Disconnect from Voice Live API"""
        if self.ws:
            await self.ws.close()

async def main():
    api_key = os.getenv("AZURE_SPEECH_KEY")
    region = os.getenv("AZURE_SPEECH_REGION")
    deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o-realtime-preview")

    print("🌍 Starting Multi-Language Sample...\n")

    agent = MultiLanguageAgent(api_key, region, deployment)

    try:
        await agent.connect()

        # Test different languages
        test_messages = [
            ("English", "Hello! Can you help me?"),
            ("Spanish", "¿Puedes hablar español?"),
            ("French", "Parlez-vous français?"),
            ("German", "Sprechen Sie Deutsch?"),
            ("Japanese", "こんにちは、日本語が話せますか？")
        ]

        for i, (lang, text) in enumerate(test_messages):
            if i > 0:
                await asyncio.sleep(4)
            
            print(f"\n{'='*60}")
            print(f"Testing {lang}")
            print('='*60)
            
            await agent.send_message(text)
            await agent.handle_events()

        print("\n🎉 Multi-language demo complete!\n")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await agent.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
