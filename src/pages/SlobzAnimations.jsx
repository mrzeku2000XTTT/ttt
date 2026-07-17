import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, Clapperboard } from "lucide-react";
import SlobzNav from "@/components/slobz/SlobzNav";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import AnimationCard from "@/components/slobzanimations/AnimationCard";
import PostAnimationForm from "@/components/slobzanimations/PostAnimationForm";

// Official Slobz clay animations — how the app works, no words needed
const OFFICIAL_ANIMATIONS = [
  { title: "Chaos Intake", url: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/8e9600c07_Chaos_Intake.mp4" },
  { title: "Chaos → Skills", url: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/bfe603498_Skills_Transform.mp4" },
  { title: "Claim a Gig", url: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/7c27d3304_Gig_Claim.mp4" },
  { title: "Escrow Locks", url: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/d158e3f16_Escrow_Lock.mp4" },
  { title: "Proof → Payout", url: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/ac2f3dd5d_Proof_Release.mp4" },
  { title: "Wellness Recharge", url: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/61be51916_Wellness_Recharge.mp4" },
];

export default function SlobzAnimations() {
  const [anims, setAnims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.SlobzAnimation.list("-created_date", 50);
      setAnims(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        <SlobzNav />

        <div className="text-center mb-8 pt-4">
          <h1 className="font-display text-3xl md:text-4xl font-black text-[#4A2FA8]">Animation Station</h1>
          <p className="text-sm text-[#5A4B8A] mt-2">Clay animations from the community. Love one? Tip the animator in KAS.</p>
        </div>

        {/* Post animation */}
        <div className="mb-10 max-w-xl mx-auto">
          {!showPost ? (
            <button
              onClick={() => setShowPost(true)}
              className="w-full py-4 rounded-[28px] bg-[#FDFBF7] hover:bg-white shadow-[0_16px_40px_rgba(124,92,252,0.14)] text-[#7C5CFC] text-xs font-display font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> POST YOUR ANIMATION FOR TIPS
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-[#1F1B2E]">Post an Animation</h2>
                <button onClick={() => setShowPost(false)} className="p-2 rounded-full hover:bg-[#F3F0FA] text-[#8B84A3]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <PostAnimationForm
                onPosted={() => {
                  setShowPost(false);
                  load();
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Community animations */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-[#7C5CFC]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : anims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {anims.map((anim) => (
              <AnimationCard key={anim.id} anim={anim} onTipped={load} />
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-[#8B84A3] mb-14">No community animations yet — be the first to post one.</div>
        )}

        {/* Official Slobz animations */}
        <div className="flex items-center gap-2 mb-5">
          <Clapperboard className="w-5 h-5 text-[#7C5CFC]" />
          <h2 className="font-display text-xl font-black text-[#4A2FA8]">How Slobz Works — Official Clay Shorts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OFFICIAL_ANIMATIONS.map((v) => (
            <div key={v.url} className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] overflow-hidden">
              <video src={v.url} controls loop playsInline className="w-full aspect-video object-cover bg-[#E9E4F5]" />
              <div className="p-4">
                <h3 className="font-heading text-sm font-semibold text-[#1F1B2E]">{v.title}</h3>
                <p className="text-[10px] text-[#8B84A3] mt-0.5">Slobz Studio · claymation</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}