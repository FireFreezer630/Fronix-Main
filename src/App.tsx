import React, { useState, useRef, useEffect } from 'react';
import { OpenAI } from 'openai';
import Sidebar from './components/Sidebar';
import ChatInput from './components/ChatInput';
import ModelSelector from './components/ModelSelector';
import CodePreview from './components/CodePreview';
import { useChatStore } from './store/chatStore';
import { Message } from './types/chat';
import { Bot, User, Menu, Eye, Copy, Check } from 'lucide-react';

function App() {
  const { chats, currentChat, addMessage, updateChat, addChat, systemPrompt, pinnedModel, apiKey, baseUrl } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [codePreview, setCodePreview] = useState<{ code: string; language: string } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chat = chats.find(c => c.id === currentChat);

  const client = new OpenAI({
    baseURL: baseUrl,
    apiKey: apiKey || 'dummy-key',
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    if (chats.length === 0 || !currentChat) {
      createNewChat();
    }
  }, [chats.length, currentChat]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: 'gpt-4o',
      createdAt: new Date(),
    };
    addChat(newChat);
  };

  const generateChatTitle = async (messages: Message[]) => {
    if (!messages.length) return;
    
    try {
      const response = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Generate a brief title (6 words or less) that summarizes the main topic or intent of this conversation. Respond with only the title, no additional text.'
          },
          ...messages.slice(0, 2)
        ],
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 50,
        stream: false
      });

      const title = response.choices[0]?.message?.content?.trim();
      if (title && currentChat) {
        updateChat(currentChat, { title });
      }
    } catch (error) {
      console.error('Failed to generate chat title:', error);
    }
  };

  useEffect(() => {
    if (chat?.messages.length === 2 && chat.title === 'New Chat') {
      generateChatTitle(chat.messages);
    }
  }, [chat?.messages.length]);

  const shouldScrollToBottom = () => {
    if (!messagesEndRef.current?.parentElement) return true;
    const container = messagesEndRef.current.parentElement;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const smoothScrollToBottom = () => {
    if (messagesEndRef.current?.parentElement) {
      const container = messagesEndRef.current.parentElement;
      const targetScroll = container.scrollHeight - container.clientHeight;
      const startScroll = container.scrollTop;
      const distance = targetScroll - startScroll;
      const duration = 500;
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        container.scrollTop = startScroll + (distance * easeProgress);
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }
  };

  useEffect(() => {
    if (shouldScrollToBottom()) {
      smoothScrollToBottom();
    }
  }, [chat?.messages]);

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatText = (text: string) => {
    // Handle code blocks first to prevent nested formatting
    let formattedText = text.replace(/```([\w]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="bg-gray-800 p-4 rounded-md my-2 overflow-x-auto"><code class="language-${lang || 'text'} whitespace-pre">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Handle inline code
    formattedText = formattedText.replace(/`([^`]+)`/g, (match, code) => {
      return `<code class="bg-gray-800 px-1 rounded">${escapeHtml(code)}</code>`;
    });

    // Handle headers with proper spacing
    formattedText = formattedText.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      const sizes = {
        1: 'text-4xl',
        2: 'text-3xl',
        3: 'text-2xl',
        4: 'text-xl',
        5: 'text-lg',
        6: 'text-base'
      };
      return `<h${level} class="${sizes[level as keyof typeof sizes]} font-bold my-4">${content.trim()}</h${level}>`;
    });

    // Style formatting
    formattedText = formattedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-400 pl-4 my-2">$1</blockquote>');

    // Convert line breaks
    formattedText = formattedText.replace(/\n/g, '<br>');

    return formattedText;
  };

  const detectCodeBlocks = (content: string) => {
    // Check for complete HTML document first
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      return {
        language: 'html',
        code: content
      };
    }

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const language = lastMatch[1]?.toLowerCase() || 'text';
      const code = lastMatch[2];
      
      return {
        language: language === 'js' ? 'javascript' : language,
        code: code.trim()
      };
    }
    return null;
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const renderPollinationsImage = (url: string) => {
    return (
      <div className="mt-4 relative">
        <div className="aspect-w-16 aspect-h-9 bg-gray-800 rounded-lg overflow-hidden">
          <img
            src={url}
            alt="Generated Image"
            className="w-full h-full object-contain"
            loading="lazy"
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              img.classList.remove('opacity-0');
            }}
            style={{ transition: 'opacity 0.3s ease-in-out' }}
            className="opacity-0"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
            <span className="text-gray-400">Loading image...</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMessageContent = (content: string, messageId: string) => {
    const formattedContent = formatText(content);
    const codeBlock = detectCodeBlocks(content);
    const pollinationsMatch = content.match(/https:\/\/pollinations\.ai\/prompt\/([^\s]+)/);

    return (
      <div className="relative group w-full">
        <div
          dangerouslySetInnerHTML={{ __html: formattedContent }}
          className="prose prose-invert max-w-none break-words"
        />
        {pollinationsMatch && renderPollinationsImage(pollinationsMatch[0])}
        <div className="flex gap-2 mt-2">
          {codeBlock && (
            <button
              onClick={() => setCodePreview(codeBlock)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 hover:bg-gray-600 rounded-md text-white"
              title="Preview code"
            >
              <Eye size={14} />
              Preview
            </button>
          )}
          <button
            onClick={() => handleCopy(content, messageId)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 hover:bg-gray-600 rounded-md text-white"
            title={copiedMessageId === messageId ? 'Copied!' : 'Copy message'}
          >
            {copiedMessageId === messageId ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    );
  };

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSend = async (content: string) => {
    if (!currentChat || !chat) return;

    if (content.startsWith('Generating image:')) {
      addMessage(currentChat, { role: 'assistant', content });
      return;
    }

    const userMessage: Message = { role: 'user', content };
    addMessage(currentChat, userMessage);
    setIsLoading(true);

    try {
      abortControllerRef.current = new AbortController();
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...chat.messages,
        userMessage
      ].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await client.chat.completions.create({
        messages,
        model: chat.model || pinnedModel || 'gpt-4o',
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 2000,
        stream: true
      }, { signal: abortControllerRef.current.signal });

      let assistantMessage = '';
      let isFirstChunk = true;
      
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantMessage += content;
        
        if (isFirstChunk) {
          addMessage(currentChat, {
            role: 'assistant',
            content: assistantMessage
          });
          isFirstChunk = false;
        } else {
          addMessage(currentChat, {
            role: 'assistant',
            content: assistantMessage
          }, true);
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Response stopped by user');
      } else {
        console.error('Error:', error);
        addMessage(currentChat, {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-screen bg-[#343541] relative">
      <div className={`
        fixed lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-10
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:block w-[260px]
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} onNewChat={createNewChat} />
      </div>
      
      <main className="flex-1 flex flex-col relative w-full">
        <div className="fixed top-0 left-0 right-0 bg-[#343541] z-10 border-b border-gray-600">
          <div className="max-w-3xl mx-auto w-full h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 text-white hover:bg-[#40414F] rounded-md"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg md:text-xl font-bold text-white truncate">
                Fronix AI
              </h1>
            </div>
            <ModelSelector
              currentModel={chat?.model || 'gpt-4o'}
              onModelChange={(model) => {
                if (currentChat) {
                  updateChat(currentChat, { model });
                }
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-14 pb-24">
          {!currentChat ? (
            <div className="flex-1 flex items-center justify-center text-white px-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Fronix AI</h1>
                <p className="text-lg text-gray-400">Start a new chat to begin</p>
              </div>
            </div>
          ) : (
            <div>
              {chat?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`border-b border-black/10 ${
                    message.role === 'assistant' ? 'bg-[#444654]' : 'bg-[#343541]'
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex gap-6 p-4 lg:p-6 text-white">
                    <div className="w-8 h-8 flex-shrink-0">
                      {message.role === 'assistant' ? (
                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                          <Bot size={20} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-h-[20px] flex flex-1 flex-col items-start gap-3 overflow-hidden">
                      {renderMessageContent(message.content, `${index}`)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput 
          onSend={handleSend} 
          onStop={stopResponse}
          isLoading={isLoading} 
        />

        {codePreview && (
          <CodePreview
            code={codePreview.code}
            language={codePreview.language}
            onClose={() => setCodePreview(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
