import React from "react";
import { Download, Mic, Square } from "lucide-react";
import MouthStyleGrid from "./MouthStyleGrid";

const Section = ({ number, title, children }) => (
  <section className="ts-section">
    <h2 className="ts-section-title">
      <span className="ts-num">{number}</span>
      {title}
    </h2>
    {children}
  </section>
);

/** Everything that shapes the mouth and drives it. */
export default function TalkStickPanel({
  settings,
  onChange,
  onPickImage,
  onPickAudio,
  onExport,
  meterRef,
  engine,
  hasImage,
}) {
  return (
    <aside className="ts-card ts-panel">
      <Section number="1" title="Character">
        <label className="ts-file">
          Upload PNG / JPG
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onPickImage(e.target.files[0])} />
        </label>
        <p className="ts-hint">A transparent PNG works especially well.</p>
      </Section>

      <Section number="2" title="Mouth position">
        <p className="ts-hint">
          Click the character to drop the mouth on it, then drag it anywhere. Press <b>Ready view</b> on the stage to
          hide the guide and see the mouth clean.
        </p>

        <div className="ts-row">
          <div>
            <label className="ts-label" htmlFor="ts-w">
              Width <b>{settings.width}</b>
            </label>
            <input
              id="ts-w"
              className="ts-range"
              type="range"
              min="8"
              max="80"
              value={settings.width}
              onChange={(e) => onChange({ width: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="ts-label" htmlFor="ts-h">
              Height <b>{settings.height}</b>
            </label>
            <input
              id="ts-h"
              className="ts-range"
              type="range"
              min="5"
              max="60"
              value={settings.height}
              onChange={(e) => onChange({ height: Number(e.target.value) })}
            />
          </div>
        </div>

        <label className="ts-label" htmlFor="ts-y">
          Vertical <b>{settings.offsetY}</b>
        </label>
        <input
          id="ts-y"
          className="ts-range"
          type="range"
          min="-40"
          max="40"
          value={settings.offsetY}
          onChange={(e) => onChange({ offsetY: Number(e.target.value) })}
        />
      </Section>

      <Section number="3" title="Mouth look">
        <MouthStyleGrid value={settings.style} onChange={(style) => onChange({ style })} />
        <p className="ts-hint">
          Every look is animated by the same voice engine — pick the one that suits your character.
        </p>
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
              onChange={(e) => onChange({ sensitivity: Number(e.target.value) })}
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
              onChange={(e) => onChange({ smoothing: Number(e.target.value) })}
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