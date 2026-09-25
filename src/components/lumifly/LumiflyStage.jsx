import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { drawScene, STAGE_DIMS } from './lumiflyRender';

/**
 * The preview canvas. It only draws — the studio owns the clock, and passes
 * `time` in. Pass `selfPlay` (the landing) and it runs its own looping clock.
 */
const LumiflyStage = forwardRef(function LumiflyStage(
  { scene, time = 0, aspect = '16:9', transition = {}, selfPlay = false, className = '' },
  ref
) {
  const innerRef = useRef(null);
  const [localTime, setLocalTime] = useState(0);
  const dims = STAGE_DIMS[aspect] || STAGE_DIMS['16:9'];
  const duration = Math.max(0.5, Number(scene?.duration) || 6);

  useEffect(() => {
    if (!selfPlay) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setLocalTime((t) => (t + dt) % duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selfPlay, duration]);

  const clock = selfPlay ? localTime : time;

  useEffect(() => {
    const canvas = innerRef.current;
    if (!canvas) return;
    drawScene(canvas.getContext('2d'), dims.w, dims.h, scene, clock, transition);
  }, [scene, clock, aspect, transition?.out, transition?.in]);

  return (
    <canvas
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      width={dims.w}
      height={dims.h}
      className={className}
    />
  );
});

export default LumiflyStage;