import { useState } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Settings, Sparkles } from 'lucide-react'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-950 via-secondary-900 to-secondary-950">
      {/* Header */}
      <header className="border-b border-secondary-800 bg-secondary-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Voice Live Playground</h1>
                <p className="text-sm text-secondary-400">Azure Speech Voice Agents</p>
              </div>
            </div>
            <button className="btn-ghost">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Configuration */}
          <div className="lg:col-span-1">
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">Configuration</h2>
              
              {/* Voice Selection */}
              <div>
                <label className="label">Voice</label>
                <select className="input">
                  <option>en-US-Jenny (Azure Standard)</option>
                  <option>en-US-Ava (Azure HD)</option>
                  <option>alloy (OpenAI)</option>
                  <option>coral (OpenAI)</option>
                </select>
              </div>

              {/* Model Selection */}
              <div>
                <label className="label">Model</label>
                <select className="input">
                  <option>gpt-4o</option>
                  <option>gpt-realtime</option>
                  <option>gpt-4.1</option>
                </select>
              </div>

              {/* VAD Type */}
              <div>
                <label className="label">Voice Activity Detection</label>
                <select className="input">
                  <option>Azure Semantic VAD</option>
                  <option>Azure Semantic VAD Multilingual</option>
                  <option>OpenAI Semantic VAD</option>
                  <option>Server VAD</option>
                </select>
              </div>

              {/* Agent Scenario */}
              <div>
                <label className="label">Agent Scenario</label>
                <select className="input">
                  <option>Custom</option>
                  <option>Customer Support</option>
                  <option>Travel Booking</option>
                  <option>Healthcare Triage</option>
                  <option>Technical Support</option>
                </select>
              </div>

              {/* Connection Status */}
              <div className="pt-4 border-t border-secondary-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-secondary-400">Status</span>
                  <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-secondary-500'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <button
                  onClick={() => setIsConnected(!isConnected)}
                  className={isConnected ? 'btn-secondary w-full' : 'btn-primary w-full'}
                >
                  {isConnected ? (
                    <>
                      <PhoneOff className="w-4 h-4 mr-2" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Center - Chat Interface */}
          <div className="lg:col-span-2">
            <div className="card p-6 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-secondary-800">
                <h2 className="text-lg font-semibold text-white">Conversation</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-secondary-400">Session: #12345</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 mb-4">
                {!isConnected ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mic className="w-8 h-8 text-secondary-600" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">Ready to Start</h3>
                      <p className="text-secondary-400 text-sm">
                        Click Connect to begin your voice conversation
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* AI Message */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-secondary-800 rounded-lg p-3">
                          <p className="text-secondary-100">
                            Hello! I'm your AI assistant. How can I help you today?
                          </p>
                        </div>
                        <span className="text-xs text-secondary-500 mt-1 block">Just now</span>
                      </div>
                    </div>

                    {/* User Message */}
                    <div className="flex items-start space-x-3 justify-end">
                      <div className="flex-1 text-right">
                        <div className="bg-primary-600 rounded-lg p-3 inline-block">
                          <p className="text-white">
                            I'd like to know about your services.
                          </p>
                        </div>
                        <span className="text-xs text-secondary-500 mt-1 block">Just now</span>
                      </div>
                      <div className="w-8 h-8 bg-secondary-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white">You</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Microphone Control */}
              <div className="flex items-center justify-center space-x-4 pt-4 border-t border-secondary-800">
                <button
                  onClick={() => setIsMicActive(!isMicActive)}
                  disabled={!isConnected}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                    ${isConnected
                      ? isMicActive
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 animate-pulse'
                        : 'bg-primary-600 hover:bg-primary-700'
                      : 'bg-secondary-800 cursor-not-allowed'
                    }
                  `}
                >
                  {isMicActive ? (
                    <MicOff className="w-7 h-7 text-white" />
                  ) : (
                    <Mic className="w-7 h-7 text-white" />
                  )}
                </button>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">
                    {!isConnected
                      ? 'Not connected'
                      : isMicActive
                      ? 'Listening...'
                      : 'Click to speak'
                    }
                  </p>
                  <p className="text-xs text-secondary-500">
                    {isConnected && 'Press and hold to talk'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Welcome to Voice Live Playground</h3>
                <p className="text-xs text-secondary-400">
                  Configure and test Azure Speech Voice Live API with 600+ voices and multiple languages
                </p>
              </div>
            </div>
            <button className="btn-ghost text-xs">
              View Docs
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-secondary-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-secondary-500">
            <p>© 2025 Foundry Live Agents. MIT License.</p>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-primary-400">Documentation</a>
              <a href="#" className="hover:text-primary-400">Samples</a>
              <a href="#" className="hover:text-primary-400">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
