import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, ImagePlus, ShieldAlert, Upload } from 'lucide-react';
import { VERIFY_TIPS } from './verifyTips';

/** While the AI verifies an X profile: proof instructions + rotating safety tips. */
export default function XProfileVerifyPanel({ handle, busy, proofFile, onProofFile, onSendProof }) {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % VERIFY_TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3.5">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 flex-shrink-0 text-cyan-300" />
        <p className="text-[12px] font-semibold text-cyan-200">
          {busy ? `Verifying ${handle ? `@${handle}` : 'your profile'} — prove it's you` : 'Prove it\u2019s you'}
        </p>
      </div>

      <ol className="space-y-1 text-[11px] leading-relaxed text-white/55">
        <li>1. Post a Kaspa meme on your X account.</li>
        <li>2. Send the proof as an image — it's filed with your listing for review.</li>
      </ol>

      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-cyan-400/30 bg-white/[0.03] px-3 text-[11px] text-cyan-200/80 transition-colors hover:border-cyan-400/50">
        <ImagePlus className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{proofFile ? proofFile.name : 'Attach proof image'}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onProofFile(e.target.files?.[0] || null)}
        />
      </label>

      {proofFile && (
        <img
          src={URL.createObjectURL(proofFile)}
          alt="Proof preview"
          className="h-24 w-full rounded-lg border border-white/10 object-cover"
        />
      )}

      {!busy && (
        <button
          onClick={onSendProof}
          disabled={!proofFile}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 text-[12px] font-bold text-black transition-transform active:scale-95 disabled:opacity-40"
        >
          <Upload className="h-3.5 w-3.5" /> Send proof
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={tipIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300" />
          <p className="text-[11px] leading-relaxed text-white/60">{VERIFY_TIPS[tipIdx]}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}