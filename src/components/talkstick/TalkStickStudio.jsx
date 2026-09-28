import React, { useEffect, useRef, useState } from "react";
import TalkStickStage from "./TalkStickStage";
import TalkStickPanel from "./TalkStickPanel";
import useMouthEngine from "./useMouthEngine";
import { fitCanvas } from "./talkStickRender";
import { stickmanSource } from "./stickmen";

// Every feature carries its own size and look. `width` is a share of the canvas
// width and `height` too, so a feature keeps its proportions at any artwork size.
const DEFAULTS = {
  mouth: { width: 38, height: 18, offsetY: 0, style: "oval", patch: false },
  eyes: { width: 30, height: 9, offsetY: 0, style: "dots", anim: "blink" },
  nose: { width: 8, height: 14, offsetY: 0, style: "dash" },
  sensitivity: 1.8,
  smoothing: 0.72,
};

// How far above the mouth a new feature is first dropped, as a share of height.
const LIFT = { eyes: 0.17, nose: 0.07 };

export default function TalkStickStudio() {
  const [image, setImage] = useState(null);
  const [stickman, setStickman] = useState(null);
  const [spots, setSpots] = useState({ mouth: null, eyes: null, nose: null });
  const [activePart, setActivePart] = useState("mouth");
  const [settings, setSettings] = useState(DEFAULTS);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [editing, setEditing] = useState(true);

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const meterRef = useRef(null);

  const engine = useMouthEngine({ canvasRef, meterRef, image, rig: spots, settings });

  // Fit the artwork to the stage, and again whenever the window changes size.
  useEffect(() => {
    if (!image) return undefined;
    const fit = () => {
      const stage = stageRef.current;
      const canvas = canvasRef.current;
      if (!stage || !canvas) return;
      const fitted = fitCanvas(canvas, image, stage.clientWidth - 44, stage.clientHeight - 44);
      if (fitted) setCanvasSize(fitted);
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
      setStickman(null);
      setImage(next);
      setSpots({ mouth: null, eyes: null, nose: null });
      URL.revokeObjectURL(url);
    };
    next.src = url;
  };

  // Draws a ready-made stickman at exactly the size the stage can hold, then lands
  // the whole face inside its head — eyes, nose and mouth all sized to fit it — so
  // it is ready to speak the moment it appears.
  const pickStickman = (id) => {
    const stage = stageRef.current;
    if (!stage) return;
    const size = {
      width: Math.max(1, stage.clientWidth - 44),
      height: Math.max(1, stage.clientHeight - 44),
    };
    const { source, head } = stickmanSource(id, size.width, size.height);
    const share = (px) => (px / size.width) * 100;

    setStickman(id);
    setImage(source);
    setCanvasSize(size);
    setSpots({
      mouth: { x: head.cx, y: head.cy + head.r * 0.46 },
      eyes: { x: head.cx, y: head.cy - head.r * 0.26 },
      nose: { x: head.cx, y: head.cy + head.r * 0.08 },
    });
    setSettings((prev) => ({
      ...prev,
      mouth: { ...prev.mouth, width: share(head.r * 1.3), height: share(head.r * 0.62), offsetY: 0 },
      eyes: { ...prev.eyes, width: share(head.r * 1.1), height: share(head.r * 0.3), offsetY: 0 },
      nose: { ...prev.nose, width: share(head.r * 0.26), height: share(head.r * 0.44), offsetY: 0 },
    }));
  };

  const exportFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const link = document.createElement("a");
    link.download = "talkstick-frame.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const updatePart = (part, patch) =>
    setSettings((prev) => ({ ...prev, [part]: { ...prev[part], ...patch } }));

  const clearPart = (part) => setSpots((prev) => ({ ...prev, [part]: null }));

  // Selecting a feature drops it above the mouth the first time, so the face is
  // usable straight away instead of starting from an empty canvas.
  const selectPart = (part) => {
    setActivePart(part);
    setSpots((prev) => {
      if (prev[part] || !prev.mouth || !canvasSize.height) return prev;
      return { ...prev, [part]: { x: prev.mouth.x, y: prev.mouth.y - canvasSize.height * LIFT[part] } };
    });
  };

  const placePart = (point) => setSpots((prev) => ({ ...prev, [activePart]: point }));

  return (
    <div className="talkstick">
      <div className="ts-shell">
        <header className="ts-head">
          <div className="ts-brand">TALKSTICK</div>
          <span className="ts-badge">Real-time face engine</span>
        </header>

        <div className="ts-layout">
          <TalkStickStage
            canvasRef={canvasRef}
            stageRef={stageRef}
            hasImage={Boolean(image)}
            activePart={activePart}
            spot={spots[activePart]}
            part={settings[activePart]}
            canvasSize={canvasSize}
            editing={editing}
            onToggleEditing={() => setEditing((prev) => !prev)}
            onPlace={placePart}
            onResize={(size) => updatePart(activePart, size)}
          />
          <TalkStickPanel
            settings={settings}
            activePart={activePart}
            spots={spots}
            onActivePart={selectPart}
            onUpdatePart={updatePart}
            onChangeVoice={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
            onClearPart={clearPart}
            stickman={stickman}
            onPickStickman={pickStickman}
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