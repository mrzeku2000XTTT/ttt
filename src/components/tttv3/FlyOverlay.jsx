import React, { useEffect, useState, useRef } from "react";

/**
 * FlyOverlay — a tiny SVG fly that buzzes around the entire viewport on random paths.
 * Fixed position, pointer-events disabled, very high z-index but non-blocking.
 */
export default function FlyOverlay() {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [angle, setAngle] = useState(0);
  const [resting, setResting] = useState(false);
  const targetRef = useRef({ x: 100, y: 100 });
  const rafRef = useRef(null);

  // Pick new random target every 1.2-2.5s, occasionally rest 0.5-1.5s
  useEffect(() => {
    const pickTarget = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      targetRef.current = {
        x: 40 + Math.random() * (w - 80),
        y: 40 + Math.random() * (h - 80),
      };

      // Random rest chance (~20%)
      if (Math.random() < 0.2) {
        setResting(true);
        setTimeout(() => setResting(false), 500 + Math.random() * 1000);
      }

      const next = 1200 + Math.random() * 1300;
      setTimeout(pickTarget, next);
    };
    const t = setTimeout(pickTarget, 800);
    return () => clearTimeout(t);
  }, []);

  // Animation loop — chase target with darty, jittery motion
  useEffect(() => {
    let prevX = pos.x;
    let prevY = pos.y;

    const tick = () => {
      setPos((p) => {
        const dx = targetRef.current.x - p.x;
        const dy = targetRef.current.y - p.y;
        // Darty acceleration + small jitter for fly-like motion
        const speed = resting ? 0 : 0.06;
        const jitter = resting ? 0 : (Math.random() - 0.5) * 4;
        const nx = p.x + dx * speed + jitter;
        const ny = p.y + dy * speed + jitter;

        // Update facing angle from movement vector
        const moveX = nx - prevX;
        const moveY = ny - prevY;
        if (Math.abs(moveX) + Math.abs(moveY) > 0.5) {
          setAngle(Math.atan2(moveY, moveX) * (180 / Math.PI));
        }
        prevX = nx;
        prevY = ny;
        return { x: nx, y: ny };
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [resting]);

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        willChange: "transform",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          // +90° offset so the fly's "forward" axis (its head) aligns with movement direction
          transform: `rotate(${angle + 90}deg)`,
          transformOrigin: "center",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 40 40" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }}>
          {/* Wings — flap fast */}
          <ellipse
            cx="13"
            cy="14"
            rx="7"
            ry="11"
            fill="rgba(200, 220, 255, 0.45)"
            style={{
              transformOrigin: "20px 20px",
              animation: resting ? "none" : "flyWingL 0.06s ease-in-out infinite alternate",
            }}
          />
          <ellipse
            cx="27"
            cy="14"
            rx="7"
            ry="11"
            fill="rgba(200, 220, 255, 0.45)"
            style={{
              transformOrigin: "20px 20px",
              animation: resting ? "none" : "flyWingR 0.06s ease-in-out infinite alternate",
            }}
          />
          {/* Body */}
          <ellipse cx="20" cy="22" rx="5" ry="9" fill="#1a1a1a" />
          <ellipse cx="20" cy="14" rx="3.5" ry="3.5" fill="#0a0a0a" />
          {/* Eyes — tiny red glints */}
          <circle cx="18.5" cy="13" r="0.9" fill="#dc2626" />
          <circle cx="21.5" cy="13" r="0.9" fill="#dc2626" />
          {/* Body segment lines */}
          <line x1="17" y1="20" x2="23" y2="20" stroke="#000" strokeWidth="0.4" opacity="0.5" />
          <line x1="17" y1="24" x2="23" y2="24" stroke="#000" strokeWidth="0.4" opacity="0.5" />
        </svg>
      </div>

      <style>{`
        @keyframes flyWingL {
          0% { transform: scaleX(1) rotate(-15deg); }
          100% { transform: scaleX(0.3) rotate(-30deg); }
        }
        @keyframes flyWingR {
          0% { transform: scaleX(1) rotate(15deg); }
          100% { transform: scaleX(0.3) rotate(30deg); }
        }
      `}</style>
    </div>
  );
}