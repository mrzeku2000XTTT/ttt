import React from 'react';
import ETAFormField, { etaInput } from './ETAFormField';

const fields = [
  ['Spin period (frames)', 'spinPeriodFrames', 180], ['Spin speed (°/s)', 'spinSpeed', 20],
  ['Sphere radius scale', 'sphereRadius', 1], ['Sphere view tilt X (deg)', 'sphereTiltX', 8],
  ['Sphere view tilt Z (deg)', 'sphereTiltZ', 0], ['Center text depth Z (px)', 'cardTextDepth', 20],
  ['Headline orbit radius', 'headlineOrbitRadius', 8], ['Headline orbit speed (°/s)', 'headlineOrbitSpeed', 12],
  ['Headline orbit incline (rad)', 'headlineOrbitIncline', 0.2], ['Perspective', 'cardPerspective', 900],
  ['X', 'satelliteX', 0], ['Y', 'satelliteY', 0], ['Z', 'satelliteZ', 0],
  ['Rotate X', 'satelliteRotateX', 0], ['Rotate Y', 'satelliteRotateY', 0],
  ['Rotate Z', 'satelliteRotateZ', 0], ['Spin phase', 'spinPhase', 0],
];

export default function ETACardsMotionControls({ advanced, setAdvanced }) {
  return <div className="space-y-4"><p className="text-xs text-muted-foreground">Cards sit on a Fibonacci sphere around the headline and spin on one Y axis like satellites; the headline follows its own small 3D orbit.</p><div className="grid gap-3 sm:grid-cols-2">{fields.map(([label,key,fallback]) => <ETAFormField key={key} label={label}><input className={etaInput} type="number" step=".1" value={advanced[key] ?? fallback} onChange={(e) => setAdvanced(key, Number(e.target.value))} /></ETAFormField>)}<ETAFormField label="Default spin direction"><select className={etaInput} value={advanced.spinDirection || 'Clockwise'} onChange={(e) => setAdvanced('spinDirection', e.target.value)}><option>Clockwise</option><option>Counter-clockwise</option></select></ETAFormField></div><div className="grid gap-2 sm:grid-cols-2"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Satellite group — position (px)</p><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Satellite group — rotation (deg)</p></div></div>;
}