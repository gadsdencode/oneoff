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
  private availableModels: LLMModel[] = [];
  private modelSwitchCallback?: (modelId: string) => void;
  private newChatCallback?: () => void;

  constructor(
    aiService: AzureAIService, 
    toastFunction?: ToastFunction,
    modelSwitchCallback?: (modelId: string) => void,
    newChatCallback?: () => void
  ) {
    this.aiService = aiService;
    this.toastFunction = toastFunction || this.defaultToastFunction;
    this.modelSwitchCallback = modelSwitchCallback;
    this.newChatCallback = newChatCallback;
    this.metrics = this.initializeMetrics();
    this.loadAvailableModels();
  }

  private loadAvailableModels(): void {
    try {
      this.availableModels = AzureAIService.getAvailableModels();
    } catch (err) {
      console.warn('Failed to load available models:', err);
      this.availableModels = [];
    }
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

    // Don't analyze too frequently
    const now = Date.now();
    if (now - this.lastAnalysisTime < 120000) return; // 2 minutes minimum between analyses
    this.lastAnalysisTime = now;

    try {
      // Analyze conversation patterns
      const analysis = await this.performConversationAnalysis(messages, currentModel);
      
      // Generate recommendations based on analysis
      const recommendations = this.generateRecommendations(analysis, currentModel);
      
      // Show the most relevant recommendation
      const topRecommendation = this.selectTopRecommendation(recommendations);
      if (topRecommendation && !this.shownRecommendations.has(topRecommendation.id)) {
        this.showSmartToast(topRecommendation);
        this.shownRecommendations.add(topRecommendation.id);
      }

    } catch (error) {
      console.error('Failed to analyze conversation:', error);
    }
  }

  private async performConversationAnalysis(messages: Message[], currentModel: LLMModel): Promise<any> {
    if (messages.length < 6) return null; // Require at least 3 exchanges before analyzing

    const recentMessages = messages.slice(-10); // Analyze last 10 messages
    const conversationText = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    // Build available models context for AI
    const modelOptions = this.availableModels
      .filter(m => m.id !== currentModel.id) // Exclude current model
      .map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        performance: m.performance,
        strengths: this.getModelStrengths(m),
        bestFor: this.getModelBestUseCase(m)
      }));

    const analysisPrompt = `Analyze this conversation and recommend the optimal model:

CONVERSATION:
${conversationText}

CURRENT MODEL:
- ID: ${currentModel.id}
- Name: ${currentModel.name}
- Category: ${currentModel.category}
- Performance: ${currentModel.performance}
- Capabilities: ${JSON.stringify(currentModel.capabilities)}

AVAILABLE ALTERNATIVE MODELS:
${JSON.stringify(modelOptions, null, 2)}

ANALYSIS CRITERIA:
1. What type of task is being performed? (coding, creative writing, analysis, research, technical discussion)
2. What complexity level is required? (simple, moderate, complex, expert)
3. Is the current model optimal for this specific task?
4. Which alternative model (if any) would perform significantly better?
5. How focused is the conversation? (1-10 scale)

IMPORTANT: Only recommend a different model if it would provide meaningfully better results (20%+ improvement) for the specific task being performed.

Return ONLY a JSON object:
{
  "taskType": "coding|creative|analysis|research|conversation|technical",
  "complexity": "simple|moderate|complex|expert",
  "modelOptimal": true|false,
  "modelRecommendation": "model-id-only-if-significantly-better",
  "improvementReason": "specific reason why recommended model is better",
  "focusScore": 1-10,
  "confidenceScore": 1-10
}`;

    const response = await this.aiService.sendChatCompletion([
      {
        role: "system",
        content: "You are an expert AI model analyzer. Recommend model switches only when they provide significant, measurable improvements for the specific task. Be conservative - only recommend changes when clearly beneficial."
      },
      {
        role: "user",
        content: analysisPrompt
      }
    ], { maxTokens: 800, temperature: 0.2 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      return null;
    }
  }

  private getModelStrengths(model: LLMModel): string[] {
    const strengths: string[] = [];
    
    if (model.performance >= 95) strengths.push("Exceptional accuracy");
    if (model.capabilities?.supportsVision) strengths.push("Image analysis");
    if (model.capabilities?.supportsCodeGeneration) strengths.push("Code generation");
    if (model.category === "code") strengths.push("Programming expertise");
    if (model.category === "reasoning") strengths.push("Complex reasoning");
    if (model.latency < 700) strengths.push("Fast response");
    if (model.cost < 0.001) strengths.push("Cost-effective");
    if (model.contextLength > 100000) strengths.push("Long context");
    
    return strengths;
  }

  private getModelBestUseCase(model: LLMModel): string {
    if (model.category === "code") return "Programming and software development";
    if (model.category === "multimodal") return "Image analysis and complex tasks";
    if (model.category === "reasoning") return "Complex problem solving and analysis";
    if (model.performance >= 95) return "High-accuracy professional tasks";
    if (model.cost < 0.001) return "High-volume or cost-sensitive applications";
    return "General-purpose conversations";
  }

  private generateRecommendations(analysis: any, currentModel: LLMModel): SmartToast[] {
    const recommendations: SmartToast[] = [];

    if (!analysis) return recommendations;

    // Model optimization recommendations - with proper filtering and realistic efficiency
    if (!analysis.modelOptimal && 
        analysis.modelRecommendation && 
        analysis.modelRecommendation !== currentModel.id &&
        analysis.confidenceScore >= 7) {
      
      const recommendedModel = this.availableModels.find(m => m.id === analysis.modelRecommendation);
      if (recommendedModel) {
        const efficiencyGain = this.calculateRealEfficiencyGain(currentModel, recommendedModel, analysis.taskType);
        
        recommendations.push({
          id: `model-opt-${analysis.modelRecommendation}`,
          title: "🚀 Model Optimization",
          description: `${recommendedModel.name} would be ${efficiencyGain}% more effective for ${analysis.taskType} tasks. ${analysis.improvementReason || 'Better suited for this type of work.'}`,
          category: 'optimization',
          priority: 'high',
          actionable: true,
          action: {
            label: "Switch Model",
            callback: () => this.triggerModelSwitch(analysis.modelRecommendation)
          }
        });
      }
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

    // Context quality recommendations - only for longer conversations that are genuinely unfocused
    if (analysis.focusScore < 4 && this.metrics.messageCount > 10) {
      recommendations.push({
        id: 'context-focus',
        title: "🎯 Context Enhancement",
        description: "Conversation is covering many different topics. Consider starting a new chat or focusing on one area",
        category: 'suggestion',
        priority: 'low',
        actionable: false
      });
    }

    // Token usage optimization - much higher threshold
    if (this.metrics.totalTokens > 25000) {
      recommendations.push({
        id: 'token-optimization',
        title: "📊 Token Usage Alert",
        description: `Very high token usage (${this.metrics.totalTokens.toLocaleString()}). Consider starting a new conversation for optimal context`,
        category: 'alert',
        priority: 'high',
        actionable: true,
        action: {
          label: "New Chat",
          callback: () => this.triggerNewChat()
        }
      });
    }

    // Feature enhancement suggestions
    if (analysis.taskType === 'coding' && this.metrics.attachmentUsage === 0) {
      recommendations.push({
        id: 'coding-enhancement',
        title: "💻 Coding Enhancement",
        description: "Upload code files for more accurate analysis and suggestions",
        category: 'enhancement',
        priority: 'low',
        actionable: false
      });
    }

    // Advanced usage patterns
    if (analysis.complexity === 'expert' && this.metrics.systemMessageChanges === 0) {
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



  private calculateRealEfficiencyGain(currentModel: LLMModel, recommendedModel: LLMModel, taskType: string): number {
    // Calculate efficiency gain based on actual model performance differences
    let baseGain = Math.max(0, recommendedModel.performance - currentModel.performance);
    
    // Apply task-specific multipliers
    const taskMultipliers: Record<string, number> = {
      'coding': recommendedModel.capabilities?.supportsCodeGeneration ? 1.5 : 0.8,
      'technical': recommendedModel.category === 'reasoning' ? 1.4 : 1.0,
      'analysis': recommendedModel.capabilities?.supportsAnalysis ? 1.3 : 1.0,
      'creative': recommendedModel.category === 'text' ? 1.2 : 1.0,
      'multimodal': recommendedModel.capabilities?.supportsVision ? 1.6 : 1.0
    };
    
    const multiplier = taskMultipliers[taskType] || 1.0;
    const adjustedGain = Math.round(baseGain * multiplier);
    
    // Ensure realistic range (15-60% improvement)
    return Math.max(15, Math.min(60, adjustedGain));
  }

  private triggerModelSwitch(modelId: string): void {
    if (this.modelSwitchCallback) {
      this.modelSwitchCallback(modelId);
    } else {
      console.warn('Model switch callback not configured');
    }
  }

  private triggerNewChat(): void {
    if (this.newChatCallback) {
      this.newChatCallback();
    } else {
      console.warn('New chat callback not configured');
    }
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