import React, { useState } from 'react';
import { Player } from '@remotion/player';
import ETAComposition, { ETA_FPS } from './ETAComposition';
import ETAShowroomControls from './ETAShowroomControls';

const dimensionsFor = (format = '') => format.startsWith('9:16') ? [720, 1280] : format.startsWith('1:1') ? [1080, 1080] : [1280, 720];
export default function ETARemotionPreview({ plan }) {
  const [selected, setSelected] = useState(-1);
  const scenes = selected < 0 ? plan.scenes : [plan.scenes[selected]];
  const showroomPlan = { ...plan, scenes };
  const frames = scenes.reduce((sum, scene) => sum + Math.max(ETA_FPS, Math.round(Number(scene.duration || 3) * ETA_FPS)), 0);
  const [width, height] = dimensionsFor(plan.format);
  return <><ETAShowroomControls scenes={plan.scenes} selected={selected} onSelect={setSelected} /><div className="eta-remotion-shell"><div className="eta-render-badges"><span>SHOWROOM · {ETA_FPS} FPS</span><span>{selected < 0 ? `COMBINED · ${plan.scenes.length} SCENES` : `SCENE ${selected + 1} · ${plan.scenes[selected].component}`}</span></div><Player key={`${selected}-${width}-${height}`} component={ETAComposition} inputProps={{ plan: showroomPlan }} durationInFrames={Math.max(ETA_FPS, frames)} fps={ETA_FPS} compositionWidth={width} compositionHeight={height} controls autoPlay loop acknowledgeRemotionLicense style={{ width: '100%', maxHeight: '72vh', aspectRatio: `${width} / ${height}` }} /></div></>;
}