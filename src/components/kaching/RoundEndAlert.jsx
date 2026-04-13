import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { getRemainingMs } from "@/components/kaching/roundClock";

const ALERT_THRESHOLD_MS = 60000; // 60 seconds before round ends

export default function RoundEndAlert({ openGames, userBets }) {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const alertFiredRef = useRef(false);
  const lastRoundRef = useRef(null);

  // Find games where user has an active bet
  const userActiveGameIds = new Set(
    (userBets || [])
      .filter(b => b.status === "confirmed" || b.status === "pending_deposit")
      .map(b => b.game_id)
  );
  const userActiveGames = (openGames || []).filter(g => userActiveGameIds.has(g.id));

  const fireAlert = useCallback(() => {
    if (alertFiredRef.current) return;
    alertFiredRef.current = true;
    setVisible(true);

    // Desktop notification (if permission granted)
    if ("Notification" in window && Notification.permission === "granted") {
      const count = userActiveGames.length;
      const body = count > 0
        ? `You have ${count} active bet${count > 1 ? "s" : ""} in this round!`
        : "Round ending soon — last chance to bet!";
      try {
        new Notification("⏰ KaChing Round Ending!", { body, icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2c211776c_generated_image.png" });
      } catch {}
    }

    // Sonner toast as fallback / supplement
    const count = userActiveGames.length;
    if (count > 0) {
      toast.warning(`⏰ Round ends in 60s — you have ${count} active bet${count > 1 ? "s" : ""}!`, { duration: 10000 });
    } else {
      toast("⏰ Round ending in 60 seconds!", { duration: 8000 });
    }
  }, [userActiveGames.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getRemainingMs();
      const secs = Math.ceil(remaining / 1000);
      setSecondsLeft(secs);

      // Detect new round → reset alert
      const roundKey = Math.floor(Date.now() / (15 * 60 * 1000));
      if (lastRoundRef.current !== null && lastRoundRef.current !== roundKey) {
        alertFiredRef.current = false;
        setVisible(false);
      }
      lastRoundRef.current = roundKey;

      // Fire alert at 60s mark
      if (remaining <= ALERT_THRESHOLD_MS && remaining > 0 && !alertFiredRef.current) {
        fireAlert();
      }

      // Auto-hide when round ends
      if (remaining <= 0) {
        setVisible(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fireAlert]);

  // Request notification permission on mount (non-blocking)
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const dismiss = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && secondsLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-md"
        >
          <div className={`relative rounded-2xl border p-4 backdrop-blur-xl shadow-2xl ${
            userActiveGames.length > 0
              ? "bg-amber-500/15 border-amber-500/30 shadow-amber-500/10"
              : "bg-white/[0.06] border-white/[0.12] shadow-black/20"
          }`}>
            <button onClick={dismiss} className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                userActiveGames.length > 0 ? "bg-amber-500/20" : "bg-white/[0.06]"
              }`}>
                <Clock className={`w-5 h-5 ${userActiveGames.length > 0 ? "text-amber-400" : "text-white/40"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-black ${userActiveGames.length > 0 ? "text-amber-400" : "text-white/70"}`}>
                    Round Ending in {secondsLeft}s
                  </span>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-2 rounded-full bg-amber-400"
                  />
                </div>

                {userActiveGames.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-amber-300/60 text-[11px]">
                      You have {userActiveGames.length} active bet{userActiveGames.length > 1 ? "s" : ""}:
                    </p>
                    {userActiveGames.slice(0, 3).map(g => (
                      <div key={g.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/20">
                        <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-white/70 text-[10px] font-medium truncate">{g.question}</span>
                        <span className="text-amber-400/60 text-[9px] font-mono flex-shrink-0">#{g.game_number}</span>
                      </div>
                    ))}
                    {userActiveGames.length > 3 && (
                      <p className="text-amber-300/40 text-[9px]">+{userActiveGames.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/40 text-[11px]">Last chance to place your bets!</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}