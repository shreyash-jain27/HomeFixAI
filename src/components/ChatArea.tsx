
import { useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import { useChat } from "@/contexts/ChatContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import WelcomeScreen from "./WelcomeScreen";
import { Loader2 } from "lucide-react";

const ChatArea = () => {
  const { chats, currentChatId, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the current chat
  const currentChat = currentChatId ? chats.find(chat => chat.id === currentChatId) : null;
  const messages = currentChat?.messages || [];
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="p-4 pb-24">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="chat-bubble-assistant flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>
      
      <div className="p-4 bg-background">
        <ChatInput />
      </div>
    </div>
  );
};

export default ChatArea;
