import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Clock, DollarSign, Check, Loader2 } from "lucide-react";

const CLAY_FACE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ff7c5a573_generated_image.png";

export default function MomentumTrack() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await base44.entities.SlobMicroTask.list("-created_date", 20);
      setTasks(res);
    } catch (e) {
      console.warn("Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (taskId) => {
    setClaiming(taskId);
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.SlobMicroTask.update(taskId, {
        status: "claimed",
        claimed_by: user?.email || "guest",
      });
      await loadTasks();
    } catch (e) {
      console.warn("Claim failed:", e);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-8 flex items-center justify-center text-[#7C5CFC]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-6 md:p-7"
    >
      <div className="mb-4">
        <h3 className="font-heading text-2xl font-semibold text-[#1F1B2E]">Slobz Momentum Track</h3>
        <p className="text-xs text-[#7A7290] mt-1">Low-stress micro-gigs. Instant payout. Zero friction.</p>
      </div>

      <div className="rounded-[20px] overflow-hidden mb-4 bg-[#7C5CFC]">
        <img src={CLAY_FACE} alt="Slobz mascot" className="w-full h-36 md:h-44 object-cover object-center" />
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-[#7A7290] text-center py-6">No micro-gigs available right now. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tasks.map((task) => {
            const claimed = task.status !== "available";
            return (
              <div
                key={task.id}
                className={`rounded-[18px] p-3.5 ${
                  claimed
                    ? "bg-[#8B6FF5] shadow-[0_6px_16px_rgba(124,92,252,0.35)]"
                    : "bg-white shadow-[0_4px_14px_rgba(90,70,160,0.1)]"
                }`}
              >
                <div className={`text-xs font-bold leading-snug mb-1 font-display ${claimed ? "text-white" : "text-[#1F1B2E]"}`}>
                  {task.title}
                </div>
                <div className={`text-[10px] leading-snug mb-2.5 line-clamp-2 ${claimed ? "text-white/75" : "text-[#8B84A3]"}`}>
                  {task.description}
                </div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className={`flex items-center gap-0.5 text-[11px] font-bold ${claimed ? "text-white" : "text-[#7C5CFC]"}`}>
                    <DollarSign className="w-3 h-3" />{task.payout_usd}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[10px] ${claimed ? "text-white/70" : "text-[#8B84A3]"}`}>
                    <Clock className="w-3 h-3" />{task.estimated_minutes}m
                  </span>
                </div>
                {!claimed ? (
                  <button
                    onClick={() => handleClaim(task.id)}
                    disabled={claiming === task.id}
                    className="w-full h-8 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] hover:from-[#FF7A59] hover:to-[#F05A3B] text-white text-[10px] font-display font-extrabold flex items-center justify-center gap-1 disabled:opacity-50 shadow-[0_4px_10px_rgba(249,107,76,0.35)] transition-all"
                  >
                    {claiming === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "CLAIM GIG"}
                  </button>
                ) : (
                  <div className="w-full h-8 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-display font-extrabold flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> {task.status === "claimed" ? "CLAIMED" : "DONE"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}