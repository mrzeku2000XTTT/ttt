import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MotionPromptPanel from "@/components/motion/MotionPromptPanel";
import MotionCodeOutput from "@/components/motion/MotionCodeOutput";
import { ORBIS_NFT_PROMPT } from "@/components/motion/orbisPrompt";

export default function MotionPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [prompt, setPrompt] = useState(ORBIS_NFT_PROMPT);
  const [code, setCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior React + Tailwind engineer who specializes in vibe-coded landing page templates.

Build a single self-contained React component based on the spec below. Output ONLY the raw JSX/JS source code — no markdown fences, no commentary, no explanations.

Requirements:
- Default export, component name should match the brand in the spec
- All Tailwind classes inline
- Include any custom CSS via a <style>{\`...\`}</style> tag inside the component
- Inject Google Fonts via useEffect that appends a <link> to document.head
- Only import from "react" and "lucide-react"
- Make it pixel-faithful to the spec
- Render every section described

SPEC:
${prompt}`,
        model: "claude_sonnet_4_6",
      });

      // Strip code fences if model included them anyway
      let clean = String(result || "").trim();
      clean = clean.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*/i, "");
      clean = clean.replace(/\s*```\s*$/i, "");
      setCode(clean);
    } catch (err) {
      setCode(`// Generation failed: ${err.message || "unknown error"}\n// Try again or simplify the prompt.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => setPrompt(ORBIS_NFT_PROMPT);

  // Build a previewable HTML doc from the generated component code
  const buildPreviewHtml = () => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<style>body{margin:0;background:#010828;}</style>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="react">
const { useState, useEffect, useRef, useMemo, useCallback } = React;
// Stub lucide-react imports → use lucide global
const LucideIcon = (name) => (props) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name.toLowerCase());
      ref.current.appendChild(el);
      window.lucide.createIcons();
    }
  }, []);
  return React.createElement('span', { ref, style: { display: 'inline-flex', width: props.size || 20, height: props.size || 20 }, className: props.className });
};
const Mail = LucideIcon('mail');
const Twitter = LucideIcon('twitter');
const Github = LucideIcon('github');
const ArrowRight = LucideIcon('arrow-right');
const ChevronRight = LucideIcon('chevron-right');

${code.replace(/^\s*import[^\n;]*;?\s*$/gm, "")}

const __root = ReactDOM.createRoot(document.getElementById('root'));
// Find the default-exported component
try {
  const Comp = (typeof OrbisNftLanding !== 'undefined') ? OrbisNftLanding :
               (typeof LandingPage !== 'undefined') ? LandingPage :
               (typeof App !== 'undefined') ? App : null;
  if (Comp) __root.render(React.createElement(Comp));
  else __root.render(React.createElement('div', {style:{color:'#fff',padding:40,fontFamily:'monospace'}}, 'No exported component found'));
} catch(e) {
  __root.render(React.createElement('pre', {style:{color:'#f88',padding:24,fontFamily:'monospace',whiteSpace:'pre-wrap'}}, String(e)));
}
</script></body></html>`;
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

      {/* Two-pane workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <MotionPromptPanel
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          generating={generating}
          onReset={handleReset}
        />
        <MotionCodeOutput
          code={code}
          onPreview={() => setShowPreview(true)}
          hasPreview={!!code && !generating}
        />
      </div>

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