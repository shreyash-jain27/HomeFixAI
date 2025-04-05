
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

// Helper function for lists with inline formatting support
const renderList = (items: string[], ordered: boolean) => {
  const ListComponent = ordered ? 'ol' : 'ul';
  const listClass = ordered ? 'list-decimal' : 'list-disc';
  
  return (
    <ListComponent className={`${listClass} ml-6 my-2`}>
      {items.map((item, i) => (
        <li key={i} className="mb-1">
          {processInlineFormatting(item)}
        </li>
      ))}
    </ListComponent>
  );
};

// Helper function for headings with inline formatting support
const renderHeading = (content: string, level: number) => {
  const baseStyles = "font-semibold text-foreground mb-4";
  const HeadingComponent = `h${level}` as keyof JSX.IntrinsicElements;
  
  let sizeClass = 'text-lg';
  switch (level) {
    case 1: sizeClass = 'text-2xl'; break;
    case 2: sizeClass = 'text-xl'; break;
    case 3: sizeClass = 'text-lg'; break;
    case 4: sizeClass = 'text-base'; break;
    case 5: sizeClass = 'text-sm'; break;
    case 6: sizeClass = 'text-xs'; break;
  }
  
  return (
    <HeadingComponent className={`${baseStyles} ${sizeClass}`}>
      {processInlineFormatting(content)}
    </HeadingComponent>
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
const renderHeadingElement = (content: string, level: number) => {
  const baseStyles = "font-semibold text-foreground mb-4";
  
  switch (level) {
    case 1:
      return <h1 className={`${baseStyles} text-2xl`}>{content}</h1>;
    case 2:
      return <h2 className={`${baseStyles} text-xl`}>{content}</h2>;
    case 3:
      return <h3 className={`${baseStyles} text-lg`}>{content}</h3>;
    case 4:
      return <h4 className={`${baseStyles} text-base`}>{content}</h4>;
    case 5:
      return <h5 className={`${baseStyles} text-sm`}>{content}</h5>;
    case 6:
      return <h6 className={`${baseStyles} text-xs`}>{content}</h6>;
    default:
      return <h2 className={`${baseStyles} text-xl`}>{content}</h2>;
  }
};

// Process text segments
const processTextSegment = (text: string) => {
  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  
  return paragraphs.map((para, paraIndex) => {
    // Check for headings
    const headingMatch = para.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      return <React.Fragment key={`para-${paraIndex}`}>{renderHeading(content, level)}</React.Fragment>;
    }
    
    // Check for lists
    if (para.trim().startsWith('* ') || para.trim().startsWith('- ')) {
      const items = para.split(/\n/).map(line => line.replace(/^[*-]\s+/, '').trim()).filter(Boolean);
      return <React.Fragment key={`para-${paraIndex}`}>{renderList(items, false)}</React.Fragment>;
    }
    
    if (/^\d+\.\s/.test(para.trim())) {
      const items = para.split(/\n/).map(line => line.replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
      return <React.Fragment key={`para-${paraIndex}`}>{renderList(items, true)}</React.Fragment>;
    }
    
    // Process inline formatting
    return (
      <p key={`para-${paraIndex}`} className="mb-2">
        {processInlineFormatting(para)}
      </p>
    );
  });
};

const processInlineFormatting = (text: string) => {
  const elements: React.ReactNode[] = [];
  let currentText = text;
  let lastIndex = 0;

  const patterns = [
    {
      regex: /`([^`]+)`/g,
      render: (content: string) => renderInlineCode(content)
    },
    {
      regex: /\*\*([^*]+?)\*\*/g,
      render: (content: string) => <strong key={`bold-${content}`} className="font-bold">{processInlineFormatting(content.trim())}</strong>
    },
    {
      regex: /\*([^*]+?)\*/g,
      render: (content: string) => <em key={`italic-${content}`} className="italic">{processInlineFormatting(content.trim())}</em>
    },
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/g,
      render: (text: string, url: string) => renderLink(text, url)
    }
  ];

  // Find all matches for all patterns
  const matches: Array<{
    pattern: typeof patterns[0],
    match: RegExpExecArray,
    index: number
  }> = [];

  // Collect all matches from all patterns
  patterns.forEach(pattern => {
    let match;
    pattern.regex.lastIndex = 0; // Reset regex state
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        pattern,
        match,
        index: match.index
      });
    }
  });

  // Sort matches by their position in the text
  matches.sort((a, b) => a.index - b.index);

  // Process matches in order
  matches.forEach(({ pattern, match, index }) => {
    if (index > lastIndex) {
      elements.push(<span key={`text-${elements.length}`}>{text.slice(lastIndex, index)}</span>);
    }

    // Add the formatted element based on pattern type
    if (pattern.regex.source.includes('\\]\\(')) {
      elements.push(pattern.render(match[1], match[2])); // For links: text and URL
    } else {
      elements.push(pattern.render(match[1])); // For other formats: just the content
    }

    lastIndex = index + match[0].length;
  });

  // Add any remaining text
  if (lastIndex < text.length) {
    elements.push(<span key={`text-${elements.length}`}>{text.slice(lastIndex)}</span>);
  }

  return elements.length > 0 ? elements : text;
};

export default MessageContent;
