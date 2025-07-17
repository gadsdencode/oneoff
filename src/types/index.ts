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
