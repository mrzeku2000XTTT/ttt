import React from 'react';
import ETAPhoneSettings from './ETAPhoneSettings';
import ETACardsSettings from './ETACardsSettings';
import ETAIPhoneSettings from './ETAIPhoneSettings';
import ETAMacBookSettings from './ETAMacBookSettings';
import ETADivMorphSettings from './ETADivMorphSettings';
import ETASearchAnimationSettings from './ETASearchAnimationSettings';
import ETASearchAnimation2Settings from './ETASearchAnimation2Settings';
import ETALogoAnimationSettings from './ETALogoAnimationSettings';
import ETAUIAnimationSettings from './ETAUIAnimationSettings';
import ETAVideoSettings from './ETAVideoSettings';
import ETABrowserUISettings from './ETABrowserUISettings';

export default function ETAComponentSettings({ scene, advanced, setAdvanced }) {
  if (scene.component === 'BrowserWindow') return <ETABrowserUISettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'PhoneWindow') return <ETAPhoneSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'IPhoneAnimated') return <ETAIPhoneSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'MacBookAnimated') return <ETAMacBookSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'DivMorph') return <ETADivMorphSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (['SearchAnimation', 'SearchAnimation1'].includes(scene.component)) return <ETASearchAnimationSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'SearchAnimation2') return <ETASearchAnimation2Settings advanced={advanced} setAdvanced={setAdvanced} />;
  if (['LogoAnimation', 'LogoAnimation1', 'LogoAnimation2'].includes(scene.component)) return <ETALogoAnimationSettings advanced={advanced} setAdvanced={setAdvanced} variant={scene.component === 'LogoAnimation2' ? 2 : scene.component === 'LogoAnimation1' ? 1 : 0} />;
  if (scene.component === 'UIAnimation') return <ETAUIAnimationSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'Video') return <ETAVideoSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (['Cards', 'Cards2', 'Cards3', 'Cards4'].includes(scene.component)) return <ETACardsSettings scene={scene} advanced={advanced} setAdvanced={setAdvanced} />;
  return null;
}