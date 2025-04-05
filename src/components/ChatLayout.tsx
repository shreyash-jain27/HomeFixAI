
import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ChatLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0 w-80" : "translate-x-0 w-16 md:w-16",
          "bg-sidebar border-r border-sidebar-border"
        )}
      >
        <Sidebar onCloseSidebar={toggleSidebar} isCollapsed={!sidebarOpen} />
      </div>
      
      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatArea />
      </div>
    </div>
  );
};

export default ChatLayout;
