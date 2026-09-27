import React, { useEffect, useRef, useState } from "react";
import TalkStickStage from "./TalkStickStage";
import TalkStickPanel from "./TalkStickPanel";
import useMouthEngine from "./useMouthEngine";
import { fitCanvas } from "./talkStickRender";

const DEFAULTS = {
  width: 38,
  height: 18,
  offsetY: 0,
  style: "oval",
  sensitivity: 1.8,
  smoothing: 0.72,
};

export default function TalkStickStudio() {
  const [image, setImage] = useState(null);
  const [mouth, setMouth] = useState(null);
  const [settings, setSettings] = useState(DEFAULTS);

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const meterRef = useRef(null);

  const engine = useMouthEngine({ canvasRef, meterRef, image, mouth, settings });

  // Fit the artwork to the stage, and again whenever the window changes size.
  useEffect(() => {
    if (!image) return undefined;
    const fit = () => {
      const stage = stageRef.current;
      const canvas = canvasRef.current;
      if (!stage || !canvas) return;
      fitCanvas(canvas, image, stage.clientWidth - 44, stage.clientHeight - 44);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [image]);

  const pickImage = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = () => {
      setImage(next);
      setMouth(null);
      URL.revokeObjectURL(url);
    };
    next.src = url;
  };

  const exportFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const link = document.createElement("a");
    link.download = "talkstick-frame.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="talkstick">
      <div className="ts-shell">
        <header className="ts-head">
          <div className="ts-brand">TALKSTICK</div>
          <span className="ts-badge">Real-time mouth engine</span>
        </header>

        <div className="ts-layout">
          <TalkStickStage
            canvasRef={canvasRef}
            stageRef={stageRef}
            hasImage={Boolean(image)}
            onPlace={setMouth}
          />
          <TalkStickPanel
            settings={settings}
            onChange={(next) => setSettings((prev) => ({ ...prev, ...next }))}
            onPickImage={pickImage}
            onPickAudio={engine.playFile}
            onExport={exportFrame}
            meterRef={meterRef}
            engine={engine}
            hasImage={Boolean(image)}
          />
        </div>
      </div>
    </div>
  );
}