import React, { useEffect, useRef, useState } from 'react';
import { GlyphThinkingController } from './aiThinkingEngine';

/**
 * GLYPH's thinking visual — the GL-PH animation: a ring of radial bars that
 * breathes while idle and turns, deepens and drifts in hue while GLYPH works.
 * No spinner, no percentage: the visual itself says it is working.
 */
export default function GlyphThinking({
  size = 256,
  isThinking = false,
  speed = 1,
  intensity = 1,
  count,
  idleMode = 'ambient',
  transparentBg = false,
  showLabel = false,
  thinkingLabel = 'thinking…',
  idleLabel = '',
  className = '',
  onStateChange,
}) {
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);
  const [state, setState] = useState('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const controller = new GlyphThinkingController(canvas, {
      speed,
      intensity,
      count,
      idleMode,
      transparentBg,
    });
    controllerRef.current = controller;
    const unsubscribe = controller.subscribe((s) => {
      setState(s);
      if (onStateChange) onStateChange(s);
    });
    const ro = new ResizeObserver(() => {
      controller.updateCanvasResolution();
      controller.renderFrame(performance.now());
    });
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      unsubscribe();
      controller.destroy();
      controllerRef.current = null;
    };
    // The controller is built once; live props are pushed in the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controllerRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    controllerRef.current?.setIntensity(intensity);
  }, [intensity]);

  useEffect(() => {
    controllerRef.current?.setIdleMode(idleMode);
  }, [idleMode]);

  useEffect(() => {
    const c = controllerRef.current;
    if (!c) return;
    if (isThinking) c.start();
    else c.stop();
  }, [isThinking]);

  const dim = typeof size === 'number' ? `${size}px` : size;
  const active = state === 'thinking' || state === 'transition_in';

  return (
    <div className={`flex shrink-0 flex-col items-center justify-center ${className}`}>
      <div className="relative overflow-hidden rounded-full" style={{ width: dim, height: dim }}>
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      {showLabel && (
        <div
          className="mt-2 min-h-[18px] text-center text-[10px] font-medium uppercase tracking-[0.2em] transition-all duration-300"
          style={{ color: active ? 'var(--g-ink)' : 'var(--g-muted)', opacity: active ? 1 : idleLabel ? 0.7 : 0 }}
        >
          {active ? thinkingLabel : idleLabel}
        </div>
      )}
    </div>
  );
}