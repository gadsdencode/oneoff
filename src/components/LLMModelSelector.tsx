"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Star, 
  StarOff, 
  Zap, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Brain, 
  Sparkles,
  ChevronDown,
  ArrowUpDown,
  Heart,
  HeartOff
} from "lucide-react";
import { LLMModel } from "@/types";

// Azure AI compatible models - these would typically come from an API
const mockModels: LLMModel[] = [
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    performance: 95,
    cost: 0.03,
    latency: 1200,
    contextLength: 128000,
    description: "Most capable GPT-4 model with improved instruction following",
    category: "text",
    tier: "pro",
    isFavorite: false
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    performance: 94,
    cost: 0.015,
    latency: 1100,
    contextLength: 200000,
    description: "Anthropic's most powerful model for complex reasoning",
    category: "reasoning",
    tier: "pro",
    isFavorite: true
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    performance: 88,
    cost: 0.001,
    latency: 800,
    contextLength: 32000,
    description: "Google's multimodal AI model with strong performance",
    category: "multimodal",
    tier: "free",
    isFavorite: false
  },
  {
    id: "codellama-34b",
    name: "Code Llama 34B",
    provider: "Meta",
    performance: 85,
    cost: 0.0008,
    latency: 900,
    contextLength: 16000,
    description: "Specialized for code generation and understanding",
    category: "code",
    tier: "free",
    isFavorite: true
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    performance: 82,
    cost: 0.002,
    latency: 600,
    contextLength: 16000,
    description: "Fast and efficient model for most tasks",
    category: "text",
    tier: "free",
    isFavorite: false
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    performance: 78,
    cost: 0.00025,
    latency: 400,
    contextLength: 200000,
    description: "Fastest Claude model with good performance",
    category: "text",
    tier: "free",
    isFavorite: false
  },
  {
    id: "ministral-3b",
    name: "Ministral 3B",
    provider: "Azure AI",
    performance: 76,
    cost: 0.0001,
    latency: 350,
    contextLength: 32000,
    description: "Fast and efficient Azure AI model for general tasks",
    category: "text",
    tier: "free",
    isFavorite: false
  }
];

const categoryIcons = {
  text: Brain,
  code: Zap,
  multimodal: Sparkles,
  reasoning: TrendingUp
};

const tierColors = {
  free: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
};

