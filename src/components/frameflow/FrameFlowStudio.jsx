import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import FrameFlowRefs from "./FrameFlowRefs";
import FrameFlowControls from "./FrameFlowControls";
import FrameFlowTimeline from "./FrameFlowTimeline";
import FrameFlowPlayer from "./FrameFlowPlayer";
import FrameFlowPayload from "./FrameFlowPayload";
import { uploadReference } from "./frameFlowUpload";
import { buildCrossfadeFrames } from "./frameFlowCrossfade";
import {
  DEFAULT_MOTION,
  DEFAULT_NEGATIVE,
  DEFAULT_STYLE_LOCK,
  PRESERVE_OPTIONS,
  buildFramePrompt,
  buildPayload,
  frameProgress,
} from "./frameFlowPresets";

export default function FrameFlowStudio({ onHome, seedStart, seedEnd }) {
  const { toast } = useToast();
  const [refs, setRefs] = useState(() => ({
    start: seedStart ? { dataUrl: seedStart } : null,
    end: seedEnd ? { dataUrl: seedEnd } : null,
  }));
  const [refUrls, setRefUrls] = useState({ start: null, end: null });
  const [settings, setSettings] = useState({
    motion: DEFAULT_MOTION,
    preset: "Custom",
    frameCount: 8,
    fps: 12,
    timing: "Even",
    camera: "Locked",
    preserve: [...PRESERVE_OPTIONS],
    styleLock: DEFAULT_STYLE_LOCK,
    negative: DEFAULT_NEGATIVE,
  });
  const [frames, setFrames] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState("");
  const [payload, setPayload] = useState(null);

  const ready = Boolean(refs.start && refs.end);

  const patch = (next) => setSettings((prev) => ({ ...prev, ...next }));

  const pick = (key, dataUrl) => {
    setRefs((prev) => ({ ...prev, [key]: { dataUrl } }));
    setRefUrls({ start: null, end: null });
  };

  useEffect(() => {
    if (!playing || frames.length < 2) return undefined;
    const id = setInterval(() => setCurrent((count) => (count + 1) % frames.length), 1000 / settings.fps);
    return () => clearInterval(id);
  }, [playing, frames.length, settings.fps]);

  // References are uploaded privately and signed for the run — reused until a
  // new reference is dropped.
  const ensureRefUrls = async () => {
    if (refUrls.start && refUrls.end) return refUrls;
    const start = await uploadReference(refs.start.dataUrl, "frameflow-start.png");
    const end = await uploadReference(refs.end.dataUrl, "frameflow-end.png");
    const urls = { start: start.signed_url, end: end.signed_url };
    setRefUrls(urls);
    return urls;
  };

  const references = (...candidates) => [...new Set(candidates.filter(Boolean))];

  const generate = async () => {
    if (!ready) {
      toast({ title: "Upload both references", description: "A start frame and an end frame are required." });
      return;
    }

    const count = settings.frameCount;
    const total = count + 2;
    setGenerating(true);
    setPlaying(false);
    setPayload(buildPayload({ settings, frameCount: count, fps: settings.fps, hasStart: true, hasEnd: true }));

    const strip = Array.from({ length: total }, (_, index) => ({
      index,
      image: index === 0 ? refs.start.dataUrl : index === total - 1 ? refs.end.dataUrl : null,
      status: index === 0 || index === total - 1 ? "ready" : "pending",
    }));
    setFrames(strip);
    setCurrent(0);

    try {
      setStage("Uploading references…");
      const urls = await ensureRefUrls();
      const next = [...strip];

      for (let index = 1; index <= count; index += 1) {
        setStage(`Generating in-between ${index} of ${count}…`);
        const previous = index === 1 ? urls.start : next[index - 1].image;
        const { url } = await base44.integrations.Core.GenerateImage({
          prompt: buildFramePrompt({
            index,
            total,
            progress: frameProgress(index, count, settings.timing),
            settings,
          }),
          existing_image_urls: references(urls.start, urls.end, previous),
        });
        next[index] = { index, image: url, status: "ready" };
        setFrames([...next]);
      }

      setStage("");
      toast({ title: "Sequence generated", description: `${count} in-betweens across ${total} frames.` });
    } catch (error) {
      setStage("");
      const demo = await buildCrossfadeFrames(refs.start.dataUrl, refs.end.dataUrl, count);
      setFrames(demo);
      toast({
        title: "Demo strip created",
        description: "Generation was unavailable, so the strip crossfades your two references. Try again for real in-betweens.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const regenerate = async (index) => {
    if (!frames.length) return;
    if (index === 0 || index === frames.length - 1) {
      toast({ title: "Reference locked", description: "The start and end frames stay exactly as you uploaded them." });
      return;
    }

    const count = frames.length - 2;
    setGenerating(true);
    setStage(`Regenerating frame ${index + 1}…`);

    try {
      const urls = await ensureRefUrls();
      const previous = index === 1 ? urls.start : frames[index - 1].image;
      const upcoming = frames[index + 1].image;
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: buildFramePrompt({
          index,
          total: frames.length,
          progress: frameProgress(index, count, settings.timing),
          settings,
        }),
        existing_image_urls: references(urls.start, urls.end, previous, upcoming),
      });

      setFrames((prev) => prev.map((frame, i) => (i === index ? { ...frame, image: url, status: "ready" } : frame)));
      setCurrent(index);
      setStage("");
      toast({ title: `Frame ${index + 1} regenerated` });
    } catch (error) {
      setStage("");
      toast({ title: "That frame could not be regenerated", description: "Try again in a moment." });
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    if (frames.length < 2) {
      toast({ title: "Generate a sequence first" });
      return;
    }
    setPlaying((value) => !value);
  };

  return (
    <div className="frameflow-page ff-studio">
      <header className="ff-studio-head">
        <div className="flex items-center gap-3">
          <button type="button" className="ff-btn ff-btn-small" onClick={onHome}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Landing
          </button>
          <span className="ff-dim hidden text-[11px] tracking-[0.14em] uppercase sm:inline">FrameFlow studio</span>
        </div>

        <div className="flex items-center gap-2">
          {generating && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c8ff4d]" />}
          <span className="ff-dim text-[11px] tracking-[0.08em] uppercase">
            {stage || (frames.length ? `${frames.length} frames · ${settings.fps} fps` : "Start → in-betweens → end")}
          </span>
        </div>
      </header>

      <div className="ff-studio-body">
        <section className="ff-studio-main ff-scroll">
          <FrameFlowRefs
            refs={refs}
            onPick={pick}
            disabled={generating}
            onError={(message) => toast({ title: message })}
          />
          <FrameFlowTimeline
            frames={frames}
            current={current}
            onSelect={setCurrent}
            onRegenerate={regenerate}
          />
          <FrameFlowPlayer
            frames={frames}
            current={current}
            playing={playing}
            onTogglePlay={togglePlay}
            onSelect={(index) => setCurrent(Math.max(0, Math.min(index, frames.length - 1)))}
          />
          <FrameFlowPayload payload={payload} />
        </section>

        <aside className="ff-studio-aside ff-scroll">
          <FrameFlowControls
            settings={settings}
            onChange={patch}
            onGenerate={generate}
            generating={generating}
            ready={ready}
          />
        </aside>
      </div>
    </div>
  );
}