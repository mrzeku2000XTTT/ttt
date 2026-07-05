import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import TransactionDetailWidget from "./TransactionDetailWidget";

const NUM_SLOTS = 10;
const POLL_MS = 12000;

function shortHash(hash) {
  if (!hash) return "";
  const h = String(hash).replace(/^tx_/, "");
  return h.length > 10 ? `${h.slice(0, 4)}…${h.slice(-4)}` : h;
}

export default function TransactionOverlay() {
  const [txPool, setTxPool] = useState([]);
  const [selected, setSelected] = useState(null);
  const mountedRef = useRef(true);

  const slots = useMemo(() => {
    return Array.from({ length: NUM_SLOTS }, (_, i) => {
      const angle = (i / NUM_SLOTS) * 360 + (Math.random() * 18 - 9);
      const duration = 7 + Math.random() * 5;
      const delay = -Math.random() * duration;
      return { angle, duration, delay, key: i };
    });
  }, []);

  const fetchTxs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getLiveKaspaTransactions", {});
      const list = res?.data?.transactions || res?.transactions || [];
      if (Array.isArray(list) && list.length > 0) {
        const cleaned = list
          .filter((t) => t && t.hash)
          .map((t) => ({
            hash: t.hash,
            short: shortHash(t.hash),
            amount: t.amount,
            timestamp: t.timestamp,
            from: t.from,
            to: t.to,
          }));
        if (mountedRef.current && cleaned.length > 0) setTxPool(cleaned);
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

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
        aria-hidden="true"
      >
        {txPool.length > 0 &&
          slots.map((slot, i) => {
            const tx = txPool[i % txPool.length];
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
                  <button
                    onClick={() => setSelected(tx)}
                    className="pointer-events-auto absolute font-mono whitespace-nowrap cursor-pointer transition-all hover:scale-125 hover:z-20"
                    style={{
                      left: "0.5vmin",
                      top: "0",
                      transform: `translateY(-50%) ${flip ? "rotate(180deg)" : ""}`,
                      fontSize: "9px",
                      color: "rgba(253, 185, 49, 0.9)",
                      textShadow: "0 0 6px rgba(253, 185, 49, 0.55)",
                      background: "transparent",
                      border: "none",
                      padding: "2px 4px",
                      lineHeight: 1,
                    }}
                    title="View transaction details"
                  >
                    {tx.short}
                  </button>
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

      {selected && (
        <TransactionDetailWidget
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}