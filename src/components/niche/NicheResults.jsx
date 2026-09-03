import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, RotateCcw, Target, Users, Zap, Calendar, Compass } from 'lucide-react';

const Panel = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 ${className}`}>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-white/50" />
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{title}</h3>
    </div>
    {children}
  </div>
);

export default function NicheResults({ result, onRestart, answers, saved }) {
  const [copied, setCopied] = React.useState(false);

  const copyIdeas = async () => {
    const text = result.ideas.map((i) => `• ${i.title} — ${i.hook}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/[0.03] text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-4">
          <Target className="w-3 h-3" /> Your niche
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">{result.niche?.name}</h1>
        <p className="text-white/60 mt-3 text-base sm:text-lg max-w-xl mx-auto italic">"{result.niche?.tagline}"</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Panel icon={Zap} title="What you're good at">
          <ul className="space-y-3">
            {result.strengths?.map((s, i) => (
              <li key={i}>
                <p className="text-white font-semibold text-sm">{s.title}</p>
                <p className="text-white/50 text-sm mt-0.5">{s.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel icon={Users} title="Your audience">
          <p className="text-white font-semibold text-sm">{result.audience?.who}</p>
          <p className="text-white/50 text-sm mt-2">{result.audience?.why_they_care}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {result.pillars?.map((p, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white/70">
                {p.name}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white/50" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">What to post</h3>
          </div>
          <button
            onClick={copyIdeas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy ideas'}
          </button>
        </div>
        <ol className="space-y-3">
          {result.ideas?.map((idea, i) => (
            <li key={i} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/20 transition-all">
              <span className="text-white/25 font-black text-lg leading-none w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-white font-semibold text-sm">{idea.title}</p>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider">{idea.format}</span>
                </div>
                <p className="text-white/60 text-sm mt-1">"{idea.hook}"</p>
                <p className="text-white/35 text-xs mt-1">{idea.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Panel icon={Calendar} title="Your cadence">
        <p className="text-white text-sm leading-relaxed">{result.cadence}</p>
      </Panel>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        {saved && (
          <Link
            to="/NicheStudio"
            className="flex-1 py-4 rounded-2xl bg-white text-black font-bold hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" /> Open in Studio
          </Link>
        )}
        <button
          onClick={onRestart}
          className="flex-1 py-4 rounded-2xl border border-white/15 text-white/70 hover:text-white hover:border-white/40 font-semibold transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Recalibrate
        </button>
        <button
          onClick={copyIdeas}
          className="flex-1 py-4 rounded-2xl bg-white text-black font-bold hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] transition-all flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied to clipboard' : 'Save my posting plan'}
        </button>
      </div>
    </div>
  );
}