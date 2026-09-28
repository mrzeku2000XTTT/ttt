import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TalkStickStage from "./TalkStickStage";
import TalkStickPanel from "./TalkStickPanel";
import useMouthEngine from "./useMouthEngine";
import { charOrigin, fitCanvas } from "./talkStickRender";
import { stickmanSource } from "./stickmen";
import { assetFromFile, fileToDataUrl, newAsset, KIND_PROP, shiftLayer } from "./sceneAssets";
import TalkStickTransport from "./TalkStickTransport";
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

// The caption laid over the scene, and the template it is dressed in.
const NO_CAPTION = { text: "", template: "subtitle", color: "#ffffff", accent: "#ffe14d" };

const NO_CHAR = { x: 0, y: 0 };

// How far the character can be scaled, either way.
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;

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
  // How big the character is drawn. The artwork and its whole face grow together.
  const [charScale, setCharScale] = useState(1);
  // Which tool the stage is holding: "mouse" places face features and drags
  // props, "hand" drags the whole character around.
  const [tool, setTool] = useState("mouse");

  const [caption, setCaption] = useState(NO_CAPTION);
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
  // The timeline's playhead, written to directly so scrubbing never re-renders.
  const scrubRef = useRef(null);
  // Every asset's artwork, keyed by its url, for the renderer to draw each frame.
  const assetImages = useRef(new Map());

  const engine = useMouthEngine({
    canvasRef,
    meterRef,
    scrubRef,
    image,
    rig: spots,
    settings,
    scene: { assets, images: assetImages.current, char: charPos, scale: charScale, caption },
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
      setCharScale(1);
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
    setCharScale(1);
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

  // One request can bring back several props at once. They are fanned out across
  // the stage as they land, so a batch never stacks up in the same spot.
  const generateSceneAsset = ({ subject, kind, transparent, count = 1 }) => {
    const many = kind === KIND_PROP ? clamp(count, 1, 4) : 1;
    setGenerating(true);
    setError("");
    const runs = Array.from({ length: many }, () => generateAsset({ subject, kind, transparent }));

    Promise.allSettled(runs)
      .then((results) => {
        const made = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
        if (!made.length) throw new Error("That generation did not come back");

        const created = made.map(({ url, ratio }, index) => {
          const asset = newAsset({
            url,
            ratio,
            kind,
            name: many > 1 ? `${subject.trim().slice(0, 30)} ${index + 1}` : subject.trim().slice(0, 40),
            prompt: subject,
          });
          if (many > 1) {
            asset.x = clamp(50 + (index - (many - 1) / 2) * 20, 8, 92);
            asset.y = clamp(50 + (index % 2 ? 9 : -9), 8, 92);
          }
          return asset;
        });

        setAssets((prev) => [...prev, ...created]);
        setSelectedAssetId(created[created.length - 1].id);
        setError(made.length < many ? `${many - made.length} of the ${many} did not come back — try those again.` : "");
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

  // Restacks an asset inside its own layer, so the scene's order is the paint order.
  const reorderAsset = (id, delta) => setAssets((prev) => shiftLayer(prev, id, delta));

  const applyProject = (project) => {
    if (!project) return;
    setSettings({ ...DEFAULTS, ...(project.settings || {}) });
    setSpots(project.spots || NO_SPOTS);
    setAssets(project.assets || []);
    setSelectedAssetId(null);
    setStickman(project.stickman || null);
    setCharacterUrl(project.characterUrl || null);
    setCharPos(project.char || NO_CHAR);
    setCharScale(project.scale || 1);
    setCaption({ ...NO_CAPTION, ...(project.caption || {}) });

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
      setCharScale(1);
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
    saveCurrent({
      version: 1,
      stickman,
      characterUrl,
      spots,
      settings,
      assets,
      char: charPos,
      scale: charScale,
      caption,
    });
  }, [hydrated, stickman, characterUrl, spots, settings, assets, charPos, charScale, caption]);

  const snapshot = () => ({
    version: 1,
    stickman,
    characterUrl,
    spots,
    settings,
    assets,
    char: charPos,
    scale: charScale,
    caption,
  });

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
  const placePart = (point) => {
    const origin = charOrigin(canvasSize, charPos, charScale);
    setSpots((prev) => ({
      ...prev,
      [activePart]: {
        x: (point.x - origin.x) / charScale,
        y: (point.y - origin.y) / charScale,
      },
    }));
  };

  // Moving the character is all it takes — the face rides along with it. A slice
  // always stays on the stage, so the character can never be dragged out of reach.
  const moveCharacter = (next) =>
    setCharPos({
      x: clamp(next.x, -canvasSize.width * 0.8, canvasSize.width * 0.8),
      y: clamp(next.y, -canvasSize.height * 0.8, canvasSize.height * 0.8),
    });

  // Resizing keeps the character centred where it is, and the face rides along.
  const scaleCharacter = (next) => setCharScale(clamp(next, MIN_SCALE, MAX_SCALE));

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
            tool={tool}
            onToolChange={setTool}
            onMoveCharacter={moveCharacter}
            charScale={charScale}
            onScaleCharacter={scaleCharacter}
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            onChangeAsset={changeAsset}
            onDeleteAsset={deleteAsset}
            onDropFiles={handleDrop}
          >
            <TalkStickTransport engine={engine} caption={caption} onCaption={setCaption} />
          </TalkStickStage>
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
            charScale={charScale}
            onScaleCharacter={scaleCharacter}
            hasImage={Boolean(image)}
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            onChangeAsset={changeAsset}
            onDeleteAsset={deleteAsset}
            onReorder={reorderAsset}
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