import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MonitorIcon, 
  X, 
  Check, 
  ArrowRight, 
  Download, 
  Copy, 
  Layout,
  Palette,
  Settings,
  Sparkles,
  FileText,
  Code
} from 'lucide-react';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

interface PageResult {
  template: string;
  components: Array<{ name: string; props: string[] }>;
  styles: {
    theme: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    spacing: string;
    borderRadius: string;
  };
  routes: string[];
}

interface GenerationResult {
  success: boolean;
  page: PageResult;
  files: Array<{ name: string; content: string; type: string }>;
}

const CreatePageModal: React.FC<CreatePageModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'template' | 'customize' | 'generating' | 'results'>('template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [requirements, setRequirements] = useState('');
  const [style, setStyle] = useState('modern');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/create-page/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const generatePage = async () => {
    if (!selectedTemplate) return;

    setStep('generating');

    try {
      const response = await fetch('/api/create-page/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate.id,
          requirements,
          style,
        }),
      });

      if (response.ok) {
        const result: GenerationResult = await response.json();
        setGenerationResult(result);
        setStep('results');
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setStep('customize');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadFiles = () => {
    if (generationResult?.files) {
      generationResult.files.forEach(file => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  const resetModal = () => {
    setStep('template');
    setSelectedTemplate(null);
    setRequirements('');
    setStyle('modern');
    setGenerationResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
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
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MonitorIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Create New Page</h2>
                <p className="text-sm text-slate-400">Generate a complete web page from templates</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Close modal"
              aria-label="Close Create Page modal"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {step === 'template' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Choose a Template</h3>
                  <p className="text-slate-400">Select a starting point for your new page</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Layout className="w-8 h-8 text-blue-400" />
                          {selectedTemplate?.id === template.id && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                          <p className="text-sm text-slate-400">{template.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {selectedTemplate && (
                  <div className="flex justify-center pt-4">
                    <motion.button
                      onClick={() => setStep('customize')}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white font-medium flex items-center gap-2 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Customize Template
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {step === 'customize' && selectedTemplate && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Customize Your Page</h3>
                  <p className="text-slate-400">Describe your requirements and choose a style</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Requirements
                    </div>
                    <textarea
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Describe what you want in your page..."
                      className="w-full h-32 p-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 resize-none focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Palette className="w-5 h-5 text-blue-400" />
                      Style Theme
                    </div>
                    <div className="space-y-2">
                      {['modern', 'classic', 'minimal', 'dark', 'colorful'].map((styleOption) => (
                        <label
                          key={styleOption}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            style === styleOption
                              ? 'border-blue-400 bg-blue-500/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="style"
                            value={styleOption}
                            checked={style === styleOption}
                            onChange={(e) => setStyle(e.target.value)}
                            className="text-blue-500"
                          />
                          <span className="text-white capitalize">{styleOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => setStep('template')}
                    className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <motion.button
                    onClick={generatePage}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white font-medium flex items-center gap-2 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Page
                  </motion.button>
                </div>
              </div>
            )}

            {step === 'generating' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 bg-blue-500/20 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Settings className="w-6 h-6 text-blue-400" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Generating Your Page</h3>
                  <p className="text-slate-400">Creating components and assembling your page...</p>
                </div>
              </div>
            )}

            {step === 'results' && generationResult && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Page Generated Successfully!</h3>
                  <p className="text-slate-400">Your page is ready with all necessary files</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <Layout className="w-5 h-5 text-blue-400" />
                      Page Structure
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h5 className="font-medium text-white mb-2">Components</h5>
                        <div className="space-y-1">
                          {generationResult.page.components.map((comp, index) => (
                            <div key={index} className="text-sm text-slate-300">
                              <span className="font-medium text-blue-400">{comp.name}</span>
                              <span className="text-slate-500 ml-2">
                                ({comp.props.join(', ')})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h5 className="font-medium text-white mb-2">Routes</h5>
                        <div className="space-y-1">
                          {generationResult.page.routes.map((route, index) => (
                            <div key={index} className="text-sm text-blue-400 font-mono">
                              {route}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-400" />
                      Generated Files
                    </h4>
                    
                    <div className="space-y-2">
                      {generationResult.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              file.type === 'component' ? 'bg-green-400' :
                              file.type === 'style' ? 'bg-purple-400' :
                              'bg-blue-400'
                            }`} />
                            <span className="text-white font-mono text-sm">{file.name}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(file.content)}
                            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                            title="Copy file content"
                          >
                            <Copy className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={downloadFiles}
                        className="flex-1 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download All
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={resetModal}
                    className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Create Another
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

export default CreatePageModal; 