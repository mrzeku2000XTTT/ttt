import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import StoryboardHero from "@/components/storyboard/StoryboardHero";
import StoryboardSteps from "@/components/storyboard/StoryboardSteps";
import StoryboardForm from "@/components/storyboard/StoryboardForm";
import StoryboardPreview from "@/components/storyboard/StoryboardPreview";
import AgentChecks from "@/components/storyboard/AgentChecks";
import StoryboardModeToggle from "@/components/storyboard/StoryboardModeToggle";
import MotionCutPrompt from "@/components/storyboard/MotionCutPrompt";
import StoryboardStudio from "@/components/storyboard/StoryboardStudio";

export default function QuickStoryboardPage() {
  const [project, setProject] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const workspaceRef = useRef(null);

  const scrollToWorkspace = () => {
    setStudioOpen(true);
  };

  if (studioOpen) {
    return <StoryboardStudio onClose={() => setStudioOpen(false)} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-[#050507] text-white" : "bg-[#f7f3ec] text-zinc-950"}`}>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/AppStoreV2" className={`inline-flex items-center gap-2 text-sm font-bold transition ${isDark ? "text-white/60 hover:text-white" : "text-zinc-500 hover:text-zinc-950"}`}>
            <ArrowLeft className="h-4 w-4" /> Back to App Store
          </Link>
          <StoryboardModeToggle isDark={isDark} onToggle={() => setIsDark((value) => !value)} />
        </div>

        <StoryboardHero onStart={scrollToWorkspace} />

        <StoryboardSteps isDark={isDark} />

        <div ref={workspaceRef} className="scroll-mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
            <h2 className="text-sm font-black uppercase tracking-[0.25em]">Workspace</h2>
            <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <StoryboardForm onGenerated={setProject} hasPreview={!!project?.image_url} isDark={isDark} />
            <StoryboardPreview imageUrl={project?.image_url} title={project?.idea} isDark={isDark} />
          </div>

          <MotionCutPrompt project={project} isDark={isDark} />

          <AgentChecks checks={project?.agent_checks || []} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}