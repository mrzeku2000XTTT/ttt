import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from "@/api/base44Client";
import { Loader2 } from 'lucide-react';

export default function KasPriceChart() {
  const [priceData, setPriceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(null);

  useEffect(() => {
    loadPriceHistory();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadPriceHistory, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPriceHistory = async () => {
    try {
      const { data } = await base44.functions.invoke('getKaspaPrice');
      
      if (data?.price) {
        const newPrice = data.price;
        setCurrentPrice(newPrice);
        
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        setPriceData(prev => {
          const updated = [
            ...prev,
            {
              time: timeLabel,
              price: newPrice,
              timestamp: now.getTime()
            }
          ];
          
          // Keep last 20 data points (20 minutes if updating every minute)
          return updated.slice(-20);
        });
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load price:', err);
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="backdrop-blur-xl bg-black/90 border border-cyan-500/30 rounded-lg p-3">
          <p className="text-cyan-400 font-bold">${payload[0].value.toFixed(4)}</p>
          <p className="text-gray-400 text-xs">{payload[0].payload.time}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading && priceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (priceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-500">
        No price data available
      </div>
    );
  }

  // Calculate price change
  const firstPrice = priceData[0]?.price || 0;
  const lastPrice = priceData[priceData.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="w-full">
      {/* Current Price Display */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Current KAS Price</div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-bold text-white">
            ${currentPrice?.toFixed(4) || '--'}
          </div>
          <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(4)} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Last {priceData.length} minutes • Live updates
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={priceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="time" 
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10 }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(4)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#06b6d4" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#06b6d4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}