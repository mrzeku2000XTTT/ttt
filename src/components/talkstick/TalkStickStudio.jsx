import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TalkStickStage from "./TalkStickStage";
import TalkStickPanel from "./TalkStickPanel";
import useMouthEngine from "./useMouthEngine";
import { fitCanvas } from "./talkStickRender";
import { stickmanSource } from "./stickmen";
import { assetFromFile, fileToDataUrl, newAsset, KIND_PROP } from "./sceneAssets";
import { generateAsset } from "./assetGenerate";
import {
  deleteHistory,
  listHistory,
  loadCurrent,
  saveCurrent,
  saveHistory,
  takePendingCharacter,
} from "./talkStickStore";

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

const NO_SPOTS = { mouth: null, eyes: null, nose: null };

const NO_CHAR = { x: 0, y: 0 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function TalkStickStudio() {
  const [image, setImage] = useState(null);
  const [characterUrl, setCharacterUrl] = useState(null);
  const [stickman, setStickman] = useState(null);
  const [spots, setSpots] = useState(NO_SPOTS);
  const [activePart, setActivePart] = useState("mouth");
  const [settings, setSettings] = useState(DEFAULTS);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [editing, setEditing] = useState(true);
  // Where the character sits on the stage. Face spots are stored relative to it,
  // so dragging the character carries its mouth, eyes and nose along with it.
  const [charPos, setCharPos] = useState(NO_CHAR);
  const [movingChar, setMovingChar] = useState(false);

  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const meterRef = useRef(null);
  // Every asset's artwork, keyed by its url, for the renderer to draw each frame.
  const assetImages = useRef(new Map());

  const engine = useMouthEngine({
    canvasRef,
    meterRef,
    image,
    rig: spots,
    settings,
    scene: { assets, images: assetImages.current, char: charPos },
  });

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

  // Loads the artwork behind each asset once, and forgets any that left the scene.
  useEffect(() => {
    const map = assetImages.current;
    const live = new Set(assets.map((asset) => asset.url));
    Array.from(map.keys()).forEach((key) => {
      if (!live.has(key)) map.delete(key);
    });
    assets.forEach((asset) => {
      if (map.has(asset.url)) return;
      const art = new Image();
      art.onload = () => map.set(asset.url, art);
      art.src = asset.url;
    });
  }, [assets]);

  const loadCharacter = (url) => {
    const next = new Image();
    next.onload = () => setImage(next);
    next.src = url;
  };

  const buildStickman = (id) => {
    const stage = stageRef.current;
    const size = {
      width: Math.max(1, (stage?.clientWidth || 900) - 44),
      height: Math.max(1, (stage?.clientHeight || 600) - 44),
    };
    const { source, head } = stickmanSource(id, size.width, size.height);
    return { source, size, head };
  };

  const pickImage = (file) => {
    if (!file) return;
    fileToDataUrl(file).then((url) => {
      setStickman(null);
      setCharacterUrl(url);
      setSpots(NO_SPOTS);
      setCharPos(NO_CHAR);
      loadCharacter(url);
    });
  };

  // Draws a ready-made stickman at exactly the size the stage can hold, then lands
  // the whole face inside its head — eyes, nose and mouth all sized to fit it — so
  // it is ready to speak the moment it appears.
  const pickStickman = (id) => {
    const { source, size, head } = buildStickman(id);
    const share = (px) => (px / size.width) * 100;

    setStickman(id);
    setCharacterUrl(null);
    setImage(source);
    setCanvasSize(size);
    setCharPos(NO_CHAR);
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

  const addAssets = (files) => {
    const pictures = files.filter((file) => file.type.startsWith("image/"));
    if (!pictures.length) return;
    Promise.all(pictures.map((file) => assetFromFile(file, KIND_PROP)))
      .then((created) => {
        setAssets((prev) => [...prev, ...created]);
        setSelectedAssetId(created[created.length - 1].id);
        setError("");
      })
      .catch((problem) => setError(problem.message));
  };

  // Dropping onto the stage gives the scene a prop — unless the stage is still
  // empty, in which case the first image becomes the character itself.
  const handleDrop = (files) => {
    const pictures = files.filter((file) => file.type.startsWith("image/"));
    if (!pictures.length) return;
    if (image) {
      addAssets(pictures);
      return;
    }
    pickImage(pictures[0]);
    addAssets(pictures.slice(1));
  };

  const generateSceneAsset = ({ subject, kind, transparent }) => {
    setGenerating(true);
    setError("");
    generateAsset({ subject, kind, transparent })
      .then(({ url, ratio }) => {
        const created = newAsset({
          url,
          ratio,
          kind,
          name: subject.trim().slice(0, 40),
          prompt: subject,
        });
        setAssets((prev) => [...prev, created]);
        setSelectedAssetId(created.id);
      })
      .catch((problem) => setError(problem.message || "That generation did not come back"))
      .finally(() => setGenerating(false));
  };

  const changeAsset = (id, patch) =>
    setAssets((prev) => prev.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)));

  const deleteAsset = (id) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    setSelectedAssetId((prev) => (prev === id ? null : prev));
  };

  const applyProject = (project) => {
    if (!project) return;
    setSettings({ ...DEFAULTS, ...(project.settings || {}) });
    setSpots(project.spots || NO_SPOTS);
    setAssets(project.assets || []);
    setSelectedAssetId(null);
    setStickman(project.stickman || null);
    setCharacterUrl(project.characterUrl || null);
    setCharPos(project.char || NO_CHAR);

    if (project.stickman) {
      const built = buildStickman(project.stickman);
      setImage(built.source);
      setCanvasSize(built.size);
      return;
    }
    if (project.characterUrl) {
      loadCharacter(project.characterUrl);
      return;
    }
    setImage(null);
    setCanvasSize({ width: 0, height: 0 });
  };

  // Pick up whatever the last visit left behind: the artwork handed over by the
  // landing page first, then the project that saves itself as you work.
  useEffect(() => {
    setHistory(listHistory());
    const pending = takePendingCharacter();
    if (pending) {
      setStickman(null);
      setCharacterUrl(pending);
      setSpots(NO_SPOTS);
      setCharPos(NO_CHAR);
      loadCharacter(pending);
    } else {
      applyProject(loadCurrent());
    }
    setHydrated(true);
    // Runs once, on the first mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCurrent({ version: 1, stickman, characterUrl, spots, settings, assets, char: charPos });
  }, [hydrated, stickman, characterUrl, spots, settings, assets, charPos]);

  const snapshot = () => ({ version: 1, stickman, characterUrl, spots, settings, assets, char: charPos });

  const saveNamedProject = () => {
    setHistory(saveHistory(projectName, snapshot()));
    setProjectName("");
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
    setSelectedAssetId(null);
    setActivePart(part);
    setSpots((prev) => {
      if (prev[part] || !prev.mouth || !canvasSize.height) return prev;
      return { ...prev, [part]: { x: prev.mouth.x, y: prev.mouth.y - canvasSize.height * LIFT[part] } };
    });
  };

  // Spots are kept in the character's own space, so a click on the stage is
  // converted back out of the character's current position before it is stored.
  const placePart = (point) =>
    setSpots((prev) => ({
      ...prev,
      [activePart]: { x: point.x - charPos.x, y: point.y - charPos.y },
    }));

  // Moving the character is all it takes — the face rides along with it. A slice
  // always stays on the stage, so the character can never be dragged out of reach.
  const moveCharacter = (next) =>
    setCharPos({
      x: clamp(next.x, -canvasSize.width * 0.8, canvasSize.width * 0.8),
      y: clamp(next.y, -canvasSize.height * 0.8, canvasSize.height * 0.8),
    });

  return (
    <div className="talkstick">
      <div className="ts-shell">
        <header className="ts-head">
          <div className="ts-head-left">
            <Link to="/TalkStick" className="ts-back">
              Overview
            </Link>
            <div className="ts-brand">TALKSTICK</div>
          </div>
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
            charPos={charPos}
            movingChar={movingChar}
            onToggleMovingChar={() => setMovingChar((prev) => !prev)}
            onMoveCharacter={moveCharacter}
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            onChangeAsset={changeAsset}
            onDeleteAsset={deleteAsset}
            onDropFiles={handleDrop}
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
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            onChangeAsset={changeAsset}
            onDeleteAsset={deleteAsset}
            onGenerateAsset={generateSceneAsset}
            onAddAssetFiles={addAssets}
            generating={generating}
            generateError={error}
            history={history}
            projectName={projectName}
            onProjectName={setProjectName}
            onSaveProject={saveNamedProject}
            onOpenProject={(entry) => applyProject(entry.project)}
            onDeleteProject={(id) => setHistory(deleteHistory(id))}
          />
        </div>
      </div>
    </div>
  );
}