import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers3, SearchCheck, Users } from "lucide-react";
import StoryboardForm from "@/components/storyboard/StoryboardForm";
import StoryboardPreview from "@/components/storyboard/StoryboardPreview";
import AgentChecks from "@/components/storyboard/AgentChecks";
import StoryboardModeToggle from "@/components/storyboard/StoryboardModeToggle";
import MotionCutPrompt from "@/components/storyboard/MotionCutPrompt";

export default function QuickStoryboardPage() {
  const [project, setProject] = useState(null);
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-[#050507] text-white" : "bg-[#f7f3ec] text-zinc-950"}`}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/AppStoreV2" className={`inline-flex items-center gap-2 text-sm font-bold transition ${isDark ? "text-white/60 hover:text-white" : "text-zinc-500 hover:text-zinc-950"}`}>
            <ArrowLeft className="h-4 w-4" /> Back to App Store
          </Link>
          <StoryboardModeToggle isDark={isDark} onToggle={() => setIsDark((value) => !value)} />
        </div>

        <section className={`overflow-hidden rounded-[2rem] border p-6 backdrop-blur-2xl transition sm:p-10 ${isDark ? "border-white/10 bg-white/[0.07] shadow-2xl shadow-black/50" : "border-zinc-200 bg-white shadow-xl shadow-zinc-200/70"}`}>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className={`mb-3 text-xs font-black uppercase tracking-[0.28em] ${isDark ? "text-amber-200" : "text-amber-700"}`}>Quick Storyboard</p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Idea to polished storyboard sheet.</h1>
              <p className={`mt-5 max-w-2xl text-lg leading-8 ${isDark ? "text-white/65" : "text-zinc-600"}`}>
                Enter one rough idea. The app researches, enhances the prompt, runs triple agent checks, then generates a production-style character or storyboard board.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-xl ${isDark ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-950"}`}><SearchCheck className="h-4 w-4" /> Research enhanced</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-xl ${isDark ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-950"}`}><Users className="h-4 w-4" /> Triple agent check</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-xl ${isDark ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-950"}`}><Layers3 className="h-4 w-4" /> Multi-step prompt</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Expressions", "Action poses", "Key details", "Palette"].map((item) => (
                <div key={item} className={`aspect-video rounded-2xl border p-4 backdrop-blur-2xl transition ${isDark ? "border-white/10 bg-white/[0.08] shadow-2xl shadow-black/30" : "border-zinc-200 bg-[#fbf7ef] shadow-sm"}`}>
                  <div className={`mb-3 h-14 w-14 rounded-full ${isDark ? "bg-gradient-to-br from-white via-sky-200 to-indigo-500 shadow-lg shadow-sky-500/20" : "bg-gradient-to-br from-amber-200 to-stone-700"}`} />
                  <p className={`text-sm font-black uppercase tracking-wide ${isDark ? "text-white/85" : "text-zinc-800"}`}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <StoryboardForm onGenerated={setProject} hasPreview={!!project?.image_url} isDark={isDark} />
          <StoryboardPreview imageUrl={project?.image_url} title={project?.idea} isDark={isDark} />
        </div>

        <MotionCutPrompt project={project} isDark={isDark} />

        <AgentChecks checks={project?.agent_checks || []} isDark={isDark} />
      </div>
    </div>
  );
}