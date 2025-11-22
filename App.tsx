
import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Chart } from './components/Chart';
import { RoundCard } from './components/RoundCard';
import { History } from './components/History';
import { AIAnalyst } from './components/AIAnalyst';
import { Leaderboard } from './components/Leaderboard';
import { Governance } from './components/Governance';
import { Chat } from './components/Chat';
import { useGameStore } from './store/gameStore';
import { fetchLivePrice } from './services/priceService';
import { ASSETS } from './constants';
import { ChevronDown, Check, Flame, Activity } from 'lucide-react';

const App: React.FC = () => {
  const { 
    updatePrice, 
    advanceRound, 
    currentRound, 
    activeView, 
    selectedAsset, 
    setAsset,
    theme,
    isChatOpen
  } = useGameStore();

  const [isAssetMenuOpen, setAssetMenuOpen] = useState(false);
  const useSimulationRef = useRef(false);

  // Apply Theme Class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Price Polling Logic
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = async () => {
      const { currentPrice } = useGameStore.getState();
      
      if (!useSimulationRef.current) {
          const price = await fetchLivePrice(selectedAsset);
          
          if (price && isMounted) {
              updatePrice(price);
              useSimulationRef.current = false; 
          } else if (isMounted) {
              useSimulationRef.current = true;
              console.log("Switched to simulation mode due to API limit");
          }
      } 
      
      if (useSimulationRef.current && isMounted) {
          const volatility = currentPrice * 0.0005; 
          const change = (Math.random() * volatility * 2) - volatility;
          const newPrice = Math.max(0.01, currentPrice + change);
          updatePrice(newPrice);
      }

      if (isMounted) {
          const delay = useSimulationRef.current ? 1000 : 10000; 
          timeoutId = setTimeout(loop, delay);
      }
    };

    loop();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [selectedAsset, updatePrice]); 

  // Round Management Loop
  useEffect(() => {
    const roundInterval = setInterval(() => {
      const now = Date.now();
      if (now >= currentRound.closeTime) {
        advanceRound();
      }
    }, 1000);

    return () => clearInterval(roundInterval);
  }, [currentRound, advanceRound]);

  const currentAssetObj = ASSETS.find(a => a.symbol === selectedAsset);

  return (
    <div className="min-h-screen bg-background text-zinc-900 dark:text-gray-100 selection:bg-celo selection:text-black font-sans transition-colors duration-300">
      <Header />
      
      <div className="relative flex">
        <main className={`flex-1 container mx-auto px-4 py-8 transition-all duration-300 ${isChatOpen ? 'mr-80' : ''}`}>
          
          {/* MARKET VIEW (DEFAULT) */}
          {activeView === 'MARKET' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
              {/* Left Column: Chart & Analysis (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Chart Card */}
                <div className="bg-surface border border-zinc-200 dark:border-white/5 rounded-3xl p-1 shadow-xl dark:shadow-2xl overflow-visible relative z-10 transition-colors duration-300">
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm rounded-[20px] p-6 h-full relative transition-colors duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                <span className="w-2 h-6 bg-celo rounded-full"></span>
                                Price Feed
                            </h2>
                            
                            {/* Asset Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setAssetMenuOpen(!isAssetMenuOpen)}
                                className="flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all group"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentAssetObj?.category === 'Volatile' ? 'bg-orange-500/20 text-orange-500' : 'bg-celo/20 text-celo'}`}>
                                    {currentAssetObj?.symbol[0]}
                                  </div>
                                  <span className="font-bold text-zinc-900 dark:text-white">{currentAssetObj?.name}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isAssetMenuOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isAssetMenuOpen && (
                                 <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50 overflow-hidden ring-1 ring-black/5 dark:ring-black/50">
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                      <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/50">
                                        <Activity className="w-3 h-3" />
                                        <span>Major Markets</span>
                                      </div>
                                      {ASSETS.filter(a => a.category === 'Major').map(asset => (
                                        <button
                                          key={asset.symbol}
                                          onClick={() => {
                                            setAsset(asset.symbol);
                                            setAssetMenuOpen(false);
                                          }}
                                          className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between group transition-colors border-l-2 border-transparent hover:border-celo"
                                        >
                                            <div className="flex items-center space-x-3">
                                                 <span className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                                    {asset.symbol.substring(0, 1)}
                                                 </span>
                                                 <div>
                                                    <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white">{asset.name}</div>
                                                    <div className="text-xs text-zinc-500 font-mono">{asset.symbol}/USD</div>
                                                 </div>
                                            </div>
                                            {selectedAsset === asset.symbol && <Check className="w-4 h-4 text-celo" />}
                                        </button>
                                      ))}

                                      <div className="my-1 border-t border-zinc-200 dark:border-zinc-800"></div>

                                      <div className="px-4 py-2 text-[10px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1 bg-orange-500/10">
                                        <Flame className="w-3 h-3" />
                                        <span>High Volatility</span>
                                      </div>
                                      {ASSETS.filter(a => a.category === 'Volatile').map(asset => (
                                        <button
                                          key={asset.symbol}
                                          onClick={() => {
                                            setAsset(asset.symbol);
                                            setAssetMenuOpen(false);
                                          }}
                                          className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between group transition-colors border-l-2 border-transparent hover:border-orange-500"
                                        >
                                            <div className="flex items-center space-x-3">
                                                 <span className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-orange-500/80 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                    {asset.symbol.substring(0, 1)}
                                                 </span>
                                                 <div>
                                                    <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white">{asset.name}</div>
                                                    <div className="text-xs text-zinc-500 font-mono">{asset.symbol}/USD</div>
                                                 </div>
                                            </div>
                                            {selectedAsset === asset.symbol && <Check className="w-4 h-4 text-orange-500" />}
                                        </button>
                                      ))}
                                    </div>
                                 </div>
                              )}
                            </div>
                        </div>
                        <Chart />
                    </div>
                </div>

                {/* AI Analysis Section */}
                <AIAnalyst />
              </div>

              {/* Right Column: Game Interaction (4 cols) */}
              <div className="lg:col-span-4">
                 <div className="sticky top-24 space-y-6">
                    <RoundCard />
                    <History />
                 </div>
              </div>
            </div>
          )}

          {/* LEADERBOARD VIEW */}
          {activeView === 'LEADERBOARD' && <Leaderboard />}

          {/* GOVERNANCE VIEW */}
          {activeView === 'GOVERNANCE' && <Governance />}

        </main>

        {/* Sidebar Chat Overlay */}
        {isChatOpen && <Chat />}
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/5 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-zinc-500 dark:text-zinc-600 text-sm">
            <p>© 2024 CeloPulse. Built for the Celo Hackathon.</p>
            <div className="mt-2 flex justify-center space-x-4">
                <a href="#" className="hover:text-celo">Smart Contract</a>
                <a href="#" className="hover:text-celo">Terms</a>
                <a href="#" className="hover:text-celo">Privacy</a>
            </div>
        </div>
      </footer>
      
      {/* Close dropdown on click outside */}
      {isAssetMenuOpen && (
        <div 
          className="fixed inset-0 z-0 bg-transparent" 
          onClick={() => setAssetMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default App;