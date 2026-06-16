import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Film, Download, Copy, Check, Sparkles, ImageIcon, Wand2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StoryboardBRollPage() {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [brolls, setBrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [generatingImg, setGeneratingImg] = useState({});
  const [brollImages, setBrollImages] = useState({});

  // Read project id from URL
  const projectId = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    if (!projectId) { navigate("/StoryboardProjects"); return; }
    base44.entities.StoryboardProject.filter({ id: projectId })
      .then((res) => {
        const p = res[0];
        if (!p) { navigate("/StoryboardProjects"); return; }
        setProject(p);
        // Generate b-roll prompts from the project data
        generateBRolls(p);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const generateBRolls = async (p) => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional video editor and cinematographer. Given this storyboard project, generate 8 cinematic B-roll shot descriptions.

Project idea: ${p.idea}
Style: ${p.style || "cinematic"}
Enhanced prompt: ${p.enhanced_prompt || ""}
Motion cut prompt: ${p.motion_cut_prompt || ""}

Return a JSON object with a "brolls" array of 8 items. Each item has:
- "shot": short shot name (e.g. "Close-up: Hands typing")
- "description": 1-2 sentence cinematic description of the shot
- "duration": suggested duration in seconds (2-5)
- "camera": camera movement (e.g. "Static", "Slow push in", "Pan left", "Dolly forward")
- "mood": mood/tone (e.g. "Tense", "Hopeful", "Mysterious")
- "prompt": a detailed AI image generation prompt for this b-roll frame`,
        response_json_schema: {
          type: "object",
          properties: {
            brolls: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  shot: { type: "string" },
                  description: { type: "string" },
                  duration: { type: "number" },
                  camera: { type: "string" },
                  mood: { type: "string" },
                  prompt: { type: "string" }
                }
              }
            }
          }
        }
      });
      setBrolls(res.brolls || []);
    } catch (e) {
      setBrolls([]);
    }
    setLoading(false);
  };

  const regenerate = () => {
    if (project) generateBRolls(project);
  };

  const copyPrompt = (prompt, idx) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const generateBRollImage = async (b, idx) => {
    setGeneratingImg((prev) => ({ ...prev, [idx]: true }));
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: b.prompt });
      setBrollImages((prev) => ({ ...prev, [idx]: res.url }));
    } catch (e) {
      // silently fail
    }
    setGeneratingImg((prev) => ({ ...prev, [idx]: false }));
  };

  const moodColor = (mood = "") => {
    const m = mood.toLowerCase();
    if (m.includes("tense") || m.includes("dark")) return "#ef4444";
    if (m.includes("hopeful") || m.includes("bright")) return "#22c55e";
    if (m.includes("mysterious")) return "#a78bfa";
    if (m.includes("epic") || m.includes("dramatic")) return "#f97316";
    if (m.includes("calm") || m.includes("peaceful")) return "#60a5fa";
    return "#94a3b8";
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">

        {/* Back */}
        <button onClick={() => navigate("/StoryboardProjects")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex-shrink-0">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">B-Roll Shots</h1>
              <p className="text-sm text-white/50 line-clamp-1">{project?.idea || "Loading project…"}</p>
            </div>
          </div>
          <button onClick={regenerate} disabled={loading || generating}
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.07] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-40 border border-white/10">
            <Sparkles className="h-4 w-4" />
            Regenerate
          </button>
        </div>

        {/* Storyboard thumbnail */}
        {project?.image_url && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10">
            <img src={project.image_url} alt={project.idea} className="w-full max-h-64 object-cover" />
          </div>
        )}

        {/* B-Roll grid */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 border-2 border-white/10 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-sm text-white/40">Generating cinematic b-roll shots…</p>
          </div>
        ) : brolls.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/40">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm font-semibold">No b-rolls generated. Try regenerating.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {brolls.map((b, idx) => (
              <div key={idx}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]">

                {/* Shot number + name */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-black text-white/60 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-[13px] font-bold text-white truncate">{b.shot}</span>
                  <span className="ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${moodColor(b.mood)}22`, color: moodColor(b.mood) }}>
                    {b.mood}
                  </span>
                </div>

                {/* Description */}
                <p className="mb-3 text-[12px] leading-relaxed text-white/60">{b.description}</p>

                {/* Meta row */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-white/50">
                    ⏱ {b.duration}s
                  </div>
                  <div className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-white/50">
                    🎥 {b.camera}
                  </div>
                </div>

                {/* Generated image */}
                {brollImages[idx] && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-white/10">
                    <img src={brollImages[idx]} alt={b.shot} className="w-full object-contain bg-black max-h-48" />
                  </div>
                )}

                {/* Prompt */}
                <div className="relative rounded-xl bg-black/30 border border-white/[0.06] p-3">
                  <p className="pr-8 text-[11px] leading-relaxed text-white/40 line-clamp-3">{b.prompt}</p>
                  <button onClick={() => copyPrompt(b.prompt, idx)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white/50 transition hover:bg-white/20 hover:text-white">
                    {copiedIdx === idx
                      ? <Check className="h-3 w-3 text-green-400" />
                      : <Copy className="h-3 w-3" />}
                  </button>
                </div>

                {/* Generate image button */}
                <button
                  onClick={() => generateBRollImage(b, idx)}
                  disabled={generatingImg[idx]}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 px-3 py-2 text-[12px] font-semibold text-white/80 transition hover:from-pink-500/30 hover:to-orange-500/30 disabled:opacity-50"
                >
                  {generatingImg[idx]
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                    : <><Wand2 className="h-3 w-3" /> {brollImages[idx] ? "Regenerate Image" : "Generate Image"}</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}