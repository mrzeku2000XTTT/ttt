import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Sparkles, Star, Snowflake, Megaphone, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdventWalletBar from "@/components/landing/advent/AdventWalletBar";
import AdventRules from "@/components/landing/advent/AdventRules";
import AdventRevealModal from "@/components/landing/advent/AdventRevealModal";
import AdventSponsorModal from "@/components/landing/advent/AdventSponsorModal";

const WALLET_KEY = "advent_wallet_address";
const GOLD = "rgba(200,160,70,0.9)";
const GOLD_DIM = "rgba(200,150,40,0.35)";
const DOOR_ICONS = [Gift, Star, Snowflake, Sparkles];

export default function AdventCalendar({ onClose, onOpenChest, sounds }) {
  const [wallet, setWallet] = useState(() => localStorage.getItem(WALLET_KEY) || "");
  const [keys, setKeys] = useState(0);
  const [doors, setDoors] = useState({});
  const [openedToday, setOpenedToday] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingDoor, setLoadingDoor] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [showSponsor, setShowSponsor] = useState(false);
  const [notice, setNotice] = useState("");

  // Best-effort autofill from TTT main wallet — never REQUIRES login
  useEffect(() => {
    if (wallet) return;
    base44.auth.me().then((u) => {
      const a = u?.created_wallet_address;
      if (a) { setWallet(a); localStorage.setItem(WALLET_KEY, a); }
    }).catch(() => {
      const saved = localStorage.getItem("chest_wallet_address");
      if (saved) { setWallet(saved); localStorage.setItem(WALLET_KEY, saved); }
    });
  }, [wallet]);

  const loadState = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await base44.functions.invoke("adventState", { wallet_address: wallet });
      setKeys(res.data.keys || 0);
      setDoors(res.data.doors || {});
      setOpenedToday(!!res.data.opened_today);
      setIsAdmin(!!res.data.is_admin);
    } catch {}
  }, [wallet]);

  useEffect(() => { loadState(); }, [loadState]);

  const changeWallet = (a) => {
    localStorage.setItem(WALLET_KEY, a);
    setWallet(a);
    setKeys(0);
    setDoors({});
    setOpenedToday(false);
  };

  const openDoor = async (num) => {
    sounds?.playSelect?.();
    setNotice("");
    if (!wallet) { setNotice("SET YOUR KASPA ADDRESS FIRST — IT TRACKS YOUR KEYS & PAYOUTS"); return; }
    if (doors[num]) { setReveal({ num, door: doors[num] }); return; }
    if (openedToday && !isAdmin) { setNotice("ONE DOOR PER DAY — COME BACK TOMORROW FOR MORE KEYS!"); return; }
    setLoadingDoor(num);
    try {
      const res = await base44.functions.invoke("adventOpenDoor", { wallet_address: wallet, door_number: num });
      if (res.data?.door) {
        setDoors((prev) => ({ ...prev, [num]: res.data.door }));
        if (typeof res.data.keys === "number") setKeys(res.data.keys);
        if (!isAdmin && !res.data.already_opened) setOpenedToday(true);
        setReveal({ num, door: res.data.door });
      }
    } catch (err) {
      setNotice(err?.response?.data?.message || "COULD NOT OPEN THIS DOOR RIGHT NOW");
    }
    setLoadingDoor(null);
  };

  const onProofProgress = (data, num) => {
    if (typeof data.keys === "number") setKeys(data.keys);
    setDoors((prev) => ({ ...prev, [num]: { ...prev[num], completed: true } }));
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

        <div className="text-center mb-4 mt-2">
          <div className="text-[18px] font-black tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: "monospace" }}>
            ADVENT CALENDAR
          </div>
          <div className="text-[9px] tracking-[0.3em] uppercase mt-1" style={{ color: "rgba(200,150,40,0.45)", fontFamily: "monospace" }}>
            DAILY DOORS · EARN KEYS · FIND SPONSOR CHESTS
          </div>
        </div>

        <AdventWalletBar wallet={wallet} onChange={changeWallet} keys={keys} />
        <AdventRules />

        {notice && (
          <div className="mb-3 px-3 py-2 text-[9px] font-bold tracking-wider text-center"
            style={{ border: "1px solid rgba(240,200,60,0.4)", color: "#f5d050", background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
            {notice}
          </div>
        )}

        {/* Door grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => {
            const opened = doors[num];
            const isChest = opened?.type === "chest";
            const Icon = DOOR_ICONS[num % DOOR_ICONS.length];
            return (
              <motion.button key={num} whileTap={{ scale: 0.9 }} onClick={() => openDoor(num)}
                disabled={loadingDoor !== null}
                className="aspect-square flex flex-col items-center justify-center gap-1 relative touch-manipulation"
                style={{
                  border: opened ? `1px solid ${isChest ? "rgba(240,200,60,0.9)" : "rgba(200,150,40,0.25)"}` : `1.5px solid ${GOLD_DIM}`,
                  background: opened
                    ? (isChest ? "rgba(200,150,40,0.18)" : "rgba(200,150,40,0.04)")
                    : "linear-gradient(145deg, rgba(200,150,40,0.12), rgba(0,0,0,0.6))",
                  boxShadow: isChest ? "0 0 16px rgba(240,200,60,0.3)" : "none",
                }}>
                {loadingDoor === num ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#f5d050" }} />
                ) : opened ? (
                  isChest
                    ? <Gift className="w-5 h-5" style={{ color: "#f5d050" }} />
                    : <span className="text-[14px] leading-none opacity-60" style={{ color: GOLD }}>{opened.completed ? "✓" : opened.type === "task" ? "▲" : "◆"}</span>
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

        {/* Sponsor CTA */}
        <button onClick={() => { sounds?.playSelect?.(); setShowSponsor(true); }}
          className="w-full mt-4 py-3 text-[10px] font-black tracking-[0.25em] uppercase flex items-center justify-center gap-2 touch-manipulation"
          style={{ border: "1px solid rgba(240,200,60,0.5)", color: "#f5d050", background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
          <Megaphone className="w-3.5 h-3.5" /> DONATE 1 KAS · ADVERTISE YOUR PRODUCT
        </button>

        {onOpenChest && (
          <button onClick={() => { onClose(); onOpenChest(); }}
            className="w-full mt-2 py-2 text-[8px] font-bold tracking-[0.3em] uppercase touch-manipulation"
            style={{ color: "rgba(200,150,40,0.4)", fontFamily: "monospace" }}>
            MAKE A WISH AT THE COMMUNITY CHEST →
          </button>
        )}

        <div className="text-center mt-2 text-[8px] tracking-[0.3em] uppercase" style={{ color: "rgba(120,90,25,0.4)", fontFamily: "monospace" }}>
          ◆ ADVENT KEYS = REPUTATION · NEVER PRIVATE KEYS ◆
        </div>
      </div>

      <AnimatePresence>
        {reveal && (
          <AdventRevealModal wallet={wallet} doorNum={reveal.num} door={doors[reveal.num] || reveal.door}
            onClose={() => setReveal(null)} onProgress={onProofProgress} />
        )}
        {showSponsor && (
          <AdventSponsorModal wallet={wallet} onClose={() => { setShowSponsor(false); loadState(); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}