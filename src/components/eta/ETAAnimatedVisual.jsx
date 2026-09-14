import React from 'react';
import { TitleScene, NumberScene, SearchScene, LogoScene, MorphScene, UIScene } from './ETATypeScenes';
import { BrowserScene, PhoneScene, LaptopScene, VideoScene } from './ETADeviceScenes';
import ETACardsScene from './ETACardsScene';
import ETARealBrowserScene from './ETARealBrowserScene';
import ETAGlassScene from './ETAGlassScene';
import ETACards3Scene from './ETACards3Scene';
import ETACards4Scene from './ETACards4Scene';
import ETAIPhone3DScene from './ETAIPhone3DScene';
import ETAMacBook3DScene from './ETAMacBook3DScene';
import ETADivMorphScene from './ETADivMorphScene';
import ETASearchAnimationScene from './ETASearchAnimationScene';
import ETASearchAnimation2Scene from './ETASearchAnimation2Scene';
import ETALogoAnimationScene from './ETALogoAnimationScene';
import ETAUIAnimationScene from './ETAUIAnimationScene';
import { sampleAutoKeyframes } from '@/lib/etaAutoKeyframes';

function VisualContent({ scene, advanced, browser, frameProgress }) {
  const props = { scene, advanced, frameProgress };
  if (scene.component === 'TitleCard') return <TitleScene {...props} />;
  if (scene.component === 'NumberDisplay') return <NumberScene {...props} />;
  if (scene.component === 'Glass') return <ETAGlassScene {...props} />;
  if (['SearchAnimation', 'SearchAnimation1'].includes(scene.component)) return <ETASearchAnimationScene {...props} />;
  if (scene.component === 'SearchAnimation2') return <ETASearchAnimation2Scene {...props} />;
  if (['LogoAnimation', 'LogoAnimation1', 'LogoAnimation2'].includes(scene.component)) return <ETALogoAnimationScene {...props} variant={scene.component === 'LogoAnimation2' ? 2 : scene.component === 'LogoAnimation1' ? 1 : 0} />;
  if (scene.component === 'DivMorph') return <ETADivMorphScene {...props} />;
  if (scene.component === 'UIAnimation') return <ETAUIAnimationScene {...props} />;
  if (scene.component === 'BrowserWindow' && Number.isFinite(frameProgress)) return <ETARealBrowserScene {...props} />;
  if (scene.component === 'BrowserWindow') return <BrowserScene {...props} browser={browser} />;
  if (scene.component === 'PhoneWindow') return <PhoneScene {...props} />;
  if (scene.component === 'IPhoneAnimated') return <ETAIPhone3DScene {...props} />;
  if (scene.component === 'MacBookAnimated') return <ETAMacBook3DScene {...props} />;
  if (scene.component === 'Video') return <VideoScene {...props} />;
  if (scene.component === 'Cards3') return <ETACards3Scene {...props} />;
  if (scene.component === 'Cards4') return <ETACards4Scene {...props} />;
  if (['Cards', 'Cards2'].includes(scene.component)) return <ETACardsScene {...props} />;
  return <TitleScene {...props} />;
}

export default function ETAAnimatedVisual({ scene, advanced, browser, frameProgress }) {
  const content = <VisualContent scene={scene} advanced={advanced} browser={browser} frameProgress={frameProgress} />;
  if (!Number.isFinite(frameProgress) || advanced.autoMotionEnabled === false) return content;
  const state = sampleAutoKeyframes(scene, advanced, frameProgress);
  const transform = `translate3d(${Number(state.x || 0)}px,${Number(state.y || 0)}px,${Number(state.z || 0)}px) rotateX(${Number(state.rotateX || 0)}deg) rotateY(${Number(state.rotateY || 0)}deg) rotateZ(${Number(state.rotateZ || 0)}deg) scale(${Number(state.scale || 1)})`;
  return <div className="flex h-full w-full items-center justify-center" style={{ perspective: 1200 }}><div className="flex h-full w-full items-center justify-center" style={{ transform, transformStyle: 'preserve-3d', willChange: 'transform' }}>{content}</div></div>;
}