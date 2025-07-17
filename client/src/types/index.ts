export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  attachments?: string[];
}

export interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

// Azure AI specific types
export interface AzureAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AzureAIConfig {
  endpoint: string;
  apiKey: string;
  modelName: string;
}

export interface ChatCompletionOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

// LLM Model Selection types
export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  performance: number;
  cost: number;
  latency: number;
  contextLength: number;
  description: string;
  category: "text" | "code" | "multimodal" | "reasoning";
  tier: "free" | "pro" | "enterprise";
  isFavorite: boolean;
}
