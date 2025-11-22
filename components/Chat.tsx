import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const Chat: React.FC = () => {
  const { messages, addMessage, isConnected, toggleChat } = useGameStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!isConnected) {
        alert("Connect wallet to chat!");
        return;
    }
    addMessage(input);
    setInput('');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface border-l border-zinc-200 dark:border-zinc-800 shadow-2xl transform transition-transform duration-300 z-40 flex flex-col animate-in slide-in-from-right">
      
      {/* Header */}
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-background/50 backdrop-blur-md">
        <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-celo" />
            <span className="font-bold text-zinc-900 dark:text-white">Trollbox</span>
            <span className="text-xs text-zinc-500 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-celo mr-1 animate-pulse"></div>
                {Math.floor(Math.random() * 100) + 50} Online
            </span>
        </div>
        <button onClick={toggleChat} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                {!msg.isSystem && (
                    <span className="text-[10px] font-bold text-zinc-500 mb-1 px-1">
                        {msg.sender}
                    </span>
                )}
                <div className={`max-w-[90%] px-3 py-2 rounded-lg text-sm break-words
                    ${msg.isSystem 
                        ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 italic w-full text-center border border-zinc-200 dark:border-zinc-800 text-xs' 
                        : msg.sender === 'You'
                            ? 'bg-celo text-black font-medium rounded-br-none'
                            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-none shadow-sm'
                    }`}
                >
                    {msg.text}
                </div>
            </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-surface">
        <form onSubmit={handleSend} className="relative">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isConnected ? "Say something..." : "Connect wallet to chat"}
                disabled={!isConnected}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-full py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-celo/50 disabled:opacity-50 transition-colors placeholder:text-zinc-500"
            />
            <button 
                type="submit"
                disabled={!isConnected || !input.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-celo text-white rounded-full hover:bg-celoDark disabled:opacity-0 transition-all active:scale-90"
            >
                <Send className="w-3 h-3" />
            </button>
        </form>
      </div>
    </div>
  );
};