import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw } from 'lucide-react';

async function downloadImage(url) {
  try {
    const blob = await (await fetch(url)).blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `act-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  } catch {
    window.open(url, '_blank');
  }
}

/**
 * One image slot — born from the period the user just typed.
 * pending  → the period, pulsing, with elapsed time
 * done     → the period fully turned into the picture (downloadable)
 * error    → retry
 */
export default function ActShot({ item, onRetry }) {
  const [seconds, setSeconds] = useState(0);
  const pending = item.status === 'pending';

  useEffect(() => {
    if (!pending) return;
    setSeconds(Math.floor((Date.now() - item.startedAt) / 1000));
    const iv = setInterval(() => setSeconds(Math.floor((Date.now() - item.startedAt) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [pending, item.startedAt]);

  if (pending) {
    return (
      <div className="inline-flex items-center gap-3 rounded-lg border border-white/15 px-3 py-1.5">
        <span className="text-3xl font-black leading-none animate-pulse">.</span>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">rendering {seconds}s</span>
      </div>
    );
  }

  if (item.status === 'error') {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">image failed</span>
        <button
          onClick={() => onRetry(item)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-300 hover:text-white"
        >
          <RefreshCw className="w-3 h-3" /> retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.12, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      className="max-w-sm"
    >
      <img src={item.url} alt={item.prompt} className="w-full h-auto rounded-lg border border-white/15" />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-neutral-600 truncate max-w-[65%]">{item.prompt}</span>
        <button
          onClick={() => downloadImage(item.url)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white shrink-0"
        >
          <Download className="w-3 h-3" /> download
        </button>
      </div>
    </motion.div>
  );
}