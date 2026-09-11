import React from 'react';
import { motion } from 'framer-motion';

// Drifting translucent parchment cards — scripture fragments suspended in the scene.
// mobile:false cards are hidden on phones to keep the small screen quiet.
export const CARDS = [
  { x: '10%', y: '16%', w: 104, h: 144, rot: -6, blur: 1.5, op: 0.5, dur: 11, delay: 0, lines: 6, mobile: true },
  { x: '76%', y: '12%', w: 128, h: 168, rot: 5, blur: 0, op: 0.6, dur: 13, delay: 1.2, lines: 7, mobile: true },
  { x: '63%', y: '50%', w: 96, h: 136, rot: 3, blur: 2.5, op: 0.4, dur: 9, delay: 0.6, lines: 5, mobile: false },
  { x: '17%', y: '55%', w: 120, h: 160, rot: -4, blur: 2, op: 0.45, dur: 12, delay: 0.3, lines: 6, mobile: false },
  { x: '42%', y: '20%', w: 88, h: 120, rot: 2, blur: 3, op: 0.35, dur: 14, delay: 0.9, lines: 4, mobile: true },
  { x: '85%', y: '46%', w: 108, h: 148, rot: 6, blur: 1, op: 0.5, dur: 10, delay: 1.6, lines: 5, mobile: false },
];

export default function ParchmentCard({ x, y, w, h, rot, blur, op, dur, delay, lines, mobile }) {
  return (
    <motion.div
      className={`bl-card absolute z-[6] p-3 ${mobile ? '' : 'hidden sm:block'}`}
      style={{ left: x, top: y, width: w, height: h, filter: blur ? `blur(${blur}px)` : undefined, opacity: op }}
      animate={{ y: [0, -26, 0], rotate: [rot, rot + 2, rot] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bl-card-line mb-1.5" style={{ width: `${58 + ((i * 37) % 38)}%`, opacity: 0.4 + (i % 3) * 0.2 }} />
      ))}
    </motion.div>
  );
}