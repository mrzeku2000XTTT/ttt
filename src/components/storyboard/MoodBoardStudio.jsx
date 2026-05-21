import React, { useEffect, useState } from "react";
import { Loader2, Sparkles, Copy, Check, Film, Plus, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ViralXTool from "@/components/storyboard/ViralXTool";

export default function MoodBoardStudio() {
  const [storyboard, setStoryboard] = useState(null);
  const [sceneIdea, setSceneIdea] = useState("Extend this story into the next emotional beat while keeping the same character, props, palette, and Kaspa theme.");
  const [scene, setScene] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);

  useEffect(() => {
    const storyboardId = new URLSearchParams(window.location.search).get("storyboard");
    if (!storyboardId) return;

    const savedSession = localStorage.getItem(`moodboard_session_${storyboardId}`);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSceneIdea(parsed.sceneIdea || sceneIdea);
        setScene(parsed.scene || null);
        setScenes(parsed.scenes || []);
      } catch {}
    }

    base44.entities.StoryboardProject.filter({ id: storyboardId }).then((items) => {
      setStoryboard(items?.[0] || null);
    });
    base44.entities.MoodBoardScene.filter({ storyboard_id: storyboardId }).then((items) => {
      const existingScenes = items || [];
      setScenes(existingScenes);
      setScene(existingScenes[0] || null);
    });
  }, []);

  useEffect(() => {
    const storyboardId = storyboard?.id || new URLSearchParams(window.location.search).get("storyboard");
    if (!storyboardId) return;
    localStorage.setItem(`moodboard_session_${storyboardId}`, JSON.stringify({ sceneIdea, scene, scenes }));
  }, [storyboard?.id, sceneIdea, scene, scenes]);

  const buildPrompt = (ideaOverride = sceneIdea) => `Create a 1:1 square mood board extension scene from the START storyboard image.

START image reference: ${storyboard?.image_url || "Use the original generated storyboard as the source image."}
New scene idea: ${ideaOverride}
Source story: ${storyboard?.idea || "Use the user scene idea as the story source."}
Inherited style: ${storyboard?.style || "cinematic storyboard concept art"}
Consistency source: ${storyboard?.enhanced_prompt || "Keep one consistent character, prop language, visual theme, and palette."}

Rules: the main character must match the START image character identity, face language, silhouette, outfit logic, key props, Kaspa/KAS visual theme, color palette, lighting mood, and visual continuity. Make it a single polished square mood board frame with one strong scene, clear composition, cinematic lighting, realistic anatomy, clean hands, consistent scale, and no gibberish text. If text is necessary, use only 1-3 correctly spelled words.`;

  const buildVideoPrompt = () => `Turn this mood board result into a cinematic scene video.

Use everything from the generated scene:
Scene idea: ${scene?.scene_idea || sceneIdea}
Scene image reference: ${scene?.image_url || "Use the generated mood board image as the visual reference."}
Scene prompt: ${scene?.scene_prompt || buildPrompt()}
Source storyboard: ${storyboard?.idea || "Original storyboard concept"}
Style continuity: ${storyboard?.style || "cinematic storyboard concept art"}

Create a polished 16:9 motion scene video with consistent character identity, same props, same outfit logic, same palette, same Kaspa/KAS theme, same lighting mood, and the same environment. Include camera direction, action beats, timing, motion details, transition style, sound design cues, and any on-screen words limited to 1-3 correctly spelled words. Keep anatomy natural, hands clean, movement believable, no gibberish text, no warped UI, and no random new characters.`;

  const generateScene = async (ideaOverride = sceneIdea) => {
    if (!ideaOverride.trim()) return;
    setLoading(true);
    const scenePrompt = buildPrompt(ideaOverride);
    const image = await base44.integrations.Core.GenerateImage({
      prompt: scenePrompt,
      existing_image_urls: storyboard?.image_url ? [storyboard.image_url] : undefined
    });
    const created = await base44.entities.MoodBoardScene.create({
      storyboard_id: storyboard?.id,
      scene_idea: ideaOverride,
      scene_prompt: scenePrompt,
      image_url: image.url,
      style: storyboard?.style || "Custom"
    });
    setScene(created);
    setScenes((prev) => [created, ...prev]);
    setLoading(false);
  };

  const generateAnotherScene = () => {
    generateScene(`${sceneIdea}\n\nCreate a fresh additional scene ${scenes.length + 1} from the same START image, with a new camera angle and new emotional beat while preserving the exact same character identity.`);
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

        <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            <ImageIcon className="h-4 w-4" /> Start image
          </div>
          {storyboard?.image_url ? (
            <img src={storyboard.image_url} alt="Original storyboard start" className="max-h-56 w-full rounded-xl object-contain" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl bg-black/40 text-sm font-semibold text-white/45">No start image selected yet.</div>
          )}
        </div>

        <textarea
          value={sceneIdea}
          onChange={(e) => setSceneIdea(e.target.value)}
          className="mt-5 min-h-40 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-white/30"
        />

        <Button onClick={() => generateScene()} disabled={loading || !sceneIdea.trim()} className="mt-4 w-full rounded-full border border-white/20 bg-white/12 px-4 py-2 font-semibold tracking-tight text-white shadow-inner shadow-white/10 backdrop-blur-2xl hover:bg-white/18">
          {loading ? "Extending Story..." : "Generate 1:1 Extension"}
        </Button>

        <Button onClick={copyPrompt} variant="outline" className="mt-3 w-full rounded-full border border-white/15 bg-white/8 px-4 py-2 font-semibold tracking-tight text-white shadow-inner shadow-white/10 backdrop-blur-2xl hover:bg-white/14">
          {copied ? "Copied" : "Copy Scene Prompt"}
        </Button>

        <Button onClick={generateAnotherScene} disabled={loading || !storyboard?.image_url} className="mt-3 w-full rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold tracking-tight text-white shadow-inner shadow-white/10 backdrop-blur-2xl hover:bg-white/15">
          {loading ? "Generating Another Scene..." : "Generate Another Scene"}
        </Button>

        <ViralXTool storageKey={`moodboard_viral_x_${storyboard?.id || "default"}`} />
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

        {scenes.length > 0 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {scenes.map((item, index) => (
              <button key={item.id || index} onClick={() => setScene(item)} className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border ${scene?.id === item.id ? "border-cyan-300" : "border-white/10"}`}>
                <img src={item.image_url} alt={`Scene ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {scene && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-cyan-200" />
                <h2 className="font-black">Scene video prompt</h2>
              </div>
              <Button onClick={copyVideoPrompt} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold tracking-tight text-white shadow-inner shadow-white/10 backdrop-blur-2xl hover:bg-white/15">
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