import React, { useState } from 'react';
import { Youtube } from 'lucide-react';
import { analyzeYouTubeStyle } from '@/lib/youtubeStyleAnalysis';
import NicheLearningWait from './NicheLearningWait';
import NicheYouTubeResult from './NicheYouTubeResult';

export default function NicheYouTubeLearner({ onLearned, onClose }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const analyze = async () => {
    if (!url.trim()) return;
    setBusy(true); setError('');
    try { setResult(await analyzeYouTubeStyle(url)); }
    catch (e) { setError(e?.message || 'I could not study that public YouTube video.'); }
    finally { setBusy(false); }
  };
  const make = (idea) => { onLearned(result.style, idea.video_prompt); onClose(); };
  if (busy) return <NicheLearningWait />;
  if (result) return <NicheYouTubeResult result={result} onMake={make} />;
  return (
    <div className="space-y-3">
      <div className="relative"><Youtube className="absolute left-3 top-3.5 h-4 w-4 text-white/40" /><input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyze()} placeholder="Paste any public YouTube URL" className="w-full rounded-xl border border-white/15 bg-white/[0.03] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/40" /></div>
      <p className="text-[11px] leading-4 text-white/40">Works with watch, share, Shorts, embed, mobile, and live-replay links. Private or region-blocked videos may be unavailable.</p>
      <button onClick={analyze} disabled={!url.trim()} className="w-full rounded-xl bg-white py-3 text-sm font-bold text-black disabled:opacity-40">Watch and learn</button>
      {error && <p className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-xs text-white/70">{error}</p>}
    </div>
  );
}