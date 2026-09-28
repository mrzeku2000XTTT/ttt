import React, { useCallback } from "react";
import { Download, Mic, Square, Trash2, X } from "lucide-react";
import FaceStyleGrid from "./FaceStyleGrid";
import StickmanGrid from "./StickmanGrid";
import { MOUTH_STYLES, drawMouth } from "./mouthStyles";
import { EYE_STYLES, EYE_ANIMS, drawEyePair } from "./eyeStyles";
import { NOSE_STYLES, drawNose } from "./noseStyles";

const PARTS = [
  { id: "mouth", label: "Mouth" },
  { id: "eyes", label: "Eyes" },
  { id: "nose", label: "Nose" },
];

const STYLE_OPTIONS = { mouth: MOUTH_STYLES, eyes: EYE_STYLES, nose: NOSE_STYLES };

const SIZE_LABELS = {
  mouth: { width: "Width", height: "Height" },
  eyes: { width: "Spacing", height: "Eye size" },
  nose: { width: "Width", height: "Height" },
};

// Each tile is drawn with the same renderer the stage uses.
const PREVIEWS = {
  mouth: (ctx, id) => drawMouth(ctx, id, { w: 40, open: 22, level: 0.72, weight: 2.4 }),
  eyes: (ctx, id) => drawEyePair(ctx, id, "open", { size: 13, spacing: 30, level: 0.5, stroke: 2.4, time: 0 }),
  nose: (ctx, id) => drawNose(ctx, id, { w: 10, h: 18, stroke: 2.4 }),
};

const Section = ({ number, title, children }) => (
  <section className="ts-section">
    <h2 className="ts-section-title">
      <span className="ts-num">{number}</span>
      {title}
    </h2>
    {children}
  </section>
);

