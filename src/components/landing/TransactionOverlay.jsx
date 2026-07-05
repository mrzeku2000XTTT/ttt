import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const NUM_SLOTS = 10;
const POLL_MS = 12000;

function shortHash(hash) {
  if (!hash) return "";
  const h = String(hash).replace(/^tx_/, "");
  return h.length > 10 ? `${h.slice(0, 4)}…${h.slice(-4)}` : h;
}

export default function TransactionOverlay() {
  const [hashPool, setHashPool] = useState([]);
  const mountedRef = useRef(true);

  // Precompute slot geometry: full 360° spread, varied speed/delay for organic flow
  const slots = useMemo(() => {
    return Array.from({ length: NUM_SLOTS }, (_, i) => {
      const angle = (i / NUM_SLOTS) * 360 + (Math.random() * 18 - 9);
      const duration = 7 + Math.random() * 5; // 7–12s per inward cycle
      const delay = -Math.random() * duration; // negative = start mid-cycle
      return { angle, duration, delay, key: i };
    });
  }, []);

  const fetchTxs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getLiveKaspaTransactions", {});
      const list = res?.data?.transactions || res?.transactions || [];
      if (Array.isArray(list) && list.length > 0) {
        const hashes = list.map((t) => shortHash(t.hash)).filter(Boolean);
        if (mountedRef.current && hashes.length > 0) setHashPool(hashes);
      }
    } catch (e) {
      // silent — overlay just stays empty
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchTxs();
    const interval = setInterval(fetchTxs, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchTxs]);

  if (hashPool.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      {slots.map((slot, i) => {
        const hash = hashPool[i % hashPool.length] || "";
        // Flip text on the left half so it reads upright, not upside-down
        const flip = Math.cos((slot.angle * Math.PI) / 180) < 0;
        return (
          <div
            key={slot.key}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `rotate(${slot.angle}deg)` }}
          >
            <div
              className="absolute"
              style={{
                animation: `tttFlowToCenter ${slot.duration}s linear infinite`,
                animationDelay: `${slot.delay}s`,
                willChange: "transform, opacity",
              }}
            >
              {/* Trailing streak pointing toward center (-X in rotated frame) */}
              <div
                className="absolute"
                style={{
                  left: "-20vmin",
                  top: "-0.5px",
                  width: "20vmin",
                  height: "1px",
                  background:
                    "linear-gradient(to right, rgba(253,185,49,0) 0%, rgba(253,185,49,0.55) 100%)",
                }}
              />
              {/* Transaction hash, riding the line; flipped upright on left half */}
              <span
                className="absolute font-mono whitespace-nowrap"
                style={{
                  left: "0.5vmin",
                  top: "0",
                  transform: `translateY(-50%) ${flip ? "rotate(180deg)" : ""}`,
                  fontSize: "9px",
                  color: "rgba(253, 185, 49, 0.9)",
                  textShadow: "0 0 6px rgba(253, 185, 49, 0.55)",
                }}
              >
                {hash}
              </span>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes tttFlowToCenter {
          0%   { transform: translateX(44vmin); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(13vmin); opacity: 0; }
        }
      `}</style>
    </div>
  );
}