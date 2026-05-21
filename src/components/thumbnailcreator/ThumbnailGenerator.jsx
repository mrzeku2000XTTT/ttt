import React, { useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STYLES = ["Viral YouTube", "Creator Face", "Gaming Energy", "Documentary", "Podcast Clip", "Tech Review"];

export default function ThumbnailGenerator({ onCreated }) {
  const [title, setTitle] = useState("How I Built This App");
  const [topic, setTopic] = useState("A polished YouTube thumbnail for a creator explaining a new app or product");
  const [characterDescription, setCharacterDescription] = useState("A surprised realistic creator face, expressive eyes, clean cutout, looking at the title");
  const [style, setStyle] = useState(STYLES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateThumbnail = async () => {
    if (!title.trim() || !topic.trim()) return;
    setLoading(true);
    const safeTitle = title.trim().split(/\s+/).slice(0, 5).join(" ");
    const prompt = `Create a realistic 16:9 YouTube thumbnail that looks professionally edited in Photoshop. EXACT title text to render: "${safeTitle}". Video topic: ${topic}. Main character/avatar/face: ${characterDescription || "create a fitting expressive human face or avatar for the topic"}. Style: ${style}.

TEXT FIT RULES: The title must fit fully inside the canvas with generous safe margins on every side. Use 2-5 large words maximum, bold block lettering, centered or left-aligned inside a clean text box, no cropping, no letters outside frame, no warped letters, no misspellings, no tiny text, no extra random words. If the full title is too long, use only the exact shortened title above.

Use clean creator-thumbnail composition: expressive face or avatar cutout, realistic lighting, depth, shadows, high contrast, bold readable text, arrows/circles only if useful, modern editorial background relevant to the topic. Do not use Kaspa neon, crypto cyber glow, generic cyan/lime sci-fi backgrounds, logos, watermarks, or unreadable text unless explicitly requested.`;
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    const created = await base44.entities.ThumbnailProject.create({
      title,
      topic,
      character_description: characterDescription,
      style,
      platform: "YouTube / TTTV",
      image_url: result.url,
      prompt,
    });
    setImageUrl(result.url);
    onCreated?.(created);
    setLoading(false);
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Thumbnail title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/10 bg-black/50 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Video topic / idea</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-24 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-white/40" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Avatar / face character</label>
            <textarea value={characterDescription} onChange={(e) => setCharacterDescription(e.target.value)} placeholder="Describe any face, avatar, character, emotion, outfit, pose, or camera angle" className="min-h-24 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/40" />
          </div>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((item) => (
              <button key={item} onClick={() => setStyle(item)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${style === item ? "bg-white text-black" : "bg-white/10 text-zinc-300 hover:bg-white/15"}`}>
                {item}
              </button>
            ))}
          </div>
          <Button onClick={generateThumbnail} disabled={loading || !title.trim() || !topic.trim()} className="w-full bg-white font-black text-black hover:bg-zinc-200">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? "Generating thumbnail..." : "Generate Thumbnail"}
          </Button>
        </div>
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-3">
          {imageUrl ? (
            <div className="w-full space-y-3">
              <img src={imageUrl} alt={title} className="aspect-video w-full rounded-xl object-cover" />
              <a href={imageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black hover:bg-zinc-200">
                <Download className="h-4 w-4" /> Open / Download
              </a>
            </div>
          ) : (
            <div className="text-center text-zinc-500">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-white" />
              <p className="text-sm font-semibold">Your generated thumbnail will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}