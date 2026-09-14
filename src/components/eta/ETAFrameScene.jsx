import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import ETAAnimatedVisual from './ETAAnimatedVisual';
import { getHyperframeState } from '@/components/kutt/kuttHyperframes';

const animationFromMotion = (scene) => scene.hyperframe_animation || (/type/i.test(scene.motion) ? 'typewriter' : /zoom/i.test(scene.motion) ? 'zoom' : /left/i.test(scene.motion) ? 'slide_left' : /pop/i.test(scene.motion) ? 'pop' : 'slide_up');
export default function ETAFrameScene({ scene, format }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / fps, duration = durationInFrames / fps;
  const frameProgress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const state = getHyperframeState({ start: 0, duration, text: scene.purpose, animation: animationFromMotion(scene) }, time);
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 110, mass: .8 } });
  const opacity = interpolate(frame, [0, 8, Math.max(9, durationInFrames - 8), durationInFrames - 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lift = (1 - entrance) * 52;
  const phoneCaption = scene.component === 'PhoneWindow';
  const verticalPhone = phoneCaption && String(format).startsWith('9:16');
  return <div className="flex h-full w-full items-center justify-center overflow-hidden bg-background p-20 text-foreground" style={{ opacity }}>
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[32px] border border-border bg-card" style={{ transform: `translateY(${lift}px) scale(${.96 + entrance * .04})` }}>
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" style={{ transform: `translate(${frameProgress * 140}px, ${Math.sin(frameProgress * Math.PI) * 80}px)` }} />
      <ETAAnimatedVisual scene={scene} advanced={scene.advanced || {}} browser={scene.advanced?.browserKeyframes?.[0] || {}} frameProgress={frameProgress} />
      <div className={phoneCaption ? (verticalPhone ? "absolute bottom-3 left-1/2 max-w-[82%] -translate-x-1/2 rounded-full bg-background/90 px-5 py-2 text-center text-lg font-semibold backdrop-blur" : "absolute right-8 top-1/2 w-[25%] -translate-y-1/2 rounded-2xl bg-background/90 px-5 py-4 text-left text-xl font-semibold backdrop-blur") : "absolute bottom-10 left-1/2 max-w-[75%] -translate-x-1/2 rounded-full bg-background/80 px-6 py-3 text-center text-2xl font-semibold backdrop-blur"} style={{ opacity: state.opacity, transform: phoneCaption && !verticalPhone ? `translateY(calc(-50% + ${state.offsetY}px)) translateX(${state.offsetX}px) scale(${state.scale})` : `translate(calc(-50% + ${state.offsetX}px), ${state.offsetY}px) scale(${state.scale})` }}>{state.visibleText}</div>
      <div className="absolute bottom-0 left-0 h-1 bg-primary" style={{ width: `${Math.min(100, time / duration * 100)}%` }} />
    </div>
  </div>;
}