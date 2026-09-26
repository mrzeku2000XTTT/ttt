import React from 'react';
import { Boxes, Droplets, Grid3x3, Layers, Sliders, Sparkles, Wand2, Zap } from 'lucide-react';

const CTA_BACKDROP = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3a1783b28_generated_image.png';

const FEATURES = [
  { icon: Zap, title: 'Instant', body: 'Renders on your device — no queue, no upload.' },
  { icon: Layers, title: '12 styles', body: 'Characters, dither, mosaic, LEGO, halftone, matrix.' },
  { icon: Sliders, title: 'Live controls', body: 'Every slider redraws the artwork as you drag it.' },
  { icon: Droplets, title: 'Stackable effects', body: 'Bloom, CRT, scanlines, grain, RGB split, glitch.' },
  { icon: Boxes, title: 'Real export', body: 'PNG, JPG or WEBP up to 4× — plus WEBM for motion.' },
];

const STEPS = [
  { n: '01', title: 'Drop an image', body: 'Any JPG, PNG, WEBP or GIF. It never leaves the browser.' },
  { n: '02', title: 'It transforms itself', body: 'A style is picked at random and rendered the moment it lands.' },
  { n: '03', title: 'Randomize', body: 'New renderer, new palette, new effect stack — one click, same photo.' },
  { n: '04', title: 'Export', body: 'Save the artwork at 1×, 2× or 4×. The interface is never in the file.' },
];

const PRODUCES = [
  { icon: Grid3x3, title: 'Characters', body: 'Brightness becomes a glyph from the ramp; colour comes from the source.', sample: '@#S08Xx+=-;:,.' },
  { icon: Droplets, title: 'Dither', body: 'Real error diffusion — Floyd–Steinberg, Atkinson, Sierra, Stucki, Burkes and Bayer.', sample: 'floyd · bayer8' },
  { icon: Boxes, title: 'Mosaic', body: 'Sampled tiles with gap, angle and a highlight per tile.', sample: 'tile 18px · 4°' },
  { icon: Layers, title: 'Halftone', body: 'Print-style dots, mono or RGB, at any screen angle.', sample: '45° · rgb' },
  { icon: Sparkles, title: 'Matrix', body: 'Columns of falling glyphs whose density is the photograph.', sample: '01アイウエオ' },
  { icon: Wand2, title: 'Mixed', body: 'Two or three renderers stacked in bands across one image.', sample: 'characters + dots + pixel' },
];

export function FeatureBar() {
  return (
    <section className="max-w-[1500px] mx-auto px-4 pb-14">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="glyph-card rounded-2xl p-4">
            <f.icon className="w-4 h-4 mb-3" style={{ color: '#4A90E2' }} />
            <p className="text-[12px] font-bold tracking-tight">{f.title}</p>
            <p className="glyph-muted text-[11px] mt-1 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Workflow() {
  return (
    <section className="max-w-[1500px] mx-auto px-4 pb-14">
      <div className="text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.24em] glyph-muted">Workflow</p>
        <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.02em] mt-2">Image in. Visual code out.</h2>
        <p className="glyph-muted text-[13px] mt-2">Four steps, none of them a waiting screen.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STEPS.map((s) => (
          <div key={s.n} className="glyph-card rounded-2xl p-5">
            <span className="glyph-accent-text glyph-mono text-[18px] font-bold">{s.n}</span>
            <p className="text-[13px] font-bold tracking-tight mt-3">{s.title}</p>
            <p className="glyph-muted text-[11px] mt-1.5 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Produces() {
  return (
    <section className="max-w-[1500px] mx-auto px-4 pb-14">
      <div className="text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.24em] glyph-muted">What it renders</p>
        <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.02em] mt-2">One image, twelve languages</h2>
        <p className="glyph-muted text-[13px] mt-2">Each style is a different algorithm reading the same pixels.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PRODUCES.map((p) => (
          <div key={p.title} className="glyph-card rounded-2xl p-5">
            <p.icon className="w-4 h-4 mb-3" style={{ color: '#4A90E2' }} />
            <p className="text-[13px] font-bold tracking-tight">{p.title}</p>
            <p className="glyph-muted text-[11px] mt-1.5 leading-relaxed">{p.body}</p>
            <p className="glyph-mono text-[10px] mt-3 glyph-muted truncate">{p.sample}</p>
          </div>
        ))}
        <div
          className="rounded-2xl p-5 flex flex-col justify-between"
          style={{ background: 'linear-gradient(150deg,#1b3a56,#0d1b28)' }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: '#8ecbff' }}>
              Randomize
            </p>
            <p className="text-white text-[18px] font-extrabold tracking-[-0.02em] mt-3 leading-tight">
              The same photo,
              <br />
              endlessly re-seen.
            </p>
          </div>
          <p className="text-[11px] mt-4" style={{ color: '#a9c9e0' }}>
            Keep pressing randomize — each result is a new interpretation of your image.
          </p>
        </div>
      </div>
    </section>
  );
}

export function CtaBox({ hasWallet, onEnter }) {
  return (
    <section className="max-w-[1500px] mx-auto px-4 pb-14">
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-10 sm:px-12 sm:py-14 text-center"
        style={{ background: 'linear-gradient(150deg,#1b3a56,#0d1b28)' }}
      >
        <img src={CTA_BACKDROP} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(150deg, rgba(13,27,40,0.72), rgba(13,27,40,0.92))' }}
        />
        <div className="relative">
          <p className="glyph-word text-[12px]" style={{ color: '#8ecbff' }}>
            Glyph
          </p>
          <h2 className="text-white text-[26px] sm:text-[34px] font-extrabold tracking-[-0.02em] mt-3">
            Drop an image. See what it becomes.
          </h2>
          <p className="text-[13px] mt-3" style={{ color: '#a9c9e0' }}>
            Free to use, and the image never leaves your device.
          </p>
          <button onClick={onEnter} className="glyph-btn glyph-btn-primary px-7 py-3 mt-6">
            {hasWallet ? 'Enter studio' : 'Connect Scorpion'}
          </button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="max-w-[1500px] mx-auto px-4 pb-12">
      <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderTop: '1px solid var(--g-line)' }}>
        <div>
          <p className="glyph-word text-[11px]">Glyph</p>
          <p className="glyph-muted text-[11px] mt-1">Built for designers, motion artists and developers.</p>
        </div>
        <p className="glyph-muted text-[11px] max-w-[46ch] sm:text-right">
          Rendering, grading and effects all run in your browser. Your images are never uploaded to a server.
        </p>
      </div>
    </footer>
  );
}