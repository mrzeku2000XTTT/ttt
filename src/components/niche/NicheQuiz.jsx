import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

const PASSION_CHIPS = [
  'Fitness', 'Crypto & Kaspa', 'Gaming', 'Music', 'Cooking', 'Fashion',
  'Tech & AI', 'Art & Design', 'Cars', 'Travel', 'Business', 'Film & Video',
  'Books', 'Sports', 'Beauty', 'DIY & Builds'
];
const PLATFORMS = ['X / Twitter', 'TikTok', 'YouTube', 'Instagram', 'LinkedIn', 'Podcast'];
const TIME_OPTIONS = ['15 min/day', '30 min/day', '1 hr/day', '2+ hrs/day'];

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
      active
        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.25)]'
        : 'bg-white/[0.03] text-white/60 border-white/10 hover:border-white/40 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export default function NicheQuiz({ onFind, loading }) {
  const [passions, setPassions] = useState([]);
  const [custom, setCustom] = useState('');
  const [askedFor, setAskedFor] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [time, setTime] = useState('30 min/day');

  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canSubmit = (passions.length > 0 || custom.trim()) && platforms.length > 0;

  const submit = () => {
    if (!canSubmit || loading) return;
    onFind({
      passions: [...passions, ...(custom.trim() ? [custom.trim()] : [])],
      asked_for: askedFor.trim(),
      platforms,
      time
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Find your niche in <span className="text-white/40">seconds</span>
        </h1>
        <p className="text-white/50 mt-3 max-w-md mx-auto text-sm sm:text-base">
          Tell the compass what you love. It tells you what you're good at — and exactly what to post.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-3">1 · What lights you up?</h2>
          <div className="flex flex-wrap gap-2">
            {PASSION_CHIPS.map((p) => (
              <Chip key={p} active={passions.includes(p)} onClick={() => toggle(passions, setPassions, p)}>{p}</Chip>
            ))}
          </div>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Add anything else you love…"
            className="mt-3 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-3">2 · What do people ask you for help with?</h2>
          <input
            value={askedFor}
            onChange={(e) => setAskedFor(e.target.value)}
            placeholder="e.g. fixing phones, workout plans, explaining crypto…"
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-3">3 · Where will you post?</h2>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Chip key={p} active={platforms.includes(p)} onClick={() => toggle(platforms, setPlatforms, p)}>{p}</Chip>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-3">4 · Time per day</h2>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((t) => (
              <Chip key={t} active={time === t} onClick={() => setTime(t)}>{t}</Chip>
            ))}
          </div>
        </section>

        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            canSubmit && !loading
              ? 'bg-white text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.35)]'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Scanning your signal…</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Find my niche <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}