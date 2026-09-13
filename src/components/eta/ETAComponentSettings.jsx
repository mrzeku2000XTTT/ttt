import React from 'react';
import ETAPhoneSettings from './ETAPhoneSettings';
import ETACardsSettings from './ETACardsSettings';

export default function ETAComponentSettings({ scene, advanced, setAdvanced }) {
  if (scene.component === 'PhoneWindow') return <ETAPhoneSettings advanced={advanced} setAdvanced={setAdvanced} />;
  if (['Cards', 'Cards2', 'Cards3', 'Cards4'].includes(scene.component)) return <ETACardsSettings advanced={advanced} setAdvanced={setAdvanced} />;
  return null;
}