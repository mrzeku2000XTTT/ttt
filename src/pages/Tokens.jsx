import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Upload, Image as ImageIcon, Loader2, Check, Wand2 } from "lucide-react";

const TOKENS_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/583744c85_generated_image.png";

export default function TokensPage() {
  const [designs, setDesigns] = useState([]); // collected design briefs this session
  const [brief, setBrief] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked].slice(0, 8));
  };
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!brief.trim() && files.length === 0) return;
    setSubmitting(true);
    // Simulate a brief design intake — replace with entity save / agent call later.
    await new Promise((r) => setTimeout(r, 700));
    setDesigns((prev) => [
      {
        id: Date.now(),
        brief: brief.trim(),
        files: files.map((f) => f.name),
        at: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    setBrief("");
    setFiles([]);
    setSubmitting(false);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <nav
        className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm">Store</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src={TOKENS_LOGO} alt="Tokens" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-sm font-bold">Tokens</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="flex-1 max-w-md mx-auto w-full px-4 pb-24 pt-6">
        {/* Hero — asks the user for designs */}
        <div className="text-center mb-7">
          <img
            src={TOKENS_LOGO}
            alt="Tokens"
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-[0_0_40px_rgba(34,211,238,0.35)]"
          />
          <h1 className="text-2xl font-black tracking-tight mb-1.5">Bring your token to life</h1>
          <p className="text-sm text-white/55 leading-relaxed max-w-xs mx-auto">
            Tell us what you're designing — a name, a vibe, a reference — and drop any artwork.
            We'll turn your brief into a mintable Kaspa token.
          </p>
        </div>

        {/* Design intake form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-2">
              <Wand2 className="w-3 h-3" /> Describe your design
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              placeholder="e.g. A gold scorpion token called SCORP — aggressive, premium, dark background, sharp serif 'S'…"
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/50 resize-none placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-2">
              <ImageIcon className="w-3 h-3" /> Reference artwork (optional)
            </label>
            <label className="block w-full h-24 rounded-xl border border-dashed border-white/15 bg-black/30 hover:border-cyan-400/40 hover:bg-cyan-400/[0.03] transition cursor-pointer flex flex-col items-center justify-center gap-1.5 text-white/50">
              <Upload className="w-5 h-5" />
              <span className="text-xs">Tap to upload designs</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
            </label>

            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/70"
                  >
                    <ImageIcon className="w-3 h-3 text-cyan-300" />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="w-4 h-4 flex items-center justify-center text-white/40 hover:text-red-400">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={submitting || (!brief.trim() && files.length === 0)}
            className="w-full h-12 rounded-xl bg-cyan-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Working on it…</>
            ) : done ? (
              <><Check className="w-4 h-4" /> Design received</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Submit design brief</>
            )}
          </button>
        </div>

        {/* Submitted briefs this session */}
        {designs.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 px-1">Your submitted designs</div>
            {designs.map((d) => (
              <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-cyan-300/80">{d.at}</span>
                  {d.files.length > 0 && (
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> {d.files.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/75 leading-relaxed">{d.brief || "(artwork only)"}</p>
                {d.files.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {d.files.map((f, i) => (
                      <span key={i} className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-white/30 text-center mt-8 leading-relaxed max-w-xs mx-auto">
          Your briefs stay on this device for now. Minting + on-chain launch coming soon.
        </p>
      </div>
    </div>
  );
}