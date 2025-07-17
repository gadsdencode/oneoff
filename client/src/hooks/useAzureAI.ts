import { useState, useCallback, useRef, useEffect } from "react";
import { AzureAIService } from "../lib/azureAI";
import { Message, AzureAIMessage, ChatCompletionOptions, LLMModel } from "../types";

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
  currentModel: string | null;
  updateModel: (model: LLMModel) => void;
  selectedLLMModel: LLMModel | null;
}

const SELECTED_MODEL_KEY = 'azure-ai-selected-model';

export const useAzureAI = (options: UseAzureAIOptions = {}): UseAzureAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [selectedLLMModel, setSelectedLLMModel] = useState<LLMModel | null>(null);
  const aiServiceRef = useRef<AzureAIService | null>(null);

  // Load persisted model selection on mount
  useEffect(() => {
    const savedModel = localStorage.getItem(SELECTED_MODEL_KEY);
    if (savedModel) {
      try {
        const parsedModel: LLMModel = JSON.parse(savedModel);
        setSelectedLLMModel(parsedModel);
        setCurrentModel(parsedModel.id);
      } catch (err) {
        console.warn("Failed to parse saved model:", err);
        localStorage.removeItem(SELECTED_MODEL_KEY);
      }
    }
  }, []);

  // Initialize Azure AI service
  const getAIService = useCallback(() => {
    if (!aiServiceRef.current) {
      try {
        const config = AzureAIService.createFromEnv();
        aiServiceRef.current = new AzureAIService(config);
        
        // Set initial model if we have a selected LLM model
        if (selectedLLMModel) {
          aiServiceRef.current.updateModel(selectedLLMModel.id);
        }
        
        setCurrentModel(aiServiceRef.current.getCurrentModel());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize Azure AI service";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    }
    return aiServiceRef.current;
  }, [selectedLLMModel]);

  // Update model selection
  const updateModel = useCallback((model: LLMModel) => {
    try {
      setSelectedLLMModel(model);
      setCurrentModel(model.id);
      
      // Persist to localStorage
      localStorage.setItem(SELECTED_MODEL_KEY, JSON.stringify(model));
      
      // Update AI service if it exists
      if (aiServiceRef.current) {
        aiServiceRef.current.updateModel(model.id);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update model";
      setError(errorMessage);
    }
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
    clearError,
    currentModel,
    updateModel,
    selectedLLMModel
  };
}; 