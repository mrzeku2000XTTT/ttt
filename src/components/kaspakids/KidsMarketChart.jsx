import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function KidsMarketChart({ data = [], color = "#7C5CFC", height = 50 }) {
  if (!data || data.length < 2) {
    return <div className="w-full" style={{ height }} />;
  }
  const chartData = data.map((v, i) => ({ i, v }));
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? "#22c55e" : "#ef4444";
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={["auto", "auto"]} hide />
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}