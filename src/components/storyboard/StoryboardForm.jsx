import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const STYLES = ["Character Bible", "Product Storyboard", "YouTube Intro", "Animation Pitch", "Comic Frames", "Game Cutscene"];

export default function StoryboardForm({ onGenerated }) {
  const [idea, setIdea] = useState("A young apprentice chef and a kind kung-fu master preparing magical dumplings for a village festival");
  const [style, setStyle] = useState(STYLES[0]);
  const [loading, setLoading] = useState(false);

  const generateStoryboard = async () => {
    if (!idea.trim()) return;
    setLoading(true);

    const plan = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `Turn this idea into a production-ready quick storyboard / character sheet brief: "${idea}".

Create: 1) concise research-inspired creative direction, 2) an enhanced image prompt for a clean storyboard sheet like animation studio concept art, 3) exactly three agent checks from: Prompt Engineer, Visual Director, Continuity Checker.
Avoid copyrighted characters. Make it original, cinematic, family-safe, and commercially usable.`,
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

Include: main characters, expressions, action poses, key props, color palette, material swatches, scale reference, and short readable labels. White or warm studio background, polished animation pitch deck layout, high-end concept art, coherent characters across panels, no watermark, no messy text.`;

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
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/60">
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Your idea</label>
      <textarea value={idea} onChange={(e) => setIdea(e.target.value)} className="min-h-36 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-950 outline-none focus:border-zinc-400" />

      <div className="mt-4 flex flex-wrap gap-2">
        {STYLES.map((item) => (
          <button key={item} onClick={() => setStyle(item)} className={`rounded-full px-3 py-2 text-xs font-black transition ${style === item ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {item}
          </button>
        ))}
      </div>

      <Button onClick={generateStoryboard} disabled={loading || !idea.trim()} className="mt-5 w-full bg-zinc-950 font-black text-white hover:bg-zinc-800">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {loading ? "Researching + triple checking..." : "Generate Quick Storyboard"}
      </Button>
    </div>
  );
}