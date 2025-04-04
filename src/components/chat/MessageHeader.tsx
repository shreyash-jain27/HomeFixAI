
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MessageHeaderProps {
  isUser: boolean;
  timestamp: number;
  content: string;
}

const MessageHeader = ({ isUser, timestamp, content }: MessageHeaderProps) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex items-start gap-2">
      <Avatar className={cn("mt-0.5", isUser ? "ml-2" : "mr-2")}>
        <AvatarFallback className={isUser ? "bg-chat-user text-primary-foreground" : ""}>
          {isUser ? "U" : "AI"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">
          {isUser ? "You" : "HomeFixAI"} • {format(timestamp, "MMM d, h:mm a")}
        </div>
      </div>
      
      <button 
        onClick={copyToClipboard}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy message"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export default MessageHeader;
