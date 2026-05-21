import React, { useEffect, useState } from "react";
import { Loader2, Sparkles, Copy, Check, Film } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function MoodBoardStudio() {
  const [storyboard, setStoryboard] = useState(null);
  const [sceneIdea, setSceneIdea] = useState("Extend this story into the next emotional beat while keeping the same character, props, palette, and Kaspa theme.");
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);

  useEffect(() => {
    const storyboardId = new URLSearchParams(window.location.search).get("storyboard");
    if (!storyboardId) return;

    base44.entities.StoryboardProject.filter({ id: storyboardId }).then((items) => {
      setStoryboard(items?.[0] || null);
    });
  }, []);

  const buildPrompt = () => `Create a 1:1 square mood board extension scene for this storyboard.

New scene idea: ${sceneIdea}
Source story: ${storyboard?.idea || "Use the user scene idea as the story source."}
Inherited style: ${storyboard?.style || "cinematic storyboard concept art"}
Consistency source: ${storyboard?.enhanced_prompt || "Keep one consistent character, prop language, visual theme, and palette."}

Rules: keep the same character identity, outfit logic, key props, Kaspa/KAS visual theme, color palette, lighting mood, and visual continuity. Make it a single polished square mood board frame with one strong scene, clear composition, cinematic lighting, realistic anatomy, clean hands, consistent scale, and no gibberish text. If text is necessary, use only 1-3 correctly spelled words.`;

  const buildVideoPrompt = () => `Turn this mood board result into a cinematic scene video.

Use everything from the generated scene:
Scene idea: ${scene?.scene_idea || sceneIdea}
Scene image reference: ${scene?.image_url || "Use the generated mood board image as the visual reference."}
Scene prompt: ${scene?.scene_prompt || buildPrompt()}
Source storyboard: ${storyboard?.idea || "Original storyboard concept"}
Style continuity: ${storyboard?.style || "cinematic storyboard concept art"}

Create a polished 16:9 motion scene video with consistent character identity, same props, same outfit logic, same palette, same Kaspa/KAS theme, same lighting mood, and the same environment. Include camera direction, action beats, timing, motion details, transition style, sound design cues, and any on-screen words limited to 1-3 correctly spelled words. Keep anatomy natural, hands clean, movement believable, no gibberish text, no warped UI, and no random new characters.`;

  const generateScene = async () => {
    if (!sceneIdea.trim()) return;
    setLoading(true);
    const scenePrompt = buildPrompt();
    const image = await base44.integrations.Core.GenerateImage({ prompt: scenePrompt });
    const created = await base44.entities.MoodBoardScene.create({
      storyboard_id: storyboard?.id,
      scene_idea: sceneIdea,
      scene_prompt: scenePrompt,
      image_url: image.url,
      style: storyboard?.style || "Custom"
    });
    setScene(created);
    setLoading(false);
  };

  const copyPrompt = async () => {
    const prompt = scene?.scene_prompt || buildPrompt();
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyVideoPrompt = async () => {
    await navigator.clipboard.writeText(buildVideoPrompt());
    setVideoCopied(true);
    setTimeout(() => setVideoCopied(false), 1500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Mood Board Page</p>
        <h1 className="text-3xl font-black">Extend the story</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">Generate a 1:1 scene that keeps the same character, props, palette, and theme from the original storyboard.</p>

        <textarea
          value={sceneIdea}
          onChange={(e) => setSceneIdea(e.target.value)}
          className="mt-5 min-h-40 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-white/30"
        />

        <Button onClick={generateScene} disabled={loading || !sceneIdea.trim()} className="mt-4 w-full bg-white font-black text-black hover:bg-white/90">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? "Extending story..." : "Generate 1:1 Extension"}
        </Button>

        <Button onClick={copyPrompt} variant="outline" className="mt-3 w-full border-white/10 bg-transparent font-black text-white hover:bg-white/10">
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy Scene Prompt"}
        </Button>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-black/40">
          {scene?.image_url ? (
            <img src={scene.image_url} alt="Mood board extension" className="h-full w-full object-contain" />
          ) : (
            <div className="px-8 text-center text-white/45">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-white" />
              <p className="text-sm font-semibold">Your 1:1 story extension will appear here.</p>
            </div>
          )}
        </div>

        {scene && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-cyan-200" />
                <h2 className="font-black">Scene video prompt</h2>
              </div>
              <Button onClick={copyVideoPrompt} className="bg-cyan-300 font-black text-black hover:bg-cyan-200">
                {videoCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {videoCopied ? "Copied" : "Copy Video Prompt"}
              </Button>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-sm leading-6 text-white/70">{buildVideoPrompt()}</pre>
          </div>
        )}
      </div>
    </div>
  );
}