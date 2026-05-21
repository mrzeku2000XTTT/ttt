import React, { useMemo, useState } from "react";
import { Check, Copy, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MotionCutPrompt({ project, isDark = false }) {
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => {
    if (!project) return "";

    return project.motion_cut_prompt || `Turn this storyboard into a cinematic multi-scene motion cut video.

Source idea: ${project.idea || "Storyboard concept"}
Visual style: ${project.style || "cinematic storyboard animation"}
Storyboard direction: ${project.enhanced_prompt || "Use the generated storyboard as the source visual plan."}

Create a 16:9 motion cut with 6-8 short scenes, smooth camera movement, clear scene transitions, consistent characters, accurate Kaspa branding, readable UI moments, no misspelled text, no gibberish labels, no warped hands, coherent lighting, clean timing, and a polished product-demo rhythm. Each scene should include: shot type, action, camera move, duration, transition, sound cue, and any on-screen text limited to 1-3 correctly spelled words.`;
  }, [project]);

  if (!project) return null;

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 backdrop-blur-2xl transition ${isDark ? "border-white/10 bg-white/[0.07] shadow-2xl shadow-black/40" : "border-zinc-200 bg-white shadow-xl shadow-zinc-200/60"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          <h2 className="text-lg font-black">Motion cut video prompt</h2>
        </div>
        <Button onClick={copyPrompt} className={`font-black ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy Prompt"}
        </Button>
      </div>
      <pre className={`max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl p-4 text-sm leading-6 ${isDark ? "bg-black/40 text-white/75" : "bg-zinc-100 text-zinc-700"}`}>{prompt}</pre>
    </div>
  );
}