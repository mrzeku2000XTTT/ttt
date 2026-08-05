/**
 * KUTT Motion UI Library
 * Every text animation + UI component the Motion agent can compose with.
 * Each entry carries a production-grade prompt recipe built on the three pillars:
 * component behaviour · camera dynamics · temporal keyframing.
 * House style throughout: clean minimalist Apple / iOS — SF-style typography,
 * generous whitespace, soft studio light, real browser/device chrome.
 */

export const HOUSE_STYLE =
  "Clean minimalist Apple/iOS design language. SF Pro style typography, tight optical kerning, generous whitespace, 12-20px corner radii, hairline 1px separators, soft neutral greys with a single accent hue. Soft diffused studio lighting, subtle ambient occlusion under floating layers, no harsh shadows. High-fidelity screen-recording aesthetic, crisp vector edges, 4K, 60fps, no gibberish text — use short real labels only.";

export const TIMING_RULES =
  "Temporal keyframing: 0.0-1.0s fast initialization, elements linear scale-in and pop into existence with no lag. 1.0-3.0s snappy ease-in-out, 0.3s transitions, panels slide and snap into perfect registration. 3.0-5.0s dampened settle, microscopic organic hover drift, slow cinematic push.";

export const CAMERA_MOVES = {
  macro_pan: "Macro pan & scan — camera tracks horizontally at steady speed across the interface, emphasising typographic contrast and sharp UI lines.",
  parallax_tilt: "Parallax isometric tilt — 30-degree isometric perspective, camera slowly arcs upward as layered UI cards separate and float above the canvas.",
  focal_zoom: "Focal zoom-in — dramatic push straight into one row or CTA, narrow depth of field heavily blurring the surrounding dashboard.",
  crane_scroll: "Crane scroll match — smooth crane-like downward descent perfectly synced to a continuous infinite scroll.",
  locked_off: "Locked-off frontal shot, dead-centre composition, only the UI itself animates.",
  orbit_45: "Macro isometric 45-degree orbit close-up with heavy background blur and realistic glassmorphism.",
};

// ─── TEXT ANIMATIONS ───
export const TEXT_ANIMATIONS = [
  { id: "split_text", label: "Split Text", recipe: "Headline splits along its centre line, halves separating vertically with a springy ease-out, then re-joining into perfect registration." },
  { id: "typewriter", label: "Typewriter", recipe: "Text types on character by character with a crisp blinking caret, monospaced rhythm, faint cursor glow." },
  { id: "rotating", label: "Rotating", recipe: "A single word slot rotates through three alternates on a vertical drum, each landing with a dampened settle." },
  { id: "fade_up_words", label: "Fade Up Words", recipe: "Words fade up one by one from 12px below the baseline, 60ms stagger, opacity 0 to 1 with a soft blur burn-off." },
  { id: "spring_scale", label: "Spring Scale", recipe: "Text scales from 0.85 to 1.0 on an overshooting spring, tiny 1.03 overshoot then a damped return." },
  { id: "anchor_flow", label: "Anchor + Flow", recipe: "One anchor word holds fixed while the surrounding line flows in around it from both edges." },
  { id: "motion_text", label: "Motion Text", recipe: "Kinetic typography — the line drifts with continuous momentum, subtle motion blur on the fastest frames." },
  { id: "staggered_reveal", label: "Staggered Reveal", recipe: "List lines cascade in top-to-bottom, each a 0.2s fade-in plus scale-up, strict 80ms stagger." },
  { id: "slide_scale", label: "Slide Scale", recipe: "Text slides in from the left while simultaneously scaling up, ease-in-out, settling with no bounce." },
  { id: "word_scale_sequence", label: "Word Scale Sequence", recipe: "Each word punches up to 1.1 scale in sequence like a beat, returning to 1.0 before the next fires." },
  { id: "static_text", label: "Static Text", recipe: "Perfectly still typographic card, no animation — only the camera moves." },
];

