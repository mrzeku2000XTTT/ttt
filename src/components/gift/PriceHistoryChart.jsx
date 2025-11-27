import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function PriceHistoryChart({ item, prediction }) {
  const history = item.price_history || [];
  
  if (history.length === 0) return null;

  const chartData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: h.price_usd
  }));

  const currentPrice = item.price_usd;
  const lowestPrice = Math.min(...history.map(h => h.price_usd));
  const priceChange = ((currentPrice - lowestPrice) / lowestPrice * 100).toFixed(1);

  return (
    <Card className="bg-black border-white/10 mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white text-sm font-semibold">Price History</h4>
          <div className={`flex items-center gap-1 text-xs ${
            priceChange > 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {priceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(priceChange)}%</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey="date" 
              stroke="#666" 
              style={{ fontSize: '10px' }}
            />
            <YAxis 
              stroke="#666" 
              style={{ fontSize: '10px' }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#000', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {prediction && (
          <div className="mt-3 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="text-xs text-green-400 font-semibold mb-1">
              AI Prediction: {prediction.best_time_to_buy}
            </div>
            <div className="text-white/60 text-[10px]">
              {prediction.reasoning}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}