import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Settings, X, RotateCcw, Play, ChevronRight, Timer, Target, Zap, Brain, Image as ImageIcon } from "lucide-react";
import RoomStudio from "@/components/valorant/RoomStudio";

// ─── Clean scenario set — only modes that actually work ───────────────────
// Tracking mode removed (hold-scoring was unreliable).
// All 3 remaining modes use click-to-hit mechanics which are deterministic.
const SCENARIOS = {
  flicking: {
    label: "Flicking",
    color: "#f97316",
    desc: "Wide-angle flicks to distant targets. Trains arm speed & snap accuracy.",
    icon: Zap,
    targetCount: 1,
    targetSize: 0.35,
    movement: "teleport_wide",
  },
  switching: {
    label: "Target Switching",
    color: "#a855f7",
    desc: "Six static targets. Click through all of them as fast as possible.",
    icon: Target,
    targetCount: 6,
    targetSize: 0.28,
    movement: "grid",
  },
  microadj: {
    label: "Micro-Adjustment",
    color: "#22c55e",
    desc: "Small drifting targets. Trains tiny, precise corrections.",
    icon: Brain,
    targetCount: 1,
    targetSize: 0.22,
    movement: "drift",
  },
};

const ROUTINES = {
  beginner: {
    label: "Beginner Routine",
    desc: "3 phases × 60s. Covers the fundamentals.",
    phases: [
      { scenario: "switching", duration: 60 },
      { scenario: "flicking",  duration: 60 },
      { scenario: "microadj",  duration: 60 },
    ],
  },
  intermediate: {
    label: "Intermediate Routine",
    desc: "3 phases × 120s. Extended practice.",
    phases: [
      { scenario: "flicking",  duration: 120 },
      { scenario: "microadj",  duration: 120 },
      { scenario: "switching", duration: 120 },
    ],
  },
};

const DEFAULT_SETTINGS = { sensitivity: 5, fov: 90, showCrosshair: true };

