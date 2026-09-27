import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { HyperframeOverlay } from '../kutt/kuttHyperframes';
import { motionTransform } from './glyphMotionFx';

// Seconds of crossfade between one beat and the next.
const DISSOLVE = 0.4;

/**
 * A GLYPH film. Each beat holds one rendered still of the artwork, moves it with
 * a movement from the studio's own vocabulary, and carries one hyperframe
 * caption. Everything is a function of the frame, so Remotion can scrub it and
 * it plays back identically every time.
 */
export default function GlyphFilmComposition({ stills = [], beats = [] }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const total = durationInFrames / fps;

  // Which beat is on screen, and how far into it we are.
  let index = 0;
  let start = 0;
  for (let i = 0; i < beats.length; i += 1) {
    const d = beats[i].seconds || 0;
    if (t < start + d || i === beats.length - 1) {
      index = i;
      break;
    }
    start += d;
  }

  const beat = beats[index] || {};
  const local = Math.max(0, t - start);
  const dissolve = interpolate(local, [0, DISSOLVE], [0, 1], { extrapolateRight: 'clamp' });
  // The whole film creeps forward, so nothing ever sits perfectly still.
  const push = interpolate(t, [0, total], [1.02, 1.07], { extrapolateRight: 'clamp' });

  const stillStyle = (i, localTime) => {
    const move = motionTransform(beats[i]?.motion || 'float', localTime + i * 1.3);
    const transform = move && move !== 'none' ? `${move} scale(${push.toFixed(4)})` : `scale(${push.toFixed(4)})`;
    return {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      transform,
      transformOrigin: 'center',
    };
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#05080d', overflow: 'hidden' }}>
      {index > 0 && dissolve < 1 && stills[index - 1] && (
        <AbsoluteFill style={{ opacity: 1 - dissolve }}>
          <Img src={stills[index - 1]} style={stillStyle(index - 1, beats[index - 1]?.seconds || 0)} />
        </AbsoluteFill>
      )}

      {stills[index] && (
        <AbsoluteFill style={{ opacity: index > 0 ? dissolve : 1 }}>
          <Img src={stills[index]} style={stillStyle(index, local)} />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {beat.caption && (
        <HyperframeOverlay
          clip={{
            start: 0,
            duration: beat.seconds || 1,
            text: beat.caption,
            animation: 'slide_up',
            style_preset: 'caption',
          }}
          t={local}
        />
      )}
    </AbsoluteFill>
  );
}