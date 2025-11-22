import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Timer, Wallet, AlertCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Position } from '../types';
import { DURATIONS } from '../constants';

export const RoundCard: React.FC = () => {
  const { currentRound, placeBet, isConnected, connectWallet, currentPrice, userBalance, selectedDuration, setDuration } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((currentRound.closeTime - now) / 1000));
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentRound]);

  useEffect(() => {
    const val = parseFloat(betAmount);
    if (isConnected && !isNaN(val) && val > userBalance) {
      setError("Insufficient balance");
    } else {
      setError(null);
    }
  }, [betAmount, userBalance, isConnected]);

  const handleBet = (pos: Position) => {
    if (!isConnected) {
        connectWallet();
        return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > userBalance) {
        return;
    }

    placeBet(pos, amount);
  };

  const setMaxBet = () => {
      if (isConnected) {
          setBetAmount(userBalance.toString());
      }
  };

  const formatTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
      return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  };

  const total = currentRound.upPool + currentRound.downPool;
  const upPct = total === 0 ? 50 : (currentRound.upPool / total) * 100;
  const downPct = total === 0 ? 50 : (currentRound.downPool / total) * 100;

  const payoutUp = total === 0 ? 2 : (total / (currentRound.upPool || 1)).toFixed(2);
  const payoutDown = total === 0 ? 2 : (total / (currentRound.downPool || 1)).toFixed(2);
  
  const isBetDisabled = !isConnected || !!error || parseFloat(betAmount) <= 0 || isNaN(parseFloat(betAmount));
  const isLocked = timeLeft <= 5;

  return (
    <div className="bg-surface border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
      {/* Duration Selector */}
      <div className="mb-6">
        <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wider">Round Duration</label>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
            {DURATIONS.map((dur) => (
                <button
                    key={dur.label}
                    onClick={() => setDuration(dur.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                        selectedDuration === dur.value 
                        ? 'bg-celo/10 border-celo text-celo dark:text-white shadow-[0_0_10px_rgba(53,208,127,0.2)]' 
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                >
                    {dur.label}
                </button>
            ))}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-between items-center mb-6 border-t border-zinc-200 dark:border-white/5 pt-4">
        {isLocked ? (
           <div className="flex items-center space-x-2">
               <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
               <span className="text-orange-500 font-bold text-sm tracking-wider">LOCKED</span>
           </div>
        ) : (
            <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-celo opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-celo"></span>
                </span>
                <span className="text-celo font-bold text-sm tracking-wider">LIVE ROUND #{currentRound.id}</span>
            </div>
        )}

        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${isLocked ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/50'}`}>
            <Timer className="w-4 h-4" />
            <span className={`font-mono font-bold ${isLocked ? 'text-orange-500' : 'text-zinc-900 dark:text-white'}`}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6 flex overflow-hidden">
        <div className="bg-up h-full transition-all duration-500" style={{ width: `${upPct}%` }}></div>
        <div className="bg-down h-full transition-all duration-500" style={{ width: `${downPct}%` }}></div>
      </div>

      {/* Bet Amount Input */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span className="font-medium">Enter Amount</span>
            <div className="flex items-center space-x-1 text-zinc-400">
                <Wallet className="w-3 h-3" />
                <span>Balance: <span className={`font-mono ${error ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>{isConnected ? userBalance.toFixed(2) : '0.00'}</span></span>
                <span className="text-[10px] font-bold">CELO</span>
            </div>
        </div>
        <div className="relative group">
            <div className={`absolute inset-0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 ${error ? 'bg-red-500/20' : 'bg-gradient-to-r from-celo/20 to-purple-500/20'}`}></div>
            <div className={`relative bg-zinc-100 dark:bg-zinc-900 border rounded-xl flex items-center overflow-hidden transition-colors ${error ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-700 focus-within:border-zinc-400 dark:focus-within:border-zinc-500'}`}>
                <input 
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isLocked}
                    className="w-full bg-transparent text-zinc-900 dark:text-white font-mono font-bold text-lg p-3 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                    min="0.1"
                    step="0.1"
                />
                <div className="flex items-center pr-3 space-x-2">
                    <button 
                        onClick={setMaxBet}
                        disabled={isLocked}
                        className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-celo px-2 py-1 rounded transition-colors uppercase tracking-wider disabled:opacity-50"
                    >
                        Max
                    </button>
                    <span className="text-sm font-bold text-zinc-500">CELO</span>
                </div>
            </div>
            {error && (
                <div className="absolute -bottom-5 left-0 text-xs text-red-500 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
      </div>

      {/* Betting Buttons */}
      <div className="space-y-4">
        {/* UP Button */}
        <button 
            onClick={() => handleBet(Position.UP)}
            disabled={isBetDisabled && isConnected || isLocked}
            className={`w-full group relative overflow-hidden rounded-xl border transition-all duration-300 active:scale-[0.98]
                ${(isBetDisabled && isConnected) || isLocked
                    ? 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-up/50 hover:bg-up/5'}`}
        >
            <div className="p-4 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-transform ${isLocked ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400' : 'bg-up/10 text-up group-hover:scale-110'}`}>
                        <ArrowUp className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <div className={`font-bold text-lg ${isLocked ? 'text-zinc-400' : 'text-up'}`}>
                            {isLocked ? 'ROUND LOCKED' : 'ENTER UP'}
                        </div>
                        <div className="text-xs text-zinc-500">Payout {payoutUp}x</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-zinc-900 dark:text-white font-mono font-bold">{currentRound.upPool.toFixed(2)} CELO</div>
                </div>
            </div>
        </button>

        {/* Current Price Indicator */}
        <div className="flex justify-center items-center space-x-2 py-1">
            <span className="text-zinc-500 text-xs">Current Price</span>
            <span className="text-zinc-900 dark:text-white font-bold font-mono">${currentPrice.toFixed(4)}</span>
        </div>

        {/* DOWN Button */}
        <button 
            onClick={() => handleBet(Position.DOWN)}
            disabled={isBetDisabled && isConnected || isLocked}
             className={`w-full group relative overflow-hidden rounded-xl border transition-all duration-300 active:scale-[0.98]
                ${(isBetDisabled && isConnected) || isLocked
                    ? 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-down/50 hover:bg-down/5'}`}
        >
            <div className="p-4 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-transform ${isLocked ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400' : 'bg-down/10 text-down group-hover:scale-110'}`}>
                        <ArrowDown className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                         <div className={`font-bold text-lg ${isLocked ? 'text-zinc-400' : 'text-down'}`}>
                             {isLocked ? 'ROUND LOCKED' : 'ENTER DOWN'}
                         </div>
                        <div className="text-xs text-zinc-500">Payout {payoutDown}x</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-zinc-900 dark:text-white font-mono font-bold">{currentRound.downPool.toFixed(2)} CELO</div>
                </div>
            </div>
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-zinc-500">
        Fee: 1% (Treasury)
      </div>
    </div>
  );
};