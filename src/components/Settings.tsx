
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useChat } from "@/contexts/ChatContext";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { hfToken, setHfToken } = useChat();
  const [tokenInput, setTokenInput] = useState(hfToken);
  
  const handleSaveToken = () => {
    setHfToken(tokenInput);
    toast.success("Hugging Face token saved");
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
        </SheetHeader>
        
        <div className="py-6">
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Hugging Face API Token</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Hugging Face API token to connect to the AI model.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="hf_..."
              />
              <Button onClick={handleSaveToken}>Save</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Get your token at{" "}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                huggingface.co/settings/tokens
              </a>
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">About</h3>
            <p className="text-sm text-muted-foreground">
              HomeFixAI uses Hugging Face's Gemma models to provide helpful advice 
              for your home repair questions. You can upload images of your repair issues
              for more specific guidance.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Settings;
