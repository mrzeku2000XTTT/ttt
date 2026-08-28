import React, { useState, useEffect } from "react";
import { Megaphone, Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CryptoAdSubmission() {
  const [adText, setAdText] = useState("");
  const [adLink, setAdLink] = useState("");
  const [txid, setTxid] = useState("");
  const [treasury, setTreasury] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("submitCryptoAd", { action: "info" });
        const data = res?.data || res;
        if (data?.treasury_address) setTreasury(data.treasury_address);
      } catch (e) {
        console.error("Failed to load ad info:", e);
      }
    })();
  }, []);

  const copyTreasury = () => {
    if (!treasury) return;
    navigator.clipboard.writeText(treasury);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!adText || !adLink || !txid) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      let email = "guest";
      try {
        const me = await base44.auth.me();
        email = me?.email || "guest";
      } catch { /* anonymous user */ }

      const res = await base44.functions.invoke("submitCryptoAd", {
        ad_text: adText,
        ad_link: adLink,
        advertiser_email: email,
        payment_txid: txid,
      });
      const data = res?.data || res;
      if (data?.error) {
        setError(data.error);
      } else if (data?.success) {
        setResult(data);
        setAdText("");
        setAdLink("");
        setTxid("");
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex flex-col items-center text-center pt-4 pb-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center mb-3">
          <Megaphone className="w-6 h-6 text-violet-300" />
        </div>
        <h3 className="text-white font-bold text-base">Advertise on the News Ticker</h3>
        <p className="text-white/40 text-xs mt-1 max-w-xs">
          Get your project seen by thousands. 1 KAS = 1 hour of live ticker exposure.
        </p>
      </div>

      {treasury && (
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/60 mb-1">Step 1: Send 1 KAS to</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] text-white/80 font-mono break-all">{treasury}</code>
            <button onClick={copyTreasury} className="flex-shrink-0 text-white/40 hover:text-white transition-colors">
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1 block">Step 2: Your ad text</label>
        <textarea
          value={adText}
          onChange={e => setAdText(e.target.value)}
          placeholder="e.g. New Kaspa meme token launching — join the presale now!"
          maxLength={200}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 resize-none"
        />
        <div className="text-right text-[9px] text-white/30 mt-0.5">{adText.length}/200</div>
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1 block">Your link</label>
        <input
          type="url"
          value={adLink}
          onChange={e => setAdLink(e.target.value)}
          placeholder="https://your-project.com"
          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-violet-500/40"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1 block">Step 3: Paste your Kaspa txid</label>
        <input
          value={txid}
          onChange={e => setTxid(e.target.value)}
          placeholder="e.g. a1b2c3d4e5f6..."
          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 font-mono"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 text-xs font-medium">{result.message}</p>
            {result.expires_at && (
              <p className="text-emerald-300/60 text-[10px] mt-0.5">Expires: {new Date(result.expires_at).toUTCString()}</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !adText || !adLink || !txid}
        className="w-full h-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-mono tracking-widest uppercase disabled:opacity-40 hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
        ) : (
          <><Megaphone className="w-4 h-4" /> Launch Ad — 1 KAS</>
        )}
      </button>

      <p className="text-[9px] text-white/30 text-center">
        Ads are fact-checked before going live. No scams, phishing, or misleading content.
      </p>
    </div>
  );
}