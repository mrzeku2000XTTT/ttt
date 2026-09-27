import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import FrameFlowRefs from "./FrameFlowRefs";
import FrameFlowControls from "./FrameFlowControls";
import FrameFlowTimeline from "./FrameFlowTimeline";
import FrameFlowPlayer from "./FrameFlowPlayer";
import FrameFlowSpriteSheet from "./FrameFlowSpriteSheet";
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
  generationOrder,
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

  // References are uploaded once per run and reused until a new reference is
  // dropped. They have to be plain public URLs — the generator fetches them
  // itself, and a private signed URL never reaches it.
  const ensureRefUrls = async () => {
    if (refUrls.start && refUrls.end) return refUrls;
    const start = await uploadReference(refs.start.dataUrl, "frameflow-start.png");
    const end = await uploadReference(refs.end.dataUrl, "frameflow-end.png");
    const urls = { start: start.file_url, end: end.file_url };
    setRefUrls(urls);
    return urls;
  };

  // One frame, drawn against both references plus whichever neighbours already
  // exist. Knowing the frame on either side — and how far it is from the end —
  // is what keeps the sequence together instead of drifting off the last frame.
  const drawFrame = async ({ index, count, results, urls }) => {
    const previous = results[index - 1]?.image || null;
    const upcoming = results[index + 1]?.image || null;

    const images = [urls.start, urls.end];
    const roles = ["1) the START reference frame", "2) the END reference frame"];
    if (previous) {
      images.push(previous);
      roles.push(`${images.length}) the frame immediately BEFORE this one, already drawn`);
    }
    if (upcoming) {
      images.push(upcoming);
      roles.push(`${images.length}) the frame immediately AFTER this one, already drawn`);
    }

    const { url } = await base44.integrations.Core.GenerateImage({
      prompt: buildFramePrompt({
        index,
        count,
        progress: frameProgress(index, count, settings.timing),
        settings,
        roles,
        before: previous ? "the attached previous frame" : "the START reference frame",
        after: upcoming ? "the attached next frame" : "the END reference frame",
      }),
      existing_image_urls: [...new Set(images)],
    });

    return url;
  };

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
      const results = [...strip];

      // Drawn from both ends inward — each reference anchors the frames beside it
      // — and anything that fails is retried, so every frame gets drawn however
      // many there are.
      let queue = generationOrder(count);
      for (let attempt = 0; attempt < 2 && queue.length; attempt += 1) {
        const pending = queue;
        queue = [];
        for (const item of pending) {
          setStage(`${attempt ? "Retrying" : "Drawing"} frame ${item.index} of ${count} · from the ${item.from}`);
          try {
            const url = await drawFrame({ index: item.index, count, results, urls });
            results[item.index] = { index: item.index, image: url, status: "ready" };
            setFrames([...results]);
          } catch (error) {
            queue.push(item);
            setFrames((prev) => prev.map((frame, i) => (i === item.index ? { ...frame, status: "error" } : frame)));
          }
        }
      }

      const missing = results.filter((frame) => !frame.image);
      if (missing.length) {
        const demo = await buildCrossfadeFrames(refs.start.dataUrl, refs.end.dataUrl, count);
        setFrames(results.map((frame, index) => (frame.image ? frame : demo[index])));
        toast({
          title: `${missing.length} frame${missing.length === 1 ? "" : "s"} fell back to the demo strip`,
          description: "Regenerate those frames individually once generation is available.",
        });
      } else {
        toast({ title: "Sequence generated", description: `${count} in-betweens across ${total} frames.` });
      }

      // Land on the last in-between so it can be checked against the end frame.
      setCurrent(Math.max(1, total - 2));
      setStage("");
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
      const url = await drawFrame({ index, count, results: frames, urls });

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
          <FrameFlowPlayer
            frames={frames}
            current={current}
            playing={playing}
            onTogglePlay={togglePlay}
            onSelect={(index) => setCurrent(Math.max(0, Math.min(index, frames.length - 1)))}
            startSrc={refs.start?.dataUrl || null}
            endSrc={refs.end?.dataUrl || null}
          />
          <FrameFlowTimeline
            frames={frames}
            current={current}
            onSelect={setCurrent}
            onRegenerate={regenerate}
          />
          <FrameFlowSpriteSheet frames={frames} current={current} onSelect={setCurrent} />
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