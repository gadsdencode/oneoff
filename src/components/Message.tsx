import React from 'react';
import { Bot, User, Clipboard, Check } from 'lucide-react';
import { Message as MessageType } from '../types';
import { cn } from '../lib/utils';

// A simple markdown-to-HTML converter
const renderMarkdown = (text: string) => {
  // This is a very basic implementation. For a real app, use a library like 'marked' or 'react-markdown'.
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const html = text
    .replace(codeBlockRegex, (match, lang, code) => {
      const escapedCode = code.replace(/</g, '<').replace(/>/g, '>');
      return `<pre class="bg-black/70 text-white p-4 rounded-lg my-4 overflow-x-auto"><code class="language-${lang || ''}">${escapedCode}</code></pre>`;
    })
    .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/\* \*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\* (.*)/g, '<li class="ml-4 list-disc">$1</li>');
  
  return { __html: html };
};

const CodeBlockToolbar: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-2 right-2">
      <button
        onClick={handleCopy}
        className="flex items-center text-xs text-muted-foreground bg-background/50 hover:bg-accent p-1.5 rounded-md transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 mr-1 text-green-500" /> Copied
          </>
        ) : (
          <>
            <Clipboard className="w-3.5 h-3.5 mr-1" /> Copy
          </>
        )}
      </button>
    </div>
  );
};

const Message: React.FC<{ message: MessageType }> = ({ message }) => {
  const isUser = message.role === 'user';
  const codeContentMatch = message.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const codeContent = codeContentMatch ? codeContentMatch[1] : '';

  return (
    <div className={cn('flex items-start gap-4 max-w-4xl', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          'relative rounded-xl px-4 py-3 text-sm md:text-base shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <div
          className="prose prose-sm prose-invert max-w-none"
          dangerouslySetInnerHTML={renderMarkdown(message.content)}
        />
        {codeContent && <CodeBlockToolbar code={codeContent} />}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default Message;
