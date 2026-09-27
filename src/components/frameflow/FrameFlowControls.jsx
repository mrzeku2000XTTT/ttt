import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { CAMERA_OPTIONS, MOTION_PRESETS, PRESERVE_OPTIONS, TIMING_OPTIONS } from "./frameFlowPresets";

/** The shot settings — motion, spacing, timing, camera, and the locked style. */
export default function FrameFlowControls({ settings, onChange, onGenerate, generating, ready }) {
  const togglePreserve = (value) => {
    const preserve = settings.preserve.includes(value)
      ? settings.preserve.filter((item) => item !== value)
      : [...settings.preserve, value];
    onChange({ preserve });
  };

  const pickPreset = (preset) => {
    onChange({ preset: preset.id, motion: preset.prompt || settings.motion });
  };

  return (
    <div className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">MOTION CONTROLS</span>
        <span className="ff-dim text-[11px]">SHOT SETTINGS</span>
      </div>

      <div className="p-[18px]">
        <div className="mb-[18px]">
          <label className="ff-field-label" htmlFor="ff-motion">
            Motion instruction
          </label>
          <textarea
            id="ff-motion"
            className="ff-textarea"
            style={{ minHeight: 96 }}
            value={settings.motion}
            onChange={(event) => onChange({ motion: event.target.value, preset: "Custom" })}
            placeholder="Example: the character slowly turns their head toward the camera while their hair and jacket follow the movement."
          />
        </div>

        <div className="mb-[18px]">
          <span className="ff-field-label">Motion preset</span>
          <div className="flex flex-wrap gap-[7px]">
            {MOTION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`ff-chip ${settings.preset === preset.id ? "is-active" : ""}`}
                onClick={() => pickPreset(preset)}
              >
                {preset.id}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-[18px] grid grid-cols-2 gap-[10px]">
          <div>
            <label className="ff-field-label" htmlFor="ff-count">
              In-betweens <span>{settings.frameCount}</span>
            </label>
            <input
              id="ff-count"
              type="range"
              min="2"
              max="24"
              value={settings.frameCount}
              onChange={(event) => onChange({ frameCount: Number(event.target.value) })}
              className="w-full accent-[#c8ff4d]"
            />
          </div>
          <div>
            <label className="ff-field-label" htmlFor="ff-fps">
              FPS <span>{settings.fps}</span>
            </label>
            <input
              id="ff-fps"
              type="range"
              min="6"
              max="24"
              value={settings.fps}
              onChange={(event) => onChange({ fps: Number(event.target.value) })}
              className="w-full accent-[#c8ff4d]"
            />
          </div>
        </div>

        <div className="mb-[18px]">
          <label className="ff-field-label" htmlFor="ff-timing">
            Motion timing
          </label>
          <select
            id="ff-timing"
            className="ff-select"
            value={settings.timing}
            onChange={(event) => onChange({ timing: event.target.value })}
          >
            {TIMING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-[18px]">
          <label className="ff-field-label" htmlFor="ff-camera">
            Camera
          </label>
          <select
            id="ff-camera"
            className="ff-select"
            value={settings.camera}
            onChange={(event) => onChange({ camera: event.target.value })}
          >
            {CAMERA_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-[18px]">
          <span className="ff-field-label">Preserve</span>
          <div className="grid grid-cols-2 gap-2">
            {PRESERVE_OPTIONS.map((option) => (
              <label key={option} className="ff-check">
                <input
                  type="checkbox"
                  checked={settings.preserve.includes(option)}
                  onChange={() => togglePreserve(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-[18px]">
          <label className="ff-field-label" htmlFor="ff-style">
            Style lock
          </label>
          <textarea
            id="ff-style"
            className="ff-textarea"
            style={{ minHeight: 140 }}
            value={settings.styleLock}
            onChange={(event) => onChange({ styleLock: event.target.value })}
          />
        </div>

        <div className="mb-[18px]">
          <label className="ff-field-label" htmlFor="ff-negative">
            Negative prompt
          </label>
          <textarea
            id="ff-negative"
            className="ff-textarea"
            style={{ minHeight: 84 }}
            value={settings.negative}
            onChange={(event) => onChange({ negative: event.target.value })}
          />
        </div>

        <button type="button" className="ff-btn ff-btn-primary w-full py-3.5" onClick={onGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating sequence…" : "Generate in-between frames"}
        </button>

        {!ready && (
          <p className="ff-dim mt-3 text-center text-[11px]">Upload both references to generate a sequence.</p>
        )}
      </div>
    </div>
  );
}