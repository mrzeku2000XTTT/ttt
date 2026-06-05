import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, UserRound, Sparkles, LayoutGrid, FolderClosed, Search, Share2,
  Loader2, Plus, Film, ArrowLeft, Image as ImageIcon, X, Heart, Code2,
  PanelLeftClose, PanelLeftOpen, Brain, ChevronDown,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { STORYBOARD_PRESETS } from "@/components/storyboard/storyboardPresets";
import MotionCutPrompt from "@/components/storyboard/MotionCutPrompt";
import AgentChecks from "@/components/storyboard/AgentChecks";
import PresetDropdown from "@/components/storyboard/PresetDropdown";

const STYLES = ["Kaspa Explainer", "DAG Flow", "KAS Wallet", "KRC20 Launch", "Miner Story", "TTT Agent"];

const STYLE_IDEAS = {
  "Kaspa Explainer": "Create a clear Kaspa storyboard explaining how fast KAS payments move through the DAG with blocks confirming in parallel, simple wallet actions, and readable labels for users new to Kaspa.",
  "DAG Flow": "Show a cinematic Kaspa DAG flow storyboard where many blue blocks connect at once, transactions confirm quickly, and the visual panels explain parallel block creation without confusing text.",
  "KAS Wallet": "Create a storyboard for a KAS wallet experience: a user opens their wallet, scans a QR code, sends KAS instantly, receives confirmation, and celebrates a smooth secure payment.",
  "KRC20 Launch": "Design a Kaspa KRC20 launch storyboard showing token setup, community announcement, wallet interaction, trading energy, and clear launch-day panels with clean readable labels.",
  "Miner Story": "Tell a Kaspa miner story with mining rigs, glowing DAG blocks, network contribution, fast block rewards, and a human builder proudly supporting the Kaspa ecosystem.",
  "TTT Agent": "Create a TTT Agent storyboard where an AI agent helps a user navigate Kaspa apps, understand KAS payments, verify actions, and complete a task inside the TTT ecosystem.",
};

