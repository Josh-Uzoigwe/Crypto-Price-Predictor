import React, { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { analyzeMarket } from '../services/geminiService';
import { MarketAnalysis } from '../types';

export const AIAnalyst: React.FC = () => {
  const { selectedAsset, priceHistory } = useGameStore();
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeMarket(selectedAsset, priceHistory);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="w-full p-1 rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 border border-white/20 dark:border-white/10 mt-6 transition-colors duration-300">
      <div className="bg-white dark:bg-[#0c0c0e] rounded-xl p-6 relative overflow-hidden transition-colors duration-300">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex justify-end mb-4 relative z-10">
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-300 flex items-center space-x-1 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Refresh Analysis'}</span>
          </button>
        </div>

        {analysis ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center space-x-4 mb-3">
              <div className={`px-3 py-1 rounded-full border text-sm font-bold flex items-center space-x-2
                ${analysis.sentiment === 'BULLISH' ? 'bg-up/10 border-up/30 text-up' : 
                  analysis.sentiment === 'BEARISH' ? 'bg-down/10 border-down/30 text-down' : 
                  'bg-zinc-100 dark:bg-zinc-500/10 border-zinc-300 dark:border-zinc-500/30 text-zinc-500 dark:text-zinc-400'}`}>
                {analysis.sentiment === 'BULLISH' && <TrendingUp className="w-4 h-4" />}
                {analysis.sentiment === 'BEARISH' && <TrendingDown className="w-4 h-4" />}
                {analysis.sentiment === 'NEUTRAL' && <Minus className="w-4 h-4" />}
                <span>{analysis.sentiment}</span>
              </div>
              <div className="text-xs text-zinc-500">
                Confidence: <span className="text-zinc-900 dark:text-white font-mono">{analysis.confidence}%</span>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-l-2 border-purple-500/30 pl-3">
              {analysis.reasoning}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-600 text-sm border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            Click refresh to ask Gemini AI for a real-time prediction strategy.
          </div>
        )}
      </div>
    </div>
  );
};