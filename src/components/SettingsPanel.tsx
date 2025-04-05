import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings as SettingsIcon } from "lucide-react";

const SettingsPanel = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
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