interface ModelCardProps {
  model: LLMModel;
  onFavorite: (id: string) => void;
  onSelect: (model: LLMModel) => void;
  isSelected: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onFavorite, onSelect, isSelected }) => {
  const CategoryIcon = categoryIcons[model.category];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden border-2 transition-all duration-300 cursor-pointer group",
          "bg-gradient-to-br from-background via-background to-muted/20",
          "hover:shadow-xl hover:shadow-primary/10",
          "rounded-3xl p-6",
          isSelected 
            ? "border-primary shadow-lg shadow-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10" 
            : "border-border hover:border-primary/50"
        )}
        onClick={() => onSelect(model)}
      >
        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(model.id);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
        >
          {model.isFavorite ? (
            <Heart className="w-4 h-4 text-red-500 fill-current" />
          ) : (
            <HeartOff className="w-4 h-4 text-muted-foreground" />
          )}
        </motion.button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <CategoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">{model.name}</h3>
            <p className="text-sm text-muted-foreground">{model.provider}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{model.description}</p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                  <TrendingUp className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold">{model.performance}%</div>
                  <div className="text-xs text-muted-foreground">Performance</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Model performance score</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                  <DollarSign className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold">${model.cost}</div>
                  <div className="text-xs text-muted-foreground">Per 1K tokens</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cost per 1000 tokens</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                  <Clock className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold">{model.latency}ms</div>
                  <div className="text-xs text-muted-foreground">Latency</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average response time</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize rounded-full">
            {model.category}
          </Badge>
          <Badge className={cn("rounded-full", tierColors[model.tier])}>
            {model.tier}
          </Badge>
        </div>

        {/* Selection Indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-4 left-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
            >
              <Star className="w-4 h-4 text-primary-foreground fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedTier: string;
  onTierChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTier,
  onTierChange,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onToggleFavorites
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-3xl bg-muted/30 border border-border/50 backdrop-blur-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 rounded-2xl border-border/50 bg-background/50 backdrop-blur-sm text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[120px] h-10 rounded-2xl border-border/50 bg-background/50 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="multimodal">Multimodal</SelectItem>
            <SelectItem value="reasoning">Reasoning</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTier} onValueChange={onTierChange}>
          <SelectTrigger className="w-[100px] h-10 rounded-2xl border-border/50 bg-background/50 text-sm">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[120px] h-10 rounded-2xl border-border/50 bg-background/50 text-sm">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="cost">Cost</SelectItem>
            <SelectItem value="latency">Latency</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          onClick={onToggleFavorites}
          size="sm"
          className="h-10 px-4 rounded-2xl"
        >
          <Star className={cn("w-3 h-3 mr-1", showFavoritesOnly && "fill-current")} />
          Favorites
        </Button>
      </div>
    </div>
  );
};

interface LLMModalSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: LLMModel) => void;
  selectedModel?: LLMModel | null;
}

const LLMModalSelector: React.FC<LLMModalSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedModel: externalSelectedModel
}) => {
  const [models, setModels] = React.useState<LLMModel[]>(mockModels);
  const [selectedModel, setSelectedModel] = React.useState<LLMModel | null>(externalSelectedModel || null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedTier, setSelectedTier] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("performance");
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  const handleFavorite = (id: string) => {
    setModels(prev => prev.map(model => 
      model.id === id ? { ...model, isFavorite: !model.isFavorite } : model
    ));
  };

  const handleSelect = (model: LLMModel) => {
    setSelectedModel(model);
  };

  const handleConfirmSelection = () => {
    if (selectedModel) {
      onSelect(selectedModel);
      onClose();
    }
  };

  const filteredAndSortedModels = React.useMemo(() => {
    let filtered = models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || model.category === selectedCategory;
      const matchesTier = selectedTier === "all" || model.tier === selectedTier;
      const matchesFavorites = !showFavoritesOnly || model.isFavorite;

      return matchesSearch && matchesCategory && matchesTier && matchesFavorites;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "performance":
          return b.performance - a.performance;
        case "cost":
          return a.cost - b.cost;
        case "latency":
          return a.latency - b.latency;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [models, searchTerm, selectedCategory, selectedTier, sortBy, showFavoritesOnly]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Select LLM Model
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Compare and select the perfect AI model for your needs
                </DialogDescription>
              </motion.div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Filter Controls */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FilterControls
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedTier={selectedTier}
                onTierChange={setSelectedTier}
                sortBy={sortBy}
                onSortChange={setSortBy}
                showFavoritesOnly={showFavoritesOnly}
                onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
              />
            </motion.div>

            {/* Results Count */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between"
            >
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedModels.length} of {models.length} models
              </p>
              {selectedModel && (
                <Badge variant="outline" className="text-sm px-3 py-1 rounded-full">
                  Selected: {selectedModel.name}
                </Badge>
              )}
            </motion.div>

            {/* Model Grid */}
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredAndSortedModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onFavorite={handleFavorite}
                    onSelect={handleSelect}
                    isSelected={selectedModel?.id === model.id}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {filteredAndSortedModels.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No models found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-2xl px-6"
              >
                Cancel
              </Button>
              <div className="flex gap-3">
                {selectedModel && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-2xl px-6">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedModel.name}</DialogTitle>
                        <DialogDescription className="text-base">
                          {selectedModel.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-6 mt-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Provider</label>
                            <p className="text-lg font-semibold">{selectedModel.provider}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Performance</label>
                            <p className="text-lg font-semibold">{selectedModel.performance}%</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Context Length</label>
                            <p className="text-lg font-semibold">{selectedModel.contextLength.toLocaleString()} tokens</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Cost per 1K tokens</label>
                            <p className="text-lg font-semibold">${selectedModel.cost}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Latency</label>
                            <p className="text-lg font-semibold">{selectedModel.latency}ms</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Tier</label>
                            <Badge className={cn("capitalize", tierColors[selectedModel.tier])}>
                              {selectedModel.tier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  onClick={handleConfirmSelection}
                  disabled={!selectedModel}
                  className="rounded-2xl px-8"
                >
                  Select Model
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LLMModalSelector; 