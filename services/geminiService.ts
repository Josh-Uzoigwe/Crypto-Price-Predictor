import { GoogleGenAI, Type } from "@google/genai";
import { PricePoint, MarketAnalysis } from "../types";

// Initialize Gemini client
// NOTE: In a real app, this key should be in .env. 
// If not present, the service handles it gracefully.
const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeMarket = async (asset: string, history: PricePoint[]): Promise<MarketAnalysis> => {
  // Mock fallback if no API key
  if (!ai) {
    await new Promise(r => setTimeout(r, 1500)); // Simulate delay
    const isBullish = Math.random() > 0.5;
    return {
      sentiment: isBullish ? 'BULLISH' : 'BEARISH',
      confidence: Math.floor(Math.random() * 30) + 60,
      reasoning: "Simulated analysis: Moving averages indicate a strong trend reversal based on recent volume spikes. RSI suggests the asset is currently in a neutral zone but momentum is building.",
      timestamp: Date.now()
    };
  }

  try {
    const priceDataStr = history.slice(-15).map(p => p.value.toFixed(4)).join(', ');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this crypto price trend for ${asset}. Prices: [${priceDataStr}]. 
      Provide a JSON response with sentiment (BULLISH/BEARISH/NEUTRAL), confidence (0-100), and a 1 sentence reasoning.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    const data = JSON.parse(text);

    return {
      sentiment: data.sentiment,
      confidence: data.confidence,
      reasoning: data.reasoning,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      sentiment: 'NEUTRAL',
      confidence: 0,
      reasoning: "AI analysis unavailable at the moment.",
      timestamp: Date.now()
    };
  }
};