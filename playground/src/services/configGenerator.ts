import type { SessionConfig } from '../types';

export class ConfigGenerator {
  static exportAsJSON(config: SessionConfig): string {
    return JSON.stringify(config, null, 2);
  }

  static exportAsTypeScript(config: SessionConfig): string {
    return `import type { SessionConfig } from './types';

export const sessionConfig: SessionConfig = ${JSON.stringify(config, null, 2)};

// Usage:
// const client = new VoiceLiveClient(apiKey, region, model);
// await client.connect();
// client.updateSession(sessionConfig);
`;
  }

  static exportAsPython(config: SessionConfig): string {
    const pythonConfig = this.convertToPythonDict(config);
    
    return `from typing import Dict, Any

session_config: Dict[str, Any] = ${pythonConfig}

# Usage:
# client = VoiceLiveClient(api_key, region, model)
# await client.connect()
# client.update_session(session_config)
`;
  }

  static exportAsJavaScript(config: SessionConfig): string {
    return `export const sessionConfig = ${JSON.stringify(config, null, 2)};

// Usage:
// const client = new VoiceLiveClient(apiKey, region, model);
// await client.connect();
// client.updateSession(sessionConfig);
`;
  }

  static exportAsSwift(config: SessionConfig): string {
    return `import Foundation

struct SessionConfig: Codable {
    let model: String
    let modalities: [String]
    let voice: String
    let instructions: String
    let inputAudioFormat: String
    let outputAudioFormat: String
    let inputAudioTranscription: InputAudioTranscription?
    let turnDetection: TurnDetection?
    let tools: [FunctionTool]?
    let toolChoice: String?
    let temperature: Double?
    let maxResponseOutputTokens: Int?
    let audioEnhancements: AudioEnhancements?
    
    enum CodingKeys: String, CodingKey {
        case model, modalities, voice, instructions
        case inputAudioFormat = "input_audio_format"
        case outputAudioFormat = "output_audio_format"
        case inputAudioTranscription = "input_audio_transcription"
        case turnDetection = "turn_detection"
        case tools
        case toolChoice = "tool_choice"
        case temperature
        case maxResponseOutputTokens = "max_response_output_tokens"
        case audioEnhancements = "audio_enhancements"
    }
}

let sessionConfig = SessionConfig(
    model: "${config.model}",
    modalities: ${JSON.stringify(config.modalities)},
    voice: "${config.voice}",
    instructions: """
${config.instructions}
""",
    inputAudioFormat: "${config.input_audio_format}",
    outputAudioFormat: "${config.output_audio_format}",
    turnDetection: ${this.convertSwiftTurnDetection(config.turn_detection)},
    temperature: ${config.temperature ?? 'nil'},
    maxResponseOutputTokens: ${config.max_response_output_tokens ?? 'nil'}
)

// Usage:
// let client = VoiceLiveClient(apiKey: apiKey, region: region, model: model)
// try await client.connect()
// client.updateSession(sessionConfig)
`;
  }

  static exportAsCURL(apiKey: string, region: string, deployment: string, config: SessionConfig): string {
    const url = `wss://${region}.api.cognitive.microsoft.com/openai/realtime?api-version=2024-10-01-preview&deployment=${deployment}`;
    
    return `# Connect to Voice Live API
curl -i -N \\
  -H "api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  "${url}"

# Send session configuration (after WebSocket connection established)
# {
#   "type": "session.update",
#   "session": ${JSON.stringify(config, null, 4).split('\n').join('\n#   ')}
# }
`;
  }

  private static convertToPythonDict(obj: any, indent = 0): string {
    const spaces = '    '.repeat(indent);
    
    if (obj === null) return 'None';
    if (obj === undefined) return 'None';
    if (typeof obj === 'boolean') return obj ? 'True' : 'False';
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.map(item => this.convertToPythonDict(item, indent + 1));
      return `[\n${spaces}    ${items.join(`,\n${spaces}    `)}\n${spaces}]`;
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          const pythonKey = `"${key}"`;
          const pythonValue = this.convertToPythonDict(value, indent + 1);
          return `${pythonKey}: ${pythonValue}`;
        });
      
      if (entries.length === 0) return '{}';
      return `{\n${spaces}    ${entries.join(`,\n${spaces}    `)}\n${spaces}}`;
    }
    
    return 'None';
  }

  private static convertSwiftTurnDetection(turnDetection: any): string {
    if (!turnDetection) return 'nil';
    
    return `TurnDetection(
        type: "${turnDetection.type}",
        threshold: ${turnDetection.threshold ?? 'nil'},
        prefixPaddingMs: ${turnDetection.prefix_padding_ms ?? 'nil'},
        silenceDurationMs: ${turnDetection.silence_duration_ms ?? 'nil'},
        createResponse: ${turnDetection.create_response ? 'true' : 'false'}
    )`;
  }

  static downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static copyToClipboard(content: string): Promise<void> {
    return navigator.clipboard.writeText(content);
  }
}
