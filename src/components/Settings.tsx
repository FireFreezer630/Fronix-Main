import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { 
    systemPrompt, 
    searchPrompt,
    updateSystemPrompt, 
    updateSearchPrompt,
    resetSearchPrompt,
    apiKey: defaultApiKey, 
    baseUrl: defaultBaseUrl,
    tavilyApiKey: defaultTavilyApiKey,
    updateApiSettings,
    apiError 
  } = useChatStore();
  
  const [prompt, setPrompt] = useState(systemPrompt);
  const [searchConfig, setSearchConfig] = useState(searchPrompt);
  const [key, setKey] = useState(defaultApiKey);
  const [url, setUrl] = useState(defaultBaseUrl);
  const [tavilyKey, setTavilyKey] = useState(defaultTavilyApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update local state when store values change
  useEffect(() => {
    setKey(defaultApiKey);
    setUrl(defaultBaseUrl);
    setTavilyKey(defaultTavilyApiKey);
  }, [defaultApiKey, defaultBaseUrl, defaultTavilyApiKey]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await updateApiSettings({
        apiKey: key || defaultApiKey,
        baseUrl: url || defaultBaseUrl,
        tavilyApiKey: tavilyKey || defaultTavilyApiKey,
      });
      
      updateSystemPrompt(prompt);
      updateSearchPrompt(searchConfig);
      onClose();
    } catch (error) {
      setSaveError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#202123] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {(apiError || saveError) && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm">
              {apiError || saveError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              OpenAI API Key {defaultApiKey && <span className="text-green-500">(loaded from .env)</span>}
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={defaultApiKey ? '••••••••' : 'Enter your OpenAI API key...'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              API Base URL {defaultBaseUrl && <span className="text-green-500">(loaded from .env)</span>}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={defaultBaseUrl || 'Enter API base URL...'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Tavily API Key {defaultTavilyApiKey && <span className="text-green-500">(loaded from .env)</span>}
            </label>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={defaultTavilyApiKey ? '••••••••' : 'Enter your Tavily API key for web search...'}
            />
            <p className="mt-2 text-sm text-gray-400">
              Required for the /search command to work. Get your API key at <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">tavily.com</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              System Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 px-3 py-2 bg-[#40414F] text-white rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter system prompt..."
            />
            <p className="mt-2 text-sm text-gray-400">
              This prompt will be used as context for all new conversations.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-200">
                Search Results Processing
              </label>
              <button
                onClick={resetSearchPrompt}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Reset to Default
              </button>
            </div>
            <textarea
              value={searchConfig}
              onChange={(e) => setSearchConfig(e.target.value)}
              className="w-full h-48 px-3 py-2 bg-[#40414F] text-white rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Enter search processing prompt..."
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <p className="text-gray-400">
                Customize how search results are processed and presented.
              </p>
              <span className="text-gray-400">
                {searchConfig.length} characters
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-md"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
