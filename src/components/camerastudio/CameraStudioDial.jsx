import React from 'react';
export default function CameraStudioDial({ axis, value, change }) {
  return <label className="camera-dial" title={`${axis.toUpperCase()} rotation: ${value}°`}>
    <span className="camera-dial-hand" style={{ transform: `rotate(${value}deg)` }}/><span className="camera-dial-text"><small>{axis.toUpperCase()}</small><b>{value}°</b></span>
    <input aria-label={`${axis.toUpperCase()} rotation`} type="range" min={axis === 'z' ? -180 : -70} max={axis === 'z' ? 180 : 70} value={value} onChange={e => change(Number(e.target.value))}/>
  </label>;
}