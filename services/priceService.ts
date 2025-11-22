
import { ASSETS } from '../constants';

export const fetchLivePrice = async (symbol: string): Promise<number | null> => {
  const asset = ASSETS.find(a => a.symbol === symbol);
  if (!asset) return null;

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${asset.coingeckoId}&vs_currencies=usd`);
    
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data[asset.coingeckoId]?.usd || null;
  } catch (error) {
    console.warn("Price fetch failed (likely rate limit), falling back to simulation", error);
    return null;
  }
};
