export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
}

export interface ChatState {
  chats: Chat[];
  currentChat: string | null;
  systemPrompt: string;
  pinnedModel: string | null;
  apiKey: string;
  baseUrl: string;
  addChat: (chat: Chat) => void;
  setCurrentChat: (id: string) => void;
  updateChat: (id: string, chat: Partial<Chat>) => void;
  deleteChat: (id: string) => void;
  addMessage: (chatId: string, message: Message, replace?: boolean) => void;
  updateSystemPrompt: (prompt: string) => void;
  setPinnedModel: (model: string | null) => void;
  updateApiSettings: (settings: Partial<Pick<ChatState, 'apiKey' | 'baseUrl'>>) => void;
}
