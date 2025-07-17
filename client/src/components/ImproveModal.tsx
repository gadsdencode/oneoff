import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Upload, 
  Code, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Zap,
  Download,
  Copy,
  FileText,
  TrendingUp
} from 'lucide-react';

interface ImproveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Improvement {
  type: 'performance' | 'accessibility' | 'security';
  description: string;
  severity: 'low' | 'medium' | 'high';
  line: number;
  suggestion: string;
}

interface ImproveResult {
  success: boolean;
  improvements: Improvement[];
  optimizedCode: string;
}

const ImproveModal: React.FC<ImproveModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [inputMethod, setInputMethod] = useState<'paste' | 'upload'>('paste');
  const [code, setCode] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImproveResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const analyzeCode = async () => {
    if (!code.trim() && !selectedFile) return;

    setStep('analyzing');

    try {
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('codeFile', selectedFile);
      } else {
        formData.append('code', code);
      }

      const response = await fetch('/api/improve/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const analysisResult: ImproveResult = await response.json();
        setResult(analysisResult);
        setStep('results');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setStep('input');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCode = () => {
    if (result?.optimizedCode) {
      const blob = new Blob([result.optimizedCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-code.tsx';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetModal = () => {
    setStep('input');
    setCode('');
    setSelectedFile(null);
    setResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'accessibility': return <CheckCircle className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-5xl max-h-[90vh] mx-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Improve Code</h2>
                <p className="text-sm text-slate-400">Analyze and optimize your code quality</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Close modal"
              aria-label="Close Improve modal"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {step === 'input' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Submit Your Code</h3>
                  <p className="text-slate-400">Upload a file or paste your code for analysis</p>
                </div>

                {/* Input Method Selection */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setInputMethod('paste')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      inputMethod === 'paste'
                        ? 'bg-green-500/20 text-green-400 border border-green-400/50'
                        : 'text-slate-400 hover:text-white border border-slate-600'
                    }`}
                  >
                    Paste Code
                  </button>
                  <button
                    onClick={() => setInputMethod('upload')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      inputMethod === 'upload'
                        ? 'bg-green-500/20 text-green-400 border border-green-400/50'
                        : 'text-slate-400 hover:text-white border border-slate-600'
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {inputMethod === 'paste' ? (
                  <div className="space-y-4">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Paste your React/TypeScript code here..."
                      className="w-full h-64 p-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 font-mono text-sm resize-none focus:border-green-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-xl p-8 text-center transition-all">
                      <input
                        type="file"
                        accept=".tsx,.ts,.jsx,.js"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload code file"
                        aria-label="Upload code file for improvement analysis"
                      />
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-800/50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Upload className="w-6 h-6 text-green-400" />
                        </div>
                        {selectedFile ? (
                          <div className="text-green-400">
                            <FileText className="w-5 h-5 mx-auto mb-2" />
                            File selected: {selectedFile.name}
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg font-medium text-white mb-2">
                              Upload your code file
                            </p>
                            <p className="text-sm text-slate-400">
                              Supports .tsx, .ts, .jsx, .js files
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(code.trim() || selectedFile) && (
                  <div className="flex justify-center">
                    <motion.button
                      onClick={analyzeCode}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white font-medium flex items-center gap-2 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Analyze & Improve
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {step === 'analyzing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 bg-green-500/20 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-green-400" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Analyzing Your Code</h3>
                  <p className="text-slate-400">Detecting issues and generating optimizations...</p>
                </div>
              </div>
            )}

            {step === 'results' && result && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Analysis Complete</h3>
                  <p className="text-slate-400">Found {result.improvements.length} improvement suggestions</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      Improvement Suggestions
                    </h4>
                    
                    <div className="space-y-3">
                      {result.improvements.map((improvement, index) => (
                        <div
                          key={index}
                          className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1 rounded-md ${getSeverityColor(improvement.severity)}`}>
                              {getTypeIcon(improvement.type)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white capitalize">{improvement.type}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(improvement.severity)}`}>
                                  {improvement.severity}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300">{improvement.description}</p>
                              <div className="text-xs text-slate-500">
                                Line {improvement.line}
                              </div>
                              <div className="p-2 bg-slate-900/50 rounded text-sm text-green-400">
                                💡 {improvement.suggestion}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <Code className="w-5 h-5 text-green-400" />
                      Optimized Code
                    </h4>
                    
                    <div className="relative">
                      <pre className="p-4 bg-slate-800/80 rounded-lg text-sm text-slate-300 overflow-x-auto max-h-80 border border-slate-700/50">
                        <code>{result.optimizedCode}</code>
                      </pre>
                      
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => copyToClipboard(result.optimizedCode)}
                          className="p-2 bg-slate-700/80 hover:bg-slate-600/80 rounded-md transition-colors"
                          title="Copy optimized code"
                        >
                          <Copy className="w-4 h-4 text-slate-300" />
                        </button>
                        <button
                          onClick={downloadCode}
                          className="p-2 bg-slate-700/80 hover:bg-slate-600/80 rounded-md transition-colors"
                          title="Download optimized code"
                        >
                          <Download className="w-4 h-4 text-slate-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={resetModal}
                    className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Analyze Another
                  </button>
                  <motion.button
                    onClick={handleClose}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImproveModal; 