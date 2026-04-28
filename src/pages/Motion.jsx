import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MotionPromptPanel from "@/components/motion/MotionPromptPanel";
import MotionCodeOutput from "@/components/motion/MotionCodeOutput";
import MotionPresetMarketplace from "@/components/motion/MotionPresetMarketplace";
import { ORBIS_NFT_PROMPT } from "@/components/motion/orbisPrompt";
import { MOTION_PRESETS } from "@/components/motion/motionPresets";

export default function MotionPage() {
  // Read seed from sessionStorage at mount-time so we never flash the Orbis default
  const seededInit = (() => {
    try {
      const seeded = sessionStorage.getItem("motion_seeded_prompt");
      const seededTitle = sessionStorage.getItem("motion_seeded_title");
      if (seeded) {
        sessionStorage.removeItem("motion_seeded_prompt");
        sessionStorage.removeItem("motion_seeded_title");
        return {
          prompt: seeded,
          preset: {
            id: "seeded",
            name: seededTitle || "From Prompt Library",
            tagline: "Seeded prompt",
            prompt: seeded,
          },
        };
      }
    } catch {}
    return null;
  })();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [prompt, setPrompt] = useState(seededInit?.prompt || ORBIS_NFT_PROMPT);
  const [code, setCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [activePreset, setActivePreset] = useState(seededInit?.preset || MOTION_PRESETS[0]);
  const [attachedRefs, setAttachedRefs] = useState([]);
  const [mobileTab, setMobileTab] = useState("prompt"); // 'prompt' | 'code'

  const handleAttachReference = (ref) => setAttachedRefs((prev) => [...prev, ref]);
  const handleRemoveRef = (idx) => setAttachedRefs((prev) => prev.filter((_, i) => i !== idx));
  const handleAppendToPrompt = (text) => setPrompt((prev) => `${prev}\n\nADDITIONAL INSTRUCTION:\n${text}`);

  useEffect(() => {
    base44.auth.me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setCode("");
    try {
      const refNote = attachedRefs.length > 0
        ? `\n\nVISUAL REFERENCES: ${attachedRefs.length} reference image(s) attached. Match their visual style, color palette, and composition.`
        : "";
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior React + Tailwind engineer who specializes in HIGH-MOTION, vibe-coded landing pages with cinematic animation. Your output must FEEL ALIVE — never static, never flat.

Build a single self-contained React component based on the spec below. Output ONLY the raw JSX/JS source code — no markdown fences, no commentary, no explanations.

CRITICAL ANIMATION REQUIREMENTS (match the energy of the Orbis NFT reference):
- Use background looping <video> tags with autoPlay/muted/loop/playsInline whenever the spec mentions cinematic, hero, video, or atmospheric backgrounds. Use placeholder MP4 URLs from sample-videos.com or coverr-style CDN if no specific URL is given.
- Add custom @keyframes animations in the <style> tag for: floating elements (translateY loops), pulsing glows (box-shadow + opacity), shimmer effects (background-position sweep), marquee scrolls (translateX infinite), fade-in-up entrances, gradient shifts, and subtle parallax tilts on hover.
- Use scroll-triggered fade/slide-in via IntersectionObserver in useEffect — elements should animate IN as they enter viewport, not appear instantly.
- Mouse-tracking effects: at minimum, hero sections should respond to mouse movement (gradient follow, parallax tilt, or spotlight effect) using onMouseMove handlers.
- Hover states must be RICH: scale transforms, shadow lifts, border glows, color shifts, icon rotations — all with transition-all duration-300 or longer.
- Animated counters/stats where appropriate (numbers that count up on scroll-in).
- Liquid/glass effects with backdrop-blur, layered gradients, and animated noise/grain overlays via CSS.
- Buttons must have hover micro-interactions (arrow slide, glow pulse, shimmer sweep).
- Include floating/orbiting decorative elements (blurred gradient orbs, animated SVG paths, particle dots) in hero sections.

TECHNICAL REQUIREMENTS:
- Default export, component name should match the brand in the spec
- All Tailwind classes inline
- All custom keyframes & animations via <style>{\`...\`}</style> tag inside the component
- Inject Google Fonts via useEffect that appends a <link> to document.head
- Only import from "react" and "lucide-react"
- Use useState + useEffect for scroll position, mouse position, intersection observer
- Make it pixel-faithful to the spec AND animation-faithful to the energy described
- Render every section described — do not skip sections
- IMPORTANT: When the spec contains a literal "\\n" (backslash-n) inside a headline or copy string, treat it as a line break — render it as a JSX <br/> or split the text across multiple spans on separate lines. NEVER output the literal characters "\\n" as visible text on the page.
- IMPORTANT: When the spec mentions clamp(...) values for font sizes, output them via inline style={{ fontSize: 'clamp(...)' }} since Tailwind cannot parse arbitrary clamp expressions reliably.
- IMPORTANT: All Google Fonts referenced in the spec MUST be injected via a useEffect that appends a <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..."/> to document.head, and applied via inline style fontFamily — Tailwind cannot reach custom font names without config.
- The result must FEEL like a $50k design agency landing page, not a static template${refNote}

SPEC:
${prompt}`,
        model: "claude_sonnet_4_6",
        file_urls: attachedRefs.map((r) => r.url),
      });

      // Strip code fences if model included them anyway
      let clean = String(result || "").trim();
      clean = clean.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*/i, "");
      clean = clean.replace(/\s*```\s*$/i, "");
      setCode(clean);
      // Auto-switch to code tab on mobile when generation completes
      setMobileTab("code");
    } catch (err) {
      setCode(`// Generation failed: ${err.message || "unknown error"}\n// Try again or simplify the prompt.`);
      setMobileTab("code");
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setPrompt(activePreset?.prompt || ORBIS_NFT_PROMPT);
  };

  const handlePickPreset = (preset) => {
    setActivePreset(preset);
    setPrompt(preset.prompt);
    setCode("");
  };

  // Build a previewable HTML doc from the generated component code
  const buildPreviewHtml = () => {
    // Strip imports — we provide React + lucide-react via ESM
    let body = code
      // Strip multi-line imports: import ... from "x"; (handles braces across newlines)
      .replace(/^\s*import\s+[\s\S]*?from\s*["'][^"']+["']\s*;?/gm, "")
      // Strip side-effect imports: import "x";
      .replace(/^\s*import\s+["'][^"']+["']\s*;?/gm, "")
      .replace(/^\s*export\s+default\s+/gm, "__DEFAULT_EXPORT__ = ")
      .replace(/^\s*export\s+/gm, "");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<style>html,body,#root{margin:0;padding:0;background:#010828;min-height:100vh;}</style>
</head><body><div id="root"></div>
<script type="importmap">
{ "imports": {
  "react": "https://esm.sh/react@18.3.1",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": "https://esm.sh/react-dom@18.3.1/client"
}}
</script>
<script type="module">
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment } from "react";
import { createRoot } from "react-dom/client";
import * as LucideAll from "https://esm.sh/lucide-react@0.475.0?deps=react@18.3.1";
import * as Babel from "https://esm.sh/@babel/standalone@7.25.6";

window.React = React;
Object.assign(window, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment });

const root = createRoot(document.getElementById("root"));
const showError = (msg) => root.render(
  React.createElement("pre",
    { style: { color: "#fca5a5", padding: 24, fontFamily: "ui-monospace,monospace", fontSize: 12, whiteSpace: "pre-wrap", background: "#0a0a0f", minHeight: "100vh" } },
    String(msg)
  )
);

try {
  const SOURCE = ${JSON.stringify(body)};
  const transformed = Babel.transform(SOURCE, {
    presets: [["react", { runtime: "classic" }]],
    filename: "preview.jsx"
  }).code;

  // Build destructured lucide bindings used in the source
  const lucideNames = Object.keys(LucideAll).filter(n => /^[A-Z]/.test(n));
  const lucideBindings = lucideNames.map(n => \`var \${n} = __L.\${n};\`).join("\\n");

  const factory = new Function("React", "__L",
    "const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment } = React;\\n" +
    lucideBindings + "\\n" +
    "var __DEFAULT_EXPORT__ = null;\\n" +
    transformed + "\\n" +
    "return __DEFAULT_EXPORT__;"
  );

  const Comp = factory(React, LucideAll);
  if (typeof Comp !== "function") {
    showError("Generated code did not export a default React component.");
  } else {
    root.render(React.createElement(Comp));
  }
} catch (e) {
  showError((e && e.stack) || String(e));
}
</script>
</body></html>`;
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center px-5">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mx-auto mb-5 flex items-center justify-center">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-[900] text-white mb-2">Motion</h1>
          <p className="text-[13px] text-white/50 mb-6">
            Vibe-code landing page generator — admin access only.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/80 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] text-white flex flex-col">
      {/* Top bar */}
      <nav className="h-14 flex items-center justify-between px-5 bg-black/60 backdrop-blur-xl border-b border-white/10 z-40 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[900] tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Motion</span>
          <span className="text-[9px] font-bold bg-cyan-500 text-white px-1.5 py-[1px] rounded">VIBE-CODE</span>
        </div>
        <span className="text-[11px] text-white/40 font-medium hidden sm:block">Admin only</span>
      </nav>

      {/* Mobile tab switcher (hidden on lg+) */}
      <div className="lg:hidden flex items-center gap-1 px-3 py-2 bg-black/40 border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => setMobileTab("prompt")}
          className={`flex-1 h-9 rounded-lg text-[12px] font-bold transition-all ${
            mobileTab === "prompt"
              ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-white/15"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          Prompt
        </button>
        <button
          onClick={() => setMobileTab("code")}
          className={`flex-1 h-9 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "code"
              ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-white/15"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          Code
          {generating && <Loader2 className="w-3 h-3 animate-spin" />}
          {!generating && code && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
        </button>
      </div>

      {/* Two-pane workspace — stacked on mobile, side-by-side on lg+ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <div className={`${mobileTab === "prompt" ? "flex" : "hidden"} lg:flex flex-col min-h-0`}>
          <MotionPromptPanel
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            generating={generating}
            onReset={handleReset}
            onBrowsePresets={() => setShowMarketplace(true)}
            activePreset={activePreset}
            attachedRefs={attachedRefs}
            onAttachReference={handleAttachReference}
            onRemoveRef={handleRemoveRef}
            onAppendToPrompt={handleAppendToPrompt}
          />
        </div>
        <div className={`${mobileTab === "code" ? "flex" : "hidden"} lg:flex flex-col min-h-0`}>
          <MotionCodeOutput
            code={code}
            onPreview={() => setShowPreview(true)}
            hasPreview={!!code && !generating}
          />
        </div>
      </div>

      {/* Preset marketplace */}
      <MotionPresetMarketplace
        open={showMarketplace}
        onClose={() => setShowMarketplace(false)}
        onPick={handlePickPreset}
      />

      {/* Live preview modal */}
      {showPreview && code && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
          <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-black/60">
            <span className="text-white/80 text-sm font-semibold">Live Preview</span>
            <button
              onClick={() => setShowPreview(false)}
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            title="motion-preview"
            srcDoc={buildPreviewHtml()}
            sandbox="allow-scripts allow-same-origin"
            className="flex-1 w-full bg-white border-0"
          />
        </div>
      )}
    </div>
  );
}