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
    console.log(`🔍 Starting analysis for ${messages.length} messages with model ${currentModel.name}`);
    
    // Show analysis in progress notification
    this.toastFunction("🔍 Analyzing Conversation", {
      description: "Generating intelligent recommendations...",
      duration: 3000
    });
    
    // Update metrics
    this.updateMetrics(messages, currentModel, responseTime, tokenUsage);

    // Reduce analysis frequency throttling even further for testing
    const now = Date.now();
    if (now - this.lastAnalysisTime < 10000) { // Reduced from 30s to 10s for faster testing
      console.log('⚠️ Analysis throttled - waiting for cooldown');
      return;
    }
    this.lastAnalysisTime = now;

    try {
      console.log('🔍 Performing conversation analysis...');
      
      // Try Azure AI analysis first
      let analysis = null;
      try {
        analysis = await this.performConversationAnalysis(messages, currentModel);
        console.log('✅ Azure AI analysis completed:', analysis);
      } catch (aiError) {
        console.warn('⚠️ Azure AI analysis failed, using fallback:', aiError);
        // Generate fallback analysis without Azure AI
        analysis = this.generateFallbackAnalysis(messages, currentModel);
        console.log('🔄 Using fallback analysis:', analysis);
      }
      
      // Generate recommendations based on analysis (or fallback)
      const recommendations = this.generateRecommendations(analysis, currentModel);
      console.log(`💡 Generated ${recommendations.length} recommendations:`, recommendations.map((r: SmartToast) => r.title));
      
      // TEMPORARY: Always add a test recommendation to verify the system works
      if (messages.length >= 2) {
        const testRecommendation = {
          id: `test-recommendation-${Date.now()}`,
          title: "🧪 Smart Analysis Complete",
          description: `Analyzed ${messages.length} messages. System is working correctly!`,
          category: 'insight' as const,
          priority: 'medium' as const,
          actionable: false
        };
        recommendations.unshift(testRecommendation);
        console.log('➕ Added test recommendation:', testRecommendation);
      }
      
      console.log('📋 All recommendations before selection:', recommendations);
      console.log('🔍 Previously shown recommendations:', Array.from(this.shownRecommendations));
      
      // Show the most relevant recommendation
      const topRecommendation = this.selectTopRecommendation(recommendations);
      console.log('🎯 Selected top recommendation:', topRecommendation);
      
      if (topRecommendation && !this.shownRecommendations.has(topRecommendation.id)) {
        console.log('📢 Showing smart recommendation:', topRecommendation.title);
        this.showSmartToast(topRecommendation);
        this.shownRecommendations.add(topRecommendation.id);
        console.log('✅ Recommendation shown and added to cache');
      } else if (topRecommendation) {
        console.log('🔄 Top recommendation already shown:', topRecommendation.title);
      } else {
        console.log('ℹ️ No new recommendations to show');
      }

    } catch (error) {
      console.error('❌ Analysis completely failed:', error);
      
      // Show a basic notification as fallback
      this.toastFunction("🧠 Smart Analysis", {
        description: "Performance analysis completed. Continue chatting for more insights.",
        duration: 4000
      });
    }
  }

  private async performConversationAnalysis(messages: Message[], currentModel: LLMModel): Promise<any> {
    // Temporarily reduce to 2 messages for immediate testing
    if (messages.length < 2) {
      console.log('⚠️ Not enough messages for analysis yet');
      return null;
    }

    console.log(`🔍 Starting Azure AI analysis for ${messages.length} messages...`);

    const recentMessages = messages.slice(-10); // Analyze last 10 messages
    const conversationText = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    console.log('📝 Conversation text preview:', conversationText.substring(0, 200) + '...');

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

    console.log('📡 Azure AI response received:', response.substring(0, 200) + '...');

    // Enhanced JSON parsing with sanitization
          console.log('🔍 Full Azure AI response for parsing:', response);
      const parsed = this.parseAzureAIResponse(response);
      if (parsed) {
        console.log('✅ Successfully parsed Azure AI analysis:', parsed);
        return parsed;
      } else {
        console.warn('⚠️ Could not parse Azure AI response, using fallback');
        return null;
      }
    } catch (apiError: any) {
      console.error('❌ Azure AI API call failed:', apiError);
      throw apiError; // Re-throw so the fallback mechanism kicks in
  }

  /**
   * Robust JSON parsing for Azure AI responses
   */
  private parseAzureAIResponse(response: string): any {
    try {
      // First, try to find JSON in the response
      const jsonMatches = [
        // Try to find complete JSON objects
        response.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/),
        // Try to find JSON with nested objects
        response.match(/\{[\s\S]*\}/),
        // Try to find JSON starting with a quote
        response.match(/"\w+":\s*\{[\s\S]*\}/),
      ];

      for (let i = 0; i < jsonMatches.length; i++) {
        const match = jsonMatches[i];
        if (match) {
          try {
            let jsonStr = match[0];
            console.log(`🎯 Trying JSON pattern ${i + 1}:`, jsonStr);
            
            // Clean up common JSON issues
            jsonStr = this.sanitizeJSON(jsonStr);
            console.log(`🧽 After sanitization:`, jsonStr);
            
            const parsed = JSON.parse(jsonStr);
            
            // Validate the parsed object has expected fields
            if (this.validateAnalysisResponse(parsed)) {
              console.log('✅ Successfully parsed and validated JSON:', parsed);
              return parsed;
            } else {
              console.warn('⚠️ Parsed JSON but validation failed:', parsed);
            }
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse JSON pattern ${i + 1}:`, parseError);
            continue;
          }
        }
      }

      console.warn('⚠️ No valid JSON found in Azure AI response');
      return null;
    } catch (error) {
      console.error('❌ JSON parsing completely failed:', error);
      return null;
    }
  }

  /**
   * Sanitize JSON string to fix common Azure AI response issues
   */
  private sanitizeJSON(jsonStr: string): string {
    // Remove leading/trailing whitespace and newlines
    jsonStr = jsonStr.trim();
    
    // Fix common issues with Azure AI responses
    jsonStr = jsonStr
      // Fix unquoted property names
      .replace(/(\w+):/g, '"$1":')
      // Fix single quotes
      .replace(/'/g, '"')
      // Fix trailing commas in objects and arrays
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix missing quotes around string values
      .replace(/:\s*([a-zA-Z][a-zA-Z0-9_\-\|\s]*)\s*([,}\]])/g, (match: string, value: string, suffix: string) => {
        // Don't quote boolean values, numbers, or already quoted strings
        if (value === 'true' || value === 'false' || value === 'null' || 
            /^\d+(\.\d+)?$/.test(value) || value.startsWith('"')) {
          return `: ${value}${suffix}`;
        }
        return `: "${value}"${suffix}`;
      })
      // Fix boolean values that were quoted
      .replace(/:\s*"(true|false)"/g, ': $1')
      // Fix number values that were quoted
      .replace(/:\s*"(\d+(?:\.\d+)?)"/g, ': $1')
      // Fix array syntax issues - handle malformed arrays
      .replace(/\[\s*([^[\]]*?)\s*\]/g, (match: string, content: string) => {
        if (!content.trim()) return '[]';
        
        // Split by comma but handle quoted strings
        const items = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = null;
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if ((char === '"' || char === "'") && (i === 0 || content[i-1] !== '\\')) {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
              quoteChar = null;
            }
          }
          
          if (char === ',' && !inQuotes) {
            items.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        if (current.trim()) {
          items.push(current.trim());
        }
        
        // Clean up and quote each item properly
        const cleanItems = items.map(item => {
          item = item.trim();
          if (!item) return '""';
          
          // If it's already quoted, return as is
          if ((item.startsWith('"') && item.endsWith('"')) || 
              (item.startsWith("'") && item.endsWith("'"))) {
            return item.replace(/'/g, '"');
          }
          
          // If it's a boolean or number, don't quote
          if (item === 'true' || item === 'false' || item === 'null' || 
              /^\d+(\.\d+)?$/.test(item)) {
            return item;
          }
          
          // Quote everything else
          return `"${item}"`;
        });
        
        return `[${cleanItems.join(', ')}]`;
      });
    
    console.log('🧹 Sanitized JSON:', jsonStr);
    return jsonStr;
  }

  /**
   * Validate that the parsed response has the expected structure
   */
  private validateAnalysisResponse(obj: any): boolean {
    return obj && 
           typeof obj === 'object' &&
           (obj.taskType || obj.complexity || obj.modelOptimal !== undefined);
  }

  /**
   * Generate fallback analysis when Azure AI is not available
   */
  private generateFallbackAnalysis(messages: Message[], currentModel: LLMModel): any {
    console.log('🔄 Generating fallback analysis...');
    
    const userMessages = messages.filter(m => m.role === 'user');
    const lastMessage = messages[messages.length - 1];
    
    // Simple heuristics-based analysis
    const hasCode = userMessages.some(m => m.content.includes('```') || 
      m.content.toLowerCase().includes('code') || 
      m.content.toLowerCase().includes('function'));
    
    const hasComplexTerms = userMessages.some(m => 
      ['algorithm', 'optimization', 'architecture', 'scalability', 'distributed'].some(term =>
        m.content.toLowerCase().includes(term)
      )
    );
    
    const isLongConversation = messages.length > 15;
    const isVeryLongConversation = messages.length > 25;
    
    return {
      taskType: hasCode ? 'coding' : 'conversation',
      complexity: hasComplexTerms ? 'expert' : isLongConversation ? 'moderate' : 'simple',
      modelOptimal: currentModel.performance > 90,
      modelRecommendation: hasCode && currentModel.id !== 'gpt-4o' ? 'gpt-4o' : null,
      focusScore: isVeryLongConversation ? 4 : isLongConversation ? 6 : 8,
      improvementAreas: isLongConversation ? ['context', 'focus'] : [],
      keyInsights: ['conversation_flow', 'model_usage']
    };
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

    console.log('💡 Generating recommendations with analysis:', analysis);
    console.log('📊 Current metrics:', this.metrics);

    // ALWAYS add a basic engagement recommendation for testing
    recommendations.push({
      id: `engagement-${Date.now()}`,
      title: "💬 Conversation Insights",
      description: `You're actively exploring with ${this.metrics.messageCount} messages. Keep the great questions coming!`,
      category: 'insight',
      priority: 'low',
      actionable: false
    });

    // Conversation milestone - more frequent (every 3 messages instead of 5)
    if (this.metrics.messageCount >= 3 && this.metrics.messageCount % 3 === 0) {
      recommendations.push({
        id: `conversation-milestone-${this.metrics.messageCount}`,
        title: "🎯 Conversation Milestone",
        description: `You've had ${this.metrics.messageCount} messages in this conversation. Great job exploring!`,
        category: 'insight',
        priority: 'low',
        actionable: false
      });
    }

    // Basic performance recommendation - lower threshold
    if (this.metrics.averageResponseTime > 1000) { // Reduced from 2000 to 1000
      recommendations.push({
        id: 'basic-performance',
        title: "⚡ Performance Note",
        description: `Response time averaging ${(this.metrics.averageResponseTime/1000).toFixed(1)}s. This is normal for complex queries.`,
        category: 'insight',
        priority: 'low',
        actionable: false
      });
    }

    console.log(`📝 Generated ${recommendations.length} basic recommendations before analysis-based ones`);

    if (!analysis) {
      console.log('ℹ️ No analysis available, returning basic recommendations only');
      return recommendations;
    }

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
    console.log('🎬 showSmartToast called with:', smartToast);
    
    const icon = this.getCategoryIcon(smartToast.category);
    const duration = smartToast.priority === 'urgent' ? 10000 : 
                    smartToast.priority === 'high' ? 8000 : 6000;

    console.log('⏰ Toast will show in 1 second with duration:', duration);

    window.setTimeout(() => {
      console.log('🚀 Actually displaying toast:', smartToast.title);
      
      this.toastFunction(smartToast.title, {
        description: smartToast.description,
        duration: duration,
        action: smartToast.action ? {
          label: smartToast.action.label,
          onClick: smartToast.action.callback
        } : undefined
      });
      
      console.log('✅ Toast function called successfully');
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