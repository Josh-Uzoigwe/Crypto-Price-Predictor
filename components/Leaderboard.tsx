import React, { useMemo } from 'react';
import { Trophy, Medal, TrendingUp, Award, Ghost } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Position } from '../types';

export const Leaderboard: React.FC = () => {
  const { userBets, pastRounds, userBalance } = useGameStore();

  const userStats = useMemo(() => {
    const finishedBets = userBets.filter(bet => pastRounds.some(r => r.id === bet.roundId));
    
    if (finishedBets.length === 0) return null;

    let wins = 0;
    let totalProfit = 0;
    let totalVolume = 0;

    finishedBets.forEach(bet => {
        totalVolume += bet.amount;
        const round = pastRounds.find(r => r.id === bet.roundId);
        if (!round) return;

        const isWin = round.winner === bet.position;
        if (isWin) {
            wins++;
            const totalPool = round.totalPool;
            const winnerPool = round.winner === Position.UP ? round.upPool : round.downPool;
            const safeWinnerPool = winnerPool === 0 ? 1 : winnerPool;
            const share = bet.amount / safeWinnerPool;
            const payout = totalPool * share;
            totalProfit += (payout - bet.amount);
        } else {
            totalProfit -= bet.amount;
        }
    });

    const winRate = finishedBets.length > 0 ? Math.round((wins / finishedBets.length) * 100) : 0;

    return {
        address: '0x12...8B4', 
        rank: 1,
        wins,
        totalBets: finishedBets.length,
        winRate,
        profit: totalProfit,
        volume: totalVolume
    };
  }, [userBets, pastRounds]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center justify-center space-x-3 transition-colors">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <span>Live Leaderboard</span>
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">Real-time ranking of active protocol participants.</p>
      </div>

      <div className="bg-surface border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[300px] transition-colors duration-300">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-4">User</div>
          <div className="col-span-3 text-right">Win Rate</div>
          <div className="col-span-3 text-right">Net Profit (CELO)</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {!userStats ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600">
                <Ghost className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No Active Players</p>
                <p className="text-sm opacity-60">Be the first to predict the market!</p>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group bg-celo/5">
              <div className="col-span-2 flex justify-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    <Trophy className="w-4 h-4" />
                </div>
              </div>
              
              <div className="col-span-4 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-celo to-blue-500 p-[1px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">YOU</span>
                  </div>
                </div>
                <span className="font-mono text-sm text-zinc-900 dark:text-white font-bold">{userStats.address}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-celo/20 text-celo border border-celo/20">YOU</span>
              </div>

              <div className="col-span-3 text-right">
                <div className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold">
                  <span className={userStats.winRate >= 50 ? 'text-celo' : 'text-red-500'}>{userStats.winRate}%</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">{userStats.wins}/{userStats.totalBets} Won</div>
              </div>

              <div className="col-span-3 text-right">
                <div className={`flex items-center justify-end space-x-1 font-mono font-bold ${userStats.profit >= 0 ? 'text-celo' : 'text-red-500'}`}>
                  <TrendingUp className={`w-3 h-3 ${userStats.profit < 0 ? 'rotate-180' : ''}`} />
                  <span>{userStats.profit >= 0 ? '+' : ''}{userStats.profit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {userStats && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-surface border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-center shadow-lg">
                <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Your Total Volume</div>
                <div className="text-2xl font-mono font-bold text-zinc-900 dark:text-white">{userStats.volume.toFixed(2)} CELO</div>
            </div>
            <div className="bg-surface border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-center shadow-lg">
                <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Global Rounds</div>
                <div className="text-2xl font-mono font-bold text-zinc-900 dark:text-white">{userStats.totalBets}</div>
            </div>
             <div className="bg-surface border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-center shadow-lg">
                <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Protocol Rank</div>
                <div className="text-2xl font-mono font-bold text-yellow-500">#1</div>
            </div>
        </div>
      )}
    </div>
  );
};