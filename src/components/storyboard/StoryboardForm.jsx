import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { STORYBOARD_PRESETS } from "@/components/storyboard/storyboardPresets";

const STYLES = ["Kaspa Explainer", "DAG Flow", "KAS Wallet", "KRC20 Launch", "Miner Story", "TTT Agent"];

const STYLE_IDEAS = {
  "Kaspa Explainer": "Create a clear Kaspa storyboard explaining how fast KAS payments move through the DAG with blocks confirming in parallel, simple wallet actions, and readable labels for users new to Kaspa.",
  "DAG Flow": "Show a cinematic Kaspa DAG flow storyboard where many blue blocks connect at once, transactions confirm quickly, and the visual panels explain parallel block creation without confusing text.",
  "KAS Wallet": "Create a storyboard for a KAS wallet experience: a user opens their wallet, scans a QR code, sends KAS instantly, receives confirmation, and celebrates a smooth secure payment.",
  "KRC20 Launch": "Design a Kaspa KRC20 launch storyboard showing token setup, community announcement, wallet interaction, trading energy, and clear launch-day panels with clean readable labels.",
  "Miner Story": "Tell a Kaspa miner story with mining rigs, glowing DAG blocks, network contribution, fast block rewards, and a human builder proudly supporting the Kaspa ecosystem.",
  "TTT Agent": "Create a TTT Agent storyboard where an AI agent helps a user navigate Kaspa apps, understand KAS payments, verify actions, and complete a task inside the TTT ecosystem."
};

export default function StoryboardForm({ onGenerated, hasPreview = false, isDark = false }) {
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [loading, setLoading] = useState(false);
  const [kaspaMode, setKaspaMode] = useState(false);

  const applyPreset = (presetId) => {
    setSelectedPreset(presetId);
    const preset = STORYBOARD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setIdea(preset.idea);
    setStyle("");
  };

  const selectStyle = (item) => {
    setSelectedPreset("");
    if (style === item) {
      setStyle("");
      setIdea("");
      return;
    }
    setStyle(item);
    setIdea(STYLE_IDEAS[item]);
  };

  const generateStoryboard = async () => {
    if (!idea.trim()) return;
    setLoading(true);

    const plan = await base44.integrations.Core.InvokeLLM({
      model: "gpt_5_mini",
      add_context_from_internet: false,
      prompt: `Transform this rough user idea into a highly detailed, production-ready storyboard / character sheet prompt: "${idea}".

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
            items: {
              type: "object",
              properties: {
                agent: { type: "string" },
                feedback: { type: "string" }
              }
            }
          }
        },
        required: ["research_notes", "enhanced_prompt", "motion_cut_prompt", "agent_checks"]
      }
    });

    const sheetTheme = isDark
      ? `dark graphite storyboard sheet, black studio background, ${kaspaMode ? "cyan and Kaspa-blue accents, " : ""}high contrast white line dividers, premium dark UI concept board`
      : "white or warm studio storyboard sheet, clean bright background, soft professional pitch deck layout";

    const kaspaLine = kaspaMode ? " Theme this around the Kaspa ecosystem (DAG, KAS payments, wallets) where it naturally fits." : "";

    const imagePrompt = `Create a clean 16:9 professional storyboard / character design sheet. Visual theme: ${sheetTheme}. Style mode: ${style || "Custom"}.${kaspaLine} ${plan.enhanced_prompt}

STRICT QUALITY RULES: Use real-world physics, believable gravity, consistent scale, correct perspective, natural anatomy, clean hands, grounded shadows, coherent lighting, accurate material behavior, and stable character continuity across every scene. Avoid paragraph text inside the image. If text appears, use only large 1-3 word labels with simple exact English spelling, straight horizontal baseline, sharp letters, and clean label boxes. Never use warped, curved, misspelled, tiny, or gibberish text. Each scene panel must have a clear purpose, readable composition, and enough visual context to understand the action.

Include: main characters, expressions, action poses, key props, color palette, material swatches, scale reference, scene panels, and only short readable labels. Polished animation pitch deck layout, high-end concept art, coherent characters across panels, no watermark, no messy text.`;

    const image = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
    const created = await base44.entities.StoryboardProject.create({
      idea,
      style: style || "Custom",
      research_notes: plan.research_notes,
      enhanced_prompt: imagePrompt,
      motion_cut_prompt: plan.motion_cut_prompt,
      agent_checks: plan.agent_checks,
      image_url: image.url,
    });

    onGenerated?.(created);
    setLoading(false);
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 backdrop-blur-2xl transition ${isDark ? "border-white/10 bg-white/[0.07] shadow-2xl shadow-black/40" : "border-zinc-200 bg-white shadow-xl shadow-zinc-200/60"}`}>
      <label className={`mb-2 block text-xs font-black uppercase tracking-[0.18em] ${isDark ? "text-white/55" : "text-zinc-500"}`}>1000 presets</label>
      <select value={selectedPreset} onChange={(e) => applyPreset(e.target.value)} className={`mb-4 w-full rounded-2xl border p-3 text-sm font-semibold outline-none backdrop-blur-xl transition ${isDark ? "border-white/10 bg-black/30 text-white focus:border-white/30" : "border-zinc-200 bg-zinc-50 text-zinc-800 focus:border-zinc-400"}`}>
        <option value="">Choose a storyboard preset...</option>
        {STORYBOARD_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>{preset.id.replace("preset-", "#")} · {preset.title}</option>
        ))}
      </select>

      <label className={`mb-2 block text-xs font-black uppercase tracking-[0.18em] ${isDark ? "text-white/55" : "text-zinc-500"}`}>Your idea</label>
      <textarea value={idea} onChange={(e) => setIdea(e.target.value)} className={`min-h-36 w-full rounded-2xl border p-4 text-sm outline-none backdrop-blur-xl transition ${isDark ? "border-white/10 bg-black/30 text-white focus:border-white/30" : "border-zinc-200 bg-zinc-50 text-zinc-950 focus:border-zinc-400"}`} />

      <div className="mt-4 flex flex-wrap gap-2">
        {STYLES.map((item) => (
          <button key={item} onClick={() => selectStyle(item)} className={`rounded-full px-3 py-2 text-xs font-black transition ${style === item ? (isDark ? "bg-white text-black" : "bg-zinc-950 text-white") : (isDark ? "bg-white/10 text-white/70 hover:bg-white/15" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => setKaspaMode((v) => !v)}
          type="button"
          className={`shrink-0 rounded-md px-4 text-xs font-black transition ${kaspaMode ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-black" : (isDark ? "bg-white/10 text-white/60 hover:bg-white/15" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200")}`}
          title="Toggle Kaspa theme"
        >
          Kaspa {kaspaMode ? "ON" : "OFF"}
        </button>
        <Button onClick={generateStoryboard} disabled={loading || !idea.trim()} className={`flex-1 font-black ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? "Regenerating while keeping preview..." : hasPreview ? "Regenerate Quick Storyboard" : "Generate Quick Storyboard"}
        </Button>
      </div>
      {hasPreview && (
        <p className={`mt-3 text-center text-xs font-semibold ${isDark ? "text-white/45" : "text-zinc-500"}`}>Regenerate keeps the current preview visible until the new storyboard is ready.</p>
      )}
    </div>
  );
}