import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, Check, Loader2, Sparkles, FileCode2 } from 'lucide-react';
import { UGC_GIRLS } from '@/components/ugc/UgcCharacters';

const SAMPLE = `<!DOCTYPE html>
<html><head><title>Bean & Brew</title></head>
<body>
  <header><nav><a class="logo">Bean & Brew</a><a>Menu</a><a>Locations</a><a>Order</a></nav></header>
  <section class="hero">
    <h1>Coffee worth waking up for</h1>
    <p>Single-origin beans, roasted in-house every morning. Free delivery on your first order.</p>
    <button>Order now</button><button>See the menu</button>
  </section>
  <section class="features">
    <div><h2>Fresh roast</h2><p>Roasted within 24 hours of your cup.</p></div>
    <div><h2>Fast delivery</h2><p>30-minute local delivery, every day.</p></div>
    <div><h2>Loyalty perks</h2><p>Earn a free drink every 10 orders.</p></div>
  </section>
  <footer>© Bean & Brew · Portland, OR</footer>
</body></html>`;

const MODES = [
  { id: 'recreate', label: 'Recreate', hint: 'Rebuild as a responsive web layout' },
  { id: 'animate', label: 'Animate', hint: 'Turn into a 2D animated scene' },
  { id: 'video', label: 'Video', hint: '6–10s promo script from the page' },
];

export default function UgcConverter() {
  const [html, setHtml] = useState('');
  const [mode, setMode] = useState('recreate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const activeGirl = loading ? 'Sage' : result ? 'Sage' : html ? 'Moxie' : 'Pippa';

  const convert = async () => {
    if (!html.trim()) { setError('Paste some HTML first.'); return; }
    setLoading(true); setError(''); setResult(null); setCopied(false);
    try {
      const res = await base44.functions.invoke('ugcHtmlToPrompt', { html, mode });
      setResult(res.data);
    } catch (e) {
      setError(e?.message || 'Conversion failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result?.prompt) return;
    try { await navigator.clipboard.writeText(result.prompt); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input */}
      <div className="rounded-3xl bg-white ring-1 ring-neutral-200 shadow-sm p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold">
            <FileCode2 className="w-5 h-5" /> HTML In
          </div>
          <button onClick={() => setHtml(SAMPLE)} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 underline underline-offset-2">
            Load sample
          </button>
        </div>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="Paste any HTML — a snippet or a full page…"
          className="flex-1 min-h-[240px] w-full rounded-2xl bg-neutral-50 ring-1 ring-neutral-200 p-4 font-mono text-[13px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-y"
          spellCheck={false}
        />
        <div className="mt-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Output mode</div>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-2xl px-3 py-2.5 text-sm font-semibold ring-1 transition ${
                  mode === m.id ? 'bg-neutral-900 text-white ring-neutral-900' : 'bg-white text-neutral-700 ring-neutral-200 hover:ring-neutral-400'
                }`}
                title={m.hint}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={convert}
          disabled={loading}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-white font-semibold px-4 py-3 hover:bg-neutral-800 disabled:opacity-60 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Factory running…' : 'Convert to Prompt'}
        </button>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      {/* Output */}
      <div className="rounded-3xl bg-white ring-1 ring-neutral-200 shadow-sm p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold">
            <Sparkles className="w-5 h-5" /> Prompt Out
          </div>
          {result?.prompt && (
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
            <img src={UGC_GIRLS[2].img} alt="Sage" className="w-16 h-16 rounded-full ring-4 ring-white shadow object-cover animate-pulse" />
            <p className="text-sm text-neutral-500">Sage is writing your prompt…</p>
          </div>
        )}

        {!loading && !result && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-10">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
              <FileCode2 className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-400">Your prompt will appear here.</p>
          </div>
        )}

        {!loading && result && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1">{result.layout_type || 'layout'}</span>
              {(result.palette || []).slice(0, 5).map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 ring-1 ring-neutral-200 text-xs font-mono text-neutral-600 px-2 py-1">
                  <span className="w-3 h-3 rounded-full ring-1 ring-black/10" style={{ background: c }} /> {c}
                </span>
              ))}
            </div>
            {result.content_summary && <p className="text-sm text-neutral-500">{result.content_summary}</p>}
            <pre className="flex-1 min-h-[200px] overflow-auto rounded-2xl bg-neutral-50 ring-1 ring-neutral-200 p-4 text-[13px] leading-relaxed text-neutral-800 whitespace-pre-wrap font-sans">
              {result.prompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}