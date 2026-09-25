import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  BACKGROUND_MOTIONS,
  BACKGROUND_PRESETS,
  DEFAULT_TEXT_COLORS,
  DEFAULT_WORDS,
  EASINGS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  GRADIENT_ANIMATIONS,
  TEXT_ANIMATIONS,
  WORD_DIRECTIONS,
  easingFn,
  textAnimation,
} from './lumiflyPresets';

const field =
  'rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white/90 outline-none focus:border-[#00c29f]/60';
const numField = `${field} w-[70px] text-right`;
const wideField = `${field} max-w-[150px]`;

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2 py-1">
    <span className="text-[11px] text-white/45">{label}</span>
    <span className="flex items-center gap-1.5">{children}</span>
  </div>
);

const Section = ({ title, children, right }) => (
  <section className="border-b border-white/10 px-3 py-2.5">
    <div className="mb-1 flex items-center justify-between gap-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{title}</p>
      {right}
    </div>
    {children}
  </section>
);

const Num = ({ value, onChange, min, max, step = 1 }) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onChange(Number(e.target.value))}
    className={numField}
  />
);

const Color = ({ value, onChange }) => (
  <input
    type="color"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-6 w-9 rounded border border-white/10 bg-transparent p-0"
  />
);

const Picker = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={wideField}>
    {options.map((o) => {
      const id = o.id ?? o;
      return (
        <option key={id} value={id} className="bg-[#131314]">
          {o.label ?? o}
        </option>
      );
    })}
  </select>
);

