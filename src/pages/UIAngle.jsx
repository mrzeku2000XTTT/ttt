import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BackToStore from "@/components/BackToStore";
import useElapsed from "@/hooks/useElapsed";
import AngleCanvas from "@/components/uiangle/AngleCanvas";
import Map3D from "@/components/uiangle/Map3D";
import AngleControls from "@/components/uiangle/AngleControls";
import { analyzeReferenceImage } from "@/components/uiangle/analyzeRef";
import { buildAnglePrompt } from "@/components/uiangle/anglePrompt";

export default function UIAngle() {
  const [refImageUrl, setRefImageUrl] = useState(null);
  const [dummies, setDummies] = useState([]);
  const [camera, setCamera] = useState({ x: 50, y: 12 });
  const [mapItems, setMapItems] = useState([]);
  const [mapCamera, setMapCamera] = useState({ x: 50, y: 18 });
  const [mode, setMode] = useState("2d");
  const [shot, setShot] = useState("Medium shot");
  const [angle, setAngle] = useState("Eye-level");
  const [camHeight, setCamHeight] = useState(1.6);
  const [yaw, setYaw] = useState(0);
  const [motion, setMotion] = useState("Dolly in");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(null);
  const elapsed = useElapsed(!!busy);

  const moveDummy = (id, x, y) =>
    setDummies((prev) => prev.map((d) => (d.id === id ? { ...d, x: x - d.w / 2, y: y - d.h / 2 } : d)));
  const moveMapItem = (id, x, y) =>
    setMapItems((prev) => prev.map((m) => (m.id === id ? { ...m, x, y } : m)));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("analyzing");
    setResult(null);
    setDummies([]);
    setMapItems([]);
    analyzeReferenceImage(file)
      .then(({ file_url, subjects }) => {
        setRefImageUrl(file_url);
        const dums = subjects.map((s, i) => ({ ...s, id: `d${i}` }));
        setDummies(dums);
        const chars = dums.filter((d) => d.kind === "character");
        const others = dums.filter((d) => d.kind !== "character");
        setMapItems([
          ...chars.map((c, i) => ({ id: `m-${c.id}`, label: c.label, kind: "character", x: 50 + i * 14, y: 70 })),
          ...others.map((o, i) => ({
            id: `m-${o.id}`, label: o.label, kind: "object",
            x: others.length > 1 ? 18 + (i * 64) / (others.length - 1) : 50, y: 34
          }))
        ]);
      })
      .finally(() => setBusy(null));
  };

  const scene = { mode, shot, angle, camHeight, yaw, motion, prompt, dummies, mapItems, mapCamera };
  const fullPrompt = () => buildAnglePrompt(scene);

  const handleGenerate = () => {
    const p = fullPrompt();
    setBusy("generating");
    base44.integrations.Core.GenerateImage({
      prompt: p,
      existing_image_urls: refImageUrl ? [refImageUrl] : undefined
    })
      .then((res) => setResult({ url: res.url, prompt: p }))
      .finally(() => setBusy(null));
  };

  const handleCopy = () => navigator.clipboard?.writeText(result?.prompt || fullPrompt());

  return (
    <div className="min-h-screen bg-black text-white">
      <BackToStore />
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/UI" className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white">
            <ArrowLeft className="h-5 w-5" />UI
          </Link>
          <span className="text-sm font-bold tracking-[0.2em]">UI ANGLE</span>
          <span className="w-14" />
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium hover:bg-white/10">
              <Upload className="h-4 w-4" />
              {refImageUrl ? "New reference" : "Upload reference image"}
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            {busy && (
              <span className="flex items-center gap-2 text-xs text-white/60">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {busy === "analyzing" ? "Analyzing reference…" : "Generating angle…"} {elapsed}s
              </span>
            )}
          </div>

          <AngleCanvas
            imageUrl={refImageUrl}
            dummies={dummies}
            camera={camera}
            onDragDummy={moveDummy}
            onDragCamera={(x, y) => setCamera({ x, y })}
            onRemoveDummy={(id) => setDummies((prev) => prev.filter((d) => d.id !== id))}
          />

          {mode !== "2d" && (
            <Map3D
              items={mapItems}
              camera={mapCamera}
              yaw={yaw}
              onDragItem={moveMapItem}
              onDragCamera={(x, y) => setMapCamera({ x, y })}
            />
          )}

          {result && (
            <div className="space-y-2 rounded-2xl border border-white/15 p-3">
              <img src={result.url} alt="Generated angle" className="w-full rounded-xl" />
              <p className="text-[11px] leading-relaxed text-white/40">{result.prompt}</p>
            </div>
          )}
        </div>

        <AngleControls
          mode={mode} setMode={setMode}
          shot={shot} setShot={setShot}
          angle={angle} setAngle={setAngle}
          camHeight={camHeight} setCamHeight={setCamHeight}
          yaw={yaw} setYaw={setYaw}
          motion={motion} setMotion={setMotion}
          prompt={prompt} setPrompt={setPrompt}
          onGenerate={handleGenerate}
          onCopyPrompt={handleCopy}
          canGenerate={!!refImageUrl}
          busy={busy}
        />
      </main>
    </div>
  );
}