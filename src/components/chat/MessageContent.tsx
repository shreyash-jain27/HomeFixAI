
import React from "react";
import { ExternalLink } from "lucide-react";

interface MessageContentProps {
  isUser: boolean;
  content: string;
}

const MessageContent = ({ isUser, content }: MessageContentProps) => {
  if (isUser) {
    return <div>{content}</div>;
  }

  // Process the content to handle markdown elements
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

// Helper function for code blocks
const renderCodeBlock = (code: string, language: string = '') => {
  const [copied, setCopied] = React.useState(false);

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
          {copied ? <span className="h-4 w-4">✓</span> : <span className="h-4 w-4">📋</span>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Helper function for inline code
const renderInlineCode = (code: string) => {
  return (
    <code className="px-1.5 py-0.5 rounded bg-muted/50 dark:bg-muted/80 font-mono text-sm">
      {code}
    </code>
  );
};

// Helper function for lists
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

// Helper function for links
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

// Helper function for headings with proper rendering
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

// Process text segments
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
    
    // Process bold text and other inline formatting within paragraph
    return (
      <p key={`para-${paraIndex}`} className="mb-2">
        {processInlineFormatting(para)}
      </p>
    );
  });
};

// Process inline formatting (bold, italic, code, links)
const processInlineFormatting = (text: string) => {
  // First handle the bold text pattern
  const elements: React.ReactNode[] = [];
  let currentText = text;
  
  // Process bold text with regex for **text**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let boldMatch;
  let hasMatches = false;
  
  while ((boldMatch = boldRegex.exec(currentText)) !== null) {
    hasMatches = true;
    const beforeText = currentText.substring(lastIndex, boldMatch.index);
    
    if (beforeText) {
      elements.push(<span key={`text-${elements.length}`}>{beforeText}</span>);
    }
    
    elements.push(<strong key={`bold-${elements.length}`} className="font-bold">{boldMatch[1]}</strong>);
    
    lastIndex = boldMatch.index + boldMatch[0].length;
  }
  
  if (hasMatches && lastIndex < currentText.length) {
    elements.push(<span key={`text-${elements.length}`}>{currentText.substring(lastIndex)}</span>);
    return elements;
  }
  
  // If no matches, return the original text
  return currentText;
};

export default MessageContent;
