import React, { useState } from 'react';
import { Vote, ScrollText, ShieldCheck } from 'lucide-react';

export const Governance: React.FC = () => {
  const activeProposals: any[] = [];
  const [priority, setPriority] = useState<'STANDARD' | 'HIGH' | 'CRITICAL'>('STANDARD');

  const costs = {
    STANDARD: 0.5,
    HIGH: 2.0,
    CRITICAL: 5.0
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center justify-center space-x-3 transition-colors">
          <Vote className="w-8 h-8 text-celo" />
          <span>DAO Governance</span>
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">Vote on protocol parameters and future assets with your $CELO tokens.</p>
      </div>

      <div className="bg-surface border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center relative overflow-hidden transition-colors duration-300">
         {/* Background decoration */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-celo/5 rounded-full blur-3xl pointer-events-none"></div>

         {activeProposals.length === 0 ? (
             <div className="relative z-10 flex flex-col items-center">
                 <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 mb-6 shadow-xl">
                    <ScrollText className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                 </div>
                 <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Active Proposals</h3>
                 <p className="text-zinc-500 max-w-md mx-auto mb-8">
                     There are currently no active governance proposals open for voting. 
                     Proposals will appear here once submitted by the community or the core team.
                 </p>
                 
                 {/* Proposal Creation Widget */}
                 <div className="mt-4 p-6 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full mx-auto text-left backdrop-blur-sm shadow-2xl transition-colors">
                    <h4 className="text-zinc-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-celo" />
                        Create Governance Proposal
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Priority Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setPriority('STANDARD')}
                                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${priority === 'STANDARD' ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-500' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => setPriority('HIGH')}
                                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${priority === 'HIGH' ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-500' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                                >
                                    High
                                </button>
                                <button
                                    onClick={() => setPriority('CRITICAL')}
                                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${priority === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-500' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                                >
                                    Critical
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm bg-zinc-100 dark:bg-black/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400">Required Deposit:</span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-white">{costs[priority].toFixed(1)} CELO</span>
                        </div>

                        <button
                            disabled
                            className="w-full py-3 rounded-lg bg-celo text-white dark:text-black font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-celo/20"
                        >
                            Create Proposal
                        </button>
                        <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-600">
                            Governance features are currently in simulation mode.
                        </p>
                    </div>
                 </div>
             </div>
         ) : (
             <div className="space-y-6">
                 {/* Map proposals here when they exist */}
             </div>
         )}
      </div>
    </div>
  );
};