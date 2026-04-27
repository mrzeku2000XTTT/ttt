// Preloaded vibe-code prompt for Motion — Orbis.Nft landing page spec
export const ORBIS_NFT_PROMPT = `Create an NFT landing page called "Orbis.Nft" with 4 sections, using a dark space theme. The page uses video backgrounds served from CloudFront, a liquid glass UI effect, and a specific color/font system. Recreate it exactly as described below.

FONTS (Google Fonts)
- Anton — used for all headings and navigation text (aliased as font-grotesk in Tailwind)
- Condiment — a cursive script used for accent/overlay text (aliased as font-condiment in Tailwind)
- System monospace font (font-mono) — used for body/description paragraphs
Load via Google Fonts in index.html: https://fonts.googleapis.com/css2?family=Anton&family=Condiment&display=swap

COLOR SYSTEM (Tailwind config)
- Background: #010828 (deep dark navy blue)
- cream: #EFF4FF (off-white, used for all text)
- neon: #6FFF00 (bright green, used for accent cursive text and underline bars)

LIQUID GLASS CSS EFFECT
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

TEXTURE OVERLAY
A full-screen fixed texture overlay sits on top of everything (z-50, pointer-events-none). It uses a /texture.png image with mix-blend-mode: lighten at opacity: 0.6, covering the entire viewport with background-size: cover.

SECTION 1: HERO (Full viewport)
- Background: full-bleed looping muted autoplaying video covering the entire section with object-cover
- Video URL: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4
- Container: max-w-[1831px] centered with responsive horizontal padding
- Section has rounded-b-[32px] bottom corners, clipping the video
- Header — Left: "Orbis.Nft" logo text in Anton, 16px, uppercase
- Center: liquid-glass nav rounded-[28px] px-[52px] py-[24px], 5 links Homepage/Gallery/Buy NFT/FAQ/Contact in Anton 13px uppercase, hover:text-neon, hidden lg:block
- Hero heading in Anton, 40px mobile / 60px sm / 75px md / 90px lg, uppercase, leading-[1.05] mobile / leading-[1] tablet+, max-width 780px, lg:ml-32. Text: "Beyond earth\\nand ( its ) familiar boundaries"
- Overlaid cursive "Nft collection" in Condiment 24-48px, absolute right of heading, -rotate-1, text-neon, mix-blend-exclusion, opacity-90
- Desktop social: 3 stacked 56x56 liquid-glass rounded-[1rem] buttons top-right (Mail, Twitter, Github 20x20)
- Mobile social: same 3 buttons centered horizontally below heading, only below lg

SECTION 2: ABOUT / INTRO (Full viewport)
- Background video: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4
- max-w-[1831px], generous py 64-96px
- Top row: Left Anton heading 32-60px uppercase: "Hello!\\nI'm orbis" with Condiment "Orbis" 36-68px neon, mix-blend-exclusion absolute bottom-right rotated
- Right paragraph mono 14-16px uppercase cream max-w-[266px]: "A digital object fixed beyond time and place. An exploration of distance, form, and silence in space"
- Bottom row: two columns each with 2 identical paragraphs at opacity-10 (decorative). Right column hidden below lg. Mobile uses text-[#010828]

SECTION 3: NFT COLLECTION GRID
- Solid #010828 background
- Header left: Anton 32-60px uppercase "Collection of\\n  Space objects" — "Space" in Condiment neon, "objects" Anton, second line indented ml-12/ml-24/ml-32
- Header right: "SEE ALL CREATORS" button — "SEE" 32-60px, "ALL"/"CREATORS" stacked smaller 20-36px, neon bar bg-neon h-1.5/h-2.5 below
- 3-col grid (lg) / 2-col / 1-col, gap 24px
- Each card: liquid-glass rounded-[32px] p-[18px] hover:bg-white/10
- Inside: square video (pb-[100%]) rounded-[24px] overflow-hidden
- Video URLs:
  1) https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4 — 8.7/10
  2) https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4 — 9/10
  3) https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4 — 8.2/10
- Each card overlay bar at bottom: liquid-glass rounded-[20px] px-5 py-4, "RARITY SCORE:" label (11px cream/70%) and score value (16px). Right side: 48x48 circular gradient button bg-gradient-to-br from-[#b724ff] to-[#7c3aed] right-arrow chevron, shadow-lg shadow-purple-500/50, hover:scale-110

SECTION 4: CTA / FINAL
- Video full-width w-full h-auto block: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4
- Right-aligned text block, lg:pr-[20%] lg:pl-[15%]
- Small "Go beyond" Condiment cursive neon mix-blend-exclusion 17-68px absolute top-left of heading
- Anton heading 16-60px uppercase: "JOIN US.\\nREVEAL WHAT'S HIDDEN.\\nDEFINE WHAT'S NEXT.\\nFOLLOW THE SIGNAL." — "JOIN US." has mb-4→mb-12 responsive
- Bottom-left absolute social: left-[8%] bottom-[12%]→bottom-[20%], vertical liquid-glass rounded-[0.5rem]→rounded-[1.25rem], 3 stacked icons (Mail, Twitter, Github), buttons w-[14vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem], dividers border-b border-white/10 except last

KEY TECHNICAL DETAILS
- React + Tailwind CSS, lucide-react for Mail/Twitter/Github
- All videos: autoPlay loop muted playsInline
- Mobile-first responsive sm:/md:/lg:
- Max content width 1831px across all sections
- All text uppercase except Condiment cursive accents

OUTPUT REQUIREMENTS
- Output ONE single self-contained React component (default export) named OrbisNftLanding
- Inline all styles with Tailwind classes; include the .liquid-glass CSS as a <style jsx> block at the top of the component
- Inline a Google Fonts <link> via a useEffect that injects it into document.head
- No external imports beyond react and lucide-react
- Do NOT wrap in markdown code fences — return raw JSX/JS only`;