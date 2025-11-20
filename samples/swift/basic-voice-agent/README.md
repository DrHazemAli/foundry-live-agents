# Basic Voice Agent - SwiftUI (iOS/macOS)

> **Difficulty:** Intermediate  
> **Duration:** 30 minutes  
> **Prerequisites:** Xcode 15+, iOS 17+ or macOS 14+, Azure Speech resource

## Overview

Native iOS/macOS implementation of Azure Speech Voice Live API using SwiftUI and modern Apple frameworks:

- URLSessionWebSocketTask for WebSocket connection
- AVAudioEngine for microphone capture
- AVAudioPlayerNode for audio playback
- SwiftUI for native UI
- Combine for reactive programming

## Features

- ✅ Native WebSocket with URLSession
- ✅ AVAudioEngine microphone integration
- ✅ Real-time audio streaming
- ✅ SwiftUI interface
- ✅ iOS audio session management
- ✅ Background audio support
- ✅ Microphone permission handling

## Prerequisites

1. **Development Environment**
   - Xcode 15.0 or later
   - iOS 17.0+ or macOS 14.0+
   - Swift 5.9+

2. **Azure Resource**
   - Speech Services or Microsoft Foundry resource
   - API key or Azure authentication

3. **Device Requirements**
   - Physical device or simulator with microphone
   - Microphone permissions granted

## Project Setup

### Create Xcode Project

1. Open Xcode
2. File > New > Project
3. Choose "iOS" > "App"
4. Product Name: VoiceLiveAgent
5. Interface: SwiftUI
6. Language: Swift
7. Click "Next" and save

### Add Capabilities

1. Select project in navigator
2. Select target
3. "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add "Background Modes"
6. Enable "Audio, AirPlay, and Picture in Picture"

### Info.plist Configuration

Add these keys to Info.plist:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to enable voice conversations with the AI assistant.</string>

<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>

<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

## Project Structure

```
VoiceLiveAgent/
├── App/
│   ├── VoiceLiveAgentApp.swift      # App entry point
│   └── ContentView.swift             # Main UI
├── Models/
│   ├── VoiceLiveConfig.swift        # Configuration
│   └── VoiceLiveEvent.swift         # Event types
├── Services/
│   ├── VoiceLiveClient.swift        # WebSocket client
│   ├── AudioCaptureService.swift    # Microphone capture
│   └── AudioPlaybackService.swift   # Audio playback
├── ViewModels/
│   └── VoiceAgentViewModel.swift    # Business logic
└── Views/
    ├── ContentView.swift             # Main view
    └── PermissionView.swift          # Permission request
```

## Implementation

### VoiceLiveAgentApp.swift

```swift
import SwiftUI

@main
struct VoiceLiveAgentApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

### VoiceLiveConfig.swift

```swift
import Foundation

struct VoiceLiveConfig {
    let resourceName: String
    let apiKey: String
    let model: String
    let voiceType: String
    let voiceName: String
    
    var wsURL: URL {
        let urlString = "wss://\(resourceName).cognitiveservices.azure.com/voice-live/realtime?api-version=2025-10-01&model=\(model)"
        return URL(string: urlString)!
    }
    
    static let `default` = VoiceLiveConfig(
        resourceName: "your-resource-name",  // Replace with your resource
        apiKey: "your-api-key",              // Replace with your key
        model: "gpt-realtime",
        voiceType: "openai",
        voiceName: "alloy"
    )
}
```

### VoiceLiveEvent.swift

```swift
import Foundation

enum VoiceLiveEvent: Codable {
    case sessionUpdate(SessionUpdateEvent)
    case sessionCreated(SessionCreatedEvent)
    case inputAudioBuffer(InputAudioBufferEvent)
    case speechStarted
    case speechStopped
    case responseCreated
    case responseTextDelta(ResponseTextDeltaEvent)
    case responseAudioDelta(ResponseAudioDeltaEvent)
    case responseDone
    case error(ErrorEvent)
    
    struct SessionUpdateEvent: Codable {
        let type = "session.update"
        let session: SessionConfig
    }
    
