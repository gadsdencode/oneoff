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

export interface ConversationInsights {
  // User interaction patterns
  userInteractionStyle: {
    communicationType: 'direct' | 'exploratory' | 'detailed' | 'concise' | 'iterative';
    questionStyle: 'specific' | 'open-ended' | 'follow-up' | 'clarifying';
    engagementLevel: 'high' | 'medium' | 'low';
    patienceLevel: 'high' | 'medium' | 'low';
  };
  
  // Conversation dynamics
  conversationDynamics: {
    topicDepth: 'surface' | 'moderate' | 'deep' | 'expert';
    focusPattern: 'single-topic' | 'multi-topic' | 'branching' | 'returning';
    complexityProgression: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    responsePreference: 'detailed' | 'concise' | 'step-by-step' | 'overview';
  };
  
  // Behavioral insights
  behavioralInsights: {
    learningStyle: 'visual' | 'practical' | 'theoretical' | 'experimental';
    problemSolvingApproach: 'systematic' | 'creative' | 'pragmatic' | 'analytical';
    confidenceLevel: 'high' | 'medium' | 'low';
    expertiseArea: string[];
    improvementAreas: string[];
  };
  
  // Interaction quality
  interactionQuality: {
    clarityScore: number; // 1-10
    efficiencyScore: number; // 1-10
    satisfactionPrediction: number; // 1-10
    potentialFrustrationPoints: string[];
  };
  
  // Hidden patterns
  hiddenInsights: {
    thinkingPattern: string;
    aiAssumptions: string;
    uncertaintyHandling: string;
    motivation: string;
  };
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
  interactionPatterns: {
    communicationTypes: string[];
    questionStyles: string[];
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
    averageMessageLength: number;
    followUpFrequency: number;
  };
  behavioralProfile: {
    learningStyle: string;
    problemSolvingApproach: string;
    confidenceTrend: 'increasing' | 'decreasing' | 'stable';
    expertiseAreas: string[];
  };
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
      modelEfficiency: 100,
      interactionPatterns: {
        communicationTypes: [],
        questionStyles: [],
        engagementTrend: 'stable',
        averageMessageLength: 0,
        followUpFrequency: 0
      },
      behavioralProfile: {
        learningStyle: 'theoretical',
        problemSolvingApproach: 'systematic',
        confidenceTrend: 'stable',
        expertiseAreas: []
      }
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
        analysis = this.generateEnhancedFallbackAnalysis(messages, currentModel);
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
    if (messages.length < 2) {
      console.log('⚠️ Not enough messages for analysis yet');
      return null;
    }

    console.log(`🔍 Starting enhanced conversation analysis for ${messages.length} messages...`);

    const recentMessages = messages.slice(-15); // Analyze last 15 messages for better context
    const conversationText = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    // Extract user messages for pattern analysis
    const userMessages = recentMessages.filter(m => m.role === 'user');
    const assistantMessages = recentMessages.filter(m => m.role === 'assistant');

    const analysisPrompt = `Analyze this conversation to understand the user's interaction patterns and provide hidden insights:

CONVERSATION:
${conversationText}

ANALYSIS TASK:
Provide deep insights about the user's interaction style, communication patterns, and behavioral tendencies. Focus on revealing "hidden insights" that would help understand how this user thinks and interacts with AI.

ANALYSIS CRITERIA:

1. **User Interaction Style Analysis:**
   - How does the user communicate? (direct, exploratory, detailed, concise, iterative)
   - What type of questions do they ask? (specific, open-ended, follow-up, clarifying)
   - What's their engagement level? (high, medium, low)
   - How patient are they with responses? (high, medium, low)

2. **Conversation Dynamics:**
   - How deep do they go into topics? (surface, moderate, deep, expert)
   - How do they handle multiple topics? (single-topic, multi-topic, branching, returning)
   - Does complexity increase, decrease, or stay stable?
   - What response style do they prefer? (detailed, concise, step-by-step, overview)

3. **Behavioral Insights:**
   - What's their learning style? (visual, practical, theoretical, experimental)
   - How do they approach problem-solving? (systematic, creative, pragmatic, analytical)
   - What's their confidence level? (high, medium, low)
   - What areas show expertise vs. areas for improvement?

4. **Interaction Quality Assessment:**
   - Rate clarity of communication (1-10)
   - Rate efficiency of interaction (1-10)
   - Predict satisfaction level (1-10)
   - Identify potential frustration points

5. **Hidden Patterns:**
   - What subtle patterns reveal their thinking process?
   - What assumptions do they make about AI capabilities?
   - How do they handle uncertainty or ambiguity?
   - What motivates their questions?

Return ONLY a JSON object with this structure:
{
  "userInteractionStyle": {
    "communicationType": "direct|exploratory|detailed|concise|iterative",
    "questionStyle": "specific|open-ended|follow-up|clarifying",
    "engagementLevel": "high|medium|low",
    "patienceLevel": "high|medium|low"
  },
  "conversationDynamics": {
    "topicDepth": "surface|moderate|deep|expert",
    "focusPattern": "single-topic|multi-topic|branching|returning",
    "complexityProgression": "increasing|decreasing|stable|fluctuating",
    "responsePreference": "detailed|concise|step-by-step|overview"
  },
  "behavioralInsights": {
    "learningStyle": "visual|practical|theoretical|experimental",
    "problemSolvingApproach": "systematic|creative|pragmatic|analytical",
    "confidenceLevel": "high|medium|low",
    "expertiseArea": ["area1", "area2"],
    "improvementAreas": ["area1", "area2"]
  },
  "interactionQuality": {
    "clarityScore": 1-10,
    "efficiencyScore": 1-10,
    "satisfactionPrediction": 1-10,
    "potentialFrustrationPoints": ["point1", "point2"]
  },
  "hiddenInsights": {
    "thinkingPattern": "description of how they think",
    "aiAssumptions": "what they assume about AI",
    "uncertaintyHandling": "how they handle uncertainty",
    "motivation": "what drives their questions"
  }
}`;

