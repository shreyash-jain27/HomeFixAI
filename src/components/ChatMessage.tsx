
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

  const formatMessageContent = () => {
    if (isUser) {
      return <div>{message.content}</div>;
    }

    const parts = [];
    const content = message.content;
    let currentIndex = 0;

    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const listRegex = /^(\s*)[-*+]\s+(.+)$/gm;
    const orderedListRegex = /^(\s*)\d+\.\s+(.+)$/gm;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /\*([^*]+)\*/g;
    
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
    
    segments.forEach((segment, idx) => {
      if (segment.type === 'code-block') {
        parts.push(
          <div key={`code-${idx}`}>
            {renderCodeBlock(segment.content, segment.language)}
          </div>
        );
      } else {
        let text = segment.content;
        
        // Process headings first - convert markdown headings to actual heading elements
        let processedText = text.replace(headingRegex, (match, hashmarks, heading) => {
          return `<h${hashmarks.length}>${heading}</h${hashmarks.length}>`;
        });
        
        let inlineCodeMatches = [];
        while ((match = inlineCodeRegex.exec(text)) !== null) {
          inlineCodeMatches.push({
            fullMatch: match[0],
            code: match[1],
            index: match.index
          });
        }
        
        let boldMatches = [];
        while ((match = boldRegex.exec(text)) !== null) {
          boldMatches.push({
            fullMatch: match[0],
            content: match[1],
            index: match.index
          });
        }
        
        let italicMatches = [];
        while ((match = italicRegex.exec(text)) !== null) {
          italicMatches.push({
            fullMatch: match[0],
            content: match[1],
            index: match.index
          });
        }
        
        let linkMatches = [];
        while ((match = linkRegex.exec(text)) !== null) {
          linkMatches.push({
            fullMatch: match[0],
            text: match[1],
            url: match[2],
            index: match.index
          });
        }
        
        const paragraphs = processedText.split(/\n\n+/).filter(Boolean);
        
        parts.push(
          <div key={`text-${idx}`} className="mb-4">
            {paragraphs.map((para, i) => {
              let listMatch = para.match(listRegex);
              let orderedListMatch = para.match(orderedListRegex);
              
              if (listMatch) {
                const items = [];
                let listItem;
                const listItemRegex = /^(\s*)[-*+]\s+(.+)$/gm;
                while ((listItem = listItemRegex.exec(para)) !== null) {
                  items.push(listItem[2]);
                }
                return renderList(items, false);
              } else if (orderedListMatch) {
                const items = [];
                let listItem;
                const listItemRegex = /^(\s*)\d+\.\s+(.+)$/gm;
                while ((listItem = listItemRegex.exec(para)) !== null) {
                  items.push(listItem[2]);
                }
                return renderList(items, true);
              } else {
                let processed = para;
                
                // Extract and process headings
                const headingTagRegex = /<h(\d)>(.+?)<\/h\1>/g;
                let headingMatches = [];
                let headingMatch;
                while ((headingMatch = headingTagRegex.exec(processed)) !== null) {
                  headingMatches.push({
                    fullMatch: headingMatch[0],
                    level: parseInt(headingMatch[1]),
                    content: headingMatch[2],
                    index: headingMatch.index
                  });
                }
                
                inlineCodeMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<code>${match.code}</code>`);
                  }
                });
                
                boldMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<strong>${match.content}</strong>`);
                  }
                });
                
                italicMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<em>${match.content}</em>`);
                  }
                });
                
                linkMatches.forEach(match => {
                  if (processed.includes(match.fullMatch)) {
                    const parts = processed.split(match.fullMatch);
                    processed = parts.join(`<a href="${match.url}">${match.text}</a>`);
                  }
                });
                
                const renderHTML = (html) => {
                  // Check if we have any heading tags to process
                  if (headingMatches.length > 0) {
                    const elements = [];
                    let currentText = html;
                    
                    // Sort heading matches by their position in the text
                    headingMatches.sort((a, b) => a.index - b.index);
                    
                    headingMatches.forEach((heading, i) => {
                      const beforeHeading = currentText.substring(0, currentText.indexOf(heading.fullMatch));
                      if (beforeHeading) {
                        elements.push(renderInnerHTML(beforeHeading, i));
                      }
                      
                      elements.push(renderHeading(heading.content, heading.level));
                      
                      currentText = currentText.substring(currentText.indexOf(heading.fullMatch) + heading.fullMatch.length);
                    });
                    
                    if (currentText) {
                      elements.push(renderInnerHTML(currentText, headingMatches.length));
                    }
                    
                    return elements;
                  } else {
                    return renderInnerHTML(html, 0);
                  }
                };
                
                // Helper function to render non-heading HTML content
                const renderInnerHTML = (html, key) => {
                  const parts = [];
                  let remainingHtml = html;
                  
                  const inlineCodeRegex = /<code>(.+?)<\/code>/g;
                  let codeMatch;
                  while ((codeMatch = inlineCodeRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, code] = codeMatch;
                    const beforeCode = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeCode) {
                      parts.push(<span key={`text-${parts.length}-${key}`}>{beforeCode}</span>);
                    }
                    
                    parts.push(renderInlineCode(code));
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  const boldRegex = /<strong>(.+?)<\/strong>/g;
                  let boldMatch;
                  while ((boldMatch = boldRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, content] = boldMatch;
                    const beforeBold = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeBold) {
                      parts.push(<span key={`text-${parts.length}-${key}`}>{beforeBold}</span>);
                    }
                    
                    parts.push(<strong key={`bold-${parts.length}-${key}`} className="font-bold">{content}</strong>);
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  const italicRegex = /<em>(.+?)<\/em>/g;
                  let italicMatch;
                  while ((italicMatch = italicRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, content] = italicMatch;
                    const beforeItalic = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeItalic) {
                      parts.push(<span key={`text-${parts.length}-${key}`}>{beforeItalic}</span>);
                    }
                    
                    parts.push(<em key={`italic-${parts.length}-${key}`}>{content}</em>);
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  const linkRegex = /<a href="([^"]+)">(.+?)<\/a>/g;
                  let linkMatch;
                  while ((linkMatch = linkRegex.exec(remainingHtml)) !== null) {
                    const [fullMatch, url, text] = linkMatch;
                    const beforeLink = remainingHtml.substring(0, remainingHtml.indexOf(fullMatch));
                    if (beforeLink) {
                      parts.push(<span key={`text-${parts.length}-${key}`}>{beforeLink}</span>);
                    }
                    
                    parts.push(renderLink(text, url));
                    
                    remainingHtml = remainingHtml.substring(remainingHtml.indexOf(fullMatch) + fullMatch.length);
                  }
                  
                  if (remainingHtml) {
                    parts.push(<span key={`text-${parts.length}-${key}`}>{remainingHtml}</span>);
                  }
                  
                  return parts.length > 0 ? parts : null;
                };
                
                return <div key={i} className="mb-2">{renderHTML(processed)}</div>;
              }
            })}
          </div>
        );
      }
    });

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