    struct SessionConfig: Codable {
        let modalities: [String]
        let instructions: String
        let voice: Voice
        let turnDetection: TurnDetection
        let inputAudioFormat: String
        let outputAudioFormat: String
        let inputAudioSamplingRate: Int
        
        struct Voice: Codable {
            let type: String
            let name: String
        }
        
        struct TurnDetection: Codable {
            let type: String
            let threshold: Double
            let silenceDurationMs: Int
            
            enum CodingKeys: String, CodingKey {
                case type
                case threshold
                case silenceDurationMs = "silence_duration_ms"
            }
        }
        
        enum CodingKeys: String, CodingKey {
            case modalities, instructions, voice
            case turnDetection = "turn_detection"
            case inputAudioFormat = "input_audio_format"
            case outputAudioFormat = "output_audio_format"
            case inputAudioSamplingRate = "input_audio_sampling_rate"
        }
    }
    
    struct SessionCreatedEvent: Codable {
        let type: String
        let session: Session
        
        struct Session: Codable {
            let id: String
            let model: String
        }
    }
    
    struct InputAudioBufferEvent: Codable {
        let type = "input_audio_buffer.append"
        let audio: String
    }
    
    struct ResponseTextDeltaEvent: Codable {
        let type: String
        let delta: String
    }
    
    struct ResponseAudioDeltaEvent: Codable {
        let type: String
        let delta: String
    }
    
    struct ErrorEvent: Codable {
        let type: String
        let error: ErrorDetail
        
        struct ErrorDetail: Codable {
            let message: String
        }
    }
}
```

### VoiceLiveClient.swift

```swift
import Foundation
import Combine

class VoiceLiveClient: ObservableObject {
    @Published var isConnected = false
    @Published var sessionId: String?
    @Published var responseText: String = ""
    
    private var webSocketTask: URLSessionWebSocketTask?
    private let config: VoiceLiveConfig
    private var cancellables = Set<AnyCancellable>()
    
    var onSpeechStarted: (() -> Void)?
    var onSpeechStopped: (() -> Void)?
    var onResponseAudio: ((Data) -> Void)?
    var onError: ((Error) -> Void)?
    
    init(config: VoiceLiveConfig) {
        self.config = config
    }
    
    func connect() {
        var request = URLRequest(url: config.wsURL)
        request.addValue(config.apiKey, forHTTPHeaderField: "api-key")
        
        webSocketTask = URLSession.shared.webSocketTask(with: request)
        webSocketTask?.resume()
        
        isConnected = true
        receiveMessage()
    }
    
    func configureSession() {
        let sessionConfig = VoiceLiveEvent.SessionConfig(
            modalities: ["text", "audio"],
            instructions: "You are a helpful assistant. Be concise and friendly.",
            voice: VoiceLiveEvent.SessionConfig.Voice(
                type: config.voiceType,
                name: config.voiceName
            ),
            turnDetection: VoiceLiveEvent.SessionConfig.TurnDetection(
                type: "server_vad",
                threshold: 0.5,
                silenceDurationMs: 500
            ),
            inputAudioFormat: "pcm16",
            outputAudioFormat: "pcm16",
            inputAudioSamplingRate: 24000
        )
        
        let event = VoiceLiveEvent.SessionUpdateEvent(session: sessionConfig)
        send(event)
    }
    
    func sendAudio(_ audioData: Data) {
        let base64Audio = audioData.base64EncodedString()
        let event = VoiceLiveEvent.InputAudioBufferEvent(audio: base64Audio)
        send(event)
    }
    
    private func send<T: Encodable>(_ event: T) {
        guard let webSocketTask = webSocketTask else { return }
        
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(event)
            let message = URLSessionWebSocketTask.Message.string(String(data: data, encoding: .utf8)!)
            
            webSocketTask.send(message) { error in
                if let error = error {
                    self.onError?(error)
                }
            }
        } catch {
            onError?(error)
        }
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                self.handleMessage(message)
                self.receiveMessage() // Continue receiving
                
