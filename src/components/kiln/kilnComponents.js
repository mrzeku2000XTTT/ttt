// The ETA component library, as the studio shows it.
// Mirrors base44/shared/kilnEtaModel.ts (and src/docs/ETA_ANIMATION_EDITOR.md).

export const ETA_LIBRARY = [
  { name: 'TitleCard', use: 'Opening or section headline' },
  { name: 'NumberDisplay', use: 'Statistics, counters, KPIs' },
  { name: 'Glass', use: 'Translucent visual panel' },
  { name: 'BrowserWindow', use: 'Browser mockup, zoom + cursor choreography' },
  { name: 'PhoneWindow', use: 'Mobile application window' },
  { name: 'Cards', use: 'Feature and benefit card systems' },
  { name: 'Cards2', use: 'Two-up card row' },
  { name: 'Cards3', use: 'Three-up card row' },
  { name: 'Cards4', use: 'Four-up card row' },
  { name: 'IPhoneAnimated', use: 'Animated phone presentation' },
  { name: 'MacBookAnimated', use: 'Animated laptop presentation' },
  { name: 'DivMorph', use: 'Container and layout morphing' },
  { name: 'SearchAnimation', use: 'Search-interface motion' },
  { name: 'LogoAnimation', use: 'Brand reveal and outro' },
  { name: 'UIAnimation', use: 'General interface animation' },
  { name: 'Video', use: 'Imported video media' },
];

// Ready-made ETA edit briefs the rail drops into the composer.
export const ETA_EDIT_IDEAS = [
  { label: 'SplitText headline', brief: 'Animate the main headline with the ETA SplitText preset, ease-out, and mark it data-text-motion="SplitText".' },
  { label: 'FadeUpWords copy', brief: 'Give the paragraph and card copy the ETA FadeUpWords preset with a short stagger, ease-out.' },
  { label: 'Zoom keyframe', brief: 'Add a BrowserWindow-style zoom keyframe onto the primary card: scale 1.4, ease-in-out, with a zoom-in transition in.' },
  { label: 'Cursor walkthrough', brief: 'Add cursor steps that move to the primary call to action and click it, then rest.' },
  { label: 'Cards4 row', brief: 'Rebuild the feature row as an ETA Cards4 component with four equal cards.' },
  { label: 'LogoAnimation outro', brief: 'Close the sheet with an ETA LogoAnimation reveal and a zoom-out transition.' },
  { label: 'NumberDisplay', brief: 'Turn the statistics into an ETA NumberDisplay with a count-up keyframe.' },
  { label: 'Drift out', brief: 'Add a match transition: drift the current block out to the left over 420ms, ease-in-out.' },
];