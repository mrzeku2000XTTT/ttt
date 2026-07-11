import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Sparkles, Star, Snowflake } from "lucide-react";

const STORAGE_KEY = "ttt_advent_doors";
const GOLD = "rgba(200,160,70,0.9)";
const GOLD_DIM = "rgba(200,150,40,0.35)";

// Outcomes — weighted. "chest" opens the Community Chest.
const OUTCOMES = [
  { type: "chest", weight: 5 },
  { type: "msg", weight: 4, text: "◆ KASPA WISDOM ◆\nThe DAG remembers every block. Patience compounds." },
  { type: "msg", weight: 4, text: "✦ LUCKY STAR ✦\nGood fortune follows you today. Tap on, tipper." },
  { type: "msg", weight: 3, text: "❄ FROZEN BLOCK ❄\nEmpty this time… but the chain keeps building." },
  { type: "msg", weight: 3, text: "⚡ SPEED BLESSING ⚡\n1 second blocks. 1 second dreams. Keep moving." },
  { type: "msg", weight: 3, text: "🎵 KAS TUNES 🎵\nThe dollar is dying — but the music plays on." },
  { type: "msg", weight: 2, text: "👻 GHOSTDAG SPIRIT 👻\nA phantom passed through this door. Nothing remains." },
  { type: "msg", weight: 2, text: "🚀 地球到火星 🚀\nEarth to Mars. You're on the right rocket." },
];

function rollOutcome() {
  const total = OUTCOMES.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of OUTCOMES) { r -= o.weight; if (r <= 0) return o; }
  return OUTCOMES[OUTCOMES.length - 1];
}

function loadDoors() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveDoors(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

const DOOR_ICONS = [Gift, Star, Snowflake, Sparkles];

export default function AdventCalendar({ onClose, onOpenChest, sounds }) {
  const [doors, setDoors] = useState(() => loadDoors());
  const [reveal, setReveal] = useState(null); // { num, outcome }

  useEffect(() => { saveDoors(doors); }, [doors]);

  const openDoor = (num) => {
    sounds?.playSelect?.();
    const existing = doors[num];
    const outcome = existing || (() => {
      const o = rollOutcome();
      return o.type === "chest" ? { type: "chest" } : { type: "msg", text: o.text };
    })();
    if (!existing) setDoors(prev => ({ ...prev, [num]: outcome }));
    setReveal({ num, outcome });
  };

  const closeReveal = () => {
    const wasChest = reveal?.outcome?.type === "chest";
    setReveal(null);
    if (wasChest) { onClose(); onOpenChest(); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
        style={{ background: "#0d0a04", border: "2px solid rgba(200,150,40,0.5)", boxShadow: "0 0 80px rgba(200,140,0,0.15)" }}>

        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1" style={{ color: GOLD }}>
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5 mt-2">
          <div className="text-[18px] font-black tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: "monospace" }}>
            ADVENT CALENDAR
          </div>
          <div className="text-[9px] tracking-[0.35em] uppercase mt-1" style={{ color: "rgba(200,150,40,0.45)", fontFamily: "monospace" }}>
            OPEN A DOOR · SOME HIDE THE COMMUNITY CHEST
          </div>
        </div>

        {/* Door grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => {
            const opened = doors[num];
            const isChest = opened?.type === "chest";
            const Icon = DOOR_ICONS[num % DOOR_ICONS.length];
            return (
              <motion.button key={num} whileTap={{ scale: 0.9 }} onClick={() => openDoor(num)}
                className="aspect-square flex flex-col items-center justify-center gap-1 relative touch-manipulation"
                style={{
                  border: opened ? `1px solid ${isChest ? "rgba(240,200,60,0.9)" : "rgba(200,150,40,0.25)"}` : `1.5px solid ${GOLD_DIM}`,
                  background: opened
                    ? (isChest ? "rgba(200,150,40,0.18)" : "rgba(200,150,40,0.04)")
                    : "linear-gradient(145deg, rgba(200,150,40,0.12), rgba(0,0,0,0.6))",
                  boxShadow: isChest ? "0 0 16px rgba(240,200,60,0.3)" : "none",
                }}>
                {opened ? (
                  isChest
                    ? <Gift className="w-5 h-5" style={{ color: "#f5d050" }} />
                    : <span className="text-[16px] leading-none opacity-50">{opened.text.split("\n")[0].slice(0, 2)}</span>
                ) : (
                  <Icon className="w-3.5 h-3.5" style={{ color: "rgba(200,150,40,0.35)" }} />
                )}
                <span className="text-[11px] font-bold" style={{ color: opened ? "rgba(200,150,40,0.4)" : GOLD, fontFamily: "monospace" }}>
                  {num}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="text-center mt-4 text-[8px] tracking-[0.3em] uppercase" style={{ color: "rgba(120,90,25,0.4)", fontFamily: "monospace" }}>
          ◆ EACH DOOR IS RANDOM · CHEST DOORS GLOW GOLD ◆
        </div>
      </div>

      {/* Reveal overlay */}
      <AnimatePresence>
        {reveal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={closeReveal}>
            <motion.div initial={{ scale: 0.7, rotateY: 90 }} animate={{ scale: 1, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="w-full max-w-xs p-6 text-center"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0d0a04",
                border: reveal.outcome.type === "chest" ? "2px solid #f5d050" : "2px solid rgba(200,150,40,0.4)",
                boxShadow: reveal.outcome.type === "chest" ? "0 0 60px rgba(240,200,60,0.4)" : "0 0 40px rgba(0,0,0,0.8)",
              }}>
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                DOOR {reveal.num}
              </div>
              {reveal.outcome.type === "chest" ? (
                <>
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <Gift className="w-14 h-14 mx-auto mb-3" style={{ color: "#f5d050" }} />
                  </motion.div>
                  <div className="text-[15px] font-black tracking-[0.2em] uppercase mb-2" style={{ color: "#f5d050", fontFamily: "monospace" }}>
                    COMMUNITY CHEST!
                  </div>
                  <div className="text-[10px] tracking-wider mb-4" style={{ color: "rgba(200,160,70,0.6)", fontFamily: "monospace" }}>
                    You found the chest — make a wish for free KAS
                  </div>
                  <button onClick={closeReveal}
                    className="w-full py-3 text-[11px] font-black tracking-[0.3em] uppercase touch-manipulation"
                    style={{ background: "#f5d050", color: "#000", fontFamily: "monospace" }}>
                    ▶ OPEN THE CHEST
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[13px] whitespace-pre-line leading-relaxed mb-4" style={{ color: GOLD, fontFamily: "monospace" }}>
                    {reveal.outcome.text}
                  </div>
                  <button onClick={closeReveal}
                    className="w-full py-2.5 text-[10px] font-bold tracking-[0.3em] uppercase touch-manipulation"
                    style={{ border: "1px solid rgba(200,150,40,0.4)", color: GOLD, background: "transparent", fontFamily: "monospace" }}>
                    CLOSE
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}