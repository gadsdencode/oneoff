import React, { useState } from "react";
import { useAzureAI, SYSTEM_MESSAGE_PRESETS } from "../hooks/useAzureAI";
import { SystemMessageSelector } from "./SystemMessageSelector";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export const SystemMessageDemo: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof SYSTEM_MESSAGE_PRESETS | "custom">("DEFAULT");
  const [customSystemMessage, setCustomSystemMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // Get the current system message based on selection
  const getCurrentSystemMessage = () => {
    if (selectedPreset === "custom") {
      return customSystemMessage || SYSTEM_MESSAGE_PRESETS.DEFAULT;
    }
    return SYSTEM_MESSAGE_PRESETS[selectedPreset];
  };

  const {
    sendMessage,
    isLoading,
    error,
    clearError,
    currentModel
  } = useAzureAI({
    systemMessage: getCurrentSystemMessage(),
    chatOptions: {
      maxTokens: 1024,
      temperature: 0.7
    }
  });

  const handlePresetChange = (preset: keyof typeof SYSTEM_MESSAGE_PRESETS | "custom", message?: string) => {
    setSelectedPreset(preset);
    if (preset === "custom" && message !== undefined) {
      setCustomSystemMessage(message);
    }
    // Clear messages when changing system message to see the difference
    setMessages([]);
    clearError();
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await sendMessage(newMessages);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: "assistant",
        timestamp: new Date()
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">System Message Configuration Demo</h1>
        <p className="text-muted-foreground">
          See how different system messages change the AI's personality and response style
        </p>
      </div>

      <SystemMessageSelector
        selectedPreset={selectedPreset}
        customMessage={customSystemMessage}
        onPresetChange={handlePresetChange}
      />

      {selectedPreset === "custom" && (
        <Card>
          <CardHeader>
            <CardTitle>Custom System Message</CardTitle>
            <CardDescription>
              Define your own system message to control the AI's behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your custom system message..."
              value={customSystemMessage}
              onChange={(e) => setCustomSystemMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Chat Demo
            <div className="flex items-center gap-2">
              {currentModel && (
                <Badge variant="secondary">{currentModel}</Badge>
              )}
              {isLoading && (
                <Badge variant="outline">Processing...</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Try asking the same question with different system message presets to see the difference
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-md ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-12"
                    : "bg-muted mr-12"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={message.role === "user" ? "default" : "secondary"}>
                    {message.role === "user" ? "You" : "Assistant"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Try asking: 'Explain quantum computing' or 'Write a story about a robot'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[60px]"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              className="self-end"
            >
              Send
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>Try these examples:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>"Explain quantum computing" - Compare technical vs. casual responses</li>
              <li>"Write a story about a robot" - See creative vs. professional styles</li>
              <li>"How do I write a business proposal?" - Professional vs. casual guidance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 