import React, { useState } from 'react';
import { Delete } from 'lucide-react';

const PIN_LENGTH = 6;

export default function PinPad({ onComplete, disabled }) {
  const [pin, setPin] = useState('');

  const press = (d) => {
    if (disabled) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setPin('');
      onComplete(next);
    }
  };

  const backspace = () => setPin(pin.slice(0, -1));

  return (
    <div className="w-full max-w-[260px] sm:max-w-[280px] mx-auto">
      <div className="flex justify-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border transition-all ${
              i < pin.length
                ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]'
                : 'bg-transparent border-white/30'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="h-12 sm:h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-xl sm:text-2xl font-semibold active:bg-cyan-500/20 active:scale-95 transition-all touch-manipulation"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => press('0')}
          className="h-12 sm:h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-xl sm:text-2xl font-semibold active:bg-cyan-500/20 active:scale-95 transition-all touch-manipulation"
        >
          0
        </button>
        <button
          onClick={backspace}
          className="h-12 sm:h-14 rounded-2xl bg-transparent text-white/60 flex items-center justify-center active:scale-95 transition-all touch-manipulation"
        >
          <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
}