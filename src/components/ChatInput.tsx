
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/contexts/ChatContext";
import { Send, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

const ChatInput = () => {
  const { sendMessage, isLoading, geminiKey } = useChat();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if (message.trim() || images.length > 0) {
      await sendMessage(message, images);
      setMessage(""); // Clear the input after sending
      setImages([]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      const imageFiles = fileArray.filter(file => 
        file.type.startsWith('image/')
      );
      setImages(prev => [...prev, ...imageFiles].slice(0, 4)); // Limit to 4 images
    }
  };
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img 
                src={URL.createObjectURL(image)}
                alt={`Upload preview ${index + 1}`}
                className="h-16 w-16 object-cover rounded-md border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    
      <div className="flex items-end gap-2 border rounded-xl bg-background p-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about home repairs, maintenance issues, or DIY projects..."
          className="flex-1 min-h-[60px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="icon"
            type="button"
            disabled={images.length >= 4 || isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Button 
            type="button" 
            size="icon"
            onClick={handleSendMessage}
            disabled={(!message.trim() && images.length === 0) || isLoading || !geminiKey}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-2">
        HomeFixAI can make mistakes. Consider checking important info.
      </p>
    </div>
  );
};

export default ChatInput;
