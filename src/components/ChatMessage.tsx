
import { useState } from "react";
import { ChatMessage as ChatMessageType } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

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
  
  // Function to format the message content with proper rendering of markdown-like text
  const formatMessageContent = () => {
    if (isUser) {
      return <div>{message.content}</div>;
    }
    
    // Parse content and render properly
    return (
      <div className="prose dark:prose-invert max-w-none">
        {message.content.split('\n').map((line, i) => (
          <p key={i} className="mb-2">{line}</p>
        ))}
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
