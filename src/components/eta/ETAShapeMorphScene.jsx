import React from 'react';
import { buildMorphPath, getMorphKeyframes, sampleShapeMorph } from '@/lib/etaShapeMorph';

export default function ETAShapeMorphScene({ scene, advanced = {}, frameProgress = 0 }) {
  const duration = Math.max(1, Number(scene.duration) || 3);
  const time = Math.max(0, Math.min(duration, frameProgress * duration));
  const state = sampleShapeMorph(getMorphKeyframes(advanced, duration), time, duration);
  const fill = advanced.shapeFillColor || '#ffffff';
  const stroke = advanced.shapeStrokeColor || '#ffffff';
  const strokeWidth = Number(advanced.shapeStrokeWidth ?? 2);
  const fillOpacity = Number(advanced.shapeFillOpacity ?? 0.12);
  const background = advanced.shapeBackground || 'transparent';
  return (
    <div className="relative h-64 w-full max-w-lg overflow-hidden rounded-2xl" style={{ background }}>
      <svg viewBox="-160 -160 320 320" className="h-full w-full">
        <g transform={`translate(${state.x} ${state.y}) rotate(${state.rotate}) scale(${state.scale})`}>
          <path
            d={buildMorphPath(state.radii)}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}