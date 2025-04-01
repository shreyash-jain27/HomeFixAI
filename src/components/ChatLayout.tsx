
import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ChatLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 md:hidden"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}
      
      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-80 flex-shrink-0'
        } bg-sidebar border-r border-sidebar-border`}
      >
        <Sidebar onCloseSidebar={() => setSidebarOpen(false)} />
      </div>
      
      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatArea />
      </div>
    </div>
  );
};

export default ChatLayout;
