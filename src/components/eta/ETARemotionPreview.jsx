import React from 'react';
import { Player } from '@remotion/player';
import ETAComposition, { ETA_FPS } from './ETAComposition';

export default function ETARemotionPreview({ plan }) {
  const frames = plan.scenes.reduce((sum, scene) => sum + Math.max(ETA_FPS, Math.round(Number(scene.duration || 3) * ETA_FPS)), 0);
  return <div className="eta-remotion-shell"><div className="eta-render-badges"><span>REMOTION · {ETA_FPS} FPS</span><span>HYPERFRAMES ACTIVE</span></div><Player component={ETAComposition} inputProps={{ plan }} durationInFrames={Math.max(ETA_FPS, frames)} fps={ETA_FPS} compositionWidth={1280} compositionHeight={720} controls autoPlay loop acknowledgeRemotionLicense style={{ width: '100%', aspectRatio: '16 / 9' }} /></div>;
}