
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

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
  createNewChat: () => void;
  setCurrentChat: (chatId: string) => void;
  sendMessage: (message: string, images?: File[]) => Promise<void>;
  clearChats: () => void;
  deleteChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load chats from localStorage on initial load
  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats) as Chat[];
        setChats(parsedChats);
        
        // Set current chat to the most recent one if it exists
        if (parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved chats:', e);
      }
    } else {
      // Create a first chat if none exist
      createNewChat();
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);

  // Create a new chat
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

  // Generate a simple ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Send a message to the current chat
  const sendMessage = async (message: string, imageFiles?: File[]) => {
    if (!currentChatId) {
      const newChatId = createNewChat();
      setCurrentChatId(newChatId);
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Add user message to the current chat
      const userMessageId = generateId();
      let images: string[] = [];
      
      // Process image files if provided
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
      
      // Update chat with user message
      const chatToUpdate = chats.find(c => c.id === currentChatId);
      if (!chatToUpdate) {
        throw new Error('Chat not found');
      }
      
      // Update chat title if it's the first message
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
      
      // Save updated chat to state
      setChats(prevChats => 
        prevChats.map(c => c.id === currentChatId ? updatedChat : c)
      );
      
      // Make API call to get assistant response
      try {
        // Prepare the request body
        const requestBody = {
          prompt: buildPrompt(updatedChat.messages), 
          images: images,
          model: "google/gemma-12b", // Replace with actual model ID
          max_tokens: 500,
          temperature: 0.7
        };
        
        // Call API endpoint
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_TOKEN || ''}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Add assistant response to chat
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: responseData.text || "I'm sorry, I couldn't generate a response.",
          timestamp: Date.now(),
        };
        
        // Update chat with assistant message
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
        
        // Add error message to chat
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again later.",
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
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const buildPrompt = (messages: ChatMessage[]) => {
    // For now, just construct a basic prompt with message history
    const homeFixesPrompt = "You are an expert in home fixes and repairs. Provide detailed, step-by-step instructions for solving common household problems. Focus on being practical, safety-conscious, and recommending the right tools and materials.\n\n";
    
    // Format conversation history
    const conversationHistory = messages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n');
    
    return `${homeFixesPrompt}${conversationHistory}`;
  };
  
  // Delete a chat
  const deleteChat = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    // If we deleted the current chat, switch to another one
    if (chatId === currentChatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        // Create a new chat if we deleted the last one
        createNewChat();
      }
    }
  };
  
  // Clear all chats
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
