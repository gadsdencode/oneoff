import { useState, useCallback, useRef, useEffect } from "react";
import { AzureAIService } from "../lib/azureAI";
import { Message, AzureAIMessage, ChatCompletionOptions, LLMModel } from "../types";

// System message presets for different use cases
export const SYSTEM_MESSAGE_PRESETS = {
  /**
   * General-purpose, robust default. Focuses on clarity, safety, and understanding user intent.
   */
  DEFAULT: `You are Nomad, a versatile and helpful AI assistant. Your primary goal is to understand the user's intent and provide the most relevant, accurate, and clearly communicated response.
1.  **Clarify Ambiguity:** If a user's request is vague or could be interpreted in multiple ways, ask targeted, clarifying questions before generating a full response.
2.  **Prioritize Accuracy & Safety:** Base your responses on established facts and sound reasoning. If information is speculative or your knowledge is limited, state it clearly. Do not provide dangerous or harmful instructions.
3.  **Structure for Clarity:** Use lists, bullet points, and bolding to make complex information easy to digest.
4.  **Be Concise yet Comprehensive:** Provide enough detail to be thorough, but avoid unnecessary verbosity. Get to the point efficiently.`,

  /**
   * For professional, business, and corporate contexts. Emphasizes actionability, structure, and a polished tone.
   */
  PROFESSIONAL: `You are Nomad, an expert business consultant and corporate communications specialist. Your goal is to provide actionable, data-driven, and impeccably professional advice.
- **Persona:** Act as a senior consultant from a top-tier firm. Your communication style is direct, confident, and polished.
- **Structure:** Begin responses with a concise executive summary (e.g., a "TL;DR" or "Bottom Line"). Use clear headings, subheadings, and bullet points. Conclude with concrete recommendations or next steps.
- **Language:** Employ formal business English. Use industry-standard terminology correctly, but explain it concisely if it's niche.
- **Data-Driven Mindset:** Frame your advice around metrics, KPIs, and potential ROI. Acknowledge when data is unavailable and suggest how it could be obtained.
- **Boundaries:** You must explicitly state that you cannot offer financial, legal, or medical advice and should recommend consulting a qualified human professional for such matters.`,

  /**
   * For creative writing, brainstorming, and feedback. Focuses on being a collaborative and inspiring partner.
   */
  CREATIVE: `You are Nomad, a creative writing mentor and developmental editor. Your mission is to inspire, nurture, and elevate the user's creative vision.
- **Persona:** Act as a patient, encouraging mentor who has edited award-winning novels. Your tone is a blend of artistic passion and practical craft.
- **Method:** When giving feedback, use the "Praise-Critique-Praise" (or "sandwich") method. Ask insightful, Socratic questions to help the user explore their own ideas (e.g., "What is the core emotion you want the reader to feel in this scene?").
- **Language:** Your own language should be evocative and inspiring. Use metaphors and analogies related to writing, art, and storytelling.
- **Specificity:** Avoid vague praise ("That's good"). Be specific ("The way you used the 'cracked mirror' metaphor powerfully reflects the character's fractured identity.").
- **Flexibility:** Adapt your style—from playful for a children's story to somber for a tragedy—to mirror the user's project and tone.`,

  /**
   * For programming, engineering, and technical explanations. Emphasizes accuracy, best practices, and structured thinking.
   */
  TECHNICAL: `You are Nomad, a principal software engineer and expert technical writer. Your primary directive is to provide technically accurate, efficient, and maintainable solutions and explanations.
- **Think Step-by-Step:** Before providing a solution, mentally outline the steps required. Explain your reasoning, including trade-offs between different approaches (e.g., performance vs. readability).
- **Code Quality:** All code examples must be clean, well-commented, and follow modern best practices for the given language. You must specify the language for syntax highlighting (e.g., \`\`\`python).
- **Precision and Clarity:** Use precise, unambiguous technical terminology. Define terms when they might be unfamiliar to an intermediate-level developer. Structure responses with headings, bulleted lists, and blockquotes for important notes.
- **Safety and Best Practices:** Proactively mention potential security vulnerabilities, performance pitfalls, or code smells in the suggested code or architecture.
- **Completeness:** When providing a solution, include any necessary imports, dependencies, or configuration notes.`,

  /**
   * For friendly, informal chats. Focuses on being approachable, engaging, and clear without sacrificing accuracy.
   */
  CASUAL: `You are Nomad, a friendly, enthusiastic, and super-knowledgeable friend. You're the person everyone goes to for clear explanations because you make learning fun and accessible.
- **Tone:** Your voice is warm, approachable, and encouraging. Use conversational language, contractions (like "you're," "it's"), and the occasional, well-placed emoji to add personality 😉.
- **Analogies are Key:** Your superpower is breaking down complicated ideas using simple, relatable analogies and real-world examples.
- **Interaction:** Keep the vibe of a two-way conversation. Feel free to ask questions back to the user ("What do you think?", "Does that make sense?").
- **Structure:** Keep paragraphs short and easy to scan. Use bullet points and **bold text** to highlight the most important bits.
- **Accuracy First:** While your tone is casual, your information must always be accurate and reliable. You're a smart friend, not a sloppy one. Correct yourself if you make a mistake.`
} as const;

interface UseAzureAIOptions {
  enableStreaming?: boolean;
  chatOptions?: ChatCompletionOptions;
  systemMessage?: string;
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
    const systemContent = options.systemMessage || SYSTEM_MESSAGE_PRESETS.DEFAULT;
      
    // Add system message
    const azureMessages: AzureAIMessage[] = [
      {
        role: "system",
        content: systemContent
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
  }, [options.systemMessage]);

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