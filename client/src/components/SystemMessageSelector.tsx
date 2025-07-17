import React from "react";
import { SYSTEM_MESSAGE_PRESETS } from "../hooks/useAzureAI";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface SystemMessageSelectorProps {
  selectedPreset: keyof typeof SYSTEM_MESSAGE_PRESETS | "custom";
  customMessage?: string;
  onPresetChange: (preset: keyof typeof SYSTEM_MESSAGE_PRESETS | "custom", message?: string) => void;
}

const PRESET_DESCRIPTIONS = {
  DEFAULT: "General purpose assistant with balanced responses",
  PROFESSIONAL: "Formal business communication style",
  CREATIVE: "Engaging creative writing and storytelling",
  TECHNICAL: "Precise technical documentation and code",
  CASUAL: "Friendly, conversational, and approachable"
} as const;

export const SystemMessageSelector: React.FC<SystemMessageSelectorProps> = ({
  selectedPreset,
  customMessage,
  onPresetChange
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Personality & Style
          <Badge variant="outline">System Message</Badge>
        </CardTitle>
        <CardDescription>
          Choose how the AI should respond and communicate with you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(Object.keys(SYSTEM_MESSAGE_PRESETS) as Array<keyof typeof SYSTEM_MESSAGE_PRESETS>).map((preset) => (
            <Button
              key={preset}
              variant={selectedPreset === preset ? "default" : "outline"}
              size="sm"
              onClick={() => onPresetChange(preset)}
              className="h-auto p-3 text-left justify-start"
            >
              <div>
                <div className="font-medium text-xs uppercase tracking-wide">
                  {preset}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {PRESET_DESCRIPTIONS[preset]}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="pt-2 border-t">
          <Button
            variant={selectedPreset === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => onPresetChange("custom", customMessage)}
            className="w-full"
          >
            Custom System Message
          </Button>
        </div>

        {selectedPreset !== "custom" && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Current System Message:</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {SYSTEM_MESSAGE_PRESETS[selectedPreset as keyof typeof SYSTEM_MESSAGE_PRESETS]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 