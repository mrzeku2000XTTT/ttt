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
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-gray-200/40"
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">SLOBZ MOMENTUM TRACK</h3>
        <p className="text-xs text-gray-500 mt-0.5">Low-stress micro-gigs. Instant payout. Zero friction.</p>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No micro-gigs available right now. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-gray-800">{task.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{task.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                  <DollarSign className="w-3 h-3" />{task.payout_usd}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />~{task.estimated_minutes}min
                </span>
              </div>
              {task.status === "available" ? (
                <button
                  onClick={() => handleClaim(task.id)}
                  disabled={claiming === task.id}
                  className="w-full h-9 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {claiming === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "CLAIM GIG"}
                </button>
              ) : (
                <div className="w-full h-9 rounded-xl bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {task.status === "claimed" ? "CLAIMED" : "DONE"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}