
import { useState } from "react";
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
  
  // Function to render code blocks with proper formatting and language
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

  // Function to render inline code
  const renderInlineCode = (code: string) => {
    return (
      <code className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-muted/80 font-mono text-sm">
        {code}
      </code>
    );
  };

  // Function to render lists
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

  // Function to render links
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

  // Function to format the message content with proper markdown-like rendering
  const formatMessageContent = () => {
    if (isUser) {
      return <div>{message.content}</div>;
    }

    // Parse content for markdown elements
    const parts = [];
    const content = message.content;
    let currentIndex = 0;

    // Regular expressions for markdown elements
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const listRegex = /^(\s*)[-*+]\s+(.+)$/gm;
    const orderedListRegex = /^(\s*)\d+\.\s+(.+)$/gm;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /\*([^*]+)\*/g;
    
    // Find code blocks first
    let match;
    const segments = [];
    let lastIndex = 0;
    
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
        // Process text segments for other markdown elements
        let text = segment.content;
        
        // Process headings
        text = text.replace(headingRegex, (match, hashmarks, heading) => {
          const level = hashmarks.length;
          const className = `text-${'xl lg md sm xs xs'.split(' ')[level - 1]} font-bold my-2`;
          return `<h${level} class="${className}">${heading}</h${level}>`;
        });
        
        // Process inline code
        let inlineCodeMatches = [];
        while ((match = inlineCodeRegex.exec(text)) !== null) {
          inlineCodeMatches.push({
            fullMatch: match[0],
            code: match[1],
            index: match.index
          });
        }
        
        // Process bold
        let boldMatches = [];
        while ((match = boldRegex.exec(text)) !== null) {
          boldMatches.push({
            fullMatch: match[0],
            content: match[1],
            index: match.index
          });
        }
        
        // Process italic
        let italicMatches = [];
        while ((match = italicRegex.exec(text)) !== null) {
          italicMatches.push({
            fullMatch: match[0],
            content: match[1],
            index: match.index
          });
        }
        
        // Process links
        let linkMatches = [];
        while ((match = linkRegex.exec(text)) !== null) {
          linkMatches.push({
            fullMatch: match[0],
            text: match[1],
            url: match[2],
            index: match.index
          });
        }
        
        // Split text by paragraphs
        const paragraphs = text.split(/\n\n+/).filter(Boolean);
        
        parts.push(
          <div key={`text-${idx}`} className="mb-4">
            {paragraphs.map((para, i) => {
              // Identify if this paragraph is a list
              const listMatch = para.match(listRegex);
              const orderedListMatch = para.match(orderedListRegex);
              
              if (listMatch) {
                // Extract list items
                const items = [];
                let listItem;
                const listItemRegex = /^(\s*)[-*+]\s+(.+)$/gm;
                while ((listItem = listItemRegex.exec(para)) !== null) {
                  items.push(listItem[2]);
                }
                return renderList(items, false);
              } else if (orderedListMatch) {
                // Extract ordered list items
                const items = [];
                let listItem;
                const listItemRegex = /^(\s*)\d+\.\s+(.+)$/gm;
                while ((listItem = listItemRegex.exec(para)) !== null) {
                  items.push(listItem[2]);
                }
                return renderList(items, true);
              } else {
                // Regular paragraph processing
                let processed = para;
                
                // Replace HTML-like tags from heading processing
                processed = processed.replace(/<h(\d) class="([^"]+)">(.+)<\/h\1>/g, (match, level, className, content) => {
                  return `<h${level}>${content}</h${level}>`;
                });
                
                // Handle inline code
                inlineCodeMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<code>${match.code}</code>`);
                  }
                });
                
                // Handle bold
                boldMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<strong>${match.content}</strong>`);
                  }
                });
                
                // Handle italic
                italicMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<em>${match.content}</em>`);
                  }
                });
                
                // Handle links
                linkMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<a href="${match.url}">${match.text}</a>`);
                  }
                });
                
                // Final rendering with HTML components
                const renderHTML = (html) => {
                  const parts = [];
                  let remainingHtml = html;
                  
                  // Process headings
                  const headingRegex = /<h(\d)>(.+?)<\/h\1>/g;
                  let headingMatch;
                  while ((headingMatch = headingRegex.exec(html)) !== null) {
                    const [fullMatch, level, content] = headingMatch;
                    const beforeHeading = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeHeading) {
                      parts.push(<span key={`text-${parts.length}`}>{beforeHeading}</span>);
                    }
                    
                    parts.push(
                      <span 
                        key={`heading-${parts.length}`} 
                        className={`block font-bold ${level === '1' ? 'text-xl' : level === '2' ? 'text-lg' : 'text-base'} my-2`}
                      >
                        {content}
                      </span>
                    );
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  // Process inline code
                  const inlineCodeRegex = /<code>(.+?)<\/code>/g;
                  let codeMatch;
                  while ((codeMatch = inlineCodeRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, code] = codeMatch;
                    const beforeCode = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeCode) {
                      parts.push(<span key={`text-${parts.length}`}>{beforeCode}</span>);
                    }
                    
                    parts.push(renderInlineCode(code));
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  // Process bold
                  const boldRegex = /<strong>(.+?)<\/strong>/g;
                  let boldMatch;
                  while ((boldMatch = boldRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, content] = boldMatch;
                    const beforeBold = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeBold) {
                      parts.push(<span key={`text-${parts.length}`}>{beforeBold}</span>);
                    }
                    
                    parts.push(<strong key={`bold-${parts.length}`}>{content}</strong>);
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  // Process italic
                  const italicRegex = /<em>(.+?)<\/em>/g;
                  let italicMatch;
                  while ((italicMatch = italicRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, content] = italicMatch;
                    const beforeItalic = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeItalic) {
                      parts.push(<span key={`text-${parts.length}`}>{beforeItalic}</span>);
                    }
                    
                    parts.push(<em key={`italic-${parts.length}`}>{content}</em>);
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  // Process links
                  const linkRegex = /<a href="([^"]+)">(.+?)<\/a>/g;
                  let linkMatch;
                  while ((linkMatch = linkRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, url, text] = linkMatch;
                    const beforeLink = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeLink) {
                      parts.push(<span key={`text-${parts.length}`}>{beforeLink}</span>);
                    }
                    
                    parts.push(renderLink(text, url));
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  // Add any remaining HTML
                  if (remainingHtml) {
                    parts.push(<span key={`text-${parts.length}`}>{remainingHtml}</span>);
                  }
                  
                  return parts;
                };
                
                return <p key={i} className="mb-2">{renderHTML(processed)}</p>;
              }
            })}
          </div>
        );
      }
    });

    // If no markdown elements were found, just render the text normally
    if (parts.length === 0) {
      parts.push(
        <div key="text" className="mb-4">
          {content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="mb-2">
              {paragraph.split('\n').map((line, j) => (
                <React.Fragment key={j}>
                  {line}
                  {j < paragraph.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
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
