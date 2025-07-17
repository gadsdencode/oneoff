import React from "react";
import { SYSTEM_MESSAGE_PRESETS } from "../hooks/useAzureAI";
import { Button } from "./ui/button";
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
    <div className="w-full space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-white">Make Nomad your own</h3>
        </div>
        <p className="text-sm text-slate-300">
          Choose how Nomad should respond and communicate with you
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(SYSTEM_MESSAGE_PRESETS) as Array<keyof typeof SYSTEM_MESSAGE_PRESETS>).map((preset) => (
            <Button
              key={preset}
              variant={selectedPreset === preset ? "default" : "outline"}
              size="sm"
              onClick={() => onPresetChange(preset)}
              className="h-auto p-4 text-left justify-start bg-slate-800/50 hover:bg-slate-700/50 border-slate-600"
            >
              <div className="w-full">
                <div className="font-medium text-sm uppercase tracking-wide mb-1 text-white">
                  {preset}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed break-words">
                  {PRESET_DESCRIPTIONS[preset]}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="pt-3 border-t border-slate-600">
          <Button
            variant={selectedPreset === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => onPresetChange("custom", customMessage)}
            className="w-full bg-slate-800/50 hover:bg-slate-700/50 border-slate-600"
          >
            <span className="font-medium">Custom System Message</span>
          </Button>
        </div>

        {selectedPreset !== "custom" && (
          <div className="mt-4 p-4 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-600/50">
            <p className="text-sm font-medium mb-3 text-white">Current System Message:</p>
            <div className="bg-slate-900/50 rounded-md p-3 border border-slate-700/50">
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed break-words">
                {SYSTEM_MESSAGE_PRESETS[selectedPreset as keyof typeof SYSTEM_MESSAGE_PRESETS]}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 