
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { PlusCircle, MessageCircle, Trash2, Sun, Moon, Home, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  onCloseSidebar?: () => void;
}

const Sidebar = ({ onCloseSidebar }: SidebarProps) => {
  const { chats, currentChatId, createNewChat, setCurrentChat, clearChats, deleteChat } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [confirmClear, setConfirmClear] = useState(false);
  
  const handleChatClick = (chatId: string) => {
    setCurrentChat(chatId);
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };
  
  const handleNewChat = () => {
    createNewChat();
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };
  
  const handleClearChats = () => {
    if (confirmClear) {
      clearChats();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center">
        <Home className="mr-2" />
        <h1 className="font-semibold text-lg">HomeFixAI</h1>
      </div>
      
      <Button 
        className="mx-4 mb-2" 
        onClick={handleNewChat}
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        New Chat
      </Button>
      
      <Separator className="my-2" />
      
      <ScrollArea className="flex-1 px-2">
        <div className="p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatClick(chat.id)}
              className={cn(
                "flex items-center p-3 mb-1 rounded-md cursor-pointer group",
                chat.id === currentChatId 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "hover:bg-sidebar-accent/80"
              )}
            >
              <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex-1 truncate">
                <p className="truncate text-sm">
                  {chat.title || 'New Chat'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.messages.length} messages • {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                </p>
              </div>
              {chat.id !== currentChatId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleClearChats}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {confirmClear ? 'Confirm Clear All' : 'Clear All Chats'}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
