import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Chat, Message } from '../types/chat';

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: [],
      currentChat: null,
      systemPrompt: "You are a helpful AI assistant.\nWhenever the user asks you to generate an image kindly tell the user to use the '/gen' command to generate images",
      pinnedModel: null,
      addChat: (chat) =>
        set((state) => ({ 
          chats: [...state.chats, chat], 
          currentChat: chat.id 
        })),
      setCurrentChat: (id) => set({ currentChat: id }),
      updateChat: (id, updatedChat) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, ...updatedChat } : chat
          ),
        })),
      deleteChat: (id) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          currentChat: state.currentChat === id ? null : state.currentChat,
        })),
      addMessage: (chatId, message, replace = false) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: replace
                    ? [...chat.messages.slice(0, -1), message]
                    : [...chat.messages, message],
                }
              : chat
          ),
        })),
      updateSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setPinnedModel: (model) => set({ pinnedModel: model }),
    }),
    {
      name: 'chat-storage',
      version: 1,
    }
  )
);
