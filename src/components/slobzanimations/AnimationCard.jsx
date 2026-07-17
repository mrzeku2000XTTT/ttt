import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import SlobzTipModal from "@/components/slobzanimations/SlobzTipModal";

export default function AnimationCard({ anim, onTipped }) {
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(null);

  return (
    <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] overflow-hidden">
      <video src={anim.video_url} controls loop playsInline className="w-full aspect-video object-cover bg-[#E9E4F5]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading text-base font-semibold text-[#1F1B2E] leading-snug">{anim.title}</h3>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E4F7EC] text-[#1E9E5A] text-[10px] font-display font-extrabold flex-shrink-0">
            <Coins className="w-3 h-3" /> {anim.tips_received || 0} KAS
          </span>
        </div>
        <p className="text-[11px] text-[#8B84A3] mb-3">by {anim.creator_name || "Anonymous Slob"}</p>

        {success && (
          <div className="text-[11px] rounded-[12px] px-3 py-2 mb-2 bg-[#E4F7EC] text-[#1E9E5A]">
            Tipped {success.amount} KAS! {success.txId ? `TX: ${String(success.txId).slice(0, 14)}…` : ""}
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2.5 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white text-[11px] font-display font-extrabold shadow-[0_6px_16px_rgba(249,107,76,0.35)]"
        >
          TIP THIS ANIMATION
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <SlobzTipModal
            anim={anim}
            onClose={() => setShowModal(false)}
            onSuccess={(res) => {
              setSuccess(res);
              onTipped?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}