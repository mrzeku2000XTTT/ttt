import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from "recharts";

export default function KlockSimChart({ data }) {
  const { mean, stdDev, threshold, teamA, teamB, overProb } = data;

  const chartData = useMemo(() => {
    // Generate normal distribution histogram data
    const bins = [];
    const binCount = 40;
    const minVal = mean - 3.5 * stdDev;
    const maxVal = mean + 3.5 * stdDev;
    const binWidth = (maxVal - minVal) / binCount;

    for (let i = 0; i < binCount; i++) {
      const x = minVal + i * binWidth + binWidth / 2;
      // Normal distribution PDF
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
      const frequency = Math.round((1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent) * 5000);
      bins.push({
        points: Math.round(x),
        frequency,
        isOver: x >= threshold,
      });
    }
    return bins;
  }, [mean, stdDev, threshold]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-xs font-bold">
          Scoring Simulation: {teamA} vs. {teamB}
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold">
          {overProb}% Over
        </span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={0} barGap={0}>
            <XAxis
              dataKey="points"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              interval={7}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={30}
              label={{ value: "Frequency", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
            />
            <ReferenceLine
              x={chartData.find(d => d.points >= threshold)?.points}
              stroke="#f97316"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: `${threshold}`, fill: "#f97316", fontSize: 10, position: "top" }}
            />
            <ReferenceLine
              x={chartData.find(d => d.points >= mean)?.points}
              stroke="#3b82f6"
              strokeWidth={2}
              label={{ value: `Mean ${mean}`, fill: "#3b82f6", fontSize: 9, position: "top" }}
            />
            <Bar dataKey="frequency" radius={[1, 1, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isOver ? "rgba(239,68,68,0.6)" : "rgba(156,163,175,0.3)"}
                  stroke={entry.isOver ? "rgba(239,68,68,0.3)" : "rgba(156,163,175,0.15)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-gray-500/40" />
          <span className="text-white/40 text-[10px]">Simulated Totals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-red-500/60" />
          <span className="text-white/40 text-[10px]">Prediction (Over)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-orange-500 border-dashed" />
          <span className="text-white/40 text-[10px]">{threshold} Threshold</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-white/40 text-[10px]">Projected Mean</span>
        </div>
      </div>
    </div>
  );
}