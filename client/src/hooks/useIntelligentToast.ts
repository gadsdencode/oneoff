import { useEffect, useRef, useCallback } from 'react';
import { IntelligentToastService } from '../lib/intelligentToastService';
import { AzureAIService } from '../lib/azureAI';
import { Message, LLMModel } from '../types';

interface UseIntelligentToastOptions {
  enabled?: boolean;
  aiService?: AzureAIService | null;
  toastFunction?: (title: string, options?: {
    description?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }) => void;
}

export const useIntelligentToast = (options: UseIntelligentToastOptions) => {
  const { enabled = true, aiService, toastFunction } = options;
  const serviceRef = useRef<IntelligentToastService | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);

  // Initialize intelligent toast service
  useEffect(() => {
    if (enabled && aiService && !serviceRef.current) {
      serviceRef.current = new IntelligentToastService(aiService, toastFunction);
    }
  }, [enabled, aiService, toastFunction]);

  // Analyze conversation and show recommendations
  const analyzeConversation = useCallback(async (
    messages: Message[],
    currentModel: LLMModel,
    responseTime?: number,
    tokenUsage?: number
  ) => {
    if (!serviceRef.current || !enabled) return;

    const now = Date.now();
    // Prevent too frequent analysis (minimum 30 seconds between analyses)
    if (now - lastAnalysisTimeRef.current < 30000) return;

    lastAnalysisTimeRef.current = now;
    await serviceRef.current.analyzeAndRecommend(messages, currentModel, responseTime, tokenUsage);
  }, [enabled]);

  // Track user actions
  const trackAction = useCallback((action: string, data?: any) => {
    if (!serviceRef.current || !enabled) return;
    serviceRef.current.trackAction(action, data);
  }, [enabled]);

  // Get performance insights
  const getInsights = useCallback(() => {
    if (!serviceRef.current || !enabled) return null;
    return serviceRef.current.getPerformanceInsights();
  }, [enabled]);

  // Reset session data
  const resetSession = useCallback(() => {
    if (!serviceRef.current || !enabled) return;
    serviceRef.current.resetSession();
  }, [enabled]);

  // Show immediate optimization tip
  const showOptimizationTip = useCallback((tip: string, action?: () => void) => {
    if (!enabled) return;
    
    if (toastFunction) {
      toastFunction("🚀 Optimization Tip", {
        description: tip,
        duration: 8000,
        action: action ? {
          label: "Apply",
          onClick: action
        } : undefined
      });
    }
  }, [enabled, toastFunction]);

  // Show performance alert
  const showPerformanceAlert = useCallback((message: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
    if (!enabled) return;

    const icons = { low: '💡', medium: '⚡', high: '⚠️' };
    const durations = { low: 6000, medium: 8000, high: 10000 };

    if (toastFunction) {
      toastFunction(`${icons[severity]} Performance Alert`, {
        description: message,
        duration: durations[severity]
      });
    }
  }, [enabled, toastFunction]);

  return {
    analyzeConversation,
    trackAction,
    getInsights,
    resetSession,
    showOptimizationTip,
    showPerformanceAlert,
    isEnabled: enabled && !!serviceRef.current
  };
}; 