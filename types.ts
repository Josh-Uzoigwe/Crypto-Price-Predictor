
export enum Position {
  UP = 'UP',
  DOWN = 'DOWN',
  NONE = 'NONE'
}

export enum RoundStatus {
  LIVE = 'LIVE',
  LOCKED = 'LOCKED',
  CALCULATING = 'CALCULATING',
  ENDED = 'ENDED'
}

export type ViewType = 'MARKET' | 'LEADERBOARD' | 'GOVERNANCE';
export type ChartType = 'AREA' | 'BAR';
export type Theme = 'light' | 'dark';

export interface Round {
  id: number;
  startTime: number;
  lockTime: number;
  closeTime: number;
  startPrice: number;
  lockPrice: number;
  closePrice: number;
  totalPool: number;
  upPool: number;
  downPool: number;
  status: RoundStatus;
  winner: Position;
}

export interface UserBet {
  roundId: number;
  amount: number;
  position: Position;
  claimed: boolean;
}

export interface PricePoint {
  time: number; // Changed to number for accurate timestamps
  value: number;
}

export interface MarketAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}