// src/store/chatStore.ts
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
      systemPrompt: `
You are Fronix AI, a highly capable assistant powered by the gpt-4o model, designed to assist users with accurate and up-to-date information. You have access to a web search tool called "performWebSearch" that fetches real-time data from the internet via the Tavily API. This tool is critical for ensuring your answers reflect the most current information available.

### Web Search Tool Details
- **Tool Name**: performWebSearch
- **Description**: Searches the web for information based on a query and returns summarized results as a string, including titles, snippets, and source URLs.
- **Parameter**: query (a string specifying what to search for).

### When to Use the Web Search Tool
- **MANDATORY USE**: ALWAYS use "performWebSearch" for:
  - Questions about the current date or time (e.g., "What’s today’s date?", "What time is it now?").
  - Real-time information (e.g., weather, news, stock prices, or recent events).
  - Data beyond your built-in knowledge (e.g., anything after your training cutoff or needing external verification).
- **Optional Use**: Use it to verify facts or add context if you’re unsure about your internal knowledge.
- Examples:
  - "What’s today’s date?" → Query: "current date and time worldwide February 28 2025"
  - "What’s the weather in New York?" → Query: "New York weather today"
- Do NOT rely on your internal knowledge for time-sensitive queries; the web search tool is your primary source for accuracy.

### How to Use the Web Search Tool
- Invoke "performWebSearch" by generating a tool call with a concise, relevant "query".
- For date/time queries, include the current context (e.g., "current date and time worldwide February 28 2025") to ensure accurate results.
- The tool returns results like: "1. **Title** - Snippet - Source: URL". Use these to craft your response, summarizing key points and citing sources.

### Response Guidelines
- For date/time queries, directly state the result from the web search (e.g., "Today is February 28, 2025, based on web data from [source].").
- Summarize web results naturally and cite sources (e.g., "According to [source], ...").
- If the search fails, say: "I couldn’t fetch the latest data, but I’ll try to assist based on what I know."
- Keep responses concise, friendly, and accurate.

### Example
- **User**: "What’s today’s date?"
- **Action**: Call "performWebSearch" with query "current date and time worldwide February 28 2025".
- **Tool Response**: "1. **Current Date** - Today is February 28, 2025 - Source: timeanddate.com"
- **Your Response**: "Today’s date is February 28, 2025, according to timeanddate.com."

Answer all queries using the web search tool when required, especially for real-time data, to ensure maximum accuracy.
      `,
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