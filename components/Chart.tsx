import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGameStore } from '../store/gameStore';
import { BarChart3, Activity } from 'lucide-react';

export const Chart: React.FC = () => {
  const { priceHistory, selectedAsset, currentPrice, chartType, setChartType, theme } = useGameStore();

  const minPrice = Math.min(...priceHistory.map(p => p.value));
  const maxPrice = Math.max(...priceHistory.map(p => p.value));
  
  let diff = maxPrice - minPrice;
  if (diff === 0) diff = maxPrice * 0.0005; 
  
  const padding = diff * 0.2;
  
  const yDomain = [
    (minPrice - padding).toFixed(4),
    (maxPrice + padding).toFixed(4)
  ];

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Theme constants
  const gridColor = theme === 'dark' ? '#27272a' : '#e5e7eb';
  const tickColor = theme === 'dark' ? '#52525b' : '#a1a1aa';
  const tooltipBg = theme === 'dark' ? '#18181b' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#27272a' : '#e4e4e7';

  return (
    <div className="h-[350px] w-full relative group">
      {/* Header inside chart */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-baseline space-x-2 transition-colors">
            <span>${currentPrice > 0 ? currentPrice.toFixed(4) : '---'}</span>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800">LIVE</span>
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{selectedAsset} / USD</p>
      </div>

      {/* Toggle Type Button */}
      <div className="absolute top-4 right-4 z-10 flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
        <button 
            onClick={() => setChartType('AREA')}
            className={`p-1.5 rounded transition-all ${chartType === 'AREA' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            title="Area Chart"
        >
            <Activity className="w-4 h-4" />
        </button>
        <button 
            onClick={() => setChartType('BAR')}
            className={`p-1.5 rounded transition-all ${chartType === 'BAR' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            title="Bar Chart"
        >
            <BarChart3 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full h-full">
        {priceHistory.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                <div className="w-8 h-8 border-4 border-celo border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-zinc-500 font-mono">Fetching Market Data...</span>
            </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'AREA' ? (
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#35D07F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#35D07F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis 
                    dataKey="time" 
                    hide={true}
                  />
                  <YAxis 
                    domain={yDomain} 
                    hide={false} 
                    orientation="right"
                    tick={{fill: tickColor, fontSize: 12}}
                    tickFormatter={(value) => Number(value).toFixed(4)}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: theme === 'dark' ? '#fff' : '#000' }}
                    itemStyle={{ color: '#35D07F' }}
                    formatter={(value: number) => [value.toFixed(4), 'Price']}
                    labelFormatter={(label) => formatTime(label as number)}
                    isAnimationActive={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#35D07F" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                    isAnimationActive={false}
                  />
                </AreaChart>
            ) : (
                <BarChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis 
                    dataKey="time" 
                    hide={true}
                  />
                  <YAxis 
                    domain={yDomain} 
                    hide={false} 
                    orientation="right"
                    tick={{fill: tickColor, fontSize: 12}}
                    tickFormatter={(value) => Number(value).toFixed(4)}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: theme === 'dark' ? '#fff' : '#000' }}
                    itemStyle={{ color: '#35D07F' }}
                    formatter={(value: number) => [value.toFixed(4), 'Price']}
                    labelFormatter={(label) => formatTime(label as number)}
                    cursor={{fill: gridColor, opacity: 0.4}}
                    isAnimationActive={false}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#35D07F" 
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};