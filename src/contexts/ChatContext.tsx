import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { generateTextResponse, generateImageResponse } from '../api/gemini';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  images?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;
  geminiKey: string | undefined;
  createNewChat: () => void;
  setCurrentChat: (chatId: string) => void;
  sendMessage: (message: string, imageFiles?: File[]) => Promise<void>;
  clearChats: () => void;
  deleteChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {

    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats) as Chat[];
        setChats(parsedChats);
        
        if (parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved chats:', e);
      }
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);


  const createNewChat = () => {
    const newChat: Chat = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const setCurrentChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Add this helper function for delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendMessage = async (message: string, imageFiles?: File[]) => {
    if (!currentChatId) {
      const newChatId = createNewChat();
      setCurrentChatId(newChatId);
    }
    
    if (!geminiKey) {
      toast.error("Please set your Google Gemini API key in the settings");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Add a 500ms delay to simulate thinking
      await delay(500);

      const userMessageId = generateId();
      let images: string[] = [];
      
      if (imageFiles && imageFiles.length > 0) {
        console.log(`Processing ${imageFiles.length} images`);
        
        images = await Promise.all(imageFiles.map(async (file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                console.log(`Image loaded: ${file.name}, type: ${file.type}`);
                resolve(e.target.result.toString());
              }
            };
            reader.onerror = (e) => {
              console.error("Error reading file:", e);
              reject(new Error("Failed to read image file"));
            };
            reader.readAsDataURL(file);
          });
        }));
        
        console.log(`Successfully processed ${images.length} images`);
      }
      
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: message,
        timestamp: Date.now(),
        images: images.length > 0 ? images : undefined
      };
      
      const chatToUpdate = chats.find(c => c.id === currentChatId);
      if (!chatToUpdate) {
        throw new Error('Chat not found');
      }
      
      let updatedTitle = chatToUpdate.title;
      if (chatToUpdate.messages.length === 0) {
        updatedTitle = message.length > 20 ? `${message.substring(0, 20)}...` : message;
      }
      
      const updatedChat = {
        ...chatToUpdate,
        title: updatedTitle,
        messages: [...chatToUpdate.messages, userMessage],
        updatedAt: Date.now()
      };
      
      setChats(prevChats => 
        prevChats.map(c => c.id === currentChatId ? updatedChat : c)
      );
      
      const prompt = buildPrompt(updatedChat.messages);
      
      let responseText: string;
      
      if (images.length > 0) {
        console.log("Sending message with images to Gemini");
        responseText = await generateImageResponse(
          prompt,
          images,
          geminiKey
        );
      } else {
        console.log("Sending text-only message to Gemini");
        responseText = await generateTextResponse(
          prompt,
          geminiKey
        );
      }
      
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText || "I'm sorry, I couldn't generate a response.",
        timestamp: Date.now(),
      };
      
      setChats(prevChats => 
        prevChats.map(c => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: Date.now()
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      console.error('Failed to get assistant response:', err);
      const errorMessage = err.message || 'Failed to get a response from the AI assistant.';
      setError(errorMessage);
      
      // Create a more user-friendly error message
      let userFriendlyError = "I'm having trouble connecting right now. ";
      
      if (errorMessage.includes("400") || errorMessage.includes("Bad Request")) {
        userFriendlyError += "There was an issue with the request format. ";
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        userFriendlyError += "Please check your Google Gemini API key. ";
      } else if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
        userFriendlyError += "You've reached the API rate limit. Please try again later. ";
      } else if (errorMessage.includes("500") || errorMessage.includes("Server Error")) {
        userFriendlyError += "The Gemini service is experiencing issues. Please try again later. ";
      }
      
      userFriendlyError += "If the problem persists, there may be an issue with the service itself.";
      
      const errorChatMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: userFriendlyError,
        timestamp: Date.now(),
      };
      
      setChats(prevChats => 
        prevChats.map(c => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, errorChatMessage],
              updatedAt: Date.now()
            };
          }
          return c;
        })
      );
      
      toast.error("Failed to get response from Gemini");
    } finally {
      setIsLoading(false);
    }
  };

  const buildPrompt = (messages: ChatMessage[]) => {
    // Check for personal questions about creator
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      const lowercaseMessage = lastMessage.content.toLowerCase();
      
      // Identity and creator questions
      const identityPatterns = [
        'who created you',
        'who made you',
        'who developed you',
        'who is your creator',
        'who is your owner',
        'who owns you',
        'who built you',
        'your creator',
        'tell me about yourself',
        'what are you',
        'who are you'
      ];

      // Check for identity/creator questions
      if (identityPatterns.some(pattern => lowercaseMessage.includes(pattern))) {
        // Return a direct response that doesn't get processed further by the model
        return `DIRECT_RESPONSE:I am HomeFixAI, an AI assistant created by Shreyash Jain. I specialize in helping people with home repairs, maintenance, and DIY projects. I'm designed to provide practical, detailed advice while maintaining safety as a top priority. While I can engage in friendly conversation, my primary focus is on helping you with your home-related questions and projects.`;
      }

      // Check for capability questions
      const capabilityPatterns = [
        'what can you do',
        'your capabilities',
        'your features',
        'help me with',
        'how can you help',
        'what do you do',
        'what are you capable of',
        'what services',
        'how do you work'
      ];

      if (capabilityPatterns.some(pattern => lowercaseMessage.includes(pattern))) {
        return `As HomeFixAI, I specialize in:

1. Home Repairs & Maintenance
   - Troubleshooting common issues
   - Step-by-step repair guides
   - Preventive maintenance advice

2. DIY Projects
   - Project planning and execution
   - Tool and material recommendations
   - Safety guidelines and best practices

3. Home Systems
   - Basic plumbing assistance
   - Electrical system guidance
   - HVAC maintenance tips

4. Safety & Prevention
   - Safety protocols for repairs
   - Identifying potential hazards
   - When to call professionals

I provide detailed, practical advice while always prioritizing safety. How can I assist you with your home-related needs today?`;
      }

      // Check for purpose/background questions
      const purposePatterns = [
        'what is your purpose',
        'why were you created',
        'what are you for',
        'what is your function',
        'why do you exist',
        'what\'s your goal',
        'what\'s your mission'
      ];

      if (purposePatterns.some(pattern => lowercaseMessage.includes(pattern))) {
        return `My specific purpose is to help people maintain and improve their homes. My mission is to make home repairs and DIY projects more accessible by providing clear, practical guidance while ensuring safety. I combine technical knowledge with easy-to-follow instructions to help you tackle home-related challenges confidently.`;
      }
    }

    const assistantPrompt = `You are HomeFixAI, a friendly and knowledgeable AI assistant focused on home repairs, maintenance, and DIY projects. Your primary expertise covers:

- Home repairs and maintenance
- DIY home improvement projects
- Home safety and preventive maintenance
- Tools and materials for home projects
- Basic home systems (plumbing, electrical, HVAC)

For casual greetings or general conversation starters (like "hi", "hello", "how are you"), respond warmly while introducing your purpose:
"Hello! I'm HomeFixAI, your friendly home improvement assistant. I'm here to help with any questions about home repairs, maintenance, or DIY projects. What can I help you with today?"

For non-home-related questions, respond politely:
"I appreciate your question! While I'm a friendly AI, I specialize in home repairs and DIY projects. I'd be happy to help you with any home-related questions you have!"

When answering relevant questions:
- Provide comprehensive, detailed responses
- Break down complex answers into clear sections
- Include step-by-step instructions when applicable
- Always address safety considerations first
- List all necessary tools and materials
- Explain when professional help is needed
- Use clear, practical examples

Ensure your responses are complete, thorough, and maintain a helpful, friendly tone.`;
    
    const recentMessages = messages.slice(-10);
    
    const conversationHistory = recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
    
    return `${assistantPrompt}\n\n${conversationHistory}\n\nAssistant: Let me provide a detailed and complete response to your question.`;
  };

  const deleteChat = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    if (chatId === currentChatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const clearChats = () => {
    setChats([]);
    createNewChat();
  };

  return (
    <ChatContext.Provider value={{
      chats,
      currentChatId,
      isLoading,
      error,
      geminiKey,
      createNewChat,
      setCurrentChat,
      sendMessage,
      clearChats,
      deleteChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
