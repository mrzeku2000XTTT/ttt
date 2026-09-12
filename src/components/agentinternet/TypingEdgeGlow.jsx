import React, { useEffect, useRef, useState } from "react";

export default function TypingEdgeGlow({ pulse }) {
  const svgRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState(false);
  const [sparks, setSparks] = useState([]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!pulse) return;
    setActive(true);
    setSparks(items => [...items.slice(-5), { id: pulse, start: Math.random() * 1000, travel: (Math.random() > 0.5 ? 1 : -1) * (400 + Math.random() * 500), hue: Math.floor(Math.random() * 3) }]);
    const timer = setTimeout(() => setActive(false), 1800);
    return () => clearTimeout(timer);
  }, [pulse]);
  const shape = { x: 1, y: 1, width: Math.max(0, size.width - 2), height: Math.max(0, size.height - 2), rx: 24, pathLength: 1000, fill: "none" };
  return (
    <svg ref={svgRef} aria-hidden="true" className={`ttt-edge-glow ${active ? "ttt-edge-active" : ""}`}>
      {[0, 1, 2].map(i => (
        <g key={i} className={`ttt-edge-runner ttt-edge-color-${i}`} style={{ "--edge-delay": `${-i * 0.8}s` }}>
          <rect {...shape} className="ttt-edge-halo" strokeDasharray="65 935" />
          <rect {...shape} className="ttt-edge-trail" strokeDasharray="45 955" />
          <rect {...shape} className="ttt-edge-core" strokeDasharray="5 995" />
        </g>
      ))}
      {sparks.map(spark => (
        <g key={spark.id} className={`ttt-edge-spark ttt-edge-color-${spark.hue}`} style={{ "--edge-start": spark.start, "--edge-end": spark.start + spark.travel }}>
          <rect {...shape} className="ttt-edge-halo" strokeDasharray="28 972" />
          <rect {...shape} className="ttt-edge-trail" strokeDasharray="18 982" />
          <rect {...shape} className="ttt-edge-core" strokeDasharray="3 997" />
        </g>
      ))}
    </svg>
  );
}