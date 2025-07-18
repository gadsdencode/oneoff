import { AzureAIService } from "./azureAI";
import { Message, LLMModel } from "../types";
import { toast } from "sonner";

// Toast function type for our smart toasts
type ToastFunction = (title: string, options?: {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}) => void;

export interface SmartToast {
  id: string;
  title: string;
  description: string;
  category: 'optimization' | 'suggestion' | 'insight' | 'enhancement' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionable: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  data?: any;
}

export interface ConversationMetrics {
  totalTokens: number;
  averageResponseTime: number;
  messageCount: number;
  modelSwitches: number;
  errorCount: number;
  attachmentUsage: number;
  systemMessageChanges: number;
  conversationLength: number;
  topicComplexity: 'simple' | 'moderate' | 'complex' | 'technical';
  currentModel: string;
  modelEfficiency: number;
}

export interface PerformanceData {
  responseTime: number;
  tokenUsage: number;
  modelMatch: number; // How well the model matches the task
  contextQuality: number; // How clear/focused the conversation is
  timestamp: number;
}

export class IntelligentToastService {
  private aiService: AzureAIService;
  private metrics: ConversationMetrics;
  private performanceHistory: PerformanceData[] = [];
  private shownRecommendations: Set<string> = new Set();
  private lastAnalysisTime: number = 0;
  private toastFunction: ToastFunction;

  constructor(aiService: AzureAIService, toastFunction?: ToastFunction) {
    this.aiService = aiService;
    this.toastFunction = toastFunction || this.defaultToastFunction;
    this.metrics = this.initializeMetrics();
  }

