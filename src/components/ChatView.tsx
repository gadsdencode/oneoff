"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Command,
  Sparkles,
  ImageIcon,
  FileUp,
  MonitorIcon,
  X,
  Loader2,
  Edit3,
  Share2,
  Plus,
  Zap,
  Brain,
  Cpu,
  CircuitBoard,
  AlertCircle
} from "lucide-react";
import { Message, CommandSuggestion } from "../types";
import { useAzureAI } from "../hooks/useAzureAI";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#8B5CF6",
  vx = 0,
  vy = 0,
}) => {
  const [particleColor, setParticleColor] = useState<string>(color);

  interface MousePosition {
    x: number;
    y: number;
  }

  const MousePosition = (): MousePosition => {
    const [mousePosition, setMousePosition] = useState<MousePosition>({
      x: 0,
      y: 0,
    });

    useEffect(() => {
      const handleMouseMove = (event: MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
      };

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }, []);

    return mousePosition;
  };

  const hexToRgb = (hex: string): number[] => {
    hex = hex.replace("#", "");
    const hexInt = parseInt(hex, 16);
    const red = (hexInt >> 16) & 255;
    const green = (hexInt >> 8) & 255;
    const blue = hexInt & 255;
    return [red, green, blue];
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<any[]>([]);
  const mousePosition = MousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);

    return () => {
      window.removeEventListener("resize", initCanvas);
    };
  }, [particleColor]);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition.x, mousePosition.y]);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = mousePosition.x - rect.left - w / 2;
      const y = mousePosition.y - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  type Circle = {
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.1;
    const dy = (Math.random() - 0.5) * 0.1;
    const magnetism = 0.1 + Math.random() * 4;
    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
    };
  };

  const rgb = hexToRgb(particleColor);

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): number => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle: Circle, i: number) => {
      const edge = [
        circle.x + circle.translateX - circle.size,
        canvasSize.current.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size,
        canvasSize.current.h - circle.y - circle.translateY - circle.size,
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
      );
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
        ease;
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
        ease;

      drawCircle(circle, true);

      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    window.requestAnimationFrame(animate);
  };

  return (
    <div className={className} ref={canvasContainerRef} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
};

const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <ImageIcon className="w-4 h-4" />,
    label: "Clone UI",
    description: "Generate a UI from a screenshot",
    prefix: "/clone"
  },
  {
    icon: <MonitorIcon className="w-4 h-4" />,
    label: "Create Page",
    description: "Generate a new web page",
    prefix: "/page"
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Improve",
    description: "Improve existing UI design",
    prefix: "/improve"
  },
  {
    icon: <Brain className="w-4 h-4" />,
    label: "Analyze",
    description: "Analyze design patterns",
    prefix: "/analyze"
  }
];

const CircuitPattern: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 10h20v20h20v-20h20v40h-20v20h-40z"
      stroke="currentColor"
      strokeWidth="0.5"
      fill="none"
      opacity="0.1"
    />
    <circle cx="30" cy="30" r="2" fill="currentColor" opacity="0.2" />
    <circle cx="70" cy="50" r="2" fill="currentColor" opacity="0.2" />
  </svg>
);

const HolographicBubble: React.FC<{
  children: React.ReactNode;
  isUser?: boolean;
  className?: string;
}> = ({ children, isUser = false, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", damping: 20, stiffness: 300 }}
    className={`
      relative p-4 rounded-2xl backdrop-blur-xl border overflow-hidden
      ${isUser 
        ? "bg-gradient-to-br from-violet-500/20 to-purple-600/20 border-violet-400/30 ml-12" 
        : "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-600/30 mr-12"
      }
      ${className}
    `}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
    <div className="relative z-10">{children}</div>
    
    {/* Holographic shimmer effect */}
    <motion.div
      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{
        x: ["-100%", "100%"],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      }}
    />
  </motion.div>
);

