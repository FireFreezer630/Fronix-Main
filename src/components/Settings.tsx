import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { systemPrompt, updateSystemPrompt } = useChatStore();
  const [prompt, setPrompt] = useState(systemPrompt);

  const handleSave = () => {
    updateSystemPrompt(prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#202123] rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
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
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
