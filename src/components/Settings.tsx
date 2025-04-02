
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useChat } from "@/contexts/ChatContext";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

const SettingsPanel = () => {
  const { geminiKey, setGeminiKey } = useChat();
  const [keyInput, setKeyInput] = useState(geminiKey);
  
  const handleSaveKey = () => {
    setGeminiKey(keyInput);
    toast.success("Google Gemini API key saved");
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your AI assistant settings
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Google Gemini API Key</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Google Gemini API key to connect to the AI model.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIza..."
              />
              <Button onClick={handleSaveKey}>Save</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Get your key at{" "}
              <a
                href="https://ai.google.dev/tutorials/setup"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                ai.google.dev
              </a>
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">About</h3>
            <p className="text-sm text-muted-foreground">
              HomeFixAI uses Google's Gemini models to provide helpful advice 
              for your home repair questions. You can upload images of your repair issues
              for more specific guidance.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
