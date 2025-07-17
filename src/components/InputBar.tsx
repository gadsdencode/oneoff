import React from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';

const InputBar: React.FC = () => {
  const [text, setText] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="p-4 bg-background border-t border-theme-border">
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-end bg-secondary rounded-xl p-2">
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            placeholder="Type your message or upload a file..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-base placeholder:text-muted-foreground px-3 py-2 max-h-48"
          />
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2" disabled={!text.trim()}>
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default InputBar;
