import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Chat, Message } from '../types/chat';
import { OpenAI } from 'openai';

const defaultApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
const defaultBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://models.inference.ai.azure.com';

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChat: null,
      systemPrompt: "You are a helpful AI assistant.",
      pinnedModel: null,
      apiKey: defaultApiKey,
      baseUrl: defaultBaseUrl,
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
      updateApiSettings: async (settings) => {
        const { apiKey, baseUrl } = settings;
        const testClient = new OpenAI({
          baseURL: baseUrl,
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });

        try {
          await testClient.chat.completions.create({
            model: 'gpt-4o', // Or any cheap model
            messages: [{ role: 'user', content: 'Hello' }],
          });
          set({ apiKey, baseUrl });
          return { success: true };
        } catch (error: any) {
          console.error('API Key test failed', error);
          return { success: false, message: error.message || 'Failed to validate API settings' };
        }
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        currentChat: state.currentChat,
        systemPrompt: state.systemPrompt,
        pinnedModel: state.pinnedModel,
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
      }),
    }
  )
);
