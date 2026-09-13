import React from 'react';
import { TitleScene, NumberScene, SearchScene, LogoScene, MorphScene, UIScene } from './ETATypeScenes';
import { BrowserScene, PhoneScene, LaptopScene, VideoScene } from './ETADeviceScenes';
import ETACardsScene from './ETACardsScene';
import ETARealBrowserScene from './ETARealBrowserScene';
import ETAGlassScene from './ETAGlassScene';
import ETACards3Scene from './ETACards3Scene';
import ETACards4Scene from './ETACards4Scene';

export default function ETAAnimatedVisual({ scene, advanced, browser, frameProgress }) {
  const props = { scene, advanced, frameProgress };
  if (scene.component === 'TitleCard') return <TitleScene {...props} />;
  if (scene.component === 'NumberDisplay') return <NumberScene {...props} />;
  if (scene.component === 'Glass') return <ETAGlassScene {...props} />;
  if (scene.component === 'SearchAnimation') return <SearchScene {...props} />;
  if (scene.component === 'LogoAnimation') return <LogoScene {...props} />;
  if (scene.component === 'DivMorph') return <MorphScene {...props} />;
  if (scene.component === 'UIAnimation') return <UIScene {...props} />;
  if (scene.component === 'BrowserWindow' && Number.isFinite(frameProgress)) return <ETARealBrowserScene {...props} />;
  if (scene.component === 'BrowserWindow') return <BrowserScene {...props} browser={browser} />;
  if (['PhoneWindow', 'IPhoneAnimated'].includes(scene.component)) return <PhoneScene {...props} />;
  if (scene.component === 'MacBookAnimated') return <LaptopScene {...props} />;
  if (scene.component === 'Video') return <VideoScene {...props} />;
  if (scene.component === 'Cards3') return <ETACards3Scene {...props} />;
  if (scene.component === 'Cards4') return <ETACards4Scene {...props} />;
  if (['Cards', 'Cards2'].includes(scene.component)) return <ETACardsScene {...props} />;
  return <TitleScene {...props} />;
}