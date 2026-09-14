import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import ETAFrameScene from './ETAFrameScene';

export const ETA_FPS = 60;
export default function ETAComposition({ plan }) {
  let start = 0;
  return <AbsoluteFill className="bg-background">{plan.scenes.map((scene, index) => {
    const durationInFrames = Math.max(ETA_FPS, Math.round(Number(scene.duration || 3) * ETA_FPS));
    const from = start; start += durationInFrames;
    return <Sequence key={`${index}-${scene.component}`} from={from} durationInFrames={durationInFrames} name={`Scene ${index + 1} · ${scene.component}`}><ETAFrameScene scene={scene} format={plan.format} /></Sequence>;
  })}</AbsoluteFill>;
}