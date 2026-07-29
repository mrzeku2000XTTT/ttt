import React, { useState, useEffect, useRef } from "react";
import { CARD_VIDEOS, AGENT_CARDS } from "./agentCards";
import { AgentCardFront, AgentCardBack } from "./AgentCardFaces";

const THICKNESS_LAYERS = [-1.47, -0.73, 0, 0.73, 1.47];

export default function AgentCardCarousel() {
  const cardCount = AGENT_CARDS.length;
  const cardsRefs = useRef([]);
  const frameId = useRef(0);
  const progress = useRef(0);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const [metrics, setMetrics] = useState({ cardW: 336, cardH: 211 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const ry = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      mouse.current.targetX = Math.max(-1, Math.min(1, rx));
      mouse.current.targetY = Math.max(-1, Math.min(1, ry));
    };
    const handleMouseLeave = () => {
      mouse.current.targetX = 0;
      mouse.current.targetY = 0;
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let cardW = Math.round(w * 0.16 + 130);
      const heightFactor = Math.min(1.0, Math.max(0.65, h / 850));
      cardW = Math.round(cardW * heightFactor);
      cardW = Math.min(336, Math.max(150, cardW));
      setMetrics({ cardW, cardH: Math.round(cardW / 1.5925) });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const renderLoop = () => {
      progress.current += 0.0016;
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

      const cards = cardsRefs.current;
      const h = window.innerHeight;
      const { cardH } = metrics;

      const continuousProgress = progress.current;
      const roundedIndex = Math.round(continuousProgress);
      const diffFromRound = continuousProgress - roundedIndex;
      const easedDiff = Math.sign(diffFromRound) * Math.pow(Math.abs(diffFromRound) * 2, 4.2) / 2;
      const virtualActiveIndex = roundedIndex + easedDiff;

      for (let i = 0; i < cardCount; i++) {
        const card = cards[i];
        if (!card) continue;

        let offset = i - virtualActiveIndex;
        const halfCount = cardCount / 2;
        while (offset > halfCount) offset -= cardCount;
        while (offset < -halfCount) offset += cardCount;

        const absOffset = Math.abs(offset);
        const sign = Math.sign(offset);

        if (absOffset > 3.0) {
          card.style.visibility = "hidden";
          continue;
        }
        card.style.visibility = "visible";

        const gap = 36;
        const peekAmount = -55;
        const D = 1350;

        let y = 0;
        let z = 0;
        let rot = 0;

        if (absOffset <= 1) {
          const t = absOffset;
          const easedT = t * t * (3 - 2 * t);
          const targetY = cardH + gap;
          y = -sign * (easedT * targetY);
          z = 400 + easedT * (220 - 400);
          rot = easedT * 132;
        } else if (absOffset <= 2) {
          const t = absOffset - 1;
          const easedT = t * t * (3 - 2 * t);
          const yStart = cardH + gap;
          const zStart = 220;
          const rotStart = 132;
          const zEnd = -60;
          const rotEnd = 175;
          const sEnd = D / (D - zEnd);
          const yEnd = (h / 2 - peekAmount) / sEnd - cardH / 2;
          y = -sign * (yStart + easedT * (yEnd - yStart));
          z = zStart + easedT * (zEnd - zStart);
          rot = rotStart + easedT * (rotEnd - rotStart);
        } else {
          const t = Math.min(absOffset - 2, 1);
          const easedT = t * t * (3 - 2 * t);
          const zStart = -60;
          const rotStart = 175;
          const zEnd3 = -250;
          const rotEnd3 = 195;
          const sEnd2 = D / (D - zStart);
          const yEnd2 = (h / 2 - peekAmount) / sEnd2 - cardH / 2;
          const sEnd3 = D / (D - zEnd3);
          const yEnd3 = (h / 2 + 100) / sEnd3 + cardH / 2;
          y = -sign * (yEnd2 + easedT * (yEnd3 - yEnd2));
          z = zStart + easedT * (zEnd3 - zStart);
          rot = rotStart + easedT * (rotEnd3 - rotStart);
        }

        const localCardRotation = -sign * rot;
        const centerFactor = Math.max(0, 1 - absOffset);
        const totalRotX = localCardRotation + -mouse.current.y * 12 * centerFactor;
        const totalRotY = mouse.current.x * 15 * centerFactor;

        card.style.zIndex = Math.round(z).toString();
        card.style.opacity = "1";
        card.style.transform = `translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateX(${totalRotX.toFixed(2)}deg) rotateY(${totalRotY.toFixed(2)}deg) rotateZ(-3deg)`;
      }
    };

    const tick = () => {
      renderLoop();
      frameId.current = requestAnimationFrame(tick);
    };
    frameId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId.current);
  }, [metrics, cardCount]);

  return (
    <div className="absolute inset-0 bg-[#000000] text-white flex items-center justify-center overflow-hidden select-none">
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none" style={{ perspective: "1350px" }}>
        <div
          className="absolute"
          style={{ width: `${metrics.cardW}px`, height: `${metrics.cardH}px`, transformStyle: "preserve-3d" }}
        >
          {AGENT_CARDS.map((agent, i) => (
            <div
              key={agent.name}
              ref={(el) => { cardsRefs.current[i] = el; }}
              className="absolute inset-0"
              style={{
                width: `${metrics.cardW}px`,
                height: `${metrics.cardH}px`,
                transformStyle: "preserve-3d",
                backfaceVisibility: "visible"
              }}
            >
              {THICKNESS_LAYERS.map((zOffset, layerIdx) => {
                const videoSrc = CARD_VIDEOS[i % CARD_VIDEOS.length];
                if (layerIdx === THICKNESS_LAYERS.length - 1) {
                  return <AgentCardFront key={layerIdx} videoSrc={videoSrc} agent={agent} index={i} zOffset={zOffset} />;
                }
                if (layerIdx === 0) {
                  return <AgentCardBack key={layerIdx} videoSrc={videoSrc} agent={agent} zOffset={zOffset} />;
                }
                return (
                  <div
                    key={layerIdx}
                    className="absolute inset-0 rounded-[16px] border border-[#808080] pointer-events-none overflow-hidden"
                    style={{ backgroundColor: "#808080", transform: `translateZ(${zOffset}px)` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}