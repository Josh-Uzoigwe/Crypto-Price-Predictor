import React from 'react';
import { Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const History: React.FC = () => {
  const { userBets, pastRounds, claimReward } = useGameStore();

  const finishedBets = userBets
    .filter(bet => pastRounds.some(r => r.id === bet.roundId))
    .sort((a, b) => b.roundId - a.roundId);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center space-x-2 transition-colors">
        <HistoryIcon className="w-5 h-5 text-celo" />
        <span>Your History</span>
      </h3>

      <div className="space-y-3">
        {finishedBets.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-500">
            No finished predictions yet. Join the current round!
          </div>
        ) : (
          finishedBets.map(bet => {
            const round = pastRounds.find(r => r.id === bet.roundId);
            if (!round) return null;
            const won = round.winner === bet.position;
            const canClaim = won && !bet.claimed;

            return (
              <div key={`${bet.roundId}-${bet.position}`} className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${won ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                    {won ? <Trophy className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">Round #{bet.roundId}</div>
                    <div className="text-xs text-zinc-500 flex space-x-2">
                      <span>Prediction: <span className={bet.position === 'UP' ? 'text-up' : 'text-down'}>{bet.position}</span></span>
                      <span>•</span>
                      <span>Bet: {bet.amount} CELO</span>
                    </div>
                  </div>
                </div>

                <div>
                  {won ? (
                    bet.claimed ? (
                      <div className="flex items-center space-x-1 text-celo text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Claimed</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => claimReward(bet.roundId)}
                        className="px-4 py-1.5 bg-celo hover:bg-celoDark text-white text-xs font-bold rounded-full shadow-lg shadow-celo/20 transition-all active:scale-95"
                      >
                        Claim Reward
                      </button>
                    )
                  ) : (
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lost</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const HistoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);