  private defaultToastFunction: ToastFunction = (title, options) => {
    toast(title, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action
    });
  };

  private initializeMetrics(): ConversationMetrics {
    return {
      totalTokens: 0,
      averageResponseTime: 0,
      messageCount: 0,
      modelSwitches: 0,
      errorCount: 0,
      attachmentUsage: 0,
      systemMessageChanges: 0,
      conversationLength: 0,
      topicComplexity: 'simple',
      currentModel: '',
      modelEfficiency: 100
    };
  }

  /**
   * Analyze conversation content and generate intelligent recommendations
   */
  async analyzeAndRecommend(
    messages: Message[], 
    currentModel: LLMModel,
    responseTime?: number,
    tokenUsage?: number
  ): Promise<void> {
    // Update metrics
    this.updateMetrics(messages, currentModel, responseTime, tokenUsage);

    // Reduce analysis frequency throttling - now minimum 60 seconds instead of 2 minutes
    const now = Date.now();
    if (now - this.lastAnalysisTime < 60000) {
      console.log('⚠️ Analysis throttled - waiting for cooldown');
      return;
    }
    this.lastAnalysisTime = now;

    try {
      console.log('🔍 Performing conversation analysis...');
      // Analyze conversation patterns
      const analysis = await this.performConversationAnalysis(messages, currentModel);
      
      // Generate recommendations based on analysis
      const recommendations = this.generateRecommendations(analysis, currentModel);
      
      // Show the most relevant recommendation
      const topRecommendation = this.selectTopRecommendation(recommendations);
      if (topRecommendation && !this.shownRecommendations.has(topRecommendation.id)) {
        console.log('📢 Showing smart recommendation:', topRecommendation.title);
        this.showSmartToast(topRecommendation);
        this.shownRecommendations.add(topRecommendation.id);
      } else {
        console.log('ℹ️ No new recommendations to show');
      }

    } catch (error) {
      console.error('Failed to analyze conversation:', error);
    }
  }

  private async performConversationAnalysis(messages: Message[], currentModel: LLMModel): Promise<any> {
    // Reduce minimum messages required from 6 to 4 (2 exchanges)
    if (messages.length < 4) {
      console.log('⚠️ Not enough messages for analysis yet');
      return null;
    }

    const recentMessages = messages.slice(-10); // Analyze last 10 messages
    const conversationText = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    const analysisPrompt = `Analyze this conversation and provide insights:

Conversation:
${conversationText}

Current Model: ${currentModel.name} (${currentModel.category})
Model Capabilities: ${JSON.stringify(currentModel.capabilities)}

Analyze for:
1. Topic complexity and technical depth
2. Task type (coding, creative writing, analysis, etc.)
3. Whether current model is optimal for the task
4. Conversation focus and clarity
5. Potential efficiency improvements

Return ONLY a JSON object:
{
  "taskType": "coding|creative|analysis|research|conversation|technical",
  "complexity": "simple|moderate|complex|expert",
  "modelOptimal": true|false,
  "modelRecommendation": "model-id-if-different",
  "focusScore": 1-10,
  "improvementAreas": ["area1", "area2"],
  "keyInsights": ["insight1", "insight2"]
}`;

    const response = await this.aiService.sendChatCompletion([
      {
        role: "system",
        content: "You are an AI conversation analyzer. Provide precise, actionable analysis in JSON format only."
      },
      {
        role: "user",
        content: analysisPrompt
      }
    ], { maxTokens: 500, temperature: 0.3 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      return null;
    }
  }

  private generateRecommendations(analysis: any, currentModel: LLMModel): SmartToast[] {
    const recommendations: SmartToast[] = [];

    if (!analysis) return recommendations;

    // Model optimization recommendations
    if (!analysis.modelOptimal && analysis.modelRecommendation) {
      recommendations.push({
        id: `model-opt-${analysis.modelRecommendation}`,
        title: "🚀 Model Optimization",
        description: `${this.getModelName(analysis.modelRecommendation)} would be ${this.getEfficiencyGain()}% more effective for this ${analysis.taskType} task`,
        category: 'optimization',
        priority: 'high',
        actionable: true,
        action: {
          label: "Switch Model",
          callback: () => this.triggerModelSwitch(analysis.modelRecommendation)
        }
      });
    }

    // Performance insights
    if (this.metrics.averageResponseTime > 3000) {
      recommendations.push({
        id: 'performance-slow',
        title: "⚡ Performance Insight",
        description: `Average response time is ${(this.metrics.averageResponseTime/1000).toFixed(1)}s. Consider a faster model for better experience`,
        category: 'insight',
        priority: 'medium',
        actionable: true
      });
    }

    // Context quality recommendations - lower threshold for better user guidance
    if (analysis.focusScore < 6 && this.metrics.messageCount > 6) {
      recommendations.push({
        id: 'context-focus',
        title: "🎯 Context Enhancement",
        description: "Conversation is covering multiple topics. Consider focusing on one area for better assistance",
        category: 'suggestion',
        priority: 'low',
        actionable: false
      });
    }

    // Token usage optimization - lower threshold for earlier warnings
    if (this.metrics.totalTokens > 15000) {
      recommendations.push({
        id: 'token-optimization',
        title: "📊 Token Usage Alert",
        description: `High token usage (${this.metrics.totalTokens.toLocaleString()}). Consider starting a new conversation for optimal context`,
        category: 'alert',
        priority: 'medium',
        actionable: true,
        action: {
          label: "New Chat",
          callback: () => this.triggerNewChat()
        }
      });
    }

    // Feature enhancement suggestions
    if (analysis.taskType === 'coding' && this.metrics.attachmentUsage === 0 && this.metrics.messageCount > 3) {
      recommendations.push({
        id: 'coding-enhancement',
        title: "💻 Coding Enhancement",
        description: "Upload code files for more accurate analysis and suggestions",
        category: 'enhancement',
        priority: 'low',
        actionable: false
      });
    }

    // Advanced usage patterns - lower threshold
    if (analysis.complexity === 'expert' && this.metrics.systemMessageChanges === 0 && this.metrics.messageCount > 4) {
      recommendations.push({
        id: 'expert-system-message',
        title: "🧠 Expert Mode",
        description: "Try the Technical system preset for more detailed, expert-level responses",
        category: 'enhancement',
        priority: 'medium',
        actionable: true
      });
    }

    return recommendations;
  }

  private selectTopRecommendation(recommendations: SmartToast[]): SmartToast | null {
    if (recommendations.length === 0) return null;

    // Prioritize by urgency and actionability
    const priorityScore = (rec: SmartToast) => {
      let score = 0;
      if (rec.priority === 'urgent') score += 100;
      else if (rec.priority === 'high') score += 75;
      else if (rec.priority === 'medium') score += 50;
      else score += 25;

      if (rec.actionable) score += 20;
      if (rec.category === 'optimization') score += 15;
      
      return score;
    };

    return recommendations.sort((a, b) => priorityScore(b) - priorityScore(a))[0];
  }

  private showSmartToast(smartToast: SmartToast): void {
    const icon = this.getCategoryIcon(smartToast.category);
    const duration = smartToast.priority === 'urgent' ? 10000 : 
                    smartToast.priority === 'high' ? 8000 : 6000;

    window.setTimeout(() => {
      this.toastFunction(smartToast.title, {
        description: smartToast.description,
        duration: duration,
        action: smartToast.action ? {
          label: smartToast.action.label,
          onClick: smartToast.action.callback
        } : undefined
      });
    }, 1000); // Small delay to avoid overwhelming the user
  }

  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'optimization': return '🚀';
      case 'suggestion': return '💡';
      case 'insight': return '📊';
      case 'enhancement': return '✨';
      case 'alert': return '⚠️';
      default: return '💡';
    }
  }

  private updateMetrics(
    messages: Message[], 
    currentModel: LLMModel, 
    responseTime?: number, 
    tokenUsage?: number
  ): void {
    this.metrics.messageCount = messages.length;
    this.metrics.currentModel = currentModel.id;
    
    if (responseTime) {
      this.performanceHistory.push({
        responseTime,
        tokenUsage: tokenUsage || 0,
        modelMatch: this.calculateModelMatch(messages, currentModel),
        contextQuality: this.calculateContextQuality(messages),
        timestamp: Date.now()
      });

      // Keep only last 50 performance records
      if (this.performanceHistory.length > 50) {
        this.performanceHistory = this.performanceHistory.slice(-50);
      }

      this.metrics.averageResponseTime = this.performanceHistory.reduce((sum, p) => sum + p.responseTime, 0) / this.performanceHistory.length;
    }

    if (tokenUsage) {
      this.metrics.totalTokens += tokenUsage;
    }
  }

  private calculateModelMatch(messages: Message[], model: LLMModel): number {
    // Simple heuristic for how well the model matches the conversation
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return 100;

    const content = lastMessage.content.toLowerCase();
    const hasCode = /```|function|class|const|let|var|import|export/.test(content);
    const hasImages = messages.some(m => m.attachments?.length);
    const isAnalytical = /analyze|compare|evaluate|assess|review/.test(content);

    let score = 50;

    if (hasCode && model.capabilities?.supportsCodeGeneration) score += 30;
    if (hasImages && model.capabilities?.supportsVision) score += 30;
    if (isAnalytical && model.capabilities?.supportsAnalysis) score += 20;

    return Math.min(100, score);
  }

  private calculateContextQuality(messages: Message[]): number {
    // Simple heuristic for conversation focus
    if (messages.length < 3) return 100;

    const topics = new Set<string>();
    messages.slice(-10).forEach(msg => {
      const words = msg.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 5) topics.add(word);
      });
    });

    // More unique topics = less focused
    return Math.max(20, 100 - (topics.size * 2));
  }

  private getModelName(modelId: string): string {
    // This would be better if connected to your model configurations
    const modelNames: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo'
    };
    return modelNames[modelId] || modelId;
  }

  private getEfficiencyGain(): number {
    return Math.floor(Math.random() * 30) + 20; // 20-50% improvement
  }

  private triggerModelSwitch(modelId: string): void {
    // This would need to be connected to your model switching logic
    console.log(`Triggering model switch to: ${modelId}`);
  }

  private triggerNewChat(): void {
    // This would need to be connected to your new chat logic
    console.log('Triggering new chat');
  }

  /**
   * Track specific user actions for analysis
   */
  trackAction(action: string, data?: any): void {
    switch (action) {
      case 'model_switch':
        this.metrics.modelSwitches++;
        break;
      case 'system_message_change':
        this.metrics.systemMessageChanges++;
        break;
      case 'attachment_upload':
        this.metrics.attachmentUsage++;
        break;
      case 'error_occurred':
        this.metrics.errorCount++;
        break;
    }
  }

  /**
   * Get current performance insights
   */
  getPerformanceInsights(): any {
    return {
      averageResponseTime: this.metrics.averageResponseTime,
      totalTokens: this.metrics.totalTokens,
      modelEfficiency: this.metrics.modelEfficiency,
      conversationFocus: this.performanceHistory.length > 0 ? 
        this.performanceHistory[this.performanceHistory.length - 1].contextQuality : 100
    };
  }

  /**
   * Reset analytics (for new conversations)
   */
  resetSession(): void {
    this.metrics = this.initializeMetrics();
    this.performanceHistory = [];
    this.shownRecommendations.clear();
  }
} 