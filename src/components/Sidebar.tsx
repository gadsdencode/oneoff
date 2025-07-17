import React from 'react';
import { Bot, Plus, Settings, MessageSquare } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col w-64 bg-secondary/50 border-r border-theme-border p-4 transition-all duration-300">
      <div className="flex items-center mb-8">
        <Bot className="w-8 h-8 text-primary mr-3" />
        <h1 className="text-xl font-bold text-foreground">AI Assistant</h1>
      </div>
      <button className="flex items-center justify-center w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 mb-6">
        <Plus className="w-5 h-5 mr-2" />
        New Chat
      </button>
      <div className="flex-1 overflow-y-auto -mr-2 pr-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Recent</h2>
        <nav className="space-y-2">
          <a href="#" className="flex items-center p-2 bg-primary/10 text-primary-foreground rounded-lg">
            <MessageSquare className="w-4 h-4 mr-3" />
            <span className="truncate">Designing a modern UI...</span>
          </a>
          <a href="#" className="flex items-center p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg">
            <MessageSquare className="w-4 h-4 mr-3" />
            <span className="truncate">React component patterns</span>
          </a>
          <a href="#" className="flex items-center p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg">
            <MessageSquare className="w-4 h-4 mr-3" />
            <span className="truncate">Python data analysis script</span>
          </a>
        </nav>
      </div>
      <div className="mt-auto">
        <a href="#" className="flex items-center p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg">
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
