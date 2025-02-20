import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Chat, Message } from '../types/chat';

const defaultApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
const defaultBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://models.inference.ai.azure.com';
const defaultTavilyApiKey = import.meta.env.VITE_TAVILY_API_KEY || '';
const defaultSearchPrompt = `Analyze the search results and provide a comprehensive, well-organized summary that answers the user's query. Include relevant facts, figures, and quotes when appropriate. Structure the response with:

1. Direct answer to the query
2. Key findings and insights
3. Supporting evidence and sources
4. Additional context if relevant

Be concise but thorough, and maintain a neutral, informative tone.`;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChat: null,
      systemPrompt: "You are a helpful AI assistant.",
      searchPrompt: defaultSearchPrompt,
      pinnedModel: 'gpt-4o',
      apiKey: defaultApiKey,
      baseUrl: defaultBaseUrl,
      tavilyApiKey: defaultTavilyApiKey,
      apiError: null,
      addChat: (chat) => {
        const { pinnedModel } = get();
        const chatWithModel = {
          ...chat,
          model: chat.model || pinnedModel
        };
        set((state) => ({
          chats: [...state.chats, chatWithModel],
          currentChat: chatWithModel.id,
          apiError: null
        }));
      },
      setCurrentChat: (id) => set({ currentChat: id, apiError: null }),
      updateChat: (id, updatedChat) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, ...updatedChat } : chat
          ),
          apiError: null
        })),
      deleteChat: (id) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          currentChat: state.currentChat === id ? null : state.currentChat,
          apiError: null
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
          apiError: null
        })),
      updateSystemPrompt: (prompt) => set({ systemPrompt: prompt, apiError: null }),
      updateSearchPrompt: (prompt) => set({ searchPrompt: prompt, apiError: null }),
      resetSearchPrompt: () => set({ searchPrompt: defaultSearchPrompt, apiError: null }),
      setPinnedModel: (model) => set({ pinnedModel: model, apiError: null }),
      updateApiSettings: async (settings) => {
        const { apiKey, baseUrl, tavilyApiKey } = settings;
        set({ 
          apiKey: apiKey || defaultApiKey, 
          baseUrl: baseUrl || defaultBaseUrl,
          tavilyApiKey: tavilyApiKey || defaultTavilyApiKey,
          apiError: null
        });
        return { success: true };
      },
      setApiError: (error: string | null) => set({ apiError: error }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        currentChat: state.currentChat,
        systemPrompt: state.systemPrompt,
        searchPrompt: state.searchPrompt,
        pinnedModel: state.pinnedModel,
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        tavilyApiKey: state.tavilyApiKey,
      }),
    }
  )
);
