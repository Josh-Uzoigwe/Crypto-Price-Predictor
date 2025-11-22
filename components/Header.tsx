import React from 'react';
import { Wallet, Zap, MessageSquare, Sun, Moon } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ViewType } from '../types';

export const Header: React.FC = () => {
  const { isConnected, connectWallet, userBalance, activeView, setView, theme, toggleTheme, isChatOpen, toggleChat } = useGameStore();

  const NavLink = ({ view, label }: { view: ViewType; label: string }) => (
    <button 
      onClick={() => setView(view)}
      className={`transition-all duration-200 flex items-center space-x-1 text-sm font-medium
        ${activeView === view 
          ? 'text-celo drop-shadow-[0_0_8px_rgba(53,208,127,0.5)]' 
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
    >
      <span>{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10 bg-surface/80 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => setView('MARKET')}
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-celo flex items-center justify-center shadow-[0_0_15px_#35D07F]">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-celo to-zinc-900 dark:to-white">
            CeloPulse
          </span>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLink view="MARKET" label="Markets" />
          <NavLink view="LEADERBOARD" label="Leaderboard" />
          <NavLink view="GOVERNANCE" label="Governance" />
        </nav>

        {/* Wallet & Actions Section */}
        <div className="flex items-center space-x-3">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Chat Toggle */}
          <button 
            onClick={toggleChat}
            className={`p-2 rounded-full transition-colors relative ${isChatOpen ? 'bg-celo/20 text-celo' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
          >
            <MessageSquare className="w-5 h-5" />
            {!isChatOpen && <div className="absolute top-1 right-1 w-2 h-2 bg-celo rounded-full animate-pulse"></div>}
          </button>

          {isConnected ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-zinc-200 dark:border-zinc-700">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs text-zinc-500">Balance</span>
                <span className="text-sm font-bold font-mono text-celo">{userBalance.toFixed(2)} CELO</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-celo animate-pulse"></div>
                <span>0x12...8B4</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="ml-2 group relative px-6 py-2 rounded-full bg-celo text-white font-bold text-sm overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-celo/20"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};