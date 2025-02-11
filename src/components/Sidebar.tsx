import React, { useState } from 'react';
import { PlusCircle, MessageSquare, Trash2, Edit, X, Settings as SettingsIcon } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import Settings from './Settings';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { chats, currentChat, addChat, setCurrentChat, deleteChat, updateChat } = useChatStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: 'gpt-4o',
      createdAt: new Date(),
    };
    addChat(newChat);
    onClose?.();
  };

  return (
    <>
      <div className="w-[260px] h-screen bg-[#202123] text-gray-200 flex flex-col">
        <div className="flex flex-col gap-2 p-3">
          <button
            onClick={createNewChat}
            className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-gray-700 transition-colors border border-gray-600 text-sm"
          >
            <PlusCircle size={16} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 pr-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-3 p-3 mx-2 rounded-md cursor-pointer break-all hover:bg-[#2A2B32] relative pr-[3.5rem] ${
                currentChat === chat.id ? 'bg-[#343541]' : ''
              }`}
              onClick={() => {
                setCurrentChat(chat.id);
                onClose?.();
              }}
            >
              <MessageSquare size={16} />
              <span className="flex-1 text-sm truncate">{chat.title}</span>
              <div className="absolute right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTitle = prompt('Enter new chat name:', chat.title);
                    if (newTitle) {
                      updateChat(chat.id, { title: newTitle });
                    }
                  }}
                  className="p-1 hover:text-white"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this chat?')) {
                      deleteChat(chat.id);
                    }
                  }}
                  className="p-1 hover:text-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto p-3 border-t border-gray-600">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <SettingsIcon size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
