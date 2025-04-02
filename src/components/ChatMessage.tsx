
import { useState } from "react";
import { ChatMessage as ChatMessageType } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Copy, Check, Code } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Function to render code blocks with proper formatting
  const renderCodeBlock = (code: string, language: string = '') => {
    return (
      <div className="relative my-2 rounded-md bg-muted/50 dark:bg-muted/80">
        <div className="flex items-center justify-between px-4 py-1 bg-muted/80 dark:bg-muted rounded-t-md border-b border-border">
          <div className="text-xs text-muted-foreground font-mono">
            {language || 'Code'}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto font-mono text-sm">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  // Function to format the message content with proper markdown-like rendering
  const formatMessageContent = () => {
    if (isUser) {
      return <div>{message.content}</div>;
    }

    // Parse content for code blocks and other formatting
    const parts = [];
    const content = message.content;
    let currentIndex = 0;

    // Regular expression to match code blocks ```code```
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > currentIndex) {
        const textBefore = content.substring(currentIndex, match.index);
        parts.push(
          <div key={`text-${currentIndex}`} className="mb-4">
            {textBefore.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        );
      }

      // Add the code block
      const language = match[1].trim();
      const code = match[2].trim();
      parts.push(
        <div key={`code-${match.index}`}>
          {renderCodeBlock(code, language)}
        </div>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last code block
    if (currentIndex < content.length) {
      const textAfter = content.substring(currentIndex);
      parts.push(
        <div key={`text-${currentIndex}`} className="mb-4">
          {textAfter.split('\n').map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
      );
    }

    // If no code blocks were found, just render the text normally
    if (parts.length === 0) {
      parts.push(
        <div key="text" className="mb-4">
          {content.split('\n').map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
      );
    }

    return (
      <div className="prose dark:prose-invert max-w-none">
        {parts}
      </div>
    );
  };
  
  return (
    <div
      className={cn(
        "mb-6",
        isUser ? "flex flex-row-reverse" : "flex"
      )}
    >
      <Avatar className={cn("mt-0.5", isUser ? "ml-2" : "mr-2")}>
        <AvatarFallback className={isUser ? "bg-chat-user text-primary-foreground" : ""}>
          {isUser ? "U" : "AI"}
        </AvatarFallback>
      </Avatar>
      
      <div className="max-w-[80%]">
        <div className={cn(
          "group relative p-4 rounded-lg",
          isUser ? "chat-bubble-user bg-primary text-primary-foreground" : "chat-bubble-assistant bg-muted"
        )}>
          {formatMessageContent()}
          
          <button 
            onClick={copyToClipboard}
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Display images if present */}
        {message.images && message.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.images.map((image, index) => (
              <img 
                key={index}
                src={image}
                alt={`Uploaded image ${index + 1}`}
                className="max-w-[200px] max-h-[200px] object-contain rounded-md border"
              />
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-1">
          {format(message.timestamp, "MMM d, h:mm a")}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
