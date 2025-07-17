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