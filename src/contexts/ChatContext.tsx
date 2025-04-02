
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
  geminiKey: string;
  setGeminiKey: (token: string) => void;
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
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_key') || '';
  });

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

  useEffect(() => {
    if (geminiKey) {
      localStorage.setItem('gemini_key', geminiKey);
    }
  }, [geminiKey]);

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
      const userMessageId = generateId();
      let images: string[] = [];
      
      if (imageFiles && imageFiles.length > 0) {
        images = await Promise.all(imageFiles.map(async (file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve(e.target.result.toString());
              }
            };
            reader.readAsDataURL(file);
          });
        }));
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
        responseText = await generateImageResponse(
          prompt,
          images,
          geminiKey
        );
      } else {
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
    } catch (err) {
      console.error('Failed to get assistant response:', err);
      setError('Failed to get a response from the AI assistant. Please try again later.');
      
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your Google Gemini API key and try again later.",
        timestamp: Date.now(),
      };
      
      setChats(prevChats => 
        prevChats.map(c => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, errorMessage],
              updatedAt: Date.now()
            };
          }
          return c;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const buildPrompt = (messages: ChatMessage[]) => {
    const homeFixesPrompt = "You are HomeFixAI, an expert in home fixes and repairs. Provide detailed, step-by-step instructions for solving common household problems. Focus on being practical, safety-conscious, and recommending the right tools and materials. Always respond directly to the user's question without including any fictional dialogue or conversation history. Address the user's current query only.\n\n";
    
    const recentMessages = messages.slice(-5);
    
    const conversationHistory = recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n');
    
    return `${homeFixesPrompt}${conversationHistory}\n\nAssistant:`;
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
      setGeminiKey,
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