const TypingIndicator: React.FC = () => (
  <HolographicBubble>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-violet-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-slate-300">AI is thinking...</span>
    </div>
  </HolographicBubble>
);

const NeuralNetworkPulse: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    animate={isActive ? {
      opacity: [0, 0.3, 0],
      scale: [0.8, 1.2, 0.8],
    } : {}}
    transition={{
      duration: 2,
      repeat: isActive ? Infinity : 0,
      ease: "easeInOut",
    }}
  >
    <div className="absolute inset-0 rounded-2xl border border-violet-400/20">
      <div className="absolute top-2 left-2 w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
      <div className="absolute top-4 right-3 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-300" />
      <div className="absolute bottom-3 left-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-700" />
    </div>
  </motion.div>
);

const RippleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, className, disabled = false }) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden transition-all duration-200
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
        ${className}
      `}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </button>
  );
};

const OrigamiModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-md w-full"
          initial={{ scale: 0, rotateX: -90 }}
          animate={{ scale: 1, rotateX: 0 }}
          exit={{ scale: 0, rotateX: 90 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <RippleButton
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </RippleButton>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const FuturisticAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant powered by Azure AI. How can I help you create something amazing today?",
      role: "assistant",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [streamingResponse, setStreamingResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Azure AI hook
  const { sendMessage, sendStreamingMessage, isLoading, error, clearError } = useAzureAI({
    enableStreaming,
    chatOptions: {
      maxTokens: 2048,
      temperature: 0.8,
      topP: 0.1
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (input.startsWith('/')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    if (isLoading) return; // Prevent multiple requests

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setAttachments([]);
    setIsTyping(true);
    setActiveMessage(userMessage.id);
    clearError(); // Clear any previous errors

    try {
      if (enableStreaming) {
        // Handle streaming response
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setStreamingResponse("");

        await sendStreamingMessage(updatedMessages, (chunk: string) => {
          setStreamingResponse(prev => {
            const newContent = prev + chunk;
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: newContent }
                  : msg
              )
            );
            return newContent;
          });
        });

        setStreamingResponse("");
      } else {
        // Handle non-streaming response
        const response = await sendMessage(updatedMessages);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      // Error handling - show error message in chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please check your Azure AI configuration and try again.`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setActiveMessage(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectCommand = (command: CommandSuggestion) => {
    setInput(command.prefix + " ");
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const addAttachment = () => {
    const fileName = `document-${Date.now()}.pdf`;
    setAttachments(prev => [...prev, fileName]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <Particles
          className="absolute inset-0"
          quantity={150}
          color="#8B5CF6"
          size={1}
          staticity={30}
        />
        
        {/* Holographic Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Circuit Patterns */}
        <div className="absolute inset-0 opacity-5">
          <CircuitPattern className="absolute top-10 left-10 w-20 h-20 text-violet-400" />
          <CircuitPattern className="absolute top-1/3 right-20 w-16 h-16 text-blue-400" />
          <CircuitPattern className="absolute bottom-20 left-1/3 w-24 h-24 text-purple-400" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <motion.header
          className="p-6 border-b border-slate-800/50 backdrop-blur-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap className="w-8 h-8 text-violet-400" />
                <motion.div
                  className="absolute inset-0 bg-violet-400/20 rounded-full blur-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  NomadAI
                </h1>
                <p className="text-xs text-slate-400">Unified UI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <RippleButton
                onClick={() => setShowShareModal(true)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50"
              >
                <Share2 className="w-4 h-4" />
              </RippleButton>
              <RippleButton
                onClick={() => setShowEditModal(true)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50"
              >
                <Edit3 className="w-4 h-4" />
              </RippleButton>
            </div>
          </div>
        </motion.header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="relative max-w-[80%]">
                    <HolographicBubble isUser={message.role === 'user'}>
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.attachments && (
                          <div className="flex flex-wrap gap-2">
                            {message.attachments.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded text-xs"
                              >
                                <FileUp className="w-3 h-3" />
                                {file}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              <span>AI</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </HolographicBubble>
                    
                    {activeMessage === message.id && (
                      <NeuralNetworkPulse isActive />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <motion.div
          className="p-6 border-t border-slate-800/50 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Command Suggestions */}
            <AnimatePresence>
              {showCommands && (
                <motion.div
                  className="mb-4 p-4 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {commandSuggestions.map((command) => (
                      <RippleButton
                        key={command.prefix}
                        onClick={() => selectCommand(command)}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/30 text-left"
                      >
                        <div className="text-violet-400">{command.icon}</div>
                        <div>
                          <div className="text-sm font-medium">{command.label}</div>
                          <div className="text-xs text-slate-400">{command.description}</div>
                        </div>
                      </RippleButton>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attachments */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="mb-4 flex flex-wrap gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {attachments.map((file, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <FileUp className="w-4 h-4 text-violet-400" />
                      <span className="text-sm">{file}</span>
                      <RippleButton
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </RippleButton>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            {error && (
              <motion.div
                className="mb-4 p-4 bg-red-900/20 backdrop-blur-xl rounded-xl border border-red-500/30"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                  <RippleButton
                    onClick={clearError}
                    className="p-1 text-red-400 hover:text-red-200"
                  >
                    <X className="w-4 h-4" />
                  </RippleButton>
                </div>
              </motion.div>
            )}

            {/* Input */}
            <div className="relative">
              <div className="flex items-end gap-4 p-4 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50">
                <div className="flex gap-2">
                  <RippleButton
                    onClick={addAttachment}
                    className="p-2 text-slate-400 hover:text-violet-400 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </RippleButton>
                  <RippleButton
                    onClick={() => setShowCommands(!showCommands)}
                    className="p-2 text-slate-400 hover:text-violet-400 transition-colors"
                  >
                    <Command className="w-5 h-5" />
                  </RippleButton>
                </div>
                
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message or use / for commands..."
                    className="w-full bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none min-h-[40px] max-h-32"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                
                <RippleButton
                  onClick={handleSend}
                  disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </RippleButton>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <OrigamiModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Conversation"
      >
        <div className="space-y-4">
          <p className="text-slate-300">Share this conversation with others</p>
                     <div className="flex gap-2">
             <input
               type="text"
               value="https://neural-ai.com/chat/abc123"
               readOnly
               placeholder="Share link"
               aria-label="Share conversation link"
               className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
             />
             <RippleButton className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg">
               Copy
             </RippleButton>
           </div>
        </div>
      </OrigamiModal>

      <OrigamiModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Azure AI Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Streaming Mode
            </label>
            <div className="flex items-center gap-3">
              <RippleButton
                onClick={() => setEnableStreaming(!enableStreaming)}
                className={`p-2 rounded-lg transition-colors ${
                  enableStreaming 
                    ? "bg-violet-600 text-white" 
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {enableStreaming ? "Enabled" : "Disabled"}
              </RippleButton>
              <span className="text-sm text-slate-400">
                {enableStreaming ? "Real-time responses" : "Wait for complete response"}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Azure AI Status
            </label>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500"}`} />
              <span className="text-sm text-slate-300">
                {error ? "Configuration Error" : "Connected"}
              </span>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1">
                Check your .env file for proper Azure AI configuration
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Model Information
            </label>
            <div className="p-3 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-300">Model: {import.meta.env.VITE_AZURE_AI_MODEL_NAME || "Ministral-3B"}</p>
              <p className="text-xs text-slate-400 mt-1">
                Endpoint: {import.meta.env.VITE_AZURE_AI_ENDPOINT ? "Configured" : "Not configured"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Configuration Help
            </label>
            <div className="text-xs text-slate-400 space-y-1">
              <p>1. Copy env.template to .env</p>
              <p>2. Add your Azure AI endpoint and API key</p>
              <p>3. Restart the development server</p>
            </div>
          </div>
        </div>
      </OrigamiModal>
    </div>
  );
};

export default FuturisticAIChat;
