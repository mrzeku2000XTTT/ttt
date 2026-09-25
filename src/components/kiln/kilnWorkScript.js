// What KILN is actually doing while it works — the codes streamed in the waiting bubble.

export const KILN_STAGES = [
  'Reading the source pixels',
  'Mapping blocks to ETA components',
  'Writing the component HTML',
  'Linking the transition',
];

export const KILN_CODE = [
  '<section data-eta-component="BrowserWindow">',
  '  .card { display:grid; gap:24px; border-radius:18px; }',
  '  @keyframes fadeUpWords { from { opacity:0; transform:translateY(14px) } }',
  '  --ink:#2B1D16; --accent:#C08A4E; --surface:#FBF7F0;',
  '  <h1 data-text-motion="SplitText" data-easing="ease-out">',
  '  transition: zoom-in 640ms cubic-bezier(.22,.61,.36,1);',
  '  /* zoom-keyframe: selector .pricing, scale 1.4, ease ease-in-out */',
  '  <div data-source-item="hero-1">',
  '  box-shadow: 0 18px 40px -24px rgba(43,29,22,.45);',
  '  @keyframes driftOut { to { transform:translateX(-38px); opacity:0 } }',
  '  cursor-step { target:"#cta", duration:420ms, click:true }',
  '  <span data-eta-component="NumberDisplay">',
  '  font-feature-settings: "ss01","cv11"; letter-spacing:-0.01em;',
  '  .grid { grid-template-columns: repeat(4, minmax(0,1fr)); }',
  '  document.fonts.ready.then(measure);',
  '  /* fitting the canvas 1:1 to the source ratio */',
  '  @keyframes springScaleText { 0%{transform:scale(.94)} 60%{transform:scale(1.02)} }',
  '  <article data-source-section="features">',
  '  data-eta-settings="text:RotatingText;easing:ease-in-out;transition:left"',
  '  border-radius: 16px; border: 1px solid rgba(43,29,22,.09);',
  '  const rows = blocks.map(b => classify(b));',
  '  @media (prefers-reduced-motion: reduce) { * { animation:none } }',
  '  <footer data-eta-component="LogoAnimation">',
  '  /* cursor steps rest at the primary CTA */',
  '  opacity: 0; animation: fadeUpWords 520ms ease-out forwards;',
  '  <nav data-eta-component="UIAnimation">',
];