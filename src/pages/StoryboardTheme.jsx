import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles, Film, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MotionCutPrompt from "@/components/storyboard/MotionCutPrompt";
import AgentChecks from "@/components/storyboard/AgentChecks";

const THEMES = {
  "create-a-storyboard": {
    title: "Create a Storyboard",
    subtitle: "A polished multi-panel storyboard sheet, ready to generate.",
    style: "Custom",
    accent: "from-violet-500 to-indigo-500",
    idea: "Create a polished character storyboard sheet with expressions, action poses, props and a clean color palette.",
  },
  "start-from-scratch": {
    title: "Start from Scratch",
    subtitle: "A blank canvas — type your own idea and generate.",
    style: "Custom",
    accent: "from-slate-400 to-slate-600",
    idea: "",
  },
  "idea-to-storyboard": {
    title: "Idea to Storyboard",
    subtitle: "Turn a simple Kaspa idea into a clean storyboard instantly.",
    style: "Kaspa Explainer",
    accent: "from-cyan-500 to-blue-500",
    idea: "Create a clear Kaspa storyboard explaining how fast KAS payments move through the DAG with blocks confirming in parallel, simple wallet actions, and readable labels for users new to Kaspa.",
  },
  "dag-flow-board": {
    title: "DAG Flow Board",
    subtitle: "A cinematic DAG flow storyboard with parallel blocks.",
    style: "DAG Flow",
    accent: "from-emerald-500 to-teal-500",
    idea: "Show a cinematic Kaspa DAG flow storyboard where many blue blocks connect at once, transactions confirm quickly, and the visual panels explain parallel block creation without confusing text.",
  },
  "kas-wallet-story": {
    title: "KAS Wallet Story",
    subtitle: "A wallet payment journey from scan to confirmation.",
    style: "KAS Wallet",
    accent: "from-sky-500 to-indigo-500",
    idea: "Create a storyboard for a KAS wallet experience: a user opens their wallet, scans a QR code, sends KAS instantly, receives confirmation, and celebrates a smooth secure payment.",
  },
  "krc20-launch-board": {
    title: "KRC20 Launch Board",
    subtitle: "A token launch storyboard with hype and clear panels.",
    style: "KRC20 Launch",
    accent: "from-amber-500 to-orange-500",
    idea: "Design a Kaspa KRC20 launch storyboard showing token setup, community announcement, wallet interaction, trading energy, and clear launch-day panels with clean readable labels.",
  },
};

export default function StoryboardThemePage() {
  const navigate = useNavigate();
  const themeKey = useMemo(() => new URLSearchParams(window.location.search).get("theme") || "create-a-storyboard", []);
  const theme = THEMES[themeKey] || THEMES["create-a-storyboard"];

  const [idea, setIdea] = useState(theme.idea);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const resultRef = useRef(null);
  const startedRef = useRef(false);

  const generate = async (overrideIdea) => {
    const finalIdea = (overrideIdea ?? idea).trim();
    if (!finalIdea || loading) return;
    setIdea(finalIdea);
    setLoading(true);
    setProject(null);

    const plan = await base44.integrations.Core.InvokeLLM({
      model: "gpt_5_mini",
      prompt: `Transform this rough user idea into a highly detailed, production-ready storyboard / character sheet prompt: "${finalIdea}".

Create: 1) concise creative direction, 2) an enhanced professional image prompt for a clean storyboard sheet like animation studio concept art, 3) exactly three agent checks from: Prompt Engineer, Visual Director, Continuity Checker, 4) a copy-ready motion cut video prompt that turns the storyboard into a 16:9 multi-scene cinematic video cut.

Add believable physics, consistent scale, natural anatomy, accurate perspective, correct shadows, material logic, readable layout. Avoid tiny/warped/gibberish text — only 1-3 word clean English labels. Original, cinematic, family-safe, commercial.`,
      response_json_schema: {
        type: "object",
        properties: {
          research_notes: { type: "string" },
          enhanced_prompt: { type: "string" },
          motion_cut_prompt: { type: "string" },
          agent_checks: { type: "array", items: { type: "object", properties: { agent: { type: "string" }, feedback: { type: "string" } } } },
        },
        required: ["research_notes", "enhanced_prompt", "motion_cut_prompt", "agent_checks"],
      },
    });

    const imagePrompt = `Create a clean 16:9 professional storyboard / character design sheet. Dark cinematic studio sheet, black background, high contrast dividers, premium concept board. Style mode: ${theme.style}. ${plan.enhanced_prompt}

STRICT QUALITY RULES: Real-world physics, believable gravity, consistent scale, correct perspective, natural anatomy, clean hands, grounded shadows, coherent lighting, stable character continuity. Avoid paragraph text. If text appears, only large 1-3 word labels with clean exact English spelling, straight baseline, sharp letters. Never warped, misspelled, tiny, or gibberish text. Polished animation pitch deck layout, no watermark.`;

    const image = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
    const created = await base44.entities.StoryboardProject.create({
      idea: finalIdea,
      style: theme.style,
      research_notes: plan.research_notes,
      enhanced_prompt: imagePrompt,
      motion_cut_prompt: plan.motion_cut_prompt,
      agent_checks: plan.agent_checks,
      image_url: image.url,
    });

    setProject(created);
    setLoading(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (theme.idea) generate(theme.idea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <button onClick={() => navigate("/QuickStoryboard")} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.accent}`}><Sparkles className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{theme.title}</h1>
            <p className="text-sm text-white/50">{theme.subtitle}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3 shadow-2xl shadow-black/40">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe what you want in this storyboard…"
            className="min-h-[90px] w-full resize-none bg-transparent px-2 py-1 text-sm text-white placeholder-white/40 outline-none"
          />
          <div className="flex justify-end px-1">
            <button onClick={() => generate()} disabled={loading || !idea.trim()} className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:opacity-95 disabled:opacity-40">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Creating…" : "Generate"}
            </button>
          </div>
        </div>

        {(project || loading) && (
          <div ref={resultRef} className="mt-10 scroll-mt-4 space-y-5">
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
    </div>
  );
}