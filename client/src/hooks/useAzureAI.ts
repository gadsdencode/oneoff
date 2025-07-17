import { useState, useCallback, useRef } from "react";
import { AzureAIService } from "../lib/azureAI";
import { Message, AzureAIMessage, ChatCompletionOptions } from "../types";

interface UseAzureAIOptions {
  enableStreaming?: boolean;
  chatOptions?: ChatCompletionOptions;
}

interface UseAzureAIReturn {
  sendMessage: (messages: Message[]) => Promise<string>;
  sendStreamingMessage: (messages: Message[], onChunk: (chunk: string) => void) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useAzureAI = (options: UseAzureAIOptions = {}): UseAzureAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiServiceRef = useRef<AzureAIService | null>(null);

  // Initialize Azure AI service
  const getAIService = useCallback(() => {
    if (!aiServiceRef.current) {
      try {
        const config = AzureAIService.createFromEnv();
        aiServiceRef.current = new AzureAIService(config);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize Azure AI service";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    }
    return aiServiceRef.current;
  }, []);

  // Convert app messages to Azure AI format
  const convertToAzureAIMessages = useCallback((messages: Message[]): AzureAIMessage[] => {
    // Add system message
    const azureMessages: AzureAIMessage[] = [
      {
        role: "system",
        content: "You are a helpful AI assistant. Provide clear, concise, and accurate responses."
      }
    ];

    // Convert user and assistant messages
    messages.forEach(message => {
      if (message.role === "user" || message.role === "assistant") {
        azureMessages.push({
          role: message.role,
          content: message.content
        });
      }
    });

    return azureMessages;
  }, []);

  // Send non-streaming message
  const sendMessage = useCallback(async (messages: Message[]): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = getAIService();
      const azureMessages = convertToAzureAIMessages(messages);
      const response = await aiService.sendChatCompletion(azureMessages, options.chatOptions);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getAIService, convertToAzureAIMessages, options.chatOptions]);

  // Send streaming message
  const sendStreamingMessage = useCallback(async (
    messages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = getAIService();
      const azureMessages = convertToAzureAIMessages(messages);
      await aiService.sendStreamingChatCompletion(azureMessages, onChunk, options.chatOptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send streaming message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getAIService, convertToAzureAIMessages, options.chatOptions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    sendStreamingMessage,
    isLoading,
    error,
    clearError
  };
}; 