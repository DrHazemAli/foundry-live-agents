import React, { useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, Bot, Volume2 } from 'lucide-react';
import type { Message } from '../types';

interface ConversationViewProps {
  messages: Message[];
  isAssistantSpeaking: boolean;
  currentTranscription?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  isAssistantSpeaking,
  currentTranscription,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscription]);

  return (
    <div className="conversation-view flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      <div className="messages-container flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Bot size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start a conversation by speaking or typing</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message flex gap-3 ${
                message.role === 'assistant' ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="avatar w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={20} className="text-white" />
                </div>
              )}

              <div
                className={`message-content max-w-[70%] ${
                  message.role === 'assistant'
                    ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100'
                    : 'bg-blue-500 dark:bg-blue-600 text-white'
                } rounded-lg p-3`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.transcription && message.transcription !== message.content && (
                  <p className="text-xs mt-2 opacity-70 italic">
                    Transcribed: {message.transcription}
                  </p>
                )}

                <div className="message-meta flex items-center gap-2 mt-2">
                  <span className="text-xs opacity-70">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </span>
                  {message.audioData && (
                    <button
                      className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
                      onClick={() => {
                        // Play audio functionality would go here
                        console.log('Play audio for message:', message.id);
                      }}
                    >
                      <Volume2 size={12} />
                      Play
                    </button>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="avatar w-8 h-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Current transcription (user speaking) */}
        {currentTranscription && (
          <div className="message flex gap-3 justify-end opacity-60">
            <div className="message-content max-w-[70%] bg-blue-400 dark:bg-blue-500 text-white rounded-lg p-3">
              <p className="text-sm">{currentTranscription}...</p>
              <span className="text-xs">Speaking...</span>
            </div>
            <div className="avatar w-8 h-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
          </div>
        )}

        {/* Assistant is speaking indicator */}
        {isAssistantSpeaking && (
          <div className="message flex gap-3 justify-start">
            <div className="avatar w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div className="message-content bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <span className="animate-bounce delay-0">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
