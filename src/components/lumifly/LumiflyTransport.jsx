import React from 'react';
import { Pause, Play, Repeat } from 'lucide-react';
import { textAnimation } from './lumiflyPresets';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function LumiflyTransport({
  scenes,
  cursor,
  onSeek,
  playing,
  onPlay,
  playAll,
  onPlayAll,
  rate,
  onRate,
  duration,
  onStretch,
}) {
  return (
    <div className="border-t border-white/10 bg-[#0e0e0f] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onPlay}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#00c29f] text-black transition-opacity hover:opacity-90"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <span className="text-[11px] tabular-nums text-white/45">
          {cursor.t.toFixed(2)}s / {duration.toFixed(2)}s
        </span>

        <select
          value={rate}
          onChange={(e) => onRate(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white/70 outline-none"
        >
          {RATES.map((r) => (
            <option key={r} value={r} className="bg-[#131314]">
              {r}x
            </option>
          ))}
        </select>

        <button
          onClick={() => onPlayAll(!playAll)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
            playAll ? 'border-[#00c29f]/60 bg-[#00c29f]/15 text-white' : 'border-white/10 text-white/50 hover:text-white'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          Play all scenes
        </button>

        <div className="ml-auto flex items-center gap-1">
          {[-1, -0.5, 0.5, 1].map((d) => (
            <button
              key={d}
              onClick={() => onStretch(d)}
              className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/50 transition-colors hover:border-white/30 hover:text-white"
            >
              {d > 0 ? `+${d}s` : `${d}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex gap-1">
        {scenes.map((scene, i) => {
          const active = i === cursor.index;
          const sceneDuration = Math.max(0.5, Number(scene.duration) || 6);
          return (
            <button
              key={scene.id}
              onClick={() => onSeek(i)}
              style={{ flexGrow: sceneDuration, flexBasis: 0 }}
              className={`relative h-8 min-w-0 overflow-hidden rounded-md border px-2 text-left text-[10px] transition-colors ${
                active ? 'border-[#00c29f]/60 bg-[#00c29f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-white/45'
              }`}
            >
              <span className="block truncate">
                scene-{i + 1} · {textAnimation(scene.animation).label}
              </span>
              {active && (
                <span
                  className="absolute bottom-0 left-0 h-0.5 bg-[#00c29f]"
                  style={{ width: `${Math.min(100, (cursor.t / sceneDuration) * 100)}%` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}