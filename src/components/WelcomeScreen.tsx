
import { Tool, Wrench, Lightbulb, PaintBucket } from "lucide-react";

const WelcomeScreen = () => {
  const examples = [
    { 
      icon: <Wrench className="h-6 w-6" />,
      text: "How do I fix a leaky kitchen faucet?" 
    },
    { 
      icon: <Tool className="h-6 w-6" />,
      text: "What's the best way to unclog a bathroom drain without chemicals?" 
    },
    { 
      icon: <Lightbulb className="h-6 w-6" />,
      text: "How to replace a light fixture safely?" 
    },
    { 
      icon: <PaintBucket className="h-6 w-6" />,
      text: "What paint should I use for my bathroom walls?" 
    }
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2">Welcome to HomeFixAI</h1>
      <p className="text-xl text-muted-foreground mb-8">Your personal home repair assistant</p>
      
      <div className="max-w-2xl w-full">
        <h2 className="text-lg font-medium mb-4">Try asking about:</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {examples.map((example, index) => (
            <div 
              key={index}
              className="flex items-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="mr-4 text-primary">{example.icon}</div>
              <p>{example.text}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            You can also upload images of your repair issues for more specific advice
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
