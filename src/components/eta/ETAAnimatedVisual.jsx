import React from 'react';
import { TitleScene, NumberScene, SearchScene, LogoScene, MorphScene, UIScene } from './ETATypeScenes';
import { BrowserScene, PhoneScene, LaptopScene, VideoScene } from './ETADeviceScenes';
import ETACardsScene from './ETACardsScene';

export default function ETAAnimatedVisual({ scene, advanced, browser }) {
  const props = { scene, advanced };
  if (scene.component === 'TitleCard') return <TitleScene {...props} />;
  if (scene.component === 'NumberDisplay') return <NumberScene {...props} />;
  if (['Glass', 'SearchAnimation'].includes(scene.component)) return <SearchScene {...props} />;
  if (scene.component === 'LogoAnimation') return <LogoScene {...props} />;
  if (scene.component === 'DivMorph') return <MorphScene {...props} />;
  if (scene.component === 'UIAnimation') return <UIScene {...props} />;
  if (scene.component === 'BrowserWindow') return <BrowserScene {...props} browser={browser} />;
  if (['PhoneWindow', 'IPhoneAnimated'].includes(scene.component)) return <PhoneScene {...props} />;
  if (scene.component === 'MacBookAnimated') return <LaptopScene {...props} />;
  if (scene.component === 'Video') return <VideoScene {...props} />;
  if (['Cards', 'Cards2', 'Cards3', 'Cards4'].includes(scene.component)) return <ETACardsScene {...props} />;
  return <TitleScene {...props} />;
}