import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import SlobzNav from "@/components/slobz/SlobzNav";
import TxStoryCard from "@/components/slobz/TxStoryCard";
import { explainKaspaTx } from "@/components/slobz/txPlainEnglish";

const SLOB_DETECTIVE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/60bb0a620_generated_image.png";

export default function SlobzTxTracker() {
  const [txInput, setTxInput] = useState("");
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const track = async () => {
    const txId = txInput.trim().replace(/^https?:\/\/[^/]+\/txs\//, "");
    if (!/^[a-fA-F0-9]{64}$/.test(txId)) {
      setError("That doesn't look like a transaction ID. It should be a long code of 64 letters and numbers. You can also paste an explorer link.");
      return;
    }
    setLoading(true);
    setError("");
    setStory(null);
    try {
      const res = await fetch(
        `https://api.kaspa.org/transactions/${txId}?resolve_previous_outpoints=light`,
        { headers: { Accept: "application/json" } }
      );
      if (res.status === 404) {
        setError("We couldn't find that transaction. Double-check the code — or if you just sent it, wait a few seconds and try again.");
        return;
      }
      if (!res.ok) throw new Error(`Network error (${res.status})`);
      const tx = await res.json();
      setStory(explainKaspaTx(tx));
    } catch (err) {
      setError(`Something went wrong looking that up: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-3xl mx-auto px-4 md:px-6 relative z-10">
        <SlobzNav backTo="/Slobz" />

        {/* Header */}
        <div className="text-center mt-6 mb-8">
          <motion.img
            src={SLOB_DETECTIVE}
            alt="Slob detective"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 rounded-[22px] object-cover shadow-[0_10px_24px_rgba(124,92,252,0.28)] mx-auto mb-4 rotate-[-3deg]"
          />
          <h1 className="font-display text-3xl md:text-4xl font-black text-[#4A2FA8]">
            What did that transaction do?
          </h1>
          <p className="text-sm text-[#5A4B8A] mt-2 max-w-md mx-auto">
            Paste any Kaspa transaction ID and we'll explain it in plain English. No confusing numbers, no jargon.
          </p>
        </div>

        {/* Input */}
        <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-5 md:p-6">
          <label className="text-[10px] tracking-[0.3em] text-[#7C5CFC] font-bold uppercase block mb-2">
            Paste the transaction code here
          </label>
          <textarea
            value={txInput}
            onChange={(e) => { setTxInput(e.target.value); setError(""); }}
            placeholder="Example: 8fc03b8b1a4c... (64 characters) or an explorer link"
            rows={2}
            className="w-full bg-[#EBE6F8] border-2 border-transparent focus:border-[#7C5CFC] rounded-[18px] p-4 text-sm font-mono text-[#1F1B2E] resize-none outline-none transition-colors"
          />
          <button
            onClick={track}
            disabled={loading || !txInput.trim()}
            className="w-full mt-3 px-8 py-3.5 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] hover:from-[#FF7A59] hover:to-[#F05A3B] disabled:opacity-50 shadow-[0_10px_24px_rgba(249,107,76,0.45)] font-display text-sm font-extrabold text-white transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> LOOKING IT UP...</>
            ) : (
              <><Search className="w-4 h-4" /> EXPLAIN THIS TRANSACTION</>
            )}
          </button>
          {error && (
            <p className="text-sm text-[#C0392B] bg-red-50 border border-red-200 rounded-[14px] p-3 mt-3">{error}</p>
          )}
        </div>

        {/* Story result */}
        {story && (
          <div className="mt-6">
            <TxStoryCard story={story} />
          </div>
        )}

        {/* Helper tip */}
        {!story && !loading && (
          <p className="text-xs text-[#7A7290] text-center mt-6 max-w-sm mx-auto">
            💡 Tip: after you send KAS, your wallet shows a "transaction ID" or "hash" — that's the code to paste here.
          </p>
        )}
      </div>
    </div>
  );
}