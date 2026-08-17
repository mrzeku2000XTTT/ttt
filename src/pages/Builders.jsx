import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Rocket, Loader2, Trash2, Target, Lightbulb, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RoadmapPhaseCard from "@/components/builders/RoadmapPhaseCard";

const GUEST_KEY = "ttt_guest_roadmaps";

export default function BuildersPage() {
  const [user, setUser] = useState(null);
  const [appIdea, setAppIdea] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadRoadmaps(currentUser);
    } catch {
      setUser(null);
      loadGuestRoadmaps();
    }
  };

  const loadGuestRoadmaps = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
      setRoadmaps(saved);
      if (saved.length > 0) setActiveRoadmap(saved[0]);
    } catch {}
    setIsLoading(false);
  };

  const loadRoadmaps = async (currentUser) => {
    try {
      const maps = await base44.entities.AppRoadmap.filter({
        user_email: currentUser.email
      }, "-created_date", 20);
      setRoadmaps(maps);
      if (maps.length > 0) setActiveRoadmap(maps[0]);
    } catch {
      loadGuestRoadmaps();
    }
    setIsLoading(false);
  };

  const saveGuestRoadmaps = (maps) => {
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(maps)); } catch {}
  };

  const handleEnhanceIdea = async () => {
    if (!appIdea.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a realistic, step-by-step development roadmap for this Kaspa blockchain app idea: "${appIdea}"

Generate a comprehensive roadmap with 4-6 phases. Each phase should include:
- Phase name (e.g., "Phase 1", "Phase 2")
- Phase title (brief, punchy)
- Short description (1-2 sentences)
- 3-5 specific tasks to complete

Focus on practical steps like market research, technical architecture, Kaspa integration, frontend development, testing, deployment, and community building.

Return ONLY valid JSON in this exact format:
{
  "enhanced_idea": "A compelling 2-3 sentence summary of the app potential",
  "roadmap_steps": [
    {
      "phase": "Phase 1",
      "title": "Planning & Research",
      "description": "Detailed phase description",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "completed": false
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            enhanced_idea: { type: "string" },
            roadmap_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  tasks: { type: "array", items: { type: "string" } },
                  completed: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      const newRoadmap = {
        id: user ? undefined : `local_${Date.now()}`,
        user_email: user?.email || "",
        app_idea: appIdea,
        enhanced_idea: response.enhanced_idea,
        roadmap_steps: response.roadmap_steps,
        completed_subtasks: {},
        progress_percentage: 0
      };

      let saved = newRoadmap;
      if (user) {
        try {
          saved = await base44.entities.AppRoadmap.create({
            user_email: user.email,
            app_idea: appIdea,
            enhanced_idea: response.enhanced_idea,
            roadmap_steps: response.roadmap_steps,
            completed_subtasks: {},
            progress_percentage: 0
          });
        } catch {}
      } else {
        const updated = [saved, ...roadmaps];
        saveGuestRoadmaps(updated);
      }

      setRoadmaps([saved, ...roadmaps]);
      setActiveRoadmap(saved);
      setAppIdea("");
    } catch (err) {
      alert("Failed to generate roadmap: " + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const computeProgress = (steps, subtasks) => {
    const total = (steps || []).reduce((sum, s) => sum + (s.tasks?.length || 0), 0);
    if (total === 0) return 0;
    const done = Object.values(subtasks || {}).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  const toggleSubtask = useCallback(async (stepIndex, taskIndex) => {
    if (!activeRoadmap) return;
    const key = `${stepIndex}-${taskIndex}`;
    const current = activeRoadmap.completed_subtasks || {};
    const newSubtasks = { ...current, [key]: !current[key] };
    const progress = computeProgress(activeRoadmap.roadmap_steps, newSubtasks);

    const updated = { ...activeRoadmap, completed_subtasks: newSubtasks, progress_percentage: progress };
    setActiveRoadmap(updated);
    setRoadmaps((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

    if (user) {
      try { await base44.entities.AppRoadmap.update(updated.id, { completed_subtasks: newSubtasks, progress_percentage: progress }); } catch {}
    } else {
      const all = roadmaps.map((r) => (r.id === updated.id ? updated : r));
      saveGuestRoadmaps(all);
    }
  }, [activeRoadmap, user, roadmaps]);

  const togglePhase = useCallback(async (stepIndex) => {
    if (!activeRoadmap) return;
    const step = activeRoadmap.roadmap_steps[stepIndex];
    if (!step?.tasks) return;
    const allDone = step.tasks.every((_, ti) => activeRoadmap.completed_subtasks?.[`${stepIndex}-${ti}`]);
    const newSubtasks = { ...(activeRoadmap.completed_subtasks || {}) };
    step.tasks.forEach((_, ti) => { newSubtasks[`${stepIndex}-${ti}`] = !allDone; });
    const progress = computeProgress(activeRoadmap.roadmap_steps, newSubtasks);

    const updated = { ...activeRoadmap, completed_subtasks: newSubtasks, progress_percentage: progress };
    setActiveRoadmap(updated);
    setRoadmaps((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

    if (user) {
      try { await base44.entities.AppRoadmap.update(updated.id, { completed_subtasks: newSubtasks, progress_percentage: progress }); } catch {}
    } else {
      const all = roadmaps.map((r) => (r.id === updated.id ? updated : r));
      saveGuestRoadmaps(all);
    }
  }, [activeRoadmap, user, roadmaps]);

  const deleteRoadmap = async (id) => {
    if (!confirm("Delete this roadmap?")) return;
    if (user) {
      try { await base44.entities.AppRoadmap.delete(id); } catch {}
    }
    const filtered = roadmaps.filter((r) => r.id !== id);
    setRoadmaps(filtered);
    if (activeRoadmap?.id === id) setActiveRoadmap(filtered[0] || null);
    if (!user) saveGuestRoadmaps(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Rocket className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Builders Roadmap</h1>
            <p className="text-white/40 text-xs">Turn your app idea into a step-by-step plan</p>
          </div>
        </div>

        {/* Idea Input */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-sm font-bold">What's your app idea?</span>
          </div>
          <textarea
            value={appIdea}
            onChange={(e) => setAppIdea(e.target.value)}
            placeholder="e.g. A decentralized marketplace for NFT trading on Kaspa..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-cyan-500/50 resize-none min-h-[80px]"
            disabled={isEnhancing}
          />
          <button
            onClick={handleEnhanceIdea}
            disabled={!appIdea.trim() || isEnhancing}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 disabled:opacity-40 text-white text-sm font-bold transition-all"
          >
            {isEnhancing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating roadmap…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Build Roadmap</>
            )}
          </button>
        </div>

        {/* Roadmap selector */}
        {roadmaps.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {roadmaps.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRoadmap(r)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeRoadmap?.id === r.id
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                {r.app_idea?.slice(0, 24) || "Untitled"}…
              </button>
            ))}
          </div>
        )}

        {/* Active roadmap */}
        {activeRoadmap ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRoadmap.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Enhanced Vision card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-transparent p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-sm mb-1">Your Enhanced Vision</h2>
                    <p className="text-white/60 text-xs leading-relaxed">{activeRoadmap.enhanced_idea}</p>
                  </div>
                  <button
                    onClick={() => deleteRoadmap(activeRoadmap.id)}
                    className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wide">Progress</span>
                  <span className="text-lg font-black text-cyan-400">{activeRoadmap.progress_percentage || 0}%</span>
                </div>
                <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${activeRoadmap.progress_percentage || 0}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full"
                  />
                </div>
              </div>

              {/* Phase cards */}
              <div className="space-y-3">
                {(activeRoadmap.roadmap_steps || []).map((step, stepIndex) => (
                  <RoadmapPhaseCard
                    key={stepIndex}
                    step={step}
                    stepIndex={stepIndex}
                    onToggleSubtask={toggleSubtask}
                    onTogglePhase={togglePhase}
                    subtaskStates={activeRoadmap.completed_subtasks || {}}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-white/20" strokeWidth={1.5} />
            </div>
            <h3 className="text-white/60 font-bold text-sm mb-1">No roadmaps yet</h3>
            <p className="text-white/30 text-xs">Enter your app idea above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}