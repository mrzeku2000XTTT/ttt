import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import ETAAnimatedVisual from './ETAAnimatedVisual';
import { getHyperframeState } from '@/components/kutt/kuttHyperframes';

const animationFromMotion = (scene) => scene.hyperframe_animation || (/type/i.test(scene.motion) ? 'typewriter' : /zoom/i.test(scene.motion) ? 'zoom' : /left/i.test(scene.motion) ? 'slide_left' : /pop/i.test(scene.motion) ? 'pop' : 'slide_up');
export default function ETAFrameScene({ scene }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / fps, duration = durationInFrames / fps;
  const state = getHyperframeState({ start: 0, duration, text: scene.purpose, animation: animationFromMotion(scene) }, time);
  const opacity = interpolate(frame, [0, 8, Math.max(9, durationInFrames - 8), durationInFrames - 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lift = interpolate(frame, [0, 18], [42, 0], { extrapolateRight: 'clamp' });
  return <div className="flex h-full w-full items-center justify-center overflow-hidden bg-background p-20 text-foreground" style={{ opacity }}>
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[32px] border border-border bg-card" style={{ transform: `translateY(${lift}px) scale(${state.scale})` }}>
      <ETAAnimatedVisual scene={scene} advanced={scene.advanced || {}} browser={scene.advanced?.browserKeyframes?.[0] || {}} />
      <div className="absolute bottom-10 left-1/2 max-w-[75%] -translate-x-1/2 rounded-full bg-background/80 px-6 py-3 text-center text-2xl font-semibold backdrop-blur" style={{ opacity: state.opacity, transform: `translate(calc(-50% + ${state.offsetX}px), ${state.offsetY}px) scale(${state.scale})` }}>{state.visibleText}</div>
      <div className="absolute bottom-0 left-0 h-1 bg-primary" style={{ width: `${Math.min(100, time / duration * 100)}%` }} />
    </div>
  </div>;
}