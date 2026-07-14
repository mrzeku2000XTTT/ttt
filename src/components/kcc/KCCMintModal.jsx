import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { KCC_RULES } from "@/components/kcc/kccRules";
import { X, Sparkles, Loader2 } from "lucide-react";

export default function KCCMintModal({ onClose, onMinted }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ruleType, setRuleType] = useState("zktimelock");
  const [deposit, setDeposit] = useState("1");
  const [generating, setGenerating] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const generateArt = async () => {
    if (!name) { setError("Name the NFT first — the art is generated from it"); return; }
    setGenerating(true); setError("");
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Futuristic Kaspa blockchain NFT collectible artwork titled "${name}". ${description || ""} Dark cyberpunk aesthetic, teal and gold accents, covenant seal motif, high detail digital art, square composition.`,
      });
      setImageUrl(res.url);
    } catch (e) {
      setError(e.message);
    }
    setGenerating(false);
  };

  const mint = async () => {
    setError("");
    if (!name) { setError("Name is required"); return; }
    const dep = Number(deposit);
    if (!dep || dep <= 0) { setError("Bound value must be a positive KAS amount"); return; }
    setMinting(true);
    try {
      const res = await base44.functions.invoke("kccNft", {
        action: "mint", name, description, image_url: imageUrl,
        covenant_type: ruleType, deposit_kas: dep,
      });
      setResult(res.data);
      onMinted();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setMinting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-black text-xl">Mint a KCC NFT</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {result ? (
          <div className="space-y-3">
            <p className="text-emerald-400 font-semibold">Deploy job filed with the SuperZK agent.</p>
            <p className="text-white/70 text-sm break-all">{result.next_step}</p>
            <p className="text-white/40 text-xs">Once you pay, hit "Check" on the NFT card — the covenant address becomes the NFT's permanent on-chain identity.</p>
            <button onClick={onClose} className="w-full py-2 rounded-lg bg-cyan-500 text-black font-bold">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="NFT name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30" />

            <div className="flex gap-3 items-center">
              <div className="w-20 h-20 rounded-lg bg-black border border-white/10 overflow-hidden flex-shrink-0">
                {imageUrl && <img src={imageUrl} alt="art" className="w-full h-full object-cover" />}
              </div>
              <button onClick={generateArt} disabled={generating}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generating…" : "Generate AI artwork"}
              </button>
            </div>

            <div>
              <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">Covenant++ rule (enforced on Kaspa L1)</p>
              <div className="grid grid-cols-2 gap-2">
                {KCC_RULES.map((r) => (
                  <button key={r.type} onClick={() => setRuleType(r.type)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${ruleType === r.type ? r.color : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25"}`}>
                    <span className="font-bold block">{r.label}</span>
                    <span className="text-[10px] opacity-70">{r.tagline}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/50 text-xs mb-1 uppercase tracking-wider">Bound value (KAS locked in the NFT's UTXO)</p>
              <input type="number" min="0.1" step="0.1" value={deposit} onChange={(e) => setDeposit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={mint} disabled={minting}
              className="w-full py-2.5 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2">
              {minting && <Loader2 className="w-4 h-4 animate-spin" />} File covenant deploy job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}