export default function ValorantArena() {
  // ── Three.js refs ───────────────────────────────────────────────────────
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);
  const targetsRef = useRef(new Map()); // Map<uuid, {mesh, phase, basePos, vel}>
  const animFrameRef = useRef(0);

  // ── Input / state refs ──────────────────────────────────────────────────
  const lockedRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const statsRef = useRef({ hits: 0, misses: 0, shots: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const screenCenter = useRef(new THREE.Vector2(0, 0));
  // Smoothed mouse delta accumulators (applied per-frame for fluid motion)
  const pendingYawRef = useRef(0);
  const pendingPitchRef = useRef(0);
  // Cached mesh array for raycasting (rebuilt only on spawn/respawn)
  const meshListRef = useRef([]);

  // Current scenario + routine state refs (avoid stale closures)
  const scenarioKeyRef = useRef("switching");
  const routineRef = useRef(null);
  const routinePhaseRef = useRef(0);
  const sessionStartRef = useRef(0);
  const phaseTimerRef = useRef(null);

  // ── UI state ────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ hits: 0, misses: 0, shots: 0 });
  const [locked, setLocked] = useState(false);
  const [screen, setScreen] = useState("landing"); // landing | select | arena
  const [activeScenario, setActiveScenario] = useState("switching");
  const [hitFlash, setHitFlash] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [routineKey, setRoutineKey] = useState(null);
  const [routinePhase, setRoutinePhase] = useState(0);
  const [showRoomStudio, setShowRoomStudio] = useState(false);
  const [customRoomUrl, setCustomRoomUrl] = useState(() => {
    try { return localStorage.getItem("valorant_custom_room") || null; } catch { return null; }
  });
  const customRoomUrlRef = useRef(customRoomUrl);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { customRoomUrlRef.current = customRoomUrl; }, [customRoomUrl]);

  const handleSelectRoom = useCallback((url) => {
    setCustomRoomUrl(url);
    try {
      if (url) localStorage.setItem("valorant_custom_room", url);
      else localStorage.removeItem("valorant_custom_room");
    } catch {}
    // Apply immediately if scene is live
    const scene = sceneRef.current;
    if (scene && scene.userData.applyRoom) {
      scene.userData.applyRoom(url);
    }
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const clearTargets = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    targetsRef.current.forEach(({ mesh }) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    targetsRef.current.clear();
  }, []);

  const makeTargetPosition = useCallback((movement, index = 0, total = 1) => {
    if (movement === "grid") {
      const cols = 3, rows = 2;
      const col = index % cols;
      const row = Math.floor(index / cols);
      return new THREE.Vector3(-4 + col * 4, 1.8 + row * 2.4, -10);
    }
    if (movement === "drift") {
      return new THREE.Vector3(0, 2.2, -8);
    }
    // teleport_wide: random wide position
    const angle = (Math.random() - 0.5) * 1.8; // ~±100°
    const dist = 9 + Math.random() * 4;
    return new THREE.Vector3(Math.sin(angle) * dist, 1.6 + Math.random() * 2.5, -Math.cos(Math.abs(angle)) * dist);
  }, []);

  const spawnTargets = useCallback((scenarioKey) => {
    const scene = sceneRef.current;
    if (!scene) return;
    clearTargets();
    const cfg = SCENARIOS[scenarioKey];
    if (!cfg) return;

    for (let i = 0; i < cfg.targetCount; i++) {
      // Lower-poly sphere: 16x12 instead of 24x24 (~50% fewer tris)
      const geo = new THREE.SphereGeometry(cfg.targetSize, 16, 12);
      // MeshBasicMaterial is unlit → no per-light shader work, much faster
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cfg.color) });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.matrixAutoUpdate = true;
      mesh.position.copy(makeTargetPosition(cfg.movement, i, cfg.targetCount));

      // Cheap ring outline (octagon-ish) for visibility
      const ringGeo = new THREE.RingGeometry(cfg.targetSize * 1.15, cfg.targetSize * 1.3, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: cfg.color, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      mesh.add(ring);

      scene.add(mesh);
      targetsRef.current.set(mesh.uuid, {
        mesh,
        basePos: mesh.position.clone(),
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Refresh cached mesh list (used by shoot raycast — avoids rebuilding every click)
    meshListRef.current = [...targetsRef.current.values()].map(t => t.mesh);
  }, [clearTargets, makeTargetPosition]);

  const respawnTarget = useCallback((uuid) => {
    const entry = targetsRef.current.get(uuid);
    if (!entry) return;
    const cfg = SCENARIOS[scenarioKeyRef.current];
    if (!cfg) return;
    // O(n) index lookup on a tiny Map (max 6 targets) — negligible cost
    let idx = 0;
    for (const k of targetsRef.current.keys()) {
      if (k === uuid) break;
      idx++;
    }
    const pos = makeTargetPosition(cfg.movement, idx, cfg.targetCount);
    entry.mesh.position.copy(pos);
    entry.basePos.copy(pos);
    entry.phase = Math.random() * Math.PI * 2;
  }, [makeTargetPosition]);

  const resetStats = useCallback(() => {
    statsRef.current = { hits: 0, misses: 0, shots: 0 };
    setStats({ hits: 0, misses: 0, shots: 0 });
  }, []);

  const switchScenario = useCallback((key) => {
    scenarioKeyRef.current = key;
    setActiveScenario(key);
    resetStats();
    spawnTargets(key);
  }, [spawnTargets, resetStats]);

  const startArena = useCallback((scenarioKey, routine = null) => {
    scenarioKeyRef.current = scenarioKey;
    routineRef.current = routine;
    routinePhaseRef.current = 0;
    setActiveScenario(scenarioKey);
    setRoutinePhase(0);
    resetStats();
    sessionStartRef.current = Date.now();
    setSessionTime(0);
    setScreen("arena");
  }, [resetStats]);

  // ── Build scene once when entering arena ────────────────────────────────
  useEffect(() => {
    if (screen !== "arena") return;

    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Performance-first renderer: no antialias (single biggest FPS hit),
    // capped pixelRatio, high-performance GPU hint, no shadow maps.
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08080f);
    // Fog removed — it adds a per-fragment cost for very little visual gain here
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(settingsRef.current.fov, w / h, 0.1, 200);
    camera.position.set(0, 1.7, 4);
    camera.rotation.order = "YXZ";
    cameraRef.current = camera;

    // Unlit scene — no lights needed since we use MeshBasicMaterial everywhere
    // This removes all per-pixel lighting math and dramatically boosts FPS.

    // Floor (unlit, cheap)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshBasicMaterial({ color: 0x0d0d18 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(60, 30, 0xff2244, 0x1a1a2e);
    grid.position.y = 0.01;
    scene.add(grid);

    // Back wall + side walls (will receive custom room texture if set)
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x111122, side: THREE.FrontSide });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), wallMat);
    backWall.position.set(0, 12, -22);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(44, 24), wallMat.clone());
    leftWall.position.set(-30, 12, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(44, 24), wallMat.clone());
    rightWall.position.set(30, 12, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Skybox sphere for panoramic custom rooms (inverted, so we see inside).
    // Radius 40 keeps the image bright & readable while staying behind all targets.
    const skyGeo = new THREE.SphereGeometry(40, 48, 24);
    const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x08080f });
    const skySphere = new THREE.Mesh(skyGeo, skyMat);
    // Rotate so the equirectangular seam sits behind the player (not in their face)
    skySphere.rotation.y = Math.PI;
    skySphere.visible = false;
    scene.add(skySphere);

    // Helper to apply a room texture (from preset / upload / AI).
    // Uses a load-token to prevent race conditions when switching quickly,
    // and disposes the previous texture to avoid GPU memory leaks.
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    let roomLoadToken = 0;

    const showDefaultRoom = () => {
      skySphere.visible = false;
      floor.visible = true;
      grid.visible = true;
      [backWall, leftWall, rightWall].forEach((w) => {
        w.visible = true;
        w.material.map = null;
        w.material.color.setHex(0x111122);
      });
      scene.background = new THREE.Color(0x08080f);
    };

    const disposeSkyTexture = () => {
      if (skyMat.map) {
        skyMat.map.dispose();
        skyMat.map = null;
      }
    };

    const applyRoom = (url) => {
      // Invalidate any in-flight load — its callback will become a no-op
      const myToken = ++roomLoadToken;

      if (!url) {
        disposeSkyTexture();
        showDefaultRoom();
        return;
      }

      loader.load(
        url,
        (tex) => {
          // Ignore if a newer applyRoom call has superseded this one
          if (myToken !== roomLoadToken) {
            tex.dispose();
            return;
          }
          // CRITICAL for equirectangular 360°: U must wrap seamlessly around the sphere.
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
          tex.needsUpdate = true;

          // Dispose previous texture BEFORE swapping
          disposeSkyTexture();
          skyMat.map = tex;
          skyMat.color.setHex(0xffffff);
          skyMat.needsUpdate = true;
          skySphere.visible = true;

          // Hide everything that would occlude the 360° panorama.
          floor.visible = false;
          grid.visible = false;
          [backWall, leftWall, rightWall].forEach((w) => {
            w.visible = false;
            w.material.map = null;
          });
          scene.background = new THREE.Color(0x000000);
        },
        undefined,
        () => {
          // Load failed — only fall back if this request is still current
          if (myToken === roomLoadToken) {
            disposeSkyTexture();
            showDefaultRoom();
          }
        }
      );
    };
    scene.userData.applyRoom = applyRoom;
    applyRoom(customRoomUrlRef.current);

    // Spawn initial targets
    spawnTargets(scenarioKeyRef.current);

    // ── Input handlers ────────────────────────────────────────────────────
    const canvas = renderer.domElement;

    const tryLock = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    };

    const handleShoot = () => {
      const cam = cameraRef.current;
      if (!cam) return;
      statsRef.current.shots++;

      const rc = raycasterRef.current;
      rc.setFromCamera(screenCenter.current, cam);
      // Use cached mesh list (refreshed on spawn/respawn) — avoids per-click allocation
      const hits = rc.intersectObjects(meshListRef.current, false);

      if (hits.length > 0) {
        statsRef.current.hits++;
        const hitUuid = hits[0].object.uuid;
        setHitFlash(true);
        setTimeout(() => setHitFlash(false), 70);
        respawnTarget(hitUuid);
      } else {
        statsRef.current.misses++;
      }
      setStats({ ...statsRef.current });
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (!lockedRef.current) {
        tryLock();
        return;
      }
      handleShoot();
    };

    // Accumulate raw movement — consumed & smoothed in the animation loop.
    // Decoupling input from render produces noticeably smoother camera motion
    // when the browser batches mousemove events at odd intervals.
    const onMouseMove = (e) => {
      if (!lockedRef.current) return;
      const s = settingsRef.current.sensitivity * 0.0008;
      pendingYawRef.current -= e.movementX * s;
      pendingPitchRef.current -= e.movementY * s;
    };

    const onLockChange = () => {
      lockedRef.current = document.pointerLockElement === canvas;
      setLocked(lockedRef.current);
    };

    const onResize = () => {
      const mw = mountRef.current?.clientWidth;
      const mh = mountRef.current?.clientHeight;
      if (!mw || !mh) return;
      camera.aspect = mw / mh;
      camera.updateProjectionMatrix();
      renderer.setSize(mw, mh);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);
    window.addEventListener("resize", onResize);

    // ── Session + phase timer ─────────────────────────────────────────────
    sessionStartRef.current = Date.now();
    phaseTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setSessionTime(elapsed);

      const routine = routineRef.current;
      if (routine) {
        const phaseIdx = routinePhaseRef.current;
        const phase = routine.phases[phaseIdx];
        if (phase && elapsed >= phase.duration) {
          const next = phaseIdx + 1;
          if (next < routine.phases.length) {
            routinePhaseRef.current = next;
            setRoutinePhase(next);
            scenarioKeyRef.current = routine.phases[next].scenario;
            setActiveScenario(routine.phases[next].scenario);
            sessionStartRef.current = Date.now();
            resetStats();
            spawnTargets(routine.phases[next].scenario);
          } else {
            // Finished routine — return to select
            clearInterval(phaseTimerRef.current);
            setScreen("select");
            if (document.pointerLockElement) document.exitPointerLock();
          }
        }
      }
    }, 250);

    // ── Animation loop — optimized for 240+ FPS & smooth camera motion ───
    let lastTs = performance.now();
    let fpsFrames = 0;
    let fpsAccum = 0;
    const PITCH_LIMIT = Math.PI / 2.2;

    const animate = (ts) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const cam = cameraRef.current;
      if (!cam) return;

      const dt = Math.min(0.05, (ts - lastTs) / 1000); // clamp to avoid jumps after tab-switch
      lastTs = ts;

      // Consume accumulated mouse delta with a tiny low-pass filter for smoothness.
      // Factor ~1 = instant (zero lag); we apply 100% of the delta but going through
      // the accumulator means multiple mousemove events in one frame are merged cleanly.
      yawRef.current += pendingYawRef.current;
      pitchRef.current += pendingPitchRef.current;
      pendingYawRef.current = 0;
      pendingPitchRef.current = 0;
      if (pitchRef.current > PITCH_LIMIT) pitchRef.current = PITCH_LIMIT;
      else if (pitchRef.current < -PITCH_LIMIT) pitchRef.current = -PITCH_LIMIT;

      cam.rotation.y = yawRef.current;
      cam.rotation.x = pitchRef.current;
      if (cam.fov !== settingsRef.current.fov) {
        cam.fov = settingsRef.current.fov;
        cam.updateProjectionMatrix();
      }

      // Target motion (drift only) — delta-time based so it stays smooth at any FPS
      const cfg = SCENARIOS[scenarioKeyRef.current];
      if (cfg && cfg.movement === "drift") {
        const t = ts * 0.001;
        targetsRef.current.forEach((entry) => {
          entry.mesh.position.x = entry.basePos.x + Math.sin(t * 1.8 + entry.phase) * 1.2;
          entry.mesh.position.y = entry.basePos.y + Math.cos(t * 1.4 + entry.phase) * 0.6;
        });
      }

      renderer.render(scene, cam);

      // FPS counter (update UI ~2x/sec, not every frame)
      fpsFrames++;
      fpsAccum += dt;
      if (fpsAccum >= 0.5) {
        setFps(Math.round(fpsFrames / fpsAccum));
        fpsFrames = 0;
        fpsAccum = 0;
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(phaseTimerRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      window.removeEventListener("resize", onResize);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      clearTargets();
      // Dispose sky texture + geometries to release GPU memory
      if (skyMat.map) skyMat.map.dispose();
      skyMat.dispose();
      skyGeo.dispose();
      renderer.dispose();
      if (mount.contains(canvas)) mount.removeChild(canvas);
      yawRef.current = 0;
      pitchRef.current = 0;
      pendingYawRef.current = 0;
      pendingPitchRef.current = 0;
    };
  }, [screen, spawnTargets, respawnTarget, clearTargets, resetStats]);

  // ── Derived UI values ───────────────────────────────────────────────────
  const accuracy = stats.shots > 0 ? Math.round((stats.hits / stats.shots) * 100) : 0;
  const currentRoutine = routineKey ? ROUTINES[routineKey] : null;
  const currentPhaseCfg = currentRoutine?.phases[routinePhase];
  const currentPhaseMax = currentPhaseCfg?.duration || 0;
  const scenarioCfg = SCENARIOS[activeScenario] || SCENARIOS.switching;

  // ── LANDING ─────────────────────────────────────────────────────────────
  if (screen === "landing") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542751371-adc38448a05e?w=2000&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-red-950/20 to-black/90" />
        <Link to={createPageUrl("Valorant")} className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="relative z-10 text-center max-w-lg px-6">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0aeac6876_image.png" alt="Valorant" className="w-16 h-16 mx-auto mb-5" />
          <h1 className="text-5xl font-black text-white mb-1 tracking-widest">AIM ARENA</h1>
          <p className="text-red-400 font-bold mb-1 tracking-widest uppercase text-xs">Precision 3D Aim Trainer</p>
          <p className="text-white/40 text-xs mb-8">Click-based training: Flicking · Switching · Micro-adjustment</p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {Object.entries(SCENARIOS).map(([key, sc]) => {
              const Icon = sc.icon;
              return (
                <div key={key} className="flex flex-col items-center gap-1 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <Icon className="w-5 h-5" style={{ color: sc.color }} />
                  <div className="text-white text-xs font-bold">{sc.label}</div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setScreen("select")}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-lg rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 tracking-widest">
            ENTER THE ARENA
          </button>
        </div>
      </div>
    );
  }

  // ── SELECT ──────────────────────────────────────────────────────────────
  if (screen === "select") {
    return (
      <div className="fixed inset-0 bg-[#08080f] overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setScreen("landing")} className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white/60">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h2 className="text-white font-black text-2xl">SELECT MODE</h2>
              <p className="text-white/40 text-xs">Pick a routine or individual scenario</p>
            </div>
            <button onClick={() => setShowRoomStudio(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-xs font-bold transition-all">
              <ImageIcon className="w-3.5 h-3.5" />
              {customRoomUrl ? "Custom Room ✓" : "Custom Room"}
            </button>
          </div>

          {showRoomStudio && (
            <RoomStudio
              currentRoomUrl={customRoomUrl}
              onSelect={handleSelectRoom}
              onClose={() => setShowRoomStudio(false)}
            />
          )}

          {/* Routines */}
          <div className="mb-6">
            <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <Timer className="w-3 h-3" /> Structured Routines
            </h3>
            <div className="space-y-3">
              {Object.entries(ROUTINES).map(([key, r]) => (
                <button key={key} onClick={() => { setRoutineKey(key); startArena(r.phases[0].scenario, r); }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{r.label}</span>
                    <span className="text-white/30 text-xs">{r.phases.length} phases · {Math.round(r.phases.reduce((a, p) => a + p.duration, 0) / 60)} min</span>
                  </div>
                  <p className="text-white/50 text-xs mb-3">{r.desc}</p>
                  <div className="flex gap-2 flex-wrap">
                    {r.phases.map((p, i) => {
                      const sc = SCENARIOS[p.scenario];
                      return (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: sc.color + '22', color: sc.color, border: `1px solid ${sc.color}44` }}>
                          {sc.label}
                        </span>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Individual scenarios */}
          <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
            <Target className="w-3 h-3" /> Individual Scenarios
          </h3>
          <div className="space-y-3">
            {Object.entries(SCENARIOS).map(([key, sc]) => {
              const Icon = sc.icon;
              return (
                <button key={key} onClick={() => { setRoutineKey(null); startArena(key, null); }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sc.color + '22', border: `1px solid ${sc.color}44` }}>
                        <Icon className="w-5 h-5" style={{ color: sc.color }} />
                      </div>
                      <div>
                        <div className="font-bold text-white">{sc.label}</div>
                        <p className="text-white/50 text-xs">{sc.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0 ml-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── ARENA ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      {hitFlash && <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundColor: scenarioCfg.color + '30' }} />}

      {settings.showCrosshair && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative w-5 h-5">
            <div className="absolute left-1/2 top-0 w-0.5 h-2 -translate-x-1/2" style={{ backgroundColor: scenarioCfg.color }} />
            <div className="absolute left-1/2 bottom-0 w-0.5 h-2 -translate-x-1/2" style={{ backgroundColor: scenarioCfg.color }} />
            <div className="absolute top-1/2 left-0 h-0.5 w-2 -translate-y-1/2" style={{ backgroundColor: scenarioCfg.color }} />
            <div className="absolute top-1/2 right-0 h-0.5 w-2 -translate-y-1/2" style={{ backgroundColor: scenarioCfg.color }} />
            <div className="absolute inset-0 m-auto w-1 h-1 rounded-full" style={{ backgroundColor: scenarioCfg.color }} />
          </div>
        </div>
      )}

      {!locked && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center mx-auto mb-3 animate-pulse" style={{ borderColor: scenarioCfg.color }}>
              <Play className="w-7 h-7" style={{ color: scenarioCfg.color }} />
            </div>
            <p className="text-white font-bold text-lg">Click to Start</p>
            <p className="text-white/40 text-xs mt-1">Left-click to lock cursor · ESC to release</p>
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: scenarioCfg.color, backgroundColor: scenarioCfg.color + '22', border: `1px solid ${scenarioCfg.color}44` }}>
          {scenarioCfg.label}
        </span>
        <div className="w-px h-6 bg-white/10" />
        <div className="text-center">
          <div className="text-white font-black">{stats.hits}</div>
          <div className="text-white/40 text-[9px]">HITS</div>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="text-center">
          <div className="text-white font-black">{stats.shots}</div>
          <div className="text-white/40 text-[9px]">SHOTS</div>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="text-center">
          <div className={`font-black ${accuracy >= 60 ? 'text-green-400' : accuracy >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</div>
          <div className="text-white/40 text-[9px]">ACC</div>
        </div>
        {currentPhaseMax > 0 && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <div className="text-white font-black">{Math.max(0, currentPhaseMax - sessionTime)}s</div>
              <div className="text-white/40 text-[9px]">LEFT</div>
            </div>
          </>
        )}
        <div className="w-px h-6 bg-white/10" />
        <button onClick={resetStats} className="text-white/30 hover:text-white transition-colors" title="Reset stats">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-6 bg-white/10" />
        <div className="text-center" title="Frames per second">
          <div className={`font-black ${fps >= 240 ? 'text-green-400' : fps >= 144 ? 'text-yellow-400' : 'text-red-400'}`}>{fps}</div>
          <div className="text-white/40 text-[9px]">FPS</div>
        </div>
      </div>

      {/* Routine phase indicator */}
      {currentRoutine && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
          {currentRoutine.phases.map((p, i) => {
            const sc = SCENARIOS[p.scenario];
            return (
              <div key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${i === routinePhase ? 'scale-110' : 'opacity-40'}`}
                style={{ color: sc.color, backgroundColor: sc.color + (i === routinePhase ? '30' : '15'), border: `1px solid ${sc.color}${i === routinePhase ? '60' : '20'}` }}>
                {i === routinePhase && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: sc.color }} />}
                {sc.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Top-left controls */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button onClick={() => { setScreen("select"); if (document.pointerLockElement) document.exitPointerLock(); }}
          className="w-9 h-9 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setShowSettings(!showSettings)}
          className="w-9 h-9 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all">
          <Settings className="w-4 h-4" />
        </button>
        <button onClick={() => { setShowRoomStudio(true); if (document.pointerLockElement) document.exitPointerLock(); }}
          className="h-9 px-3 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg flex items-center gap-1.5 text-white/50 hover:text-white transition-all text-xs font-bold">
          <ImageIcon className="w-3.5 h-3.5" />
          Room
        </button>
      </div>

      {/* Scenario quick-switch (only when not in routine) */}
      {!currentRoutine && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-1.5">
          {Object.entries(SCENARIOS).map(([key, sc]) => {
            const Icon = sc.icon;
            const active = activeScenario === key;
            return (
              <button key={key} onClick={() => switchScenario(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? '' : 'opacity-50 hover:opacity-80'}`}
                style={active ? { backgroundColor: sc.color + '22', color: sc.color, border: `1px solid ${sc.color}44` } : { color: 'white' }}>
                <Icon className="w-3.5 h-3.5" />
                {sc.label}
              </button>
            );
          })}
        </div>
      )}

      {showSettings && (
        <div className="absolute top-16 left-4 z-30 w-64 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">Settings</h3>
            <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-white/40 hover:text-white" /></button>
          </div>
          {[
            { key: "sensitivity", label: "Sensitivity", min: 1, max: 20 },
            { key: "fov", label: "Field of View", min: 60, max: 120 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <label className="text-white/50 text-xs uppercase">{label}</label>
                <span className="text-red-400 text-xs font-bold">{settings[key]}</span>
              </div>
              <input type="range" min={min} max={max} value={settings[key]}
                onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
                className="w-full accent-red-500" />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <label className="text-white/50 text-xs uppercase">Crosshair</label>
            <button onClick={() => setSettings(s => ({ ...s, showCrosshair: !s.showCrosshair }))}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.showCrosshair ? 'bg-red-600' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.showCrosshair ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/40 text-xs">Reset</button>
        </div>
      )}

      {showRoomStudio && (
        <RoomStudio
          currentRoomUrl={customRoomUrl}
          onSelect={handleSelectRoom}
          onClose={() => setShowRoomStudio(false)}
        />
      )}
    </div>
  );
}