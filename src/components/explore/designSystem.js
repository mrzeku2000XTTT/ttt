// Baked-in premium design system ("design.md") for the Blueprint landing-page generator.
// Injected into every generation prompt so output is consistently world-class,
// Apple-grade, motion-rich ("motionsites") — without the LLM guessing.
// Also ships a motion runtime injected into the preview host iframe.

export const PREMIUM_DESIGN_SPEC = `PREMIUM DESIGN SYSTEM — "MotionSites" — MANDATORY for every page. Bake this in; never produce generic template-looking output.

TYPOGRAPHY (Inter is loaded by the host):
- Hero headline: text-5xl sm:text-6xl lg:text-7xl, font-extrabold, tracking-tight, leading-[1.02]. Tight letter-spacing on big type.
- Section titles: text-3xl sm:text-4xl font-bold tracking-tight.
- Body: text-base sm:text-lg leading-relaxed text-neutral-600. Keep measure ~65ch.
- Eyebrow/labels: text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400.
- Emphasize one or two key words in the hero with gradient text (bg-clip-text text-transparent bg-gradient-to-r from-... to-...).

COLOR (light default, unless the user explicitly asks dark):
- Background: white / neutral-50. Ink: near-black #0a0a0a. Body text neutral-600, muted neutral-400.
- One vibrant accent (choose a tasteful indigo/violet/emerald that fits the product). Use it sparingly: CTAs, gradient highlights, icon strokes, highlighted borders.
- Hairline borders: border-neutral-200 / border-black/5. Cards: border border-neutral-200 bg-white.
- If the user asks for dark: bg-neutral-950, text-white/neutral-300, accents pop on dark, borders white/10.

SPACING & LAYOUT:
- Sections: py-24 sm:py-32. Container: max-w-7xl mx-auto px-6 sm:px-8. Generous whitespace between blocks.
- Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8. Bento grids mix col-spans (md:col-span-2).
- Radius: rounded-2xl cards, rounded-full pills/buttons, rounded-3xl hero cards.
- Shadows: shadow-sm resting; hover:shadow-xl hover:-translate-y-1 transition-all duration-300.

MOTION — "motionsites" (the host injects a scroll-reveal runtime — USE IT):
- Add class "reveal" to any element that should animate in on scroll (fades + slides up). Stagger with "reveal-delay-1" / "reveal-delay-2" / "reveal-delay-3" / "reveal-delay-4".
- Hero: a subtle animated aurora/gradient backdrop (radial-gradient blobs) plus one or two floating elements using class "animate-float".
- Trusted-by strip: wrap brand names in a "marquee" container (host provides the marquee animation).
- Buttons: hover:scale-105 with a soft shadow glow. Cards: hover lift (translate-y + shadow). Links: hover to accent color.
- Keep motion tasteful (150-600ms easing), never janky. The host respects prefers-reduced-motion.

SECTION ANATOMY (include all that fit; never lorem ipsum — write real, punchy marketing copy):
1. Sticky nav: backdrop-blur-xl bg-white/70 border-b border-neutral-200; logo text + nav links + CTA pill.
2. Hero (min-h-[90vh]): big headline with a gradient-highlighted word, subhead, two CTAs (primary filled accent, secondary ghost/outline), aurora/gradient backdrop or product mock, floating chips. Reveal on load.
3. Trusted-by marquee of brand names.
4. Features: a bento grid (mixed col-spans) with inline SVG icons (lucide-style, stroke-width 1.5, currentColor), title + one-line description, hover lift.
5. How it works: 3 numbered steps with a connecting hairline.
6. Showcase / product highlight: a large rounded-3xl card with a mock UI or Unsplash image.
7. Testimonial: a large pull-quote, avatar, name, role.
8. Pricing: 2-3 tiers; middle one highlighted (accent border + scale-105), check-icon feature lists.
9. Stats band: 3-4 large tabular-nums numbers.
10. Final CTA: full-width gradient/aurora band, headline + CTA.
11. Footer: 4-5 columns of links, logo, copyright, socials.

PREMIUM PATTERNS TO USE:
- Bento grids with mixed cell sizes for visual rhythm.
- Glassmorphism: backdrop-blur-xl bg-white/60 border border-white/40 over rich backgrounds.
- Gradient text for one or two key hero words.
- Hairline dividers, generous padding, a micro-interaction on every interactive element.
- Inline SVG icons only (never external icon libraries). Stroke width 1.5, currentColor.

IMAGES: use real Unsplash photo URLs that exist, with a width param (e.g. https://images.unsplash.com/photo-1557683316-ea9c9d4e6d70?w=1200).

RESPONSIVE: mobile-first; sm:/md:/lg: breakpoints. Nothing overflows at 375px. Nav collapses cleanly on mobile.

ACCESSIBILITY: alt text on images, sufficient contrast, visible focus rings.

OUTPUT RULES (unchanged): return ONLY the inner <body> HTML. No <html>/<head>/<body>/<script> tags — the host provides them. No markdown, no backticks, no explanation. Tailwind utility classes only (CDN loaded by host). Use the "reveal", "reveal-delay-*", "marquee" and "animate-float" classes for motion — the host provides the runtime CSS/JS.`;

// Injected into the preview iframe <style> so generated pages animate without
// the LLM shipping its own scripts. Keep backtick-free (interpolated into templates).
export const MOTION_RUNTIME_CSS = `
@keyframes bp_aurora { 0%,100%{transform:translate(-8%,-8%) rotate(0deg)} 50%{transform:translate(8%,8%) rotate(180deg)} }
@keyframes bp_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes bp_marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.reveal{opacity:0;transform:translateY(24px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}
.reveal.reveal-in{opacity:1;transform:none}
.reveal-delay-1{transition-delay:.08s}
.reveal-delay-2{transition-delay:.16s}
.reveal-delay-3{transition-delay:.24s}
.reveal-delay-4{transition-delay:.32s}
.marquee{display:flex;gap:3rem;align-items:center;width:max-content;animation:bp_marquee 32s linear infinite}
.animate-float{animation:bp_float 6s ease-in-out infinite}
.animate-aurora{animation:bp_aurora 14s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .reveal{opacity:1;transform:none;transition:none}
  .marquee,.animate-float,.animate-aurora{animation:none}
}
`;

// Injected before the iframe edit script. Reveals .reveal elements on scroll.
export const MOTION_RUNTIME_JS = `(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('reveal-in');io.unobserve(e.target);}})},{threshold:0.12,rootMargin:'0px 0px -8% 0px'});function bind(){document.querySelectorAll('.reveal:not(.reveal-in)').forEach(function(el){io.observe(el);});}if(document.readyState!=='loading'){bind();}else{document.addEventListener('DOMContentLoaded',bind);}})();`;