/** Everything that shapes the face and drives it. */
export default function TalkStickPanel({
  settings,
  activePart,
  spots,
  onActivePart,
  onUpdatePart,
  onChangeVoice,
  onClearPart,
  stickman,
  onPickStickman,
  onPickImage,
  onPickAudio,
  onExport,
  meterRef,
  engine,
  hasImage,
}) {
  const part = settings[activePart];
  const labels = SIZE_LABELS[activePart];
  // Small features are a fraction of a percent on a wide stage, so keep a decimal there.
  const size = (value) => (value < 10 ? value.toFixed(1) : Math.round(value));
  const activeLabel = (PARTS.find((item) => item.id === activePart) || PARTS[0]).label;

  // Sampled at the instant each preset is at its most recognisable.
  const animPreview = useCallback(
    (ctx, id) => {
      const anim = EYE_ANIMS.find((item) => item.id === id) || EYE_ANIMS[0];
      drawEyePair(ctx, settings.eyes.style, id, {
        size: 13,
        spacing: 30,
        level: anim.preview.level,
        stroke: 2.4,
        time: anim.preview.t,
      });
    },
    [settings.eyes.style]
  );

  return (
    <aside className="ts-card ts-panel">
      <Section number="1" title="Character">
        <label className="ts-file">
          Upload PNG / JPG
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onPickImage(e.target.files[0])} />
        </label>
        <p className="ts-hint">A transparent PNG works especially well.</p>

        <h3 className="ts-sub">Or start from a stickman</h3>
        <StickmanGrid value={stickman} onChange={onPickStickman} />
        <p className="ts-hint">
          Ten characters, each caught mid-action and sized to fill the stage. The face is placed inside the head for
          you — pick one and press play.
        </p>
      </Section>

      <Section number="2" title="Face">
        <div className="ts-parts" role="radiogroup" aria-label="Feature">
          {PARTS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={activePart === item.id}
              className={`ts-part ${activePart === item.id ? "is-active" : ""} ${
                spots[item.id] ? "is-placed" : ""
              }`}
              onClick={() => onActivePart(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="ts-hint">
          Click the character to drop the <b>{activeLabel}</b> on it, drag to position, and pull the corner handle to
          resize. Press <b>Ready view</b> to hide the guide.
        </p>

        <h3 className="ts-sub">Remove a part</h3>
        <div className="ts-clear-row">
          {PARTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ts-chip"
              disabled={!spots[item.id]}
              onClick={() => onClearPart(item.id)}
            >
              <X className="h-3 w-3" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="ts-row">
          <div>
            <label className="ts-label" htmlFor="ts-w">
              {labels.width} <b>{size(part.width)}</b>
            </label>
            <input
              id="ts-w"
              className="ts-range"
              type="range"
              min="0.5"
              max="95"
              step="0.5"
              value={part.width}
              onChange={(e) => onUpdatePart(activePart, { width: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="ts-label" htmlFor="ts-h">
              {labels.height} <b>{size(part.height)}</b>
            </label>
            <input
              id="ts-h"
              className="ts-range"
              type="range"
              min="0.5"
              max="75"
              step="0.5"
              value={part.height}
              onChange={(e) => onUpdatePart(activePart, { height: Number(e.target.value) })}
            />
          </div>
        </div>

        <label className="ts-label" htmlFor="ts-y">
          Vertical <b>{part.offsetY}</b>
        </label>
        <input
          id="ts-y"
          className="ts-range"
          type="range"
          min="-40"
          max="40"
          value={part.offsetY}
          onChange={(e) => onUpdatePart(activePart, { offsetY: Number(e.target.value) })}
        />

        {spots[activePart] && (
          <button type="button" className="ts-btn ts-btn-quiet" onClick={() => onClearPart(activePart)}>
            <Trash2 className="h-3.5 w-3.5" />
            Remove {activeLabel.toLowerCase()}
          </button>
        )}
      </Section>

      <Section number="3" title={`${activeLabel} look`}>
        <FaceStyleGrid
          options={STYLE_OPTIONS[activePart]}
          value={part.style}
          onChange={(style) => onUpdatePart(activePart, { style })}
          preview={PREVIEWS[activePart]}
        />

        {activePart === "eyes" && (
          <>
            <h3 className="ts-sub">Animation</h3>
            <FaceStyleGrid
              options={EYE_ANIMS}
              value={settings.eyes.anim}
              onChange={(anim) => onUpdatePart("eyes", { anim })}
              preview={animPreview}
            />
          </>
        )}

        {activePart === "mouth" && (
          <label className="ts-check">
            <input
              type="checkbox"
              checked={settings.mouth.patch}
              onChange={(e) => onUpdatePart("mouth", { patch: e.target.checked })}
            />
            Cover the mouth already drawn on the artwork
          </label>
        )}
      </Section>

      <Section number="4" title="Voice">
        <button
          type="button"
          className={`ts-btn ${engine.listening ? "ts-btn-live" : "ts-btn-primary"}`}
          onClick={engine.toggleMic}
        >
          {engine.listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {engine.listening ? "Stop microphone" : "Start microphone"}
        </button>

        <label className="ts-file">
          Use an audio file
          <input type="file" accept="audio/*" onChange={(e) => onPickAudio(e.target.files[0])} />
        </label>

        <div className="ts-status">
          <span className={`ts-dot ${engine.listening ? "is-live" : ""}`} />
          {engine.status}
        </div>
        <div className="ts-meter">
          <div className="ts-meter-fill" ref={meterRef} />
        </div>

        <div className="ts-row">
          <div>
            <label className="ts-label" htmlFor="ts-sens">
              Sensitivity <b>{settings.sensitivity.toFixed(1)}</b>
            </label>
            <input
              id="ts-sens"
              className="ts-range"
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={settings.sensitivity}
              onChange={(e) => onChangeVoice({ sensitivity: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="ts-label" htmlFor="ts-smooth">
              Smoothing <b>{settings.smoothing.toFixed(2)}</b>
            </label>
            <input
              id="ts-smooth"
              className="ts-range"
              type="range"
              min="0.1"
              max="0.95"
              step="0.01"
              value={settings.smoothing}
              onChange={(e) => onChangeVoice({ smoothing: Number(e.target.value) })}
            />
          </div>
        </div>
      </Section>

      <Section number="5" title="Export">
        <button type="button" className="ts-btn" onClick={onExport} disabled={!hasImage}>
          <Download className="h-3.5 w-3.5" />
          Export current frame PNG
        </button>
        <p className="ts-hint">
          For live video, screen-record the stage or connect this canvas to your own recording pipeline.
        </p>
      </Section>

      <p className="ts-hint">Everything runs locally in your browser. The microphone is processed in real time.</p>
    </aside>
  );
}