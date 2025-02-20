import React from 'react';
import { ChevronDown, Pin } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

const models = [
  'gpt-4o',
  'gpt-4o-mini',
  'DeepSeek-R1',
  'Phi-4',
  'Llama-3.3-70B-Instruct',
  'Codestral-2501'
];

export default function ModelSelector({ 
  currentModel, 
  onModelChange 
}: { 
  currentModel: string;
  onModelChange: (model: string) => void;
}) {
  const { pinnedModel, setPinnedModel } = useChatStore();

  const handlePinModel = (model: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedModel(pinnedModel === model ? null : model);
  };

  const truncateModelName = (name: string) => {
    if (window.innerWidth < 768) {
      return name.length > 10 ? `${name.substring(0, 10)}...` : name;
    }
    return name;
  };

  return (
    <div className="relative flex items-center gap-2">
      <select
        value={currentModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="appearance-none bg-[#40414F] text-white px-3 md:px-4 py-1.5 md:py-2 pr-8 rounded-md cursor-pointer border border-gray-600 hover:bg-[#2A2B32] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {truncateModelName(model)} {pinnedModel === model ? '(Pinned)' : ''}
          </option>
        ))}
      </select>
      <button
        onClick={(e) => handlePinModel(currentModel, e)}
        className={`p-1.5 md:p-2 rounded-md hover:bg-[#2A2B32] transition-colors ${
          pinnedModel === currentModel ? 'text-blue-500' : 'text-gray-400'
        }`}
        title={pinnedModel === currentModel ? 'Unpin model' : 'Pin as default model'}
      >
        <Pin size={14} className="md:w-4 md:h-4" />
      </button>
      <ChevronDown className="absolute right-[3.5rem] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
    </div>
  );
}
