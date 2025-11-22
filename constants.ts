
export const ROUND_DURATION_SEC = 30; // Default
export const INITIAL_CELO_PRICE = 0.65;
export const MOCK_USER_BALANCE = 1000; // cUSD

// Mock contract address for display
export const CONTRACT_ADDRESS = "0x7a4...3b29";

export const ASSETS = [
  // Major / Stable
  { symbol: 'CELO', name: 'Celo Native', coingeckoId: 'celo', category: 'Major' },
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', category: 'Major' },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', category: 'Major' },
  
  // High Volatility / Memes
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', category: 'Volatile' },
  { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', category: 'Volatile' },
  { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe', category: 'Volatile' },
  { symbol: 'WIF', name: 'dogwifhat', coingeckoId: 'dogwifhat', category: 'Volatile' },
  { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu', category: 'Volatile' },
  { symbol: 'BONK', name: 'Bonk', coingeckoId: 'bonk', category: 'Volatile' },
  { symbol: 'FLOKI', name: 'Floki', coingeckoId: 'floki', category: 'Volatile' },
];

export const DURATIONS = [
  { label: '30s', value: 30 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: '1h', value: 3600 },
  { label: '4h', value: 14400 },
  { label: '1d', value: 86400 },
  { label: '1w', value: 604800 },
  { label: '1y', value: 31536000 },
];