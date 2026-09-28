import React, { useEffect, useRef } from "react";
import { stickmanSource } from "../stickmen";
import { drawMouth } from "../mouthStyles";
import { drawEyePair } from "../eyeStyles";

const W = 300;
const H = 250;

/**
 * The studio's real output, drawn with the same renderer the stage uses — a
 * stickman with a mouth and eyes that keep moving, so the landing shows the
 * app rather than describing it.
 */
export default function TalkStickHeroPreview() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { source, head } = stickmanSource("wave", W, H);
    const mouthW = head.r * 1.3;
    const mouthH = head.r * 0.62;

    let frame = 0;
    const draw = (time) => {
      const level = 0.42 + 0.58 * Math.abs(Math.sin(time / 340));
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(source, 0, 0, W, H);

      ctx.save();
      ctx.translate(head.cx, head.cy - head.r * 0.26);
      drawEyePair(ctx, "dots", "blink", {
        size: head.r * 0.3,
        spacing: head.r * 1.1,
        level,
        stroke: 3,
        time: time / 1000,
      });
      ctx.restore();

      ctx.save();
      ctx.translate(head.cx, head.cy + head.r * 0.46);
      drawMouth(ctx, "oval", {
        w: mouthW * (0.88 + level * 0.12),
        open: mouthH * (0.18 + level * 1.35),
        level,
        weight: 3,
      });
      ctx.restore();

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="tsl-preview">
      <canvas ref={ref} className="tsl-preview-canvas" style={{ width: W, height: H }} />
      <span className="tsl-preview-note">Live output · mouth follows the voice</span>
    </div>
  );
}