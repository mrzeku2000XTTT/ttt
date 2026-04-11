import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { getRemainingMs as getGlobalRemaining, ROUND_MS } from "./roundClock";

/**
 * GameTimer — uses the fixed UTC 15-minute round clock.
 * If `endTime` is provided, counts down to that specific time.
 * Otherwise, counts down to the current round boundary.
 */
export default function GameTimer({ endTime }) {
  function calcRemaining() {
    if (endTime) {
      return Math.max(0, new Date(endTime).getTime() - Date.now());
    }
    return getGlobalRemaining();
  }

  const [remaining, setRemaining] = useState(calcRemaining());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const totalSecs = Math.floor(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const pct = Math.max(0, Math.min(100, (remaining / ROUND_MS) * 100));
  const isUrgent = mins < 2;

  // Real Central Time clock
  const now = new Date();
  const ctStr = now.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-[10px] font-mono flex-shrink-0">{ctStr} CT</span>
      <div className="relative w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`flex items-center gap-1 flex-shrink-0 ${isUrgent ? 'text-red-400' : 'text-emerald-400'}`}>
        <Clock className="w-3 h-3" />
        <span className="text-xs font-mono font-bold tabular-nums">
          {remaining === 0 ? 'ENDED' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
        </span>
      </div>
    </div>
  );
}