import React, { useState } from 'react';
import { Settings, MessageSquare, Mic, Code, Zap, AlertCircle, Moon, Sun } from 'lucide-react';
import { VoiceGallery } from './components/VoiceGallery';
import { AudioVisualizer } from './components/AudioVisualizer';
import { MicrophoneButton } from './components/MicrophoneButton';
import { ConversationView } from './components/ConversationView';
import { VoiceSelector } from './components/VoiceSelector';
import { AgentSelector } from './components/AgentSelector';
import { ConfigPanel } from './components/ConfigPanel';
import { useVoiceLive } from './hooks/useVoiceLive';
import { useAudioCapture } from './hooks/useAudioCapture';
import { useConfiguration } from './hooks/useConfiguration';
import { useConversation } from './hooks/useConversation';
import { useConnectionStore } from './stores/connectionStore';
import { useTheme } from './contexts/ThemeContext';
import type { Voice, AgentScenario } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'voices' | 'config' | 'code'>('chat');
  const [selectedVoice, setSelectedVoice] = useState<Voice | undefined>();
  const [selectedAgent, setSelectedAgent] = useState<AgentScenario | undefined>();
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Hooks
  const { connect, disconnect, isConnected, isConnecting, sendAudio, updateSession } = useVoiceLive();
  const { isCapturing, volume, toggleCapture } = useAudioCapture();
  const { 
    config, 
    apiKey, 
    region, 
    updateConnectionSettings, 
    setVoice, 
    setInstructions,
    setTemperature,
    updateVADSettings,
    updateConfig,
  } = useConfiguration();
  const { messages, isAssistantSpeaking, currentTranscription } = useConversation();
  const connectionState = useConnectionStore();
  const { theme, toggleTheme } = useTheme();

  // Handle voice selection
  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
    setVoice(voice.type as any);
    
    if (isConnected) {
      updateSession({ voice: voice.type });
    }
  };

  // Handle agent selection
  const handleAgentSelect = (agent: AgentScenario) => {
    setSelectedAgent(agent);
    
    // Apply agent configuration
    if (agent.config) {
      updateConfig(agent.config);
      
      if (isConnected) {
        updateSession(agent.config);
      }
    }
  };

  // Handle microphone toggle
  const handleMicToggle = () => {
    if (!isConnected) {
      alert('Please connect first by providing API key and region in Configuration tab');
      return;
    }

    toggleCapture((audioData) => {
      sendAudio(audioData);
    });
  };

  // Handle connection
  const handleConnect = async () => {
    if (!apiKey || !region) {
      alert('Please provide API key and region in the Configuration tab');
      setActiveTab('config');
      return;
    }

    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect. Please check your credentials.');
    }
  };

  return (
    <div className="app min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-[#0a0a0a] dark:via-[#0f0f1a] dark:to-[#0d0d1a] transition-colors duration-200">
      {/* Header */}
      <header className="bg-white/80 dark:bg-[#111111]/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Voice Live Playground</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time Voice AI Playground</p>
              </div>
            </div>

            {/* Connection Status & Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun size={20} className="text-gray-400" />
                )}
              </button>

              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#1a1a1a]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionState.status === 'connected'
                      ? 'bg-green-500 shadow-lg shadow-green-500/50'
                      : connectionState.status === 'connecting'
                      ? 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50'
                      : connectionState.status === 'error'
                      ? 'bg-red-500 shadow-lg shadow-red-500/50'
                      : 'bg-gray-400 dark:bg-gray-500'
                  }`}
                />
                <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-200">
                  {connectionState.status}
                </span>
                {connectionState.latency && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">({connectionState.latency}ms)</span>
                )}
              </div>

              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 font-medium"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30 transition-all duration-200 font-medium"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {connectionState.error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
              <span className="text-sm text-red-800 dark:text-red-300">{connectionState.error}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <nav className="flex gap-2 mt-4 -mb-px overflow-x-auto">
            <TabButton
              icon={<MessageSquare size={18} />}
              label="Conversation"
              active={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
            />
            <TabButton
              icon={<Mic size={18} />}
              label="Voices"
              active={activeTab === 'voices'}
              onClick={() => setActiveTab('voices')}
            />
            <TabButton
              icon={<Settings size={18} />}
              label="Configuration"
              active={activeTab === 'config'}
              onClick={() => setActiveTab('config')}
            />
            <TabButton
              icon={<Code size={18} />}
              label="Export Code"
              active={activeTab === 'code'}
              onClick={() => setActiveTab('code')}
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white/90 dark:bg-[#111111]/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 min-h-[600px]">
              <div className="lg:col-span-2 space-y-4">
                {/* Agent & Voice Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <AgentSelector
                    selectedAgent={selectedAgent}
                    onSelectAgent={handleAgentSelect}
                    disabled={isConnected}
                  />
                  <VoiceSelector
                    selectedVoice={selectedVoice}
                    onSelectVoice={handleVoiceSelect}
                    disabled={isConnected}
                  />
                </div>

                <div className="h-96 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#0a0a0a] shadow-inner">
                  <ConversationView
                    messages={messages}
                    isAssistantSpeaking={isAssistantSpeaking}
                    currentTranscription={currentTranscription}
                  />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <AudioVisualizer
                    volume={volume}
                    isActive={isCapturing}
                    className="h-32 mb-4"
                  />

                  <div className="flex justify-center">
                    <MicrophoneButton
                      isCapturing={isCapturing}
                      volume={volume}
                      onToggle={handleMicToggle}
                      disabled={!isConnected}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar - Config & Stats */}
              <div className="space-y-4">
                {/* Configuration Panel Toggle */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg overflow-hidden">
                  <button
                    onClick={() => setShowConfigPanel(!showConfigPanel)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings size={18} />
                      Configuration
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {showConfigPanel ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  
                  {showConfigPanel && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                      <ConfigPanel
                        temperature={config.temperature || 0.7}
                        onTemperatureChange={(val) => {
                          setTemperature(val);
                          if (isConnected) updateSession({ temperature: val });
                        }}
                        vadType={config.turn_detection?.type || 'server_vad'}
                        onVADTypeChange={(val) => {
                          updateVADSettings({ type: val });
                          if (isConnected) updateSession({ turn_detection: { ...config.turn_detection, type: val } });
                        }}
                        vadThreshold={config.turn_detection?.threshold || 0.5}
                        onVADThresholdChange={(val) => {
                          updateVADSettings({ threshold: val });
                          if (isConnected) updateSession({ turn_detection: { ...config.turn_detection, threshold: val } });
                        }}
                        vadSilenceDuration={config.turn_detection?.silence_duration_ms || 500}
                        onVADSilenceDurationChange={(val) => {
                          updateVADSettings({ silenceDuration: val });
                          if (isConnected) updateSession({ turn_detection: { ...config.turn_detection, silence_duration_ms: val } });
                        }}
                        instructions={config.instructions}
                        onInstructionsChange={(val) => {
                          setInstructions(val);
                          if (isConnected) updateSession({ instructions: val });
                        }}
                        disabled={false}
                      />
                    </div>
                  )}
                </div>

                {/* Session Stats */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-lg">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Session Stats</h3>
                  <dl className="space-y-2 text-sm">
                    <StatRow label="Messages" value={messages.length.toString()} />
                    <StatRow 
                      label="Latency" 
                      value={connectionState.latency ? `${connectionState.latency}ms` : 'N/A'} 
                    />
                    <StatRow label="Voice" value={selectedVoice?.name || 'Default'} />
                    <StatRow label="Agent" value={selectedAgent?.name || 'None'} />
                    <StatRow label="Model" value={config.model} valueClass="text-xs" />
                  </dl>
                </div>

                {/* Quick Tips */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800 shadow-lg">
                  <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">Quick Tips</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Select an agent scenario to get started</li>
                    <li>• Choose a voice that matches your use case</li>
                    <li>• Adjust settings in real-time during calls</li>
                    <li>• Click microphone when ready to speak</li>
                  </ul>
                </div>

                {!apiKey && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 shadow-lg">
                    <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-200 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Setup Required
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                      Add your API key and region in the Configuration tab to get started.
                    </p>
                    <button
                      onClick={() => setActiveTab('config')}
                      className="text-sm text-yellow-900 dark:text-yellow-200 underline hover:no-underline font-medium"
                    >
                      Configure now →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voices Tab */}
          {activeTab === 'voices' && (
            <div className="p-6">
              <VoiceGallery onSelectVoice={handleVoiceSelect} selectedVoice={selectedVoice} />
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="p-6">
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Connection Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Key *</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => updateConnectionSettings({ apiKey: e.target.value })}
                        placeholder="Enter your Azure Speech API key"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Get your API key from Azure Portal → Speech Services → Keys
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Region *</label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => updateConnectionSettings({ region: e.target.value })}
                        placeholder="e.g., eastus, westeurope, southeastasia"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        The Azure region where your resource is deployed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Session Configuration</h2>
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4 overflow-x-auto border border-gray-200 dark:border-gray-700">
                    <pre className="text-xs text-gray-800 dark:text-gray-200">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Export Tab */}
          {activeTab === 'code' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Export Configuration</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Export your current configuration in different formats
              </p>
              
              {/* Configuration Preview */}
              <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Current Configuration</h3>
                <pre className="text-xs bg-white dark:bg-[#111111] text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const jsonStr = JSON.stringify(config, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'voice-live-config.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 rounded-xl border border-blue-200 dark:border-blue-700 transition-all duration-200"
                >
                  <Code size={20} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-200">Download JSON</span>
                </button>

                <button
                  onClick={() => {
                    const tsCode = `// Voice Live Configuration\n// Generated on ${new Date().toISOString()}\n\nimport type { SessionConfig } from './types';\n\nexport const config: SessionConfig = ${JSON.stringify(config, null, 2)};\n`;
                    const blob = new Blob([tsCode], { type: 'text/typescript' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'voice-live-config.ts';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/40 dark:hover:to-purple-800/40 rounded-xl border border-purple-200 dark:border-purple-700 transition-all duration-200"
                >
                  <Code size={20} className="text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-900 dark:text-purple-200">Download TypeScript</span>
                </button>

                <button
                  onClick={() => {
                    const pyCode = `# Voice Live Configuration\n# Generated on ${new Date().toISOString()}\n\nconfig = ${JSON.stringify(config, null, 4).replace(/"/g, "'")};\n`;
                    const blob = new Blob([pyCode], { type: 'text/x-python' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'voice_live_config.py';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/40 dark:hover:to-green-800/40 rounded-xl border border-green-200 dark:border-green-700 transition-all duration-200"
                >
                  <Code size={20} className="text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-200">Download Python</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                    alert('Configuration copied to clipboard!');
                  }}
                  className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800/60 dark:hover:to-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200"
                >
                  <Code size={20} className="text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-200">Copy to Clipboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#111111]/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 <a href="https://github.com/DrHazemAli" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Hazem Ali</a> • MIT License</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/DrHazemAli/foundry-live-agents" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">GitHub</a>
              <a href="https://github.com/DrHazemAli/foundry-live-agents#readme" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Documentation</a>
              <a href="https://github.com/DrHazemAli/foundry-live-agents/tree/main/samples" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Samples</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-t-xl transition-all duration-200 border-b-2 font-medium ${
      active
        ? 'bg-white dark:bg-[#1a1a1a] border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 shadow-lg'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]/50 border-transparent'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

interface StatRowProps {
  label: string;
  value: string;
  valueClass?: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between">
    <dt className="text-gray-600 dark:text-gray-400">{label}:</dt>
    <dd className={`font-medium text-gray-900 dark:text-white ${valueClass}`}>{value}</dd>
  </div>
);

export default App;
