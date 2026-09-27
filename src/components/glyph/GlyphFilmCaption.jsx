import React from 'react';
import { AbsoluteFill } from 'remotion';
import { captionFrame, captionSpec } from './glyphFilmType';

/**
 * One caption on the film, laid out and animated by its type. Nothing here is a
 * CSS transition — every value is read off the frame, so Remotion can scrub it
 * and the film plays back identically every time.
 */
export default function GlyphFilmCaption({ text, type, t, duration, width, height }) {
  const spec = captionSpec(type, width, height);
  const f = captionFrame(spec, text, t, duration);
  if (!text || f.opacity <= 0.002) return null;

  const centered = spec.anchor === 'center';
  const left = spec.anchor === 'left';

  const place = {
    position: 'absolute',
    left: left ? '8%' : '50%',
    maxWidth: spec.maxWidth,
    textAlign: left ? 'left' : 'center',
    opacity: f.opacity,
    transform: left
      ? `translateY(${f.rise.toFixed(2)}px)`
      : `translate(-50%, ${centered ? '-50%' : '0'}) translateY(${f.rise.toFixed(2)}px) scale(${f.scale.toFixed(4)})`,
    ...(centered ? { top: '50%' } : { bottom: '12%' }),
  };

  const face = {
    fontFamily: spec.face,
    fontWeight: spec.weight,
    fontSize: `${spec.size}px`,
    letterSpacing: spec.tracking,
    lineHeight: spec.line,
    textTransform: 'uppercase',
    color: spec.color,
    textShadow: spec.shadow,
  };

  // The hook: one masked line per word, each climbing into place a beat apart.
  const words = f.words.map((w, i) => (
    <React.Fragment key={`${w.text}-${i}`}>
      <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.06em' }}>
        <span
          style={{
            display: 'inline-block',
            transform: `translateY(${((1 - w.progress) * 110).toFixed(2)}%)`,
            opacity: w.progress,
          }}
        >
          {w.text}
        </span>
      </span>
      {i < f.words.length - 1 ? ' ' : null}
    </React.Fragment>
  ));

  const plate = spec.plate ? (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden',
        background: spec.plateBg,
        border: spec.plateBorder,
        borderRadius: spec.radius,
        padding: spec.pad,
      }}
    >
      {text}
      {/* The light line wipes the top edge of the plate as it lands. */}
      {spec.type === 'launch' && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '1px',
            width: `${(f.enter * 100).toFixed(1)}%`,
            background: 'rgba(255,255,255,0.55)',
          }}
        />
      )}
    </span>
  ) : (
    <span>{text}</span>
  );

  return (
    <>
      <AbsoluteFill style={{ background: spec.scrim, opacity: f.opacity }} />
      <div style={place}>
        {spec.type === 'rule' && (
          <div
            style={{
              width: `${(f.rule * spec.u * 0.075).toFixed(1)}px`,
              height: '1.5px',
              background: '#6BCAFF',
              boxShadow: '0 0 0.7em rgba(107,202,255,0.65)',
              marginBottom: '0.6em',
            }}
          />
        )}
        <div style={face}>{spec.type === 'kinetic' ? words : plate}</div>
      </div>
    </>
  );
}