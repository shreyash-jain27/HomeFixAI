
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { PlusCircle, MessageCircle, Trash2, Sun, Moon, Home, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

// Update the interface
interface SidebarProps {
  onCloseSidebar: () => void;
  isCollapsed: boolean;
}

const Sidebar = ({ onCloseSidebar, isCollapsed }: SidebarProps) => {
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
    const newChatId = createNewChat();
    if (newChatId !== undefined) {
if (typeof newChatId === 'string') {
  setCurrentChat(newChatId);
}
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
  
  const handleHomeButtonClick = () => {
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseSidebar}
        >
          <MessageCircle className={cn(
            "flex-shrink-0",
            isCollapsed ? "h-5 w-5" : "h-4 w-4"
          )} />
        </Button>

        {!isCollapsed && (
          <Button 
            onClick={handleNewChat}
            className="flex-1 ml-2"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        )}
      </div>

      {/* Only show these elements when sidebar is expanded */}
      <div className={cn(
        "flex flex-col flex-1 min-h-0 transition-all duration-300",
        isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
      )}>
        <Separator className="my-2" />
        <ScrollArea className="flex-1">
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
        
        <div className="p-4 mt-auto border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
            

            {/* this is the button of the settings */}
            {/* <Button 
              variant="ghost"
              size="icon"
            >
              <Settings className="w-4 h-4" />
            </Button> */}
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
    </div>
  );
};

export default Sidebar;
