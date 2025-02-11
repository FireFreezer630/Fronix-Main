import React from 'react';
import { CommandSuggestion } from '../types/commands';

interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[];
  onSelect: (command: string) => void;
  visible: boolean;
}

export default function CommandSuggestions({ suggestions, onSelect, visible }: CommandSuggestionsProps) {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#40414F] rounded-lg shadow-lg border border-gray-600 overflow-hidden">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.command}
          onClick={() => onSelect(suggestion.command)}
          className="w-full px-4 py-2 text-left hover:bg-[#2A2B32] text-white flex justify-between items-center"
        >
          <span className="font-mono">{suggestion.command}</span>
          <span className="text-sm text-gray-400">{suggestion.description}</span>
        </button>
      ))}
    </div>
  );
}
