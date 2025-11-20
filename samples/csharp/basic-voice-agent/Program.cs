using System;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace BasicVoiceAgent
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();

            var apiKey = config["AzureSpeech:ApiKey"];
            var region = config["AzureSpeech:Region"];
            var deployment = config["AzureSpeech:Deployment"] ?? "gpt-4o-realtime-preview";

            Console.WriteLine("🎤 Starting Basic Voice Agent (C#)...\n");

            var url = $"wss://{region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment={deployment}";

            using var ws = new ClientWebSocket();
            ws.Options.SetRequestHeader("api-key", apiKey);

            await ws.ConnectAsync(new Uri(url), CancellationToken.None);
            Console.WriteLine("✅ Connected to Voice Live API\n");

            // Configure session
            var sessionConfig = new
            {
                type = "session.update",
                session = new
                {
                    model = "gpt-4o-realtime-preview",
                    modalities = new[] { "text", "audio" },
                    voice = "alloy",
                    instructions = "You are a helpful assistant.",
                    input_audio_format = "pcm16",
                    output_audio_format = "pcm16",
                    turn_detection = new
                    {
                        type = "server_vad",
                        threshold = 0.5,
                        silence_duration_ms = 500
                    },
                    temperature = 0.8,
                    max_response_output_tokens = 1024
                }
            };

            await SendMessage(ws, sessionConfig);

            // Event loop
            var cts = new CancellationTokenSource();
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true;
                cts.Cancel();
            };

            await ReceiveMessages(ws, cts.Token);

            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
            Console.WriteLine("\n🎉 Disconnected!");
        }

        static async Task SendMessage(ClientWebSocket ws, object message)
        {
            var json = JsonSerializer.Serialize(message);
            var bytes = Encoding.UTF8.GetBytes(json);
            await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
        }

        static async Task ReceiveMessages(ClientWebSocket ws, CancellationToken cancellationToken)
        {
            var buffer = new byte[8192];

            try
            {
                while (ws.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
                {
                    var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        break;
                    }

                    var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    var doc = JsonDocument.Parse(json);
                    var root = doc.RootElement;

                    if (!root.TryGetProperty("type", out var typeElement))
                        continue;

                    var eventType = typeElement.GetString();

                    switch (eventType)
                    {
                        case "session.created":
                            Console.WriteLine($"📡 Session created: {root.GetProperty("session").GetProperty("id")}");
                            break;

                        case "session.updated":
                            Console.WriteLine("✅ Session updated");
                            break;

                        case "input_audio_buffer.speech_started":
                            Console.WriteLine("👂 User started speaking...");
                            break;

                        case "input_audio_buffer.speech_stopped":
                            Console.WriteLine("🔇 User stopped speaking");
                            break;

                        case "input_audio_transcription.completed":
                            if (root.TryGetProperty("transcript", out var transcript))
                            {
                                var text = transcript.GetString();
                                if (!string.IsNullOrEmpty(text))
                                {
                                    Console.WriteLine($"📝 You: {text}");
                                }
                            }
                            break;

                        case "response.text.delta":
                            if (root.TryGetProperty("delta", out var delta))
                            {
                                Console.Write(delta.GetString());
                            }
                            break;

                        case "response.text.done":
                            if (root.TryGetProperty("text", out var text))
                            {
                                Console.WriteLine($"\n🤖 Assistant: {text.GetString()}\n");
                            }
                            break;

                        case "response.done":
                            Console.WriteLine("✅ Response complete");
                            break;

                        case "error":
                            if (root.TryGetProperty("error", out var error))
                            {
                                Console.WriteLine($"❌ Error: {error}");
                            }
                            break;
                    }
                }
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("\n\n👋 Shutting down...");
            }
        }
    }
}
