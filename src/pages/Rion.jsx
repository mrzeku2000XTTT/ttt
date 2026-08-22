import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Clapperboard, PenLine, Camera, Film } from "lucide-react";
import RionInputForm from "@/components/rion/RionInputForm";
import RionShotCard from "@/components/rion/RionShotCard";
import { buildPlannerPrompt } from "@/components/rion/rionRules";

export default function Rion() {
  const [prompt, setPrompt] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [shots, setShots] = useState([]);
  const [error, setError] = useState("");

  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(up?.file_url || null);
    } catch { setError("Couldn't upload reference photo."); }
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setRunning(true); setError(""); setResult(null); setShots([]); setStage("script");
    try {
      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: buildPlannerPrompt({ prompt, hasPhoto: !!photoUrl }),
        response_json_schema: {
          type: "object",
          properties: {
            script: { type: "string" },
            beats: { type: "array", items: { type: "object", properties: {
              beat: { type: "number" }, description: { type: "string" },
              beat_type: { type: "string" }, location: { type: "string" },
            } } },
            shots: { type: "array", items: { type: "object", properties: {
              beat: { type: "number" }, beat_type: { type: "string" }, description: { type: "string" },
              shot_type: { type: "string" }, camera_language: { type: "string" }, visual_prompt: { type: "string" },
            } } },
          },
        },
      });

      setResult(plan);
      setStage("coverage");

      const rendered = [];
      for (const shot of plan.shots || []) {
        setStage("render");
        try {
          const img = await base44.integrations.Core.GenerateImage({
            prompt: `Cinematic storyboard frame: ${shot.visual_prompt}. Framing: ${shot.shot_type} shot. Camera: ${shot.camera_language}. No text in image.`,
            existing_image_urls: photoUrl ? [photoUrl] : undefined,
          });
          rendered.push({ ...shot, image_url: img?.url || "" });
        } catch {
          rendered.push({ ...shot, image_url: "" });
        }
        setShots([...rendered]);
      }
      setStage("");
    } catch (err) {
      setError(err?.message || "Generation failed.");
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-2 text-white/40 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> TTT
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-black" />
            </div>
            <span className="font-black tracking-tight">RION</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Rion <span className="text-cyan-400">Script-First Storyboard</span>
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-lg mx-auto">
            Script first, camera second. Rion expands your prompt into a script, maps each beat to the right shot deterministically, then renders consistent frames from your reference photo.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-6 text-center">
          {[
            { icon: PenLine, label: "1. Script", active: stage === "script" },
            { icon: Camera, label: "2. Coverage", active: stage === "coverage" },
            { icon: Film, label: "3. Render", active: stage === "render" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`rounded-xl p-3 border text-xs ${s.active ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/[0.03] text-white/40"}`}>
                <Icon className="w-4 h-4 mx-auto mb-1" /> {s.label}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RionInputForm prompt={prompt} setPrompt={setPrompt} onPhoto={handlePhoto} photoUrl={photoUrl} onGenerate={generate} running={running} />
            {error && <p className="mt-3 text-rose-400 text-sm">{error}</p>}
          </div>
          <div className="lg:col-span-2 space-y-4">
            {result?.script && (
              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-2xl p-4">
                <p className="text-cyan-300 text-xs font-bold uppercase tracking-widest mb-1">Script</p>
                <p className="text-white/80 text-sm">{result.script}</p>
              </div>
            )}
            {shots.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shots.map((s, i) => <RionShotCard key={i} shot={s} index={i} />)}
              </div>
            )}
            {!result && !running && (
              <div className="text-center text-white/30 text-sm py-12 border border-dashed border-white/10 rounded-2xl">
                Enter a prompt and generate a storyboard.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}