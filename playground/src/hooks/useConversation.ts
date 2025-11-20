import { useCallback } from 'react';
import { useConversationStore } from '../stores/conversationStore';
import type { Message } from '../types';

export function useConversation() {
  const {
    messages,
    isAssistantSpeaking,
    currentTranscription,
    addMessage,
    updateMessage,
    clearMessages,
    setAssistantSpeaking,
    setCurrentTranscription,
    deleteMessage,
    getMessageCount,
    getTokenEstimate,
  } = useConversationStore();

  const sendTextMessage = useCallback((content: string) => {
    const message: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    addMessage(message);
  }, [addMessage]);

  const addAssistantMessage = useCallback((content: string, audioData?: ArrayBuffer) => {
    const message: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      audioData,
    };
    addMessage(message);
  }, [addMessage]);

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    updateMessage(messageId, { content });
  }, [updateMessage]);

  const updateMessageAudio = useCallback((messageId: string, audioData: ArrayBuffer) => {
    updateMessage(messageId, { audioData });
  }, [updateMessage]);

  const getMessageById = useCallback((messageId: string) => {
    return messages.find(msg => msg.id === messageId);
  }, [messages]);

  const getRecentMessages = useCallback((count: number) => {
    return messages.slice(-count);
  }, [messages]);

  const clearConversation = useCallback(() => {
    clearMessages();
    setCurrentTranscription('');
  }, [clearMessages, setCurrentTranscription]);

  return {
    // State
    messages,
    isAssistantSpeaking,
    currentTranscription,
    messageCount: getMessageCount(),
    tokenEstimate: getTokenEstimate(),

    // Actions
    sendTextMessage,
    addAssistantMessage,
    updateMessageContent,
    updateMessageAudio,
    deleteMessage,
    clearConversation,
    setAssistantSpeaking,
    setCurrentTranscription,

    // Queries
    getMessageById,
    getRecentMessages,
  };
}
