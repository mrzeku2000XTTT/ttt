import React, { useState } from 'react';
import { Focus, SlidersHorizontal, Download, Scan } from 'lucide-react';
import CameraStudioDial from '@/components/camerastudio/CameraStudioDial';
import CameraStudioSettings from '@/components/camerastudio/CameraStudioSettings';
export default function CameraStudioDock({ settings, update, exporting, progress, ready, capture }) {
  const [open, setOpen] = useState(false);
  return <div className="camera-bottom">
    {open && !exporting && <CameraStudioSettings settings={settings} update={update} close={() => setOpen(false)}/>}
    <fieldset className="camera-dock" disabled={exporting}>
      <div className="camera-segments">{['photo', 'video'].map(mode => <button key={mode} aria-pressed={settings.mode === mode} onClick={() => update({ mode })}>{mode.toUpperCase()}</button>)}</div>
      {['x', 'y', 'z'].map(axis => <CameraStudioDial key={axis} axis={axis} value={settings[axis]} change={value => update({ [axis]: value })}/>)}
      <div className="camera-tools">
        <label className="camera-color" title="Backdrop color"><span style={{ background: settings.background }}/><input type="color" aria-label="Backdrop color" value={settings.background} onChange={e => update({ background: e.target.value })}/></label>
        <button title="Auto frame — reset rotation and scale" onClick={() => update({ x: 0, y: 0, z: 0, zoom: 1 })}><Focus size={15}/></button>
        <button onClick={() => setOpen(!open)} title="Camera settings" aria-expanded={open}><SlidersHorizontal size={15}/></button>
        <button onClick={() => setOpen(!open)} title="Adjust scale">{settings.zoom.toFixed(1)}×</button>
        <button title="Toggle rounded corners" onClick={() => update({ radius: settings.radius ? 0 : .08 })}><Scan size={15}/></button>
        <select aria-label="Canvas aspect ratio" value={settings.ratio} onChange={e => update({ ratio: e.target.value })}>{['16:9', '9:16', '1:1', '4:3'].map(ratio => <option key={ratio}>{ratio}</option>)}</select>
        <button className="camera-shutter" disabled={!ready || exporting} onClick={capture} title={settings.mode === 'photo' ? 'Download PNG' : 'Export silent video'}><Download size={14}/>{exporting ? `${Math.round(progress * 100)}%` : 'Export'}</button>
      </div>
    </fieldset>
    <p className="camera-hint">{exporting ? `Exporting · ${(progress * settings.duration).toFixed(1)} / ${settings.duration}s · Keep this tab active` : settings.mode === 'photo' ? 'Drag the X / Y / Z dials to rotate · PNG export' : `${settings.duration}s · XYZ auto-keyed every second · 60 FPS capture · MP4 where supported, otherwise WebM · Silent`}</p>
    {exporting && <progress className="camera-export-progress" value={progress} max={1} aria-label="Export progress"/>}
  </div>;
}