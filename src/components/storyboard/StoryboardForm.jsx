import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { STORYBOARD_PRESETS } from "@/components/storyboard/storyboardPresets";

const STYLES = ["Character Bible", "Product Storyboard", "YouTube Intro", "Animation Pitch", "Comic Frames", "Game Cutscene"];

export default function StoryboardForm({ onGenerated, hasPreview = false, isDark = false }) {
  const [idea, setIdea] = useState("A young apprentice chef and a kind kung-fu master preparing magical dumplings for a village festival");
  const [style, setStyle] = useState(STYLES[0]);
  const [loading, setLoading] = useState(false);

  const applyPreset = (presetId) => {
    const preset = STORYBOARD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setIdea(preset.idea);
    setStyle(preset.style);
  };

  const generateStoryboard = async () => {
    if (!idea.trim()) return;
    setLoading(true);

    const plan = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `Transform this rough user idea into a highly detailed, production-ready storyboard / character sheet prompt: "${idea}".

Create: 1) concise research-inspired creative direction, 2) an enhanced professional image prompt for a clean storyboard sheet like animation studio concept art, 3) exactly three agent checks from: Prompt Engineer, Visual Director, Continuity Checker.

The enhanced prompt must add clear scene-by-scene details, believable physics, consistent scale, natural anatomy, accurate perspective, correct shadows, material logic, readable layout hierarchy, and exact spelling guidance for any visible labels. Avoid warped text, gibberish lettering, impossible poses, melting objects, inconsistent character designs, and broken hands. Avoid copyrighted characters. Make it original, cinematic, family-safe, and commercially usable.`, 
      response_json_schema: {
        type: "object",
        properties: {
          research_notes: { type: "string" },
          enhanced_prompt: { type: "string" },
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
        required: ["research_notes", "enhanced_prompt", "agent_checks"]
      }
    });

    const imagePrompt = `Create a clean 16:9 professional storyboard / character design sheet. Style mode: ${style}. ${plan.enhanced_prompt}

STRICT QUALITY RULES: Use real-world physics, believable gravity, consistent scale, correct perspective, natural anatomy, clean hands, grounded shadows, coherent lighting, accurate material behavior, and stable character continuity across every scene. If text appears, keep it minimal, large, straight, sharp, correctly spelled, and placed inside clean label boxes; never use warped, curved, misspelled, tiny, or gibberish text. Each scene panel must have a clear purpose, readable composition, and enough visual context to understand the action.

Include: main characters, expressions, action poses, key props, color palette, material swatches, scale reference, scene panels, and short readable labels. White or warm studio background, polished animation pitch deck layout, high-end concept art, coherent characters across panels, no watermark, no messy text.`;

    const image = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
    const created = await base44.entities.StoryboardProject.create({
      idea,
      style,
      research_notes: plan.research_notes,
      enhanced_prompt: imagePrompt,
      agent_checks: plan.agent_checks,
      image_url: image.url,
    });

    onGenerated?.(created);
    setLoading(false);
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 backdrop-blur-2xl transition ${isDark ? "border-white/10 bg-white/[0.07] shadow-2xl shadow-black/40" : "border-zinc-200 bg-white shadow-xl shadow-zinc-200/60"}`}>
      <label className={`mb-2 block text-xs font-black uppercase tracking-[0.18em] ${isDark ? "text-white/55" : "text-zinc-500"}`}>1000 presets</label>
      <select defaultValue="" onChange={(e) => applyPreset(e.target.value)} className={`mb-4 w-full rounded-2xl border p-3 text-sm font-semibold outline-none backdrop-blur-xl transition ${isDark ? "border-white/10 bg-black/30 text-white focus:border-white/30" : "border-zinc-200 bg-zinc-50 text-zinc-800 focus:border-zinc-400"}`}>
        <option value="" disabled>Choose a storyboard preset...</option>
        {STORYBOARD_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>{preset.id.replace("preset-", "#")} · {preset.title}</option>
        ))}
      </select>

      <label className={`mb-2 block text-xs font-black uppercase tracking-[0.18em] ${isDark ? "text-white/55" : "text-zinc-500"}`}>Your idea</label>
      <textarea value={idea} onChange={(e) => setIdea(e.target.value)} className={`min-h-36 w-full rounded-2xl border p-4 text-sm outline-none backdrop-blur-xl transition ${isDark ? "border-white/10 bg-black/30 text-white focus:border-white/30" : "border-zinc-200 bg-zinc-50 text-zinc-950 focus:border-zinc-400"}`} />

      <div className="mt-4 flex flex-wrap gap-2">
        {STYLES.map((item) => (
          <button key={item} onClick={() => setStyle(item)} className={`rounded-full px-3 py-2 text-xs font-black transition ${style === item ? (isDark ? "bg-white text-black" : "bg-zinc-950 text-white") : (isDark ? "bg-white/10 text-white/70 hover:bg-white/15" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}`}>
            {item}
          </button>
        ))}
      </div>

      <Button onClick={generateStoryboard} disabled={loading || !idea.trim()} className={`mt-5 w-full font-black ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {loading ? "Regenerating while keeping preview..." : hasPreview ? "Regenerate Quick Storyboard" : "Generate Quick Storyboard"}
      </Button>
      {hasPreview && (
        <p className={`mt-3 text-center text-xs font-semibold ${isDark ? "text-white/45" : "text-zinc-500"}`}>Regenerate keeps the current preview visible until the new storyboard is ready.</p>
      )}
    </div>
  );
}