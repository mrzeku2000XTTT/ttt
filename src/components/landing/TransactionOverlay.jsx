import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const NUM_RADIAL_LINES = 28;
const MAX_VISIBLE = 9;
const POLL_MS = 12000;

function shortHash(hash) {
  if (!hash) return "";
  const h = String(hash).replace(/^tx_/, "");
  return h.length > 10 ? `${h.slice(0, 4)}…${h.slice(-4)}` : h;
}

export default function TransactionOverlay() {
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  const fetchTxs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getLiveKaspaTransactions", {});
      const list = res?.data?.transactions || res?.transactions || [];
      if (!Array.isArray(list) || list.length === 0) {
        setError(true);
        return;
      }
      setError(false);
      // Pick a rotating slice so positions shift over time
      const slice = list.slice(0, MAX_VISIBLE).map((t, i) => ({
        id: t.hash || `${t.timestamp}-${i}`,
        hash: shortHash(t.hash),
        amount: t.amount,
        lineIndex: i % NUM_RADIAL_LINES,
        radius: 30 + ((i * 13) % 38), // 30–68% from center
      }));
      if (mountedRef.current) setTxs(slice);
    } catch (e) {
      if (mountedRef.current) setError(true);
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

  if (error || txs.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      {txs.map((tx, i) => {
        const angle = (tx.lineIndex / NUM_RADIAL_LINES) * 360;
        const rad = (angle * Math.PI) / 180;
        const xPct = 50 + tx.radius * Math.cos(rad);
        const yPct = 50 + tx.radius * Math.sin(rad);
        // Rotate text to lie along the radial line; flip if on left half for readability
        const onLeft = Math.cos(rad) < 0;
        const rotation = onLeft ? angle + 180 : angle;

        return (
          <div
            key={tx.id}
            className="absolute"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) translate(${onLeft ? "-50%" : "0"}, -50%)`,
              animation: `txFade 600ms ease-out both`,
              animationDelay: `${i * 70}ms`,
            }}
          >
            <span
              className="font-mono text-[8px] sm:text-[9px] tracking-wider whitespace-nowrap"
              style={{
                color: "rgba(253, 185, 49, 0.85)",
                textShadow: "0 0 6px rgba(253, 185, 49, 0.6)",
              }}
            >
              {tx.hash}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes txFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}