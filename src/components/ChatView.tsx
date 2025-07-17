import React from 'react';
import MessageList from './MessageList';
import InputBar from './InputBar';
import { Maximize, Minimize } from 'lucide-react';

const ChatView: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 h-full">
      <header className="flex items-center justify-between p-4 border-b border-theme-border">
        <div>
          <h2 className="text-lg font-semibold">Chat with AI</h2>
          <p className="text-sm text-muted-foreground">
            Ask me anything or upload a file.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-accent">
            <Maximize className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>
      <MessageList />
      <InputBar />
    </div>
  );
};

export default ChatView;
