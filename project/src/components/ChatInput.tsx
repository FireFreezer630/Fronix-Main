import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle } from 'lucide-react';
import { getCommandSuggestions, executeCommand } from '../utils/commands';
import CommandSuggestions from './CommandSuggestions';
import { CommandSuggestion } from '../types/commands';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Reduced max height
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    if (input.startsWith('/')) {
      setSuggestions(getCommandSuggestions(input));
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      if (input.startsWith('/')) {
        const commandResult = await executeCommand(input.trim()); // Capture the result
        if (commandResult) {
          onSend(commandResult); // Send the command result to onSend
        } else {
          // Handle cases where command execution might not return a message
          console.warn('Command execution did not return a message.');
        }
      } else {
        onSend(input.trim());
      }
      setInput('');
      setSuggestions([]);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      setInput(suggestions[0].command + ' ');
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (command: string) => {
    setInput(command + ' ');
    setSuggestions([]);
    textareaRef.current?.focus();
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#343541] py-2 border-t border-gray-600">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4">
        <div className="relative">
          <CommandSuggestions
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            visible={suggestions.length > 0}
          />
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={isLoading}
            className="w-full pr-24 pl-4 py-2 bg-[#40414F] rounded-lg resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
            style={{
              maxHeight: '120px',
              minHeight: '40px'
            }}
          />
          <div className="absolute right-2 bottom-1.5 flex gap-2">
            {isLoading && (
              <button
                type="button"
                onClick={onStop}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <StopCircle size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-1.5 text-gray-400 hover:text-white disabled:hover:text-gray-400 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
