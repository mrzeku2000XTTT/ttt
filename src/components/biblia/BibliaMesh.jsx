import React from 'react';

// Deterministic faint golden network mesh — same world on the landing and the feed.
const NODES = [
  [120, 180], [340, 120], [620, 200], [900, 110], [1180, 190], [1360, 120],
  [220, 420], [520, 380], [760, 460], [1040, 400], [1300, 430],
  [160, 640], [460, 700], [820, 660], [1100, 700], [1330, 640],
];
const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [1, 6], [2, 7], [3, 8], [4, 9], [5, 10],
  [6, 7], [7, 8], [8, 9], [9, 10],
  [6, 11], [7, 12], [8, 13], [9, 14], [10, 15],
  [11, 12], [12, 13], [13, 14], [14, 15], [2, 8],
];

export default function BibliaMesh({ faint = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" style={{ opacity: faint ? 0.45 : 1 }}>
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {EDGES.map(([a, b], i) => (
          <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="#c5b085" strokeWidth="0.6" opacity="0.35" />
        ))}
        {NODES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#dcd0b8" className="bl-node" style={{ animationDelay: `${(i % 5) * 0.8}s` }} />
        ))}
      </svg>
    </div>
  );
}