            case .failure(let error):
                self.onError?(error)
                self.isConnected = false
            }
        }
    }
    
    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        guard case .string(let text) = message,
              let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return
        }
        
        switch type {
        case "session.created":
            if let session = json["session"] as? [String: Any],
               let id = session["id"] as? String {
                DispatchQueue.main.async {
                    self.sessionId = id
                }
            }
            
        case "input_audio_buffer.speech_started":
            onSpeechStarted?()
            
        case "input_audio_buffer.speech_stopped":
            onSpeechStopped?()
            
        case "response.text.delta":
            if let delta = json["delta"] as? String {
                DispatchQueue.main.async {
                    self.responseText += delta
                }
            }
            
        case "response.audio.delta":
            if let delta = json["delta"] as? String,
               let audioData = Data(base64Encoded: delta) {
                onResponseAudio?(audioData)
            }
            
        case "response.done":
            DispatchQueue.main.async {
                self.responseText = ""
            }
            
        case "error":
            if let error = json["error"] as? [String: Any],
               let message = error["message"] as? String {
                onError?(NSError(domain: "VoiceLive", code: -1, userInfo: [NSLocalizedDescriptionKey: message]))
            }
            
        default:
            break
        }
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        isConnected = false
    }
}
```

### AudioCaptureService.swift

```swift
import AVFoundation

class AudioCaptureService {
    private var audioEngine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    
    var onAudioData: ((Data) -> Void)?
    
    func start() throws {
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
        try audioSession.setActive(true)
        
        // Setup audio engine
        audioEngine = AVAudioEngine()
        inputNode = audioEngine?.inputNode
        
        let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: 24000,
            channels: 1,
            interleaved: true
        )!
        
        inputNode?.installTap(onBus: 0, bufferSize: 4096, format: format) { [weak self] buffer, time in
            let audioData = self?.bufferToData(buffer)
            if let data = audioData {
                self?.onAudioData?(data)
            }
        }
        
        try audioEngine?.start()
    }
    
    func stop() {
        inputNode?.removeTap(onBus: 0)
        audioEngine?.stop()
        
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            print("Error deactivating audio session: \(error)")
        }
    }
    
    private func bufferToData(_ buffer: AVAudioPCMBuffer) -> Data {
        let audioBuffer = buffer.audioBufferList.pointee.mBuffers
        return Data(bytes: audioBuffer.mData!, count: Int(audioBuffer.mDataByteSize))
    }
}
```

### AudioPlaybackService.swift

```swift
import AVFoundation

class AudioPlaybackService {
    private var audioEngine: AVAudioEngine?
    private var playerNode: AVAudioPlayerNode?
    private let audioQueue = DispatchQueue(label: "audio.playback")
    
    func start() throws {
        audioEngine = AVAudioEngine()
        playerNode = AVAudioPlayerNode()
        
        let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: 24000,
            channels: 1,
            interleaved: true
        )!
        
        audioEngine?.attach(playerNode!)
        audioEngine?.connect(playerNode!, to: audioEngine!.mainMixerNode, format: format)
        
        try audioEngine?.start()
        playerNode?.play()
    }
    
    func play(_ audioData: Data) {
        guard let playerNode = playerNode else { return }
        
        let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: 24000,
            channels: 1,
            interleaved: true
        )!
        
        let frameCount = UInt32(audioData.count) / format.streamDescription.pointee.mBytesPerFrame
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        
        buffer.frameLength = frameCount
        audioData.withUnsafeBytes { ptr in
            memcpy(buffer.audioBufferList.pointee.mBuffers.mData, ptr.baseAddress, audioData.count)
        }
        
        audioQueue.async {
            playerNode.scheduleBuffer(buffer)
        }
    }
    
    func stop() {
        playerNode?.stop()
        audioEngine?.stop()
    }
}
```

### VoiceAgentViewModel.swift

```swift
import Foundation
import AVFoundation
import Combine

class VoiceAgentViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var sessionId: String?
    @Published var isSpeaking = false
    @Published var responseText: String = ""
    @Published var statusMessage = "Ready to connect"
    @Published var microphonePermission: AVAudioSession.RecordPermission = .undetermined
    
    private var client: VoiceLiveClient
    private var audioCapture: AudioCaptureService
    private var audioPlayback: AudioPlaybackService
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        self.client = VoiceLiveClient(config: .default)
        self.audioCapture = AudioCaptureService()
        self.audioPlayback = AudioPlaybackService()
        
        setupBindings()
        checkMicrophonePermission()
    }
    
    private func setupBindings() {
        // Client bindings
        client.$isConnected
            .assign(to: &$isConnected)
        
        client.$sessionId
            .assign(to: &$sessionId)
        
        client.$responseText
            .assign(to: &$responseText)
        
        // Event handlers
        client.onSpeechStarted = { [weak self] in
            DispatchQueue.main.async {
                self?.isSpeaking = true
                self?.statusMessage = "Listening..."
            }
        }
        
        client.onSpeechStopped = { [weak self] in
            DispatchQueue.main.async {
                self?.isSpeaking = false
                self?.statusMessage = "Processing..."
            }
        }
        
        client.onResponseAudio = { [weak self] audioData in
            self?.audioPlayback.play(audioData)
        }
        
        client.onError = { [weak self] error in
            DispatchQueue.main.async {
                self?.statusMessage = "Error: \(error.localizedDescription)"
            }
        }
        
        // Audio capture
        audioCapture.onAudioData = { [weak self] audioData in
            self?.client.sendAudio(audioData)
        }
    }
    
    private func checkMicrophonePermission() {
        microphonePermission = AVAudioSession.sharedInstance().recordPermission
    }
    
    func requestMicrophonePermission() {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                self?.microphonePermission = granted ? .granted : .denied
            }
        }
    }
    
    func connect() {
        statusMessage = "Connecting..."
        client.connect()
        client.configureSession()
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.startAudio()
        }
    }
    
    private func startAudio() {
        do {
            try audioPlayback.start()
            try audioCapture.start()
            statusMessage = "Ready - speak now!"
        } catch {
            statusMessage = "Audio error: \(error.localizedDescription)"
        }
    }
    
    func disconnect() {
        audioCapture.stop()
        audioPlayback.stop()
        client.disconnect()
        statusMessage = "Disconnected"
    }
}
```

### ContentView.swift

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = VoiceAgentViewModel()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Status
                statusSection
                
                // Response Text
                responseSection
                
                Spacer()
                
                // Connect Button
                connectButton
            }
            .padding()
            .navigationTitle("Voice Live Agent")
        }
        .onAppear {
            if viewModel.microphonePermission == .undetermined {
                viewModel.requestMicrophonePermission()
            }
        }
    }
    
    private var statusSection: some View {
        VStack(spacing: 10) {
            Image(systemName: viewModel.isSpeaking ? "waveform" : "mic.fill")
                .font(.system(size: 60))
                .foregroundColor(viewModel.isConnected ? .green : .gray)
                .symbolEffect(.pulse, isActive: viewModel.isSpeaking)
            
            Text(viewModel.statusMessage)
                .font(.headline)
            
            if let sessionId = viewModel.sessionId {
                Text("Session: \(sessionId.prefix(8))...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private var responseSection: some View {
        ScrollView {
            Text(viewModel.responseText.isEmpty ? "AI responses will appear here" : viewModel.responseText)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(10)
        }
        .frame(height: 200)
    }
    
    private var connectButton: some View {
        Button(action: {
            if viewModel.isConnected {
                viewModel.disconnect()
            } else {
                viewModel.connect()
            }
        }) {
            Text(viewModel.isConnected ? "Disconnect" : "Connect")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(viewModel.isConnected ? Color.red : Color.blue)
                .cornerRadius(15)
        }
        .disabled(viewModel.microphonePermission != .granted)
    }
}
```

## Usage

1. Replace `your-resource-name` and `your-api-key` in `VoiceLiveConfig.swift`
2. Build and run on device or simulator
3. Grant microphone permission when prompted
4. Tap "Connect" to start
5. Speak into microphone
6. Listen to AI responses

## Testing on Device

### iOS Simulator
- Simulator microphone uses Mac microphone
- Audio playback works

### Physical Device
- Better audio quality
- Real-world testing
- Background audio support

## Next Steps

1. **[Multi-Language Support](../multi-language-voice-agent/)** - Add language switching
2. **[Avatar Integration](../voice-with-avatar/)** - Add video avatar
3. **[Function Calling](../voice-with-functions/)** - Add tools

---

**[← Back to Swift Samples](../) | [iOS Development Guide →](https://developer.apple.com/documentation/)**
