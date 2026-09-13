import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LEARNING_LESSONS = [
  'Your tiny animation detective is counting every swoop, pop, pause, and surprise.',
  'Tiny awareness lesson: notice what moved, when it moved, and how it made you feel.',
  'Kaspa is like a classroom where many answers can arrive together instead of waiting in one line.',
  'A blockDAG lets Kaspa blocks grow together, like branches sharing one very fast family tree.',
  'Frames are tiny moments. Paying attention to each moment is a simple way to practice awareness.',
  'The robot brought popcorn. It cannot eat popcorn. This has become an emotional subplot.'
];

export default function NicheLearningWait() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const started = Date.now(); const tick = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000); return () => clearInterval(tick); }, []);
  const lesson = LEARNING_LESSONS[Math.floor(seconds / 6) % LEARNING_LESSONS.length];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <Loader2 className="mx-auto h-5 w-5 animate-spin text-white/70" />
      <p className="mt-2 text-sm font-semibold text-white">Watching YouTube and learning the animation · {seconds}s</p>
      <p className="mt-3 flex items-start justify-center gap-1.5 text-xs leading-5 text-white/50"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />{lesson}</p>
    </div>
  );
}