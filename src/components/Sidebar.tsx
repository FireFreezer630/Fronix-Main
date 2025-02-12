import React, { useState } from 'react';
import { PlusCircle, MessageSquare, Trash2, Edit, Settings as SettingsIcon } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import Settings from './Settings';

interface SidebarProps {
  onClose?: () => void;
  onNewChat: () => void;
}

export default function Sidebar({ onClose, onNewChat }: SidebarProps) {
  const { chats, currentChat, setCurrentChat, deleteChat, updateChat } = useChatStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNewChat = () => {
    onNewChat();
    onClose?.();
  };

  return (
    <>
      <div className="w-[260px] h-screen bg-[#202123] text-gray-200 flex flex-col">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            style={{
              marginTop: '50px', // Added marginTop to push button down
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: '#3b82f6', // blue-600 in hex
              color: 'white',
              fontWeight: '500',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <PlusCircle size={18} />
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
                  className="p-1.5 hover:text-white rounded-md hover:bg-gray-700"
                  title="Rename chat"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this chat?')) {
                      deleteChat(chat.id);
                    }
                  }}
                  className="p-1.5 hover:text-white rounded-md hover:bg-gray-700"
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-[#202123] p-3 border-t border-gray-600">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-700 transition-colors text-sm"
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