    try {
      const response = await this.aiService.sendChatCompletion([
        {
          role: "system",
          content: "You are an expert in analyzing human-AI interaction patterns. Focus on revealing subtle insights about user behavior, communication style, and interaction preferences. Be insightful and specific."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ], { maxTokens: 1200, temperature: 0.3 });

      console.log('📡 Enhanced analysis response received:', response.substring(0, 200) + '...');
      
      const parsed = this.parseAzureAIResponse(response);
      if (parsed) {
        console.log('✅ Successfully parsed enhanced analysis:', parsed);
        return parsed;
      } else {
        console.warn('⚠️ Could not parse enhanced analysis, using fallback');
        return this.generateEnhancedFallbackAnalysis(messages, currentModel);
      }
    } catch (apiError: any) {
      console.error('❌ Enhanced analysis failed:', apiError);
      return this.generateEnhancedFallbackAnalysis(messages, currentModel);
    }
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
           (obj.userInteractionStyle || obj.conversationDynamics || obj.behavioralInsights || 
            obj.taskType || obj.complexity || obj.modelOptimal !== undefined);
  }

  /**
   * Generate enhanced fallback analysis when Azure AI is not available
   */
  private generateEnhancedFallbackAnalysis(messages: Message[], currentModel: LLMModel): any {
    console.log('🔄 Generating enhanced fallback analysis...');
    
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    // Analyze message patterns
    const avgUserMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const hasCode = userMessages.some(m => m.content.includes('```') || m.content.toLowerCase().includes('code'));
    const hasQuestions = userMessages.some(m => m.content.includes('?'));
    const hasFollowUps = userMessages.length > 2 && userMessages.slice(-2).some(m => 
      m.content.toLowerCase().includes('what about') || 
      m.content.toLowerCase().includes('can you') ||
      m.content.toLowerCase().includes('how about')
    );
    
    // Determine interaction patterns
    const communicationType = avgUserMessageLength > 200 ? 'detailed' : 
                             hasFollowUps ? 'iterative' : 
                             hasQuestions ? 'exploratory' : 'direct';
    
    const questionStyle = hasFollowUps ? 'follow-up' : 
                         hasQuestions ? 'open-ended' : 'specific';
    
    const engagementLevel = userMessages.length > 5 ? 'high' : 
                           userMessages.length > 2 ? 'medium' : 'low';
    
    return {
      userInteractionStyle: {
        communicationType,
        questionStyle,
        engagementLevel,
        patienceLevel: 'medium'
      },
      conversationDynamics: {
        topicDepth: hasCode ? 'deep' : 'moderate',
        focusPattern: userMessages.length > 8 ? 'multi-topic' : 'single-topic',
        complexityProgression: 'stable',
        responsePreference: 'detailed'
      },
      behavioralInsights: {
        learningStyle: hasCode ? 'practical' : 'theoretical',
        problemSolvingApproach: hasCode ? 'systematic' : 'creative',
        confidenceLevel: 'medium',
        expertiseArea: hasCode ? ['programming'] : ['general'],
        improvementAreas: ['communication_clarity']
      },
      interactionQuality: {
        clarityScore: 7,
        efficiencyScore: 6,
        satisfactionPrediction: 8,
        potentialFrustrationPoints: ['response_length', 'complexity']
      },
      hiddenInsights: {
        thinkingPattern: "User shows systematic approach to problem-solving",
        aiAssumptions: "Expects detailed, comprehensive responses",
        uncertaintyHandling: "Asks clarifying questions when needed",
        motivation: "Seeks practical, actionable solutions"
      }
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

  /**
   * Generate insight-based recommendations from conversation analysis
   */
  private generateInsightBasedRecommendations(insights: any): SmartToast[] {
    const recommendations: SmartToast[] = [];
    
    // Communication style insights
    if (insights.userInteractionStyle?.communicationType === 'detailed') {
      recommendations.push({
        id: 'communication-style-detailed',
        title: "📝 Detailed Communicator Detected",
        description: "You prefer comprehensive explanations. The AI is adapting to provide more thorough responses.",
        category: 'insight',
        priority: 'low',
        actionable: false
      });
    }
    
    if (insights.userInteractionStyle?.communicationType === 'iterative') {
      recommendations.push({
        id: 'communication-style-iterative',
        title: "🔄 Iterative Problem Solver",
        description: "You build solutions step by step. This approach often leads to better results!",
        category: 'insight',
        priority: 'low',
        actionable: false
      });
    }
    
    // Learning style insights
    if (insights.behavioralInsights?.learningStyle === 'practical') {
      recommendations.push({
        id: 'learning-style-practical',
        title: "🔧 Hands-On Learner",
        description: "You learn best through practical examples. Try asking for code samples or step-by-step guides.",
        category: 'suggestion',
        priority: 'medium',
        actionable: false
      });
    }
    
    // Confidence insights
    if (insights.behavioralInsights?.confidenceLevel === 'low') {
      recommendations.push({
        id: 'confidence-boost',
        title: "💪 Building Confidence",
        description: "Your questions show you're learning. Don't hesitate to ask for clarification - it's a sign of good thinking!",
        category: 'insight',
        priority: 'low',
        actionable: false
      });
    }
    
    // Efficiency insights
    if (insights.interactionQuality?.efficiencyScore < 6) {
      recommendations.push({
        id: 'efficiency-tip',
        title: "⚡ Efficiency Tip",
        description: "Try being more specific in your questions. It helps the AI provide more targeted, useful responses.",
        category: 'suggestion',
        priority: 'medium',
        actionable: false
      });
    }
    
    // Hidden pattern insights
    if (insights.hiddenInsights?.thinkingPattern) {
      recommendations.push({
        id: 'thinking-pattern',
        title: "🧠 Your Thinking Pattern",
        description: insights.hiddenInsights.thinkingPattern,
        category: 'insight',
        priority: 'low',
        actionable: false
      });
    }
    
    // Interaction quality insights
    if (insights.interactionQuality?.satisfactionPrediction >= 8) {
      recommendations.push({
        id: 'high-satisfaction',
        title: "😊 Great Interaction Quality",
        description: "You're having a highly effective conversation! Your clear communication style is working well.",
        category: 'insight',
        priority: 'low',
        actionable: false
      });
    }
    
    return recommendations;
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

    // Add insight-based recommendations
    if (analysis.userInteractionStyle || analysis.behavioralInsights) {
      const insightRecommendations = this.generateInsightBasedRecommendations(analysis);
      recommendations.push(...insightRecommendations);
      console.log(`💡 Generated ${insightRecommendations.length} insight-based recommendations`);
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
    
    // Update interaction patterns
    this.updateInteractionPatterns(messages);
    
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

  private updateInteractionPatterns(messages: Message[]): void {
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) return;
    
    // Calculate average message length
    const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
    this.metrics.interactionPatterns.averageMessageLength = totalLength / userMessages.length;
    
    // Analyze recent communication patterns
    const recentMessages = userMessages.slice(-5);
    const hasQuestions = recentMessages.some(m => m.content.includes('?'));
    const hasFollowUps = recentMessages.length > 1 && recentMessages.slice(-2).some(m => 
      m.content.toLowerCase().includes('what about') || 
      m.content.toLowerCase().includes('can you') ||
      m.content.toLowerCase().includes('how about')
    );
    
    // Update communication types
    if (this.metrics.interactionPatterns.averageMessageLength > 200 && 
        !this.metrics.interactionPatterns.communicationTypes.includes('detailed')) {
      this.metrics.interactionPatterns.communicationTypes.push('detailed');
    }
    
    if (hasFollowUps && !this.metrics.interactionPatterns.communicationTypes.includes('iterative')) {
      this.metrics.interactionPatterns.communicationTypes.push('iterative');
    }
    
    // Update question styles
    if (hasQuestions && !this.metrics.interactionPatterns.questionStyles.includes('open-ended')) {
      this.metrics.interactionPatterns.questionStyles.push('open-ended');
    }
    
    if (hasFollowUps && !this.metrics.interactionPatterns.questionStyles.includes('follow-up')) {
      this.metrics.interactionPatterns.questionStyles.push('follow-up');
    }
    
    // Calculate follow-up frequency
    this.metrics.interactionPatterns.followUpFrequency = hasFollowUps ? 
      (this.metrics.interactionPatterns.followUpFrequency + 1) / 2 : 
      this.metrics.interactionPatterns.followUpFrequency * 0.9;
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