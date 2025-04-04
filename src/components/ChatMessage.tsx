
import React from "react";
import { ChatMessage as ChatMessageType } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import MessageContent from "./chat/MessageContent";
import MessageImages from "./chat/MessageImages";
import MessageHeader from "./chat/MessageHeader";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  
  return (
    <div className={cn("mb-6 group", isUser ? "flex flex-row-reverse" : "flex")}>
      <div className="max-w-[80%]">
        <MessageHeader 
          isUser={isUser} 
          timestamp={message.timestamp} 
          content={message.content} 
        />
        
        <div className={cn(
          "group relative p-4 rounded-lg mt-1",
          isUser 
            ? "chat-bubble-user bg-primary text-primary-foreground" 
            : "chat-bubble-assistant bg-muted"
        )}>
          <MessageContent isUser={isUser} content={message.content} />
        </div>
        
        <MessageImages images={message.images || []} />
      </div>
    </div>
  );
};

export default ChatMessage;
