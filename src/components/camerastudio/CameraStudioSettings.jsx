import React from 'react';
import { X } from 'lucide-react';
import { CAMERA_EASINGS } from '@/components/camerastudio/cameraEasing';
export default function CameraStudioSettings({ settings, update, close }) {
  return <section className="camera-settings" aria-label="Camera settings">
    <header><strong>Camera & motion</strong><button onClick={close} aria-label="Close settings"><X size={16}/></button></header>
    <label>Scale <output>{settings.zoom.toFixed(2)}×</output><input type="range" min="0.4" max="1.8" step="0.01" value={settings.zoom} onChange={e => update({ zoom: Number(e.target.value) })}/></label>
    <label>Corner radius <output>{Math.round(settings.radius * 100)}%</output><input type="range" min="0" max="0.25" step="0.01" value={settings.radius} onChange={e => update({ radius: Number(e.target.value) })}/></label>
    <label>Shadow <output>{Math.round(settings.shadow * 100)}%</output><input type="range" min="0" max="0.7" step="0.01" value={settings.shadow} onChange={e => update({ shadow: Number(e.target.value) })}/></label>
    <label>Operator movement<select value={settings.motion} onChange={e => update({ motion: e.target.value })}><option value="push">Product demo — push in</option><option value="orbit">Gentle orbit</option><option value="float">Floating screen</option></select></label>
    <label>Camera easing<select value={settings.easing || 'auto'} onChange={e => update({ easing: e.target.value })}>{CAMERA_EASINGS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Video duration<select value={settings.duration} onChange={e => update({ duration: Number(e.target.value) })}>{[4, 6, 10, 15, 30, 60].map(n => <option key={n} value={n}>{n} seconds</option>)}</select></label>
    <p>Video exports are silent. Keep this tab active while exporting.</p>
  </section>;
}