const TEMPLATES = [
  { title: "Create a\nStoryboard", cta: "Go to Studio →", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bd8ec1706_generated_image.png", theme: "create-a-storyboard" },
  { title: "Start from\nScratch", cta: "Blank idea →", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1d43a9eae_generated_image.png", theme: "start-from-scratch" },
  { title: "Idea to\nStoryboard", cta: "Try it now →", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/27d84cbfd_generated_image.png", theme: "idea-to-storyboard" },
  { title: "DAG\nFlow Board", cta: "Get started →", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/71627bf9b_generated_image.png", theme: "dag-flow-board" },
  { title: "KAS Wallet\nStory", cta: "Build now →", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/80940743d_generated_image.png", theme: "kas-wallet-story" },
  { title: "KRC20\nLaunch Board", cta: "Try it now →", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fece3485b_generated_image.png", theme: "krc20-launch-board" },
];

const SIDEBAR_ICONS = [
  { icon: Home, label: "Home", path: "/QuickStoryboard" },
  { icon: UserRound, label: "Storyboard", path: "/QuickStoryboard" },
  { icon: LayoutGrid, label: "Styles", path: "/StoryboardStyles" },
  { icon: Sparkles, label: "Presets", path: "/StoryboardPresets" },
  { icon: FolderClosed, label: "Projects", path: "/StoryboardProjects" },
];

export default function StoryboardStudio({ onClose }) {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState("");
  const [kaspaMode, setKaspaMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thoughts, setThoughts] = useState(null);
  const [showThoughts, setShowThoughts] = useState(false);
  const [thinking, setThinking] = useState(false);
  const resultRef = useRef(null);
  const thoughtsRef = useRef(null);

  useEffect(() => {
    base44.entities.StoryboardProject.list("-created_date", 25).then(setHistory).catch(() => {});
    try {
      const seed = sessionStorage.getItem("storyboard_seed");
      if (seed) {
        const { idea: si, style: ss } = JSON.parse(seed);
        if (si) setIdea(si);
        if (ss) setStyle(ss);
        sessionStorage.removeItem("storyboard_seed");
      }
    } catch { /* ignore */ }
  }, []);

  const pickStyle = (item) => {
    if (style === item) { setStyle(""); return; }
    setStyle(item);
    if (!idea.trim()) setIdea(STYLE_IDEAS[item]);
  };

  const pickPreset = (e) => {
    const preset = STORYBOARD_PRESETS.find((p) => p.id === e.target.value);
    if (preset) { setIdea(preset.idea); setStyle(""); }
  };

  const runPrompt = async () => {
    const finalIdea = idea.trim();
    if (!finalIdea || thinking) return;
    setThinking(true);
    setShowThoughts(true);
    setThoughts(null);
    setTimeout(() => thoughtsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);

    const out = await base44.integrations.Core.InvokeLLM({
      model: "gpt_5_mini",
      prompt: `You are a senior prompt engineer for a Kaspa storyboard studio. The user's rough idea: "${finalIdea}".

Think out loud about how to improve it, then produce a fully restructured, production-ready prompt. Be concise but show your reasoning.`,
      response_json_schema: {
        type: "object",
        properties: {
          reasoning: { type: "string", description: "Step-by-step thoughts on what to improve and why" },
          restructured_prompt: { type: "string", description: "The final improved prompt" },
        },
        required: ["reasoning", "restructured_prompt"],
      },
    });

    setThoughts(out);
    setThinking(false);
  };

  const generate = async (overrideIdea) => {
    const finalIdea = (overrideIdea ?? idea).trim();
    if (!finalIdea) return;
    setIdea(finalIdea);
    setLoading(true);

    const plan = await base44.integrations.Core.InvokeLLM({
      model: "gpt_5_mini",
      add_context_from_internet: false,
      prompt: `Transform this rough user idea into a highly detailed, production-ready storyboard / character sheet prompt: "${finalIdea}".

Create: 1) concise research-inspired creative direction, 2) an enhanced professional image prompt for a clean storyboard sheet like animation studio concept art, 3) exactly three agent checks from: Prompt Engineer, Visual Director, Continuity Checker, 4) a copy-ready motion cut video prompt that turns the storyboard into a 16:9 multi-scene cinematic video cut.

The enhanced prompt must add clear scene-by-scene details, believable physics, consistent scale, natural anatomy, accurate perspective, correct shadows, material logic, and readable layout hierarchy. Avoid tiny text, paragraph text, warped text, gibberish lettering, impossible poses, melting objects, inconsistent character designs, and broken hands. If labels are needed, use only 1-3 word simple labels in exact clean English. Avoid copyrighted characters. Make it original, cinematic, family-safe, and commercially usable.`,
      response_json_schema: {
        type: "object",
        properties: {
          research_notes: { type: "string" },
          enhanced_prompt: { type: "string" },
          motion_cut_prompt: { type: "string" },
          agent_checks: {
            type: "array",
            items: { type: "object", properties: { agent: { type: "string" }, feedback: { type: "string" } } },
          },
        },
        required: ["research_notes", "enhanced_prompt", "motion_cut_prompt", "agent_checks"],
      },
    });

    const kaspaLine = kaspaMode ? " Theme this around the Kaspa ecosystem (DAG, KAS payments, wallets) where it naturally fits." : "";
    const imagePrompt = `Create a clean 16:9 professional storyboard / character design sheet. Dark cinematic studio sheet, black background, high contrast dividers, premium concept board. Style mode: ${style || "Custom"}.${kaspaLine} ${plan.enhanced_prompt}

STRICT QUALITY RULES: Use real-world physics, believable gravity, consistent scale, correct perspective, natural anatomy, clean hands, grounded shadows, coherent lighting, accurate material behavior, and stable character continuity across every scene. Avoid paragraph text inside the image. If text appears, use only large 1-3 word labels with simple exact English spelling, straight horizontal baseline, sharp letters, and clean label boxes. Never use warped, curved, misspelled, tiny, or gibberish text. Each scene panel must have a clear purpose, readable composition, and enough visual context to understand the action.

Include: main characters, expressions, action poses, key props, color palette, material swatches, scale reference, scene panels, and only short readable labels. Polished animation pitch deck layout, high-end concept art, coherent characters across panels, no watermark, no messy text.`;

    const image = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
    const created = await base44.entities.StoryboardProject.create({
      idea: finalIdea,
      style: style || "Custom",
      research_notes: plan.research_notes,
      enhanced_prompt: imagePrompt,
      motion_cut_prompt: plan.motion_cut_prompt,
      agent_checks: plan.agent_checks,
      image_url: image.url,
    });

    setProject(created);
    setHistory((h) => [created, ...h]);
    setLoading(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  return (
    <div className="fixed inset-0 z-[120] flex bg-[#0b0d12] text-white">
      {/* Left rail */}
      <aside className="hidden w-[60px] flex-col items-center border-r border-white/5 bg-[#0e1016] py-4 lg:flex">
        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 font-black">S</div>
        <div className="flex flex-1 flex-col items-center gap-1">
          {SIDEBAR_ICONS.map(({ icon: Icon, label, path }, i) => (
            <button key={label} onClick={() => navigate(path)} className={`flex w-full flex-col items-center gap-1 rounded-lg py-2 text-[9px] font-semibold transition ${i === 0 ? "text-white" : "text-white/40 hover:text-white/70"}`}>
              <Icon className="h-5 w-5" /> {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3 text-white/40">
          <Heart className="h-5 w-5" />
          <Code2 className="h-5 w-5" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">M</div>
        </div>
      </aside>

      {/* History sidebar — collapsible */}
      <aside className={`hidden flex-col overflow-hidden border-r border-white/5 bg-[#0d0f14] transition-all duration-300 ease-in-out md:flex ${sidebarOpen ? "w-[230px]" : "w-0 border-r-0"}`}>
        <div className="w-[230px] flex-shrink-0">
          <div className="flex items-center gap-2 p-3">
            <button onClick={() => { setProject(null); setIdea(""); setStyle(""); }} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-bold text-white/90 transition hover:bg-white/10">
              <Plus className="h-4 w-4" /> Create New
            </button>
            <button onClick={() => setSidebarOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10" title="Hide recent">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="w-[230px] flex-1 flex-shrink-0 overflow-y-auto px-3 pb-4">
          <p className="mb-2 mt-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Recent</p>
          {history.length === 0 && <p className="text-xs text-white/30">No storyboards yet.</p>}
          <div className="space-y-0.5">
            {history.map((h) => (
              <button key={h.id} onClick={() => { setProject(h); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }} className="block w-full rounded-lg px-2 py-2 text-left transition hover:bg-white/5">
                <p className="truncate text-[13px] font-semibold text-white/85">{h.idea || "Untitled storyboard"}</p>
                <p className="text-[10px] text-white/30">{h.style || "Custom"}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="relative flex-1 overflow-y-auto">
        {/* top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#0b0d12]/80 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 md:flex" title="Show recent">
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Exit Studio
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10"><Search className="h-4 w-4" /></button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-8">
          {/* Hero */}
          <div className="text-center">
            <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-[clamp(2rem,5vw,3.2rem)] font-black tracking-tight text-transparent">Say it with a storyboard</h1>
            <p className="mt-2 text-sm text-white/50 sm:text-base">One all-in-one agent for storyboard &amp; motion-cut creation.</p>
          </div>

          {/* Prompt box */}
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3 shadow-2xl shadow-black/40">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <PresetDropdown onPick={(p) => { setIdea(p.idea); setStyle(""); }} />
            </div>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ask for a storyboard, a character sheet, or anything in between… I can get you started."
              className="min-h-[72px] w-full resize-none bg-transparent px-2 text-sm text-white placeholder-white/40 outline-none"
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <button key={s} onClick={() => pickStyle(s)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${style === s ? "bg-white text-black" : "bg-white/5 text-white/55 hover:bg-white/10"}`}>{s}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={runPrompt} disabled={thinking || !idea.trim()} className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-bold text-white/85 transition hover:bg-white/10 disabled:opacity-40" title="Let AI show its thoughts & restructure your prompt">
                  {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  Prompt
                </button>
                <button onClick={() => generate()} disabled={loading || !idea.trim()} className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:opacity-95 disabled:opacity-40">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Creating…" : "Generate"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick chips */}
          <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {["Use a Style", "Pick a Preset", "Motion Cut Ready", "Triple Agent Check"].map((c) => (
              <span key={c} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/70">{c}</span>
            ))}
          </div>

          {/* AI thoughts panel */}
          {showThoughts && (
            <div ref={thoughtsRef} className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-violet-400/30 bg-violet-500/[0.06]">
              <button onClick={() => setShowThoughts((v) => !v)} className="flex w-full items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-white/90">
                  <Brain className="h-4 w-4 text-violet-300" /> AI Thoughts &amp; Restructured Prompt
                </span>
                <ChevronDown className="h-4 w-4 text-white/50" />
              </button>
              <div className="space-y-4 px-4 pb-4">
                {thinking && !thoughts ? (
                  <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Thinking &amp; restructuring…</div>
                ) : thoughts ? (
                  <>
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Reasoning</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{thoughts.reasoning}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Restructured Prompt</p>
                        <button onClick={() => setIdea(thoughts.restructured_prompt)} className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black transition hover:bg-white/90">Use this</button>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">{thoughts.restructured_prompt}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Template cards */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button key={t.title} onClick={() => navigate(`/StoryboardTheme?theme=${t.theme}`)} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 text-left">
                <img src={t.img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="relative flex h-full flex-col justify-between p-3">
                  <h3 className="whitespace-pre-line text-lg font-black leading-tight drop-shadow">{t.title}</h3>
                  <span className="text-xs font-bold text-white/80">{t.cta}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Result */}
          {(project || loading) && (
            <div ref={resultRef} className="mt-12 scroll-mt-4 space-y-5">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white/60">Result</h2>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex min-h-[340px] items-center justify-center overflow-hidden rounded-xl bg-black/40">
                  {loading && !project?.image_url ? (
                    <div className="text-center text-white/50">
                      <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
                      <p className="text-sm font-semibold">Researching, enhancing &amp; rendering…</p>
                    </div>
                  ) : project?.image_url ? (
                    <img src={project.image_url} alt={project.idea} className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-white/20" />
                  )}
                </div>
                {project?.image_url && (
                  <a href={project.image_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90">
                    <Film className="h-4 w-4" /> Open / Download
                  </a>
                )}
              </div>

              {project && <MotionCutPrompt project={project} isDark />}
              {project && <AgentChecks checks={project.agent_checks || []} isDark />}
            </div>
          )}
        </div>
      </main>

      <button onClick={onClose} className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 lg:hidden">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}