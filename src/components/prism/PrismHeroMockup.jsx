import React from 'react';
import { ScanLine } from 'lucide-react';

/**
 * A still preview of the inspector, built from the real numbers a PRISM pass
 * produces — not a screenshot, so it stays crisp at any size.
 */

const SHOTS = [
  { n: '01', len: 10.2 },
  { n: '02', len: 8.4 },
  { n: '03', len: 6.1 },
  { n: '04', len: 3.8 },
  { n: '05', len: 21.5 },
  { n: '06', len: 13.1 },
];

const WAVE = [8, 14, 9, 18, 12, 22, 16, 26, 14, 20, 11, 24, 17, 28, 13, 19, 10, 23, 15, 27, 12, 21, 16, 25, 11, 18, 14, 22, 9, 17];

const MOTION = '0,34 8,30 16,32 24,12 32,26 40,28 48,10 56,24 64,30 72,8 80,22 88,26 96,14 100,20';
const BRIGHT = '0,12 10,14 20,11 30,16 40,13 50,15 60,10 70,14 80,12 90,15 100,13';

const ROWS = [
  ['Shot boundary', '3 cuts · 30.80s, 41.00s, 52.89s'],
  ['Pacing', 'Fast · avg 10.5s'],
  ['Motion intensity', 'peak 66.9 · mean 3.0'],
  ['Brightness', 'avg 74% · white 46%'],
  ['Dominant palette', null],
  ['Typography', 'Two-tone statement, sans'],
];

const PALETTE = ['#f276b7', '#f184d8', '#fbfbfc', '#040404'];

export default function PrismHeroMockup() {
  const total = SHOTS.reduce((a, s) => a + s.len, 0);

  return (
    <div className="relative">
      <div className="rounded-2xl border border-[#e9e9e9] bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.22)] overflow-hidden">
        {/* chrome */}
        <div className="flex items-center gap-2 px-3 h-8 border-b border-[#f0f0f0] bg-[#fafafa]">
          <span className="w-2 h-2 rounded-full bg-[#e4e4e4]" />
          <span className="w-2 h-2 rounded-full bg-[#e4e4e4]" />
          <span className="w-2 h-2 rounded-full bg-[#e4e4e4]" />
          <span className="ml-2 flex items-center gap-1.5 text-[9px] tracking-[0.14em] text-[#a3a3a3] font-semibold">
            <ScanLine className="w-3 h-3" />
            PRISM — VIDEO INSPECTOR
          </span>
          <span className="ml-auto text-[9px] text-[#b0b0b0] tabular-nums">63.09s</span>
        </div>

        <div className="p-3 space-y-2.5">
          {/* viewer */}
          <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-[#f276b7] to-[#f184d8] flex items-center justify-center">
            <span className="px-6 text-center text-[13px] sm:text-[15px] font-semibold text-white/95 drop-shadow-sm">
              Centralized platforms hold your funds.
            </span>
            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/45 text-[8px] text-white tabular-nums">
              00:02.00
            </span>
          </div>

          {/* timeline */}
          <div>
            <div className="flex gap-0.5">
              {SHOTS.map((s) => (
                <div key={s.n} className="relative" style={{ width: `${(s.len / total) * 100}%` }}>
                  <div
                    className="h-9 rounded-[3px] border border-[#ededed]"
                    style={{
                      background:
                        Number(s.n) > 4
                          ? 'linear-gradient(135deg,#f7f7f8,#fbfbfc)'
                          : 'linear-gradient(135deg,#f276b7,#f184d8)',
                    }}
                  />
                  <span className="absolute bottom-0.5 left-1 text-[7px] font-semibold text-black/45">
                    Shot {s.n}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-end gap-[1px] h-4">
              {WAVE.map((h, i) => (
                <span key={i} className="flex-1 rounded-sm bg-[#c9c9c9]" style={{ height: `${h + 10}%` }} />
              ))}
            </div>
          </div>

          {/* curves */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#f0f0f0] px-2 py-1.5">
              <span className="text-[8px] uppercase tracking-[0.14em] text-[#a3a3a3]">Motion</span>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-7 block">
                <polyline points={MOTION} fill="none" stroke="#A020F0" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="rounded-lg border border-[#f0f0f0] px-2 py-1.5">
              <span className="text-[8px] uppercase tracking-[0.14em] text-[#a3a3a3]">Brightness</span>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-7 block">
                <polyline points={BRIGHT} fill="none" stroke="#0000FF" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>

          {/* analysis + palette */}
          <div className="grid grid-cols-[1.5fr_1fr] gap-2">
            <div className="rounded-lg border border-[#f0f0f0] p-2">
              <span className="text-[8px] uppercase tracking-[0.14em] text-[#a3a3a3]">Frame analysis</span>
              <div className="mt-1 space-y-0.5">
                {ROWS.map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <span className="text-[8.5px] text-[#8a8a8a] w-[74px] shrink-0">{k}</span>
                    {v ? (
                      <span className="text-[8.5px] text-black truncate">{v}</span>
                    ) : (
                      <span className="flex gap-0.5">
                        {PALETTE.map((c) => (
                          <span key={c} className="w-2.5 h-2.5 rounded-sm border border-[#ececec]" style={{ background: c }} />
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#f0f0f0] p-2">
              <span className="text-[8px] uppercase tracking-[0.14em] text-[#a3a3a3]">Palette</span>
              <div className="mt-1 flex rounded overflow-hidden h-4">
                {PALETTE.map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <div className="mt-1.5 aspect-video rounded bg-gradient-to-br from-[#fbfbfc] to-[#f0f0f2] border border-[#f0f0f0]" />
              <span className="block mt-1 text-[8px] text-[#a3a3a3]">A new tomorrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* floating read-out */}
      <div className="hidden sm:block absolute -left-6 bottom-16 w-[168px] rounded-xl border border-[#ececec] bg-white p-2.5 shadow-[0_16px_36px_-16px_rgba(0,0,0,0.3)]">
        <span className="text-[9px] font-bold tracking-[0.14em] text-black">SHOT 04</span>
        <div className="mt-1.5 space-y-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[8.5px] text-[#8a8a8a]">Camera</span>
            <span className="text-[8.5px] text-black">Slow Push In</span>
          </span>
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[8.5px] text-[#8a8a8a]">Motion</span>
            <span className="text-[8.5px] text-black tabular-nums">12.4 px/frame</span>
          </span>
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[8.5px] text-[#8a8a8a]">Duration</span>
            <span className="text-[8.5px] text-black tabular-nums">3.82s</span>
          </span>
        </div>
      </div>
    </div>
  );
}