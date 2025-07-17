import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import { AzureAIMessage, AzureAIConfig, ChatCompletionOptions, LLMModel } from "../types";

export class AzureAIService {
  private client: any; // ModelClient type issue - using any for now
  private config: AzureAIConfig;

  constructor(config: AzureAIConfig) {
    this.config = config;
    this.client = ModelClient(
      config.endpoint,
      new AzureKeyCredential(config.apiKey)
    );
  }

  /**
   * Update the model name for this service instance
   */
  updateModel(modelName: string): void {
    this.config.modelName = modelName;
  }

  /**
   * Get current model configuration
   */
  getCurrentModel(): string {
    return this.config.modelName;
  }

  /**
   * Get available Azure AI models
   * Note: This returns a curated list since Azure AI doesn't provide a direct models API
   */
  static getAvailableModels(): LLMModel[] {
    return [
      // Azure OpenAI Models
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "Azure OpenAI",
        performance: 96,
        cost: 0.005,
        latency: 800,
        contextLength: 128000,
        description: "Most advanced GPT-4 model with multimodal capabilities",
        category: "multimodal",
        tier: "pro",
        isFavorite: false,
        capabilities: {
          supportsVision: true,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "Azure OpenAI",
        performance: 88,
        cost: 0.00015,
        latency: 600,
        contextLength: 128000,
        description: "Efficient and cost-effective GPT-4 model",
        category: "text",
        tier: "free",
        isFavorite: true,
        capabilities: {
          supportsVision: false,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "Azure OpenAI",
        performance: 94,
        cost: 0.01,
        latency: 1000,
        contextLength: 128000,
        description: "Enhanced GPT-4 model with improved performance",
        category: "text",
        tier: "pro",
        isFavorite: false,
        capabilities: {
          supportsVision: true,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "Azure OpenAI",
        performance: 82,
        cost: 0.0015,
        latency: 500,
        contextLength: 16000,
        description: "Fast and efficient language model for general tasks",
        category: "text",
        tier: "free",
        isFavorite: false,
        capabilities: {
          supportsVision: false,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      // Microsoft Models
      {
        id: "phi-4",
        name: "Phi-4",
        provider: "Microsoft",
        performance: 85,
        cost: 0.0005,
        latency: 400,
        contextLength: 16384,
        description: "Microsoft's efficient small language model",
        category: "text",
        tier: "free",
        isFavorite: false,
        capabilities: {
          supportsVision: false,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      // Mistral Models
      {
        id: "ministral-3b",
        name: "Ministral 3B",
        provider: "Mistral AI",
        performance: 78,
        cost: 0.0001,
        latency: 300,
        contextLength: 131072,
        description: "Compact and efficient Mistral model",
        category: "text",
        tier: "free",
        isFavorite: false,
        capabilities: {
          supportsVision: false,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      {
        id: "mistral-large-2411",
        name: "Mistral Large 2411",
        provider: "Mistral AI",
        performance: 92,
        cost: 0.008,
        latency: 900,
        contextLength: 128000,
        description: "Latest high-performance Mistral model",
        category: "reasoning",
        tier: "pro",
        isFavorite: false,
        capabilities: {
          supportsVision: false,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      // Meta Models
      {
        id: "llama-3.3-70b-instruct",
        name: "Llama 3.3 70B Instruct",
        provider: "Meta",
        performance: 89,
        cost: 0.002,
        latency: 1200,
        contextLength: 128000,
        description: "Meta's latest instruction-tuned model",
        category: "text",
        tier: "free",
        isFavorite: false,
        capabilities: {
          supportsVision: false,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      {
        id: "llama-3.2-11b-vision-instruct",
        name: "Llama 3.2 11B Vision",
        provider: "Meta",
        performance: 84,
        cost: 0.0008,
        latency: 800,
        contextLength: 128000,
        description: "Vision-capable Llama model for multimodal tasks",
        category: "multimodal",
        tier: "free",
        isFavorite: false,
        capabilities: {
          supportsVision: true,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      },
      // Cohere Models
      {
        id: "cohere-command-r-plus",
        name: "Command R+",
        provider: "Cohere",
        performance: 87,
        cost: 0.003,
        latency: 700,
        contextLength: 131072,
        description: "Advanced command-following model from Cohere",
        category: "text",
        tier: "pro",
        isFavorite: false,
        capabilities: {
          supportsVision: false,
          supportsCodeGeneration: true,
          supportsAnalysis: true,
          supportsImageGeneration: false
        }
      }
    ];
  }

  /**
   * Send a single chat completion request
   */
  async sendChatCompletion(
    messages: AzureAIMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    try {
      const response = await this.client.path("/chat/completions").post({
        body: {
          messages,
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.8,
          top_p: options.topP || 0.1,
          model: this.config.modelName,
          stream: false,
        },
      });

      if (response.status !== "200") {
        throw new Error(`Azure AI API error: ${response.body.error}`);
      }

      return response.body.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Azure AI Service Error:", error);
      throw error;
    }
  }

  /**
   * Send a streaming chat completion request
   */
  async sendStreamingChatCompletion(
    messages: AzureAIMessage[],
    onChunk: (chunk: string) => void,
    options: ChatCompletionOptions = {}
  ): Promise<void> {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    
    try {
      const response = await this.client.path("/chat/completions").post({
        body: {
          messages,
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.8,
          top_p: options.topP || 0.1,
          model: this.config.modelName,
          stream: true,
        },
      }).asBrowserStream();

      if (response.status !== "200") {
        throw new Error(`Failed to get chat completions, HTTP operation failed with ${response.status} code`);
      }

      const stream = response.body;
      if (!stream) {
        throw new Error("The response stream is undefined");
      }

      // Use the browser's native ReadableStream API
      reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader!.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const eventData = JSON.parse(data);
              for (const choice of eventData.choices || []) {
                const content = choice.delta?.content;
                if (content) {
                  onChunk(content);
                }
              }
            } catch (parseError) {
              // Skip invalid JSON, continue processing
              console.warn("Failed to parse SSE event:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Azure AI Streaming Service Error:", error);
      throw error;
    } finally {
      // Always release the reader to avoid locked stream issues
      if (reader) {
        try {
          reader.releaseLock();
        } catch (releaseError) {
          console.warn("Error releasing stream reader:", releaseError);
        }
      }
    }
  }

  /**
   * Create Azure AI config from environment variables
   */
  static createFromEnv(): AzureAIConfig {
    const endpoint = import.meta.env.VITE_AZURE_AI_ENDPOINT;
    const apiKey = import.meta.env.VITE_AZURE_AI_API_KEY;
    const modelName = import.meta.env.VITE_AZURE_AI_MODEL_NAME || "Ministral-3B";

    if (!endpoint || !apiKey) {
      throw new Error(
        "Azure AI configuration missing. Please set VITE_AZURE_AI_ENDPOINT and VITE_AZURE_AI_API_KEY environment variables."
      );
    }

    return { endpoint, apiKey, modelName };
  }

  /**
   * Create Azure AI config with custom model
   */
  static createWithModel(modelName: string): AzureAIConfig {
    const config = this.createFromEnv();
    return { ...config, modelName };
  }
}

export default AzureAIService; 