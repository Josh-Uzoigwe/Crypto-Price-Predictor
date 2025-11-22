import { create } from 'zustand';
import { Position, Round, RoundStatus, UserBet, PricePoint, ViewType, ChartType, Theme, ChatMessage } from '../types';
import { ROUND_DURATION_SEC, INITIAL_CELO_PRICE, MOCK_USER_BALANCE } from '../constants';

interface GameState {
  activeView: ViewType;
  theme: Theme;
  isChatOpen: boolean;
  currentPrice: number;
  priceHistory: PricePoint[];
  currentRound: Round;
  pastRounds: Round[];
  userBalance: number;
  userBets: UserBet[];
  isConnected: boolean;
  selectedAsset: string;
  selectedDuration: number;
  chartType: ChartType;
  messages: ChatMessage[];
  
  // Actions
  setView: (view: ViewType) => void;
  toggleTheme: () => void;
  toggleChat: () => void;
  connectWallet: () => void;
  placeBet: (position: Position, amount: number) => void;
  updatePrice: (newPrice: number) => void;
  advanceRound: () => void;
  claimReward: (roundId: number) => void;
  setAsset: (asset: string) => void;
  setDuration: (duration: number) => void;
  setChartType: (type: ChartType) => void;
  addMessage: (text: string, sender?: string, isSystem?: boolean) => void;
}

// Helper to generate initial random walk data
const generateInitialHistory = (startPrice: number, count: number = 40): PricePoint[] => {
    const history: PricePoint[] = [];
    const now = Date.now();
    let val = startPrice;
    
    for (let i = 0; i < count; i++) {
        history.unshift({
            time: now - i * 2000,
            value: val
        });
        const volatility = val * 0.002; 
        const change = (Math.random() * volatility * 2) - volatility;
        val = val - change; 
    }
    return history;
};

export const useGameStore = create<GameState>((set, get) => ({
  activeView: 'MARKET',
  theme: 'dark',
  isChatOpen: false,
  currentPrice: INITIAL_CELO_PRICE,
  priceHistory: generateInitialHistory(INITIAL_CELO_PRICE),
  selectedDuration: ROUND_DURATION_SEC,
  chartType: 'AREA',
  currentRound: {
    id: 1,
    startTime: Date.now(),
    lockTime: Date.now() + (ROUND_DURATION_SEC * 1000),
    closeTime: Date.now() + (ROUND_DURATION_SEC * 1000),
    startPrice: INITIAL_CELO_PRICE,
    lockPrice: 0,
    closePrice: 0,
    totalPool: 150,
    upPool: 80,
    downPool: 70,
    status: RoundStatus.LIVE,
    winner: Position.NONE,
  },
  pastRounds: [],
  userBalance: MOCK_USER_BALANCE,
  userBets: [],
  isConnected: false,
  selectedAsset: 'CELO',
  messages: [
      { id: '1', sender: 'System', text: 'Welcome to the CeloPulse Trollbox!', timestamp: Date.now(), isSystem: true },
      { id: '2', sender: '0x8A...221', text: 'CELO looking bullish today 🚀', timestamp: Date.now() - 50000 },
      { id: '3', sender: 'CryptoDave', text: 'Anyone shorting ETH?', timestamp: Date.now() - 20000 },
  ],

  setView: (view) => set({ activeView: view }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChartType: (type) => set({ chartType: type }),
  setDuration: (duration) => set({ selectedDuration: duration }),

  setAsset: (asset) => set({ selectedAsset: asset, priceHistory: [] }),

  connectWallet: () => set({ isConnected: true }),

  addMessage: (text, sender = 'You', isSystem = false) => set((state) => ({
      messages: [...state.messages, {
          id: Math.random().toString(36).substr(2, 9),
          sender,
          text,
          timestamp: Date.now(),
          isSystem
      }]
  })),

  placeBet: (position, amount) => {
    const { userBalance, currentRound, userBets } = get();
    if (isNaN(amount) || amount <= 0) return;
    if (userBalance < amount) return;
    if (currentRound.status !== RoundStatus.LIVE) return;

    const newBet: UserBet = {
      roundId: currentRound.id,
      amount,
      position,
      claimed: false,
    };

    // Auto-send message to chat
    get().addMessage(`bet ${amount} CELO on ${position} 🎲`, '0x12...8B4', true);

    set({
      userBalance: userBalance - amount,
      userBets: [...userBets, newBet],
      currentRound: {
        ...currentRound,
        totalPool: currentRound.totalPool + amount,
        upPool: position === Position.UP ? currentRound.upPool + amount : currentRound.upPool,
        downPool: position === Position.DOWN ? currentRound.downPool + amount : currentRound.downPool,
      }
    });
  },

  updatePrice: (newPrice) => {
    const { priceHistory } = get();
    
    let newHistory = [...priceHistory];

    if (newHistory.length === 0) {
        const now = Date.now();
        newHistory = [];
        let val = newPrice;
        const pointsToBackfill = 40;

        for (let i = 0; i < pointsToBackfill; i++) {
            newHistory.unshift({
                time: now - i * 2000,
                value: val
            });
            
            const volatility = val * 0.003; 
            const change = (Math.random() * volatility * 2) - volatility;
            val = val - change; 
        }
    } else {
        newHistory.push({
            time: Date.now(),
            value: newPrice
        });
        if (newHistory.length > 60) newHistory.shift();
    }

    set({ 
        currentPrice: newPrice, 
        priceHistory: newHistory 
    });
  },

  advanceRound: () => {
    const { currentRound, currentPrice, pastRounds, selectedDuration } = get();
    
    let winner = Position.NONE;
    if (currentPrice > currentRound.startPrice) winner = Position.UP;
    if (currentPrice < currentRound.startPrice) winner = Position.DOWN;

    const settledRound = {
      ...currentRound,
      closePrice: currentPrice,
      winner,
      status: RoundStatus.ENDED
    };

    const nextRound: Round = {
      id: currentRound.id + 1,
      startTime: Date.now(),
      lockTime: Date.now() + (selectedDuration * 1000),
      closeTime: Date.now() + (selectedDuration * 1000),
      startPrice: currentPrice,
      lockPrice: 0,
      closePrice: 0,
      totalPool: 0,
      upPool: 0,
      downPool: 0,
      status: RoundStatus.LIVE,
      winner: Position.NONE,
    };

    set({
      pastRounds: [settledRound, ...pastRounds],
      currentRound: nextRound
    });
  },

  claimReward: (roundId) => {
    const { userBets, pastRounds, userBalance } = get();
    const betIndex = userBets.findIndex(b => b.roundId === roundId);
    if (betIndex === -1) return;

    const bet = userBets[betIndex];
    if (bet.claimed) return;

    const round = pastRounds.find(r => r.id === roundId);
    if (!round) return;

    if (round.winner === bet.position) {
      const totalPool = round.totalPool;
      const winnerPool = round.winner === Position.UP ? round.upPool : round.downPool;
      const safeWinnerPool = winnerPool === 0 ? 1 : winnerPool;
      const share = bet.amount / safeWinnerPool;
      const reward = totalPool * share; 

      const updatedBets = [...userBets];
      updatedBets[betIndex] = { ...bet, claimed: true };

      set({
        userBalance: userBalance + reward,
        userBets: updatedBets
      });
    }
  }
}));