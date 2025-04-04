
import React, { useState } from "react";
import { ChatMessage as ChatMessageType } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Copy, Check, ExternalLink } from "lucide-react";

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
            aria-label="Copy code"
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

  const renderInlineCode = (code: string) => {
    return (
      <code className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-muted/80 font-mono text-sm">
        {code}
      </code>
    );
  };

  const renderList = (items: string[], ordered: boolean) => {
    return ordered ? (
      <ol className="list-decimal ml-6 my-2">
        {items.map((item, i) => (
          <li key={i} className="mb-1">{item}</li>
        ))}
      </ol>
    ) : (
      <ul className="list-disc ml-6 my-2">
        {items.map((item, i) => (
          <li key={i} className="mb-1">{item}</li>
        ))}
      </ul>
    );
  };

  const renderLink = (text: string, url: string) => {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center"
      >
        {text}
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    );
  };

  const renderHeading = (content: string, level: number) => {
    switch (level) {
      case 1:
        return <h1 className="text-2xl font-bold my-3">{content}</h1>;
      case 2:
        return <h2 className="text-xl font-bold my-2.5">{content}</h2>;
      case 3:
        return <h3 className="text-lg font-bold my-2">{content}</h3>;
      case 4:
        return <h4 className="text-base font-bold my-1.5">{content}</h4>;
      case 5:
        return <h5 className="text-sm font-bold my-1">{content}</h5>;
      case 6:
        return <h6 className="text-xs font-bold my-0.5">{content}</h6>;
      default:
        return <h2 className="text-xl font-bold my-2.5">{content}</h2>;
    }
  };

  // Improved function to format message content with proper markdown rendering
  const formatMessageContent = () => {
    if (isUser) {
      return <div>{message.content}</div>;
    }

    // Process the content to handle markdown elements
    let content = message.content;
    const parts = [];
    
    // Extract code blocks first to avoid interference with other formatting
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const segments = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
          index: lastIndex
        });
      }
      
      segments.push({
        type: 'code-block',
        language: match[1].trim(),
        content: match[2].trim(),
        index: match.index
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex),
        index: lastIndex
      });
    }
    
    // Process each segment
    segments.forEach((segment, idx) => {
      if (segment.type === 'code-block') {
        parts.push(
          <div key={`code-${idx}`}>
            {renderCodeBlock(segment.content, segment.language)}
          </div>
        );
      } else {
        // Process non-code text
        const textSegments = processTextSegment(segment.content);
        parts.push(<div key={`text-${idx}`}>{textSegments}</div>);
      }
    });

    return (
      <div className="prose dark:prose-invert max-w-none">
        {parts}
      </div>
    );
  };

  // Helper function to process text segments
  const processTextSegment = (text: string) => {
    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/).filter(Boolean);
    
    return paragraphs.map((para, paraIndex) => {
      // Check for headings (## Heading)
      const headingMatch = para.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        return <React.Fragment key={`para-${paraIndex}`}>{renderHeading(content, level)}</React.Fragment>;
      }
      
      // Check for unordered lists
      if (para.trim().startsWith('* ') || para.trim().startsWith('- ')) {
        const items = para.split(/\n/).map(line => line.replace(/^[*-]\s+/, '').trim()).filter(Boolean);
        return <React.Fragment key={`para-${paraIndex}`}>{renderList(items, false)}</React.Fragment>;
      }
      
      // Check for ordered lists
      if (/^\d+\.\s/.test(para.trim())) {
        const items = para.split(/\n/).map(line => line.replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
        return <React.Fragment key={`para-${paraIndex}`}>{renderList(items, true)}</React.Fragment>;
      }
      
      // Process inline formatting within paragraph
      return (
        <p key={`para-${paraIndex}`} className="mb-2">
          {processInlineFormatting(para)}
        </p>
      );
    });
  };
  
  // Process inline formatting (bold, italic, code, links)
  const processInlineFormatting = (text: string) => {
    const elements: React.ReactNode[] = [];
    let remainingText = text;
    
    // Process bold text (**bold**)
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(remainingText)) !== null) {
      const [fullMatch, content] = match;
      const beforeBold = remainingText.substring(lastIndex, match.index);
      
      if (beforeBold) {
        elements.push(<span key={`text-${elements.length}`}>{beforeBold}</span>);
      }
      
      elements.push(<strong key={`bold-${elements.length}`} className="font-bold">{content}</strong>);
      
      lastIndex = match.index + fullMatch.length;
    }
    
    if (lastIndex < remainingText.length) {
      elements.push(<span key={`text-${elements.length}`}>{remainingText.substring(lastIndex)}</span>);
    }
    
    // If no formatting was found, return the original text
    return elements.length > 0 ? elements : remainingText;
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