// ─── UI COMPONENTS ───
export const UI_COMPONENTS = [
  { id: "title_card", label: "Title Card", recipe: "Full-bleed minimalist title card, oversized centred headline on a soft off-white or near-black canvas, thin accent rule beneath." },
  { id: "browser_window", label: "Browser Window", recipe: "Photoreal macOS Safari browser window — rounded corners, three traffic-light dots, clean pill URL bar, subtle window shadow — floating on a soft gradient backdrop, real web page content inside." },
  { id: "phone_window", label: "Phone Window", recipe: "Floating phone-shaped viewport with iOS status bar, rounded 44px corners and a home indicator line, app content scrolling inside." },
  { id: "iphone", label: "iPhone", recipe: "Photoreal titanium iPhone in three-quarter view, Dynamic Island visible, screen emitting soft light onto the surrounding surface." },
  { id: "macbook", label: "MacBook", recipe: "Photoreal MacBook Pro, lid at 105 degrees, screen showing the interface, keyboard catching a soft rim light, sitting on a matte neutral surface." },
  { id: "div_morph", label: "Div Morph", recipe: "One UI container smoothly morphs into another — corner radius, size and content cross-fading in a single continuous fluid transform." },
  { id: "card_stack_1", label: "Card Stack 1", recipe: "Three cards stacked in depth, the top card lifting and sliding away to reveal the next, dampened settle." },
  { id: "card_stack_2", label: "Card Stack 2", recipe: "Cards fan out horizontally from a single stack into a neat row, each landing with a 0.3s snap." },
  { id: "card_stack_3", label: "Card Stack 3", recipe: "Isometric card stack exploding apart vertically into floating parallax layers with visible depth spacing." },
  { id: "card_stack_4", label: "Card Stack 4 (halo + zoom)", recipe: "Card stack with a soft glowing halo behind the hero card, camera zooming in as the halo pulses once." },
  { id: "search_animation_1", label: "Search Animation 1", recipe: "Search field expands from a compact icon into a full pill input, query types in, results cascade below in a staggered reveal." },
  { id: "search_animation_2", label: "Search Animation 2", recipe: "Command-palette overlay fades in over a blurred interface, cursor moves down highlighted rows with a soft active glow." },
  { id: "logo_animation_1", label: "Logo Animation 1", recipe: "Logo mark draws itself in with a mask wipe, then the wordmark fades up beside it and the whole lockup settles." },
  { id: "logo_animation_2", label: "Logo Animation 2", recipe: "Logo assembles from separated geometric parts flying into alignment, one specular sweep across the finished mark." },
  { id: "ui_animation", label: "UI Animation", recipe: "Composite interface choreography — sidebar expands, main content cards fluidly squeeze and resize to the new viewport, toggles and pills animating state." },
  { id: "widget_box", label: "Widget Box", recipe: "A single floating iOS-style widget card — frosted glassmorphic panel, rounded 24px corners, one metric in oversized type, a small sparkline and a status pill, hovering with a soft drop shadow." },
  { id: "sidebar_expand", label: "Sidebar Expand", recipe: "Left navigation panel smoothly expands out, main content cards fluidly squeeze and resize to fit the new viewport layout." },
  { id: "dropdown_reveal", label: "Dropdown Reveal", recipe: "A profile icon click triggers a crisp downward vertical unfold, the menu list arriving on an organic dampened motion profile." },
  { id: "hover_glow", label: "Active State Glow", recipe: "Cursor asset overlays a list row, the container background shifting with a soft pulsing accent glow highlight." },
  { id: "videos", label: "Videos", recipe: "Video tile grid inside the interface, thumbnails loading in with a staggered fade and one tile expanding to fill the frame." },
];

export const ALL_MOTION_PARTS = [...TEXT_ANIMATIONS, ...UI_COMPONENTS];

export function findPart(id) {
  return ALL_MOTION_PARTS.find((p) => p.id === id);
}

export function partMenu() {
  return `TEXT ANIMATIONS:\n${TEXT_ANIMATIONS.map((t) => `- ${t.id} (${t.label}): ${t.recipe}`).join("\n")}\n\nUI COMPONENTS:\n${UI_COMPONENTS.map((c) => `- ${c.id} (${c.label}): ${c.recipe}`).join("\n")}\n\nCAMERA MOVES:\n${Object.entries(CAMERA_MOVES).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;
}

/** Assemble the final render prompt for one motion-UI scene. */
export function buildMotionPrompt({ component, textAnimation, camera, content, palette, aspect }) {
  const comp = findPart(component);
  const txt = findPart(textAnimation);
  const cam = CAMERA_MOVES[camera] || CAMERA_MOVES.locked_off;

  return [
    comp?.recipe || UI_COMPONENTS[1].recipe,
    content,
    txt ? `Text behaviour: ${txt.recipe}` : "",
    `Camera: ${cam}`,
    TIMING_RULES,
    palette ? `Palette: ${palette}.` : "",
    HOUSE_STYLE,
    aspect ? `${aspect} composition.` : "",
  ].filter(Boolean).join(" ");
}