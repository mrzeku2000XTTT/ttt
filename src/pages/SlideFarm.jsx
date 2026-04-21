import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import JSZip from "jszip";
import SlidefarmForm from "@/components/slidefarm/SlidefarmForm";
import SlidefarmPreview from "@/components/slidefarm/SlidefarmPreview";
import SlidefarmHistory from "@/components/slidefarm/SlidefarmHistory";
import { generateSlideshowCopy, generateSlideImages, buildSlides } from "@/components/slidefarm/slidefarmEngine";
import { renderSlide } from "@/components/slidefarm/slidefarmRenderer";

export default function SlideFarmPage() {
  const [niche, setNiche] = useState("");
  const [voice, setVoice] = useState("");
  const [offer, setOffer] = useState("");
  const [slideCount, setSlideCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [slideshow, setSlideshow] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const list = await base44.entities.Slideshow.list("-created_date", 12);
      setHistory(list);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setSlideshow(null);
    try {
      setStatus("Writing hooks + copy…");
      const copy = await generateSlideshowCopy({ niche, voice, slideCount, productOrOffer: offer });

      setStatus("Generating on-aesthetic images…");
      const images = await generateSlideImages(copy.image_prompts.slice(0, slideCount), niche);

      const slides = buildSlides({
        hook: copy.hook,
        body_slides: copy.body_slides,
        cta: copy.cta,
        images,
      });

      const saved = await base44.entities.Slideshow.create({
        niche,
        voice,
        hook: copy.hook,
        body_slides: copy.body_slides,
        cta: copy.cta,
        caption: copy.caption,
        slides,
        status: "ready",
      });
      setSlideshow(saved);
      loadHistory();
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong. Try again.");
    }
    setLoading(false);
    setStatus("");
  };

  const handleExport = async () => {
    if (!slideshow) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < slideshow.slides.length; i++) {
        const blob = await renderSlide(slideshow.slides[i]);
        zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
      }
      zip.file("caption.txt", slideshow.caption || "");
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slidefarm-${slideshow.niche.replace(/\s+/g, "-").toLowerCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      await base44.entities.Slideshow.update(slideshow.id, { status: "exported" });
    } catch (err) {
      console.error(err);
    }
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl("AppStoreV2")} className="flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm">Apps</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="font-[900] tracking-tight">SlideFarm</div>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold mb-3">
            <Sparkles className="w-3 h-3" /> TikTok Slideshow Automation
          </div>
          <h1 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-2">
            One niche → endless viral slideshows
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            Claude writes the hooks + copy. AI generates the aesthetic images. You get a ready-to-post slideshow in 60 seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-[380px_1fr] gap-6">
          {/* Left: form */}
          <div>
            <SlidefarmForm
              niche={niche}
              setNiche={setNiche}
              voice={voice}
              setVoice={setVoice}
              offer={offer}
              setOffer={setOffer}
              slideCount={slideCount}
              setSlideCount={setSlideCount}
              onGenerate={handleGenerate}
              loading={loading}
            />
            {status && (
              <div className="mt-3 text-cyan-400 text-[11px] font-semibold animate-pulse">{status}</div>
            )}
          </div>

          {/* Right: preview */}
          <div>
            {slideshow ? (
              <SlidefarmPreview slideshow={slideshow} onExport={handleExport} exporting={exporting} />
            ) : (
              <div className="h-full min-h-[320px] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/40 p-8 text-center">
                <Sparkles className="w-8 h-8 mb-3" />
                <div className="text-sm font-semibold text-white/60">Your slideshow preview will appear here</div>
                <div className="text-[11px] mt-1">Enter a niche on the left and hit Generate</div>
              </div>
            )}
          </div>
        </div>

        <SlidefarmHistory history={history} onOpen={setSlideshow} />
      </main>
    </div>
  );
}