import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Clock, DollarSign, Check, Loader2 } from "lucide-react";

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
      <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-[#EDE9E1] p-8 flex items-center justify-center text-[#8A857C]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-[#EDE9E1] p-6 md:p-7"
    >
      <div className="mb-4">
        <h3 className="font-heading text-lg font-semibold text-[#1A1A1A]">Slobz Momentum Track</h3>
        <p className="text-xs text-[#8A857C] mt-0.5">Low-stress micro-gigs. Instant payout. Zero friction.</p>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-[#8A857C] text-center py-6">No micro-gigs available right now. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-2.5">
          {tasks.map((task) => (
            <div key={task.id} className="bg-[#FBF7F0] rounded-xl p-3.5 border border-[#F0EDE5]">
              <div className="text-xs font-bold text-[#1A1A1A] leading-snug mb-1">{task.title}</div>
              <div className="text-[10px] text-[#8A857C] leading-snug mb-2.5 line-clamp-2">{task.description}</div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#0D5B3A]">
                  <DollarSign className="w-3 h-3" />{task.payout_usd}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-[#8A857C]">
                  <Clock className="w-3 h-3" />{task.estimated_minutes}m
                </span>
              </div>
              {task.status === "available" ? (
                <button
                  onClick={() => handleClaim(task.id)}
                  disabled={claiming === task.id}
                  className="w-full h-7 rounded-lg bg-[#0D5B3A] hover:bg-[#0A4A30] text-white text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                >
                  {claiming === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "CLAIM GIG"}
                </button>
              ) : (
                <div className="w-full h-7 rounded-lg bg-[#E8E4DD] text-[#8A857C] text-[10px] font-bold flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" /> {task.status === "claimed" ? "CLAIMED" : "DONE"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}