/** The selected easing, plotted — the same curve the renderer applies. */
function EasingGraph({ easing }) {
  const fn = easingFn(easing);
  const points = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    return `${(t * 100).toFixed(1)},${(100 - fn(t) * 100).toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-16 w-full rounded-md border border-white/10 bg-black/40">
      <polyline points={points} fill="none" stroke="#00c29f" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const ToggleButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="mt-1 w-full rounded-md border border-white/10 py-1 text-[10px] text-white/50 transition-colors hover:border-white/25 hover:text-white"
  >
    {children}
  </button>
);

export default function LumiflyInspector({ scene, onPatch, entranceFrom }) {
  const [showEasing, setShowEasing] = useState(false);
  const [showOutGraph, setShowOutGraph] = useState(false);
  const [showInGraph, setShowInGraph] = useState(false);

  if (!scene) return null;

  const glow = scene.glow || {};
  const bg = scene.background || {};
  const cut = scene.matchCut || {};
  const out = scene.outgoing || {};
  const incoming = scene.incoming || {};
  const words = { ...DEFAULT_WORDS, ...(scene.words || {}) };
  const colors = scene.textColors?.length === 3 ? scene.textColors : DEFAULT_TEXT_COLORS;
  const bgColors = bg.colors?.length === 3 ? bg.colors : BACKGROUND_PRESETS[0].colors;

  const setColor = (index, value) => {
    const next = [...colors];
    next[index] = value;
    onPatch({ textColors: next });
  };
  const setBgColor = (index, value) => {
    const next = [...bgColors];
    next[index] = value;
    onPatch({ background: { ...bg, colors: next } });
  };
  const setWord = (patch) => onPatch({ words: { ...words, ...patch } });

  return (
    <aside className="w-full shrink-0 border-t border-white/10 bg-[#0e0e0f] lg:max-h-[calc(100vh-52px)] lg:w-[330px] lg:overflow-y-auto lg:border-l lg:border-t-0">
      <Section title="Text content">
        <textarea
          value={scene.text}
          onChange={(e) => onPatch({ text: e.target.value })}
          rows={2}
          className={`${field} w-full resize-none leading-relaxed`}
        />
      </Section>

      <Section title="Type">
        <Row label="Font size">
          <Num value={scene.fontSize} min={24} max={900} step={10} onChange={(v) => onPatch({ fontSize: v })} />
        </Row>
        <Row label="Font family">
          <Picker value={scene.fontFamily} onChange={(v) => onPatch({ fontFamily: v })} options={FONT_FAMILIES} />
        </Row>
      </Section>

      <Section
        title="Text color & gradient"
        right={
          <button
            onClick={() => onPatch({ textColors: [...DEFAULT_TEXT_COLORS] })}
            className="flex items-center gap-1 text-[10px] text-white/40 transition-colors hover:text-white"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to theme default
          </button>
        }
      >
        {[0, 1, 2].map((i) => (
          <Row key={i} label={`Color ${i + 1}`}>
            <Color value={colors[i]} onChange={(v) => setColor(i, v)} />
          </Row>
        ))}
        <Row label="Gradient animation">
          <Picker value={scene.gradientAnimation} onChange={(v) => onPatch({ gradientAnimation: v })} options={GRADIENT_ANIMATIONS} />
        </Row>
      </Section>

      <Section title="Text animation">
        <Row label="Animation">
          <Picker value={scene.animation} onChange={(v) => onPatch({ animation: v })} options={TEXT_ANIMATIONS} />
        </Row>
        <p className="mt-1 text-[10px] leading-relaxed text-white/30">{textAnimation(scene.animation).description}</p>
        <Row label="Easing">
          <Picker value={scene.easing} onChange={(v) => onPatch({ easing: v })} options={EASINGS} />
        </Row>
        <ToggleButton onClick={() => setShowEasing((v) => !v)}>Edit Easing</ToggleButton>
        {showEasing && <div className="mt-1.5"><EasingGraph easing={scene.easing} /></div>}
      </Section>

      {scene.animation === 'fade-up-words' && (
        <Section title="Words">
          <Row label="Word fade duration (frames)">
            <Num value={words.fadeDuration} min={1} max={300} step={5} onChange={(v) => setWord({ fadeDuration: v })} />
          </Row>
          <Row label="Delay between words (frames)">
            <Num value={words.stagger} min={0} max={60} step={1} onChange={(v) => setWord({ stagger: v })} />
          </Row>
          <Row label="Sentence hold duration (frames)">
            <Num value={words.holdDuration} min={0} max={300} step={5} onChange={(v) => setWord({ holdDuration: v })} />
          </Row>
          <Row label="Sentence fade out duration (frames)">
            <Num value={words.fadeOutDuration} min={0} max={300} step={5} onChange={(v) => setWord({ fadeOutDuration: v })} />
          </Row>
          <Row label="Delay between sentences (frames)">
            <Num value={words.sentenceDelay} min={0} max={300} step={5} onChange={(v) => setWord({ sentenceDelay: v })} />
          </Row>
          <Row label="Fade up distance">
            <Num value={words.distance} min={0} max={1200} step={20} onChange={(v) => setWord({ distance: v })} />
          </Row>
          <Row label="Direction">
            <Picker value={words.direction} onChange={(v) => setWord({ direction: v })} options={WORD_DIRECTIONS} />
          </Row>
          <Row label="Blur in">
            <Switch checked={words.blurOn !== false} onCheckedChange={(v) => setWord({ blurOn: v })} />
          </Row>
          {words.blurOn !== false && (
            <Row label="Blur amount (px)">
              <Num value={words.blur} min={0} max={80} step={1} onChange={(v) => setWord({ blur: v })} />
            </Row>
          )}
          <Row label="Continuous drift">
            <Switch checked={!!words.drift} onCheckedChange={(v) => setWord({ drift: v })} />
          </Row>
        </Section>
      )}

      <Section title="Typography">
        <Row label="Font weight">
          <Picker value={scene.weight} onChange={(v) => onPatch({ weight: Number(v) })} options={FONT_WEIGHTS} />
        </Row>
      </Section>

      <Section title="Timing">
        <Row label="Speed">
          <Num value={scene.speed} min={0.1} max={4} step={0.1} onChange={(v) => onPatch({ speed: v })} />
        </Row>
        <Row label="Slide speed">
          <Num value={scene.slideSpeed} min={0.1} max={4} step={0.1} onChange={(v) => onPatch({ slideSpeed: v })} />
        </Row>
        <Row label="Slide start offset">
          <Num value={scene.slideStart} min={-2000} max={2000} step={10} onChange={(v) => onPatch({ slideStart: v })} />
        </Row>
        <Row label="Slide end offset">
          <Num value={scene.slideEnd} min={-2000} max={2000} step={10} onChange={(v) => onPatch({ slideEnd: v })} />
        </Row>
      </Section>

      <Section title="Glow">
        <Row label="Glow">
          <Switch checked={!!glow.on} onCheckedChange={(v) => onPatch({ glow: { ...glow, on: v } })} />
        </Row>
        <Row label="Glow color">
          <Color value={glow.color || '#ffffff'} onChange={(v) => onPatch({ glow: { ...glow, color: v } })} />
        </Row>
        <Row label="Glow intensity">
          <Num value={glow.intensity ?? 0.5} min={0} max={1} step={0.05} onChange={(v) => onPatch({ glow: { ...glow, intensity: v } })} />
        </Row>
        <Row label="Glow dissolve duration">
          <Num value={glow.dissolve ?? 5} min={0.5} max={20} step={0.5} onChange={(v) => onPatch({ glow: { ...glow, dissolve: v } })} />
        </Row>
      </Section>

      <Section title="Background">
        <Row label="Preset">
          <select
            value=""
            onChange={(e) => {
              const preset = BACKGROUND_PRESETS.find((p) => p.id === e.target.value);
              if (preset) onPatch({ background: { ...bg, colors: [...preset.colors] } });
            }}
            className={wideField}
          >
            <option value="" className="bg-[#131314]">
              Custom
            </option>
            {BACKGROUND_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#131314]">
                {p.label}
              </option>
            ))}
          </select>
        </Row>
        {[0, 1, 2].map((i) => (
          <Row key={i} label={`Color ${i + 1}`}>
            <Color value={bgColors[i]} onChange={(v) => setBgColor(i, v)} />
          </Row>
        ))}
        <Row label="Motion">
          <Picker value={bg.motion} onChange={(v) => onPatch({ background: { ...bg, motion: v } })} options={BACKGROUND_MOTIONS} />
        </Row>
        <Row label="Motion speed">
          <Num value={bg.speed ?? 0.6} min={0} max={3} step={0.1} onChange={(v) => onPatch({ background: { ...bg, speed: v } })} />
        </Row>
      </Section>

      <Section title="Match cut to next scene">
        <Row label="Disable match cut">
          <Switch checked={!(cut.on ?? true)} onCheckedChange={(v) => onPatch({ matchCut: { ...cut, on: !v } })} />
        </Row>
        <Row label="Direction">
          <Picker
            value={cut.direction || 'left'}
            onChange={(v) => onPatch({ matchCut: { ...cut, direction: v } })}
            options={[
              { id: 'left', label: 'Left' },
              { id: 'right', label: 'Right' },
            ]}
          />
        </Row>
      </Section>

      <Section title="Outgoing (this scene exits)">
        <Row label="Duration (s)">
          <Num value={out.duration ?? 0.5} min={0} max={5} step={0.1} onChange={(v) => onPatch({ outgoing: { ...out, duration: v } })} />
        </Row>
        <Row label="Slide distance (0–1)">
          <Num value={out.slideDistance ?? 0.5} min={0} max={1} step={0.05} onChange={(v) => onPatch({ outgoing: { ...out, slideDistance: v } })} />
        </Row>
        <Row label="Drift amount (0–1)">
          <Num value={out.driftAmount ?? 0.15} min={0} max={1} step={0.05} onChange={(v) => onPatch({ outgoing: { ...out, driftAmount: v } })} />
        </Row>
        <Row label="Drift over last (s)">
          <Num value={out.driftOver ?? 2.5} min={0} max={10} step={0.5} onChange={(v) => onPatch({ outgoing: { ...out, driftOver: v } })} />
        </Row>
        <Row label="Drift curve (outgoing)">
          <Picker value={out.driftCurve} onChange={(v) => onPatch({ outgoing: { ...out, driftCurve: v } })} options={EASINGS} />
        </Row>
        <ToggleButton onClick={() => setShowOutGraph((v) => !v)}>Easing graph (outgoing)</ToggleButton>
        {showOutGraph && <div className="mt-1.5"><EasingGraph easing={out.driftCurve} /></div>}
      </Section>

      <Section title="Incoming (next scene enters)">
        <Row label="Golden ratio (1:2)">
          <Switch
            checked={!!incoming.goldenRatio}
            onCheckedChange={(v) =>
              onPatch({
                incoming: {
                  ...incoming,
                  goldenRatio: v,
                  duration: v ? Math.max(0.2, (Number(out.duration) || 0.5) * 2) : incoming.duration,
                },
              })
            }
          />
        </Row>
        <Row label="Duration (s)">
          <Num value={incoming.duration ?? 1} min={0} max={5} step={0.1} onChange={(v) => onPatch({ incoming: { ...incoming, duration: v } })} />
        </Row>
        <Row label="Slide distance (0–1)">
          <Num value={incoming.slideDistance ?? 0.5} min={0} max={1} step={0.05} onChange={(v) => onPatch({ incoming: { ...incoming, slideDistance: v } })} />
        </Row>
        <Row label="Opacity (start)">
          <Num value={incoming.opacityStart ?? 0} min={0} max={1} step={0.05} onChange={(v) => onPatch({ incoming: { ...incoming, opacityStart: v } })} />
        </Row>
        <Row label="Scale (start)">
          <Num value={incoming.scaleStart ?? 1} min={0.2} max={2} step={0.05} onChange={(v) => onPatch({ incoming: { ...incoming, scaleStart: v } })} />
        </Row>
        <ToggleButton onClick={() => setShowInGraph((v) => !v)}>Easing graph (incoming)</ToggleButton>
        {showInGraph && <div className="mt-1.5"><EasingGraph easing={incoming.easing || 'easeOutCubic'} /></div>}
      </Section>

      {entranceFrom && (
        <Section title="From previous scene (read-only)">
          <p className="text-[11px] leading-relaxed text-white/50">
            Your entrance: {entranceFrom.frames} frames, direction: {entranceFrom.direction}.
          </p>
        </Section>
      )}
    </aside>
  );
}