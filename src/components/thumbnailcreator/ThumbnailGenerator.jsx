import React, { useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STYLES = ["Viral YouTube", "Kaspa Cyber", "Luxury Tech", "Gaming Energy", "Documentary", "Podcast Clip"];

export default function ThumbnailGenerator({ onCreated }) {
  const [title, setTitle] = useState("Kaspa Super App Explained");
  const [topic, setTopic] = useState("A bold thumbnail about TTT, TapToTip, and the Kaspa ecosystem");
  const [style, setStyle] = useState(STYLES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateThumbnail = async () => {
    if (!title.trim() || !topic.trim()) return;
    setLoading(true);
    const prompt = `Create a 16:9 high-converting creator thumbnail. Title text: "${title}". Topic: ${topic}. Style: ${style}. Brand: TTT is the Kaspa Super App, TapToTip energy, neon cyan and lime accents, bold readable typography, dramatic contrast, expressive composition, professional YouTube thumbnail, no watermarks.`;
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    const created = await base44.entities.ThumbnailProject.create({
      title,
      topic,
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
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-28 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-cyan-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((item) => (
              <button key={item} onClick={() => setStyle(item)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${style === item ? "bg-cyan-400 text-black" : "bg-white/10 text-zinc-300 hover:bg-white/15"}`}>
                {item}
              </button>
            ))}
          </div>
          <Button onClick={generateThumbnail} disabled={loading || !title.trim() || !topic.trim()} className="w-full bg-cyan-400 font-black text-black hover:bg-cyan-300">
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
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-cyan-300" />
              <p className="text-sm font-semibold">Your generated thumbnail will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}