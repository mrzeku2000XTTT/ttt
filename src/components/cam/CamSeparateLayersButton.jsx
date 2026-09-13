import React from 'react';
import { Layers3, LoaderCircle } from 'lucide-react';

export default function CamSeparateLayersButton({ disabled, busy, elapsed, onClick }) {
  return <button className="cm-separate-layers" disabled={disabled||busy} onClick={onClick} title="Use Kinezma to turn this image into controllable assets">
    {busy?<LoaderCircle className="animate-spin"/>:<Layers3/>}
    <span>{busy?`Separating ${elapsed}s`:'Separate Into Layers'}</span>
  </button>;
}