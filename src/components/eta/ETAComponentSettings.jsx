import React from 'react';
import ETAPhoneSettings from './ETAPhoneSettings';
import ETACardsSettings from './ETACardsSettings';
import ETAIPhoneSettings from './ETAIPhoneSettings';
import ETAMacBookSettings from './ETAMacBookSettings';
import ETADivMorphSettings from './ETADivMorphSettings';
import ETASearchAnimationSettings from './ETASearchAnimationSettings';

export default function ETAComponentSettings({ scene, advanced, setAdvanced }) {
  if (scene.component === 'PhoneWindow') return <ETAPhoneSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'IPhoneAnimated') return <ETAIPhoneSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'MacBookAnimated') return <ETAMacBookSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'DivMorph') return <ETADivMorphSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (scene.component === 'SearchAnimation') return <ETASearchAnimationSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (['Cards', 'Cards2', 'Cards3', 'Cards4'].includes(scene.component)) return <ETACardsSettings scene={scene} advanced={advanced} setAdvanced={setAdvanced} />;
  return null;
}