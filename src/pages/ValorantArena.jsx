import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Settings, X, RotateCcw, Play, ChevronRight, Timer, Target, Zap, Activity, Brain } from "lucide-react";

// ─── Aimer7-inspired scenario definitions ───────────────────────────────────
const SCENARIOS = {
  tracking: {
    label: "Tracking",
    color: "#38bdf8",
    desc: "Smoothly follow moving targets. Trains wrist/arm synchronization.",
    aimer7: "Inspired by: Midrange Long Strafes Invincible, Air Far Long Strafes",
    targetCount: 1,
    targetSize: 7,
    targetSpeed: 6,
    movementType: "strafe", // smooth horizontal strafe
    shootMode: "hold",       // hold to track, score by time on target
  },
  flicking: {
    label: "Flicking",
    color: "#f97316",
    desc: "Rapid large flicks to distant targets. Trains arm movement and speed.",
    aimer7: "Inspired by: Bounce 180, Close Long Strafes Invincible",
    targetCount: 1,
    targetSize: 5,
    targetSpeed: 0,
    movementType: "teleport_far", // spawns far away
    shootMode: "click",
  },
  switching: {
    label: "Target Switching",
    color: "#a855f7",
    desc: "Click through multiple targets as fast as possible. Trains switching speed.",
    aimer7: "Inspired by: 1wall6targets TE, 1wall9000targets",
    targetCount: 6,
    targetSize: 4,
    targetSpeed: 0,
    movementType: "static_spread",
    shootMode: "click",
  },
  microadj: {
    label: "Micro-Adjustment",
    color: "#22c55e",
    desc: "Tiny clustered targets requiring precise micro corrections.",
    aimer7: "Inspired by: Close Fast Strafes Invincible, Smoothbot",
    targetCount: 1,
    targetSize: 3,
    targetSpeed: 2,
    movementType: "micro", // small jitter
    shootMode: "click",
  },
  // Aimer7 Routine modes
  routine_beginner: null,
  routine_intermediate: null,
};

const ROUTINES = {
  beginner: {
    label: "Beginner Routine",
    color: "#22c55e",
    desc: "Based on Aimer7's complete beginner workout. 3 phases × 5 min.",
    phases: [
      { scenario: "tracking",  label: "Tracking — Smooth Strafe",       duration: 300 },
      { scenario: "flicking",  label: "Click Timing — Wide Flicks",      duration: 300 },
      { scenario: "switching", label: "Target Switching — 6 Targets",    duration: 300 },
    ],
  },
  intermediate: {
    label: "Intermediate Routine",
    color: "#f97316",
    desc: "Based on Aimer7's intermediate workout. 4 phases × 5 min.",
    phases: [
      { scenario: "tracking",  label: "Tracking — Long Strafes",         duration: 300 },
      { scenario: "microadj",  label: "Micro-Adjustment — Tight Targets", duration: 300 },
      { scenario: "flicking",  label: "Click Timing — Extreme Flicks",    duration: 300 },
      { scenario: "switching", label: "Target Switching — Speed",         duration: 300 },
    ],
  },
};

const DEFAULT_SETTINGS = { sensitivity: 5, fov: 90, showCrosshair: true };

export default function ValorantArena() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const targetsRef = useRef([]);
  const animFrameRef = useRef(null);
  const lockedRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const statsRef = useRef({ hits: 0, misses: 0, shots: 0, trackTime: 0 });
  const clockRef = useRef(new THREE.Clock());
  const raycasterRef = useRef(new THREE.Raycaster());
  const currentScenarioRef = useRef(null);
  const onTargetRef = useRef(false);
  const sessionTimerRef = useRef(null);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ hits: 0, misses: 0, shots: 0, trackTime: 0 });
  const [locked, setLocked] = useState(false);
  const [screen, setScreen] = useState("landing"); // landing | select | arena
  const [activeScenario, setActiveScenario] = useState("tracking");
  const [hitFlash, setHitFlash] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [maxTime, setMaxTime] = useState(0);

  // Routine state
  const [routineKey, setRoutineKey] = useState(null);
  const [routinePhase, setRoutinePhase] = useState(0);
  const [routinePhaseTime, setRoutinePhaseTime] = useState(0);
  const routineRef = useRef(null);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Build three.js scene
  const buildScene = useCallback(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth, h = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08080f);
    scene.fog = new THREE.Fog(0x08080f, 25, 70);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(settings.fov, w / h, 0.1, 200);
    camera.position.set(0, 1.7, 4);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const dir = new THREE.DirectionalLight(0xff3333, 1.4);
    dir.position.set(4, 10, 5);
    dir.castShadow = true;
    scene.add(dir);
    const ptLight = new THREE.PointLight(0x4488ff, 1, 35);
    ptLight.position.set(0, 8, -12);
    scene.add(ptLight);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x0d0d18, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(50, 50, 0xff2244, 0x1a1a2e);
    grid.position.y = 0.01;
    scene.add(grid);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.85 });
    [
      { pos: [0, 10, -22], rot: [0, 0, 0] },
      { pos: [-22, 10, 0], rot: [0, Math.PI / 2, 0] },
      { pos: [22, 10, 0], rot: [0, -Math.PI / 2, 0] },
    ].forEach(({ pos, rot }) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(50, 22), wallMat);
      w.position.set(...pos);
      w.rotation.set(...rot);
      scene.add(w);
    });

    // Scenario name label on back wall (subtle)
    return renderer.domElement;
  }, []);

  const spawnTargets = useCallback((scenario) => {
    const scene = sceneRef.current;
    if (!scene) return;
    targetsRef.current.forEach(t => scene.remove(t.mesh));
    targetsRef.current = [];

    const cfg = SCENARIOS[scenario];
    if (!cfg) return;
    const r = cfg.targetSize * 0.045;
    const geo = new THREE.SphereGeometry(r, 20, 20);

    for (let i = 0; i < cfg.targetCount; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.color), roughness: 0.2, metalness: 0.7, emissive: new THREE.Color(cfg.color), emissiveIntensity: 0.15 });
      const mesh = new THREE.Mesh(geo, mat);

      if (cfg.movementType === "static_spread") {
        // 6 targets spread on back wall
        const cols = 3, rows = 2;
        const col = i % cols, row = Math.floor(i / cols);
        mesh.position.set(-4 + col * 4, 1.5 + row * 2.5, -10);
      } else if (cfg.movementType === "micro") {
        mesh.position.set(0, 2, -8);
      } else {
        mesh.position.set((Math.random() - 0.5) * 16, 1.5 + Math.random() * 4, -9 - Math.random() * 8);
      }

      scene.add(mesh);
      targetsRef.current.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * cfg.targetSpeed * 0.04,
          (Math.random() - 0.5) * cfg.targetSpeed * 0.015,
          0
        ),
        basePos: mesh.position.clone(),
        phase: Math.random() * Math.PI * 2,
        lastFlick: 0,
      });
    }
  }, []);

  const respawnTarget = useCallback((t, scenario) => {
    const cfg = SCENARIOS[scenario];
    if (!cfg) return;
    if (cfg.movementType === "teleport_far") {
      // spawn far from center — wide angle flick required
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 8;
      t.mesh.position.set(Math.cos(angle) * dist, 1.5 + Math.random() * 3, -9 - Math.random() * 6);
    } else if (cfg.movementType === "strafe") {
      t.mesh.position.set((Math.random() - 0.5) * 14, 1.5 + Math.random() * 3, -8 - Math.random() * 6);
      t.vel.x = (Math.random() > 0.5 ? 1 : -1) * cfg.targetSpeed * 0.04;
    } else {
      t.mesh.position.set((Math.random() - 0.5) * 14, 1.5 + Math.random() * 3, -8 - Math.random() * 6);
    }
    t.basePos = t.mesh.position.clone();
  }, []);

  const startArena = useCallback((scenarioKey, routine = null, routinePhaseIdx = 0) => {
    currentScenarioRef.current = scenarioKey;
    routineRef.current = routine;
    statsRef.current = { hits: 0, misses: 0, shots: 0, trackTime: 0 };
    setStats({ hits: 0, misses: 0, shots: 0, trackTime: 0 });
    setScreen("arena");

    const timeLimit = routine ? routine.phases[routinePhaseIdx].duration : 0;
    setMaxTime(timeLimit);
    setSessionTime(0);
  }, []);

  // Main 3D effect — mounts when screen === "arena"
  useEffect(() => {
    if (screen !== "arena") return;

    const canvas = buildScene();
    if (!canvas) return;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    spawnTargets(currentScenarioRef.current);

    // Controls
    const onMouseDown = (e) => {
      if (!lockedRef.current) { canvas.requestPointerLock(); return; }
      const cfg = SCENARIOS[currentScenarioRef.current];
      if (!cfg || cfg.shootMode === "hold") return;
      statsRef.current.shots++;
      const rc = raycasterRef.current;
      rc.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = rc.intersectObjects(targetsRef.current.map(t => t.mesh));
      if (hits.length > 0) {
        statsRef.current.hits++;
        const hitMesh = hits[0].object;
        const hitTarget = targetsRef.current.find(t => t.mesh === hitMesh);
        hitMesh.material.emissiveIntensity = 1.2;
        hitMesh.material.color.set(0xffffff);
        setHitFlash(true);
        setTimeout(() => setHitFlash(false), 80);
        setTimeout(() => {
          if (hitTarget) {
            respawnTarget(hitTarget, currentScenarioRef.current);
            const cfg2 = SCENARIOS[currentScenarioRef.current];
            hitMesh.material.color.set(new THREE.Color(cfg2.color));
            hitMesh.material.emissiveIntensity = 0.15;
          }
        }, 120);
      } else {
        statsRef.current.misses++;
      }
      setStats({ ...statsRef.current });
    };

    const onMouseMove = (e) => {
      if (!lockedRef.current) return;
      const s = settingsRef.current.sensitivity * 0.0006;
      yawRef.current -= e.movementX * s;
      pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current - e.movementY * s));
    };

    const onLockChange = () => {
      lockedRef.current = document.pointerLockElement === canvas;
      setLocked(lockedRef.current);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);

    // Session timer
    const startTs = Date.now();
    sessionTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      setSessionTime(elapsed);
      if (routineRef.current) {
        const phaseIdx = routinePhase;
        const phaseDur = routineRef.current.phases[phaseIdx]?.duration || 0;
        if (elapsed >= phaseDur) {
          const nextPhase = phaseIdx + 1;
          if (nextPhase < routineRef.current.phases.length) {
            setRoutinePhase(nextPhase);
            currentScenarioRef.current = routineRef.current.phases[nextPhase].scenario;
            spawnTargets(currentScenarioRef.current);
            statsRef.current = { hits: 0, misses: 0, shots: 0, trackTime: 0 };
            setStats({ ...statsRef.current });
          } else {
            clearInterval(sessionTimerRef.current);
          }
        }
      }
    }, 1000);

    // Tracking score
    let trackInterval;
    const doTrackCheck = () => {
      const cfg = SCENARIOS[currentScenarioRef.current];
      if (cfg?.shootMode === "hold" && lockedRef.current) {
        const rc = raycasterRef.current;
        rc.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = rc.intersectObjects(targetsRef.current.map(t => t.mesh));
        if (hits.length > 0) {
          statsRef.current.trackTime = (statsRef.current.trackTime || 0) + 0.1;
          statsRef.current.shots = Math.max(1, statsRef.current.shots);
          setStats({ ...statsRef.current });
        }
      }
    };
    trackInterval = setInterval(doTrackCheck, 100);

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const cfg = SCENARIOS[currentScenarioRef.current];
      if (!cfg) return;

      camera.rotation.order = "YXZ";
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;
      camera.fov = settingsRef.current.fov;
      camera.updateProjectionMatrix();

      const t = Date.now() * 0.001;
      targetsRef.current.forEach((tgt) => {
        if (cfg.movementType === "strafe") {
          tgt.mesh.position.x += tgt.vel.x;
          if (Math.abs(tgt.mesh.position.x) > 12) tgt.vel.x *= -1;
        } else if (cfg.movementType === "micro") {
          // tiny oscillation
          tgt.mesh.position.x = tgt.basePos.x + Math.sin(t * 3 + tgt.phase) * 0.8;
          tgt.mesh.position.y = tgt.basePos.y + Math.cos(t * 2.5 + tgt.phase) * 0.5;
        }
        // pulse emissive when crosshair is near
        const rc = raycasterRef.current;
        rc.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = rc.intersectObject(tgt.mesh);
        tgt.mesh.material.emissiveIntensity = intersects.length > 0 ? 0.6 : 0.15;
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mountRef.current?.clientWidth, h = mountRef.current?.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(sessionTimerRef.current);
      clearInterval(trackInterval);
      canvas.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      window.removeEventListener("resize", onResize);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      renderer.dispose();
      if (mountRef.current?.contains(canvas)) mountRef.current.removeChild(canvas);
    };
  }, [screen]);

  const resetStats = () => {
    statsRef.current = { hits: 0, misses: 0, shots: 0, trackTime: 0 };
    setStats({ ...statsRef.current });
  };

  const accuracy = stats.shots > 0 ? Math.round((stats.hits / stats.shots) * 100) : 0;
  const trackPct = maxTime > 0 ? Math.min(100, Math.round((stats.trackTime / maxTime) * 100)) : 0;
  const cfg = SCENARIOS[activeScenario];
  const currentRoutine = routineKey ? ROUTINES[routineKey] : null;
  const currentPhaseLabel = currentRoutine?.phases[routinePhase]?.label;

  // ── LANDING ──────────────────────────────────────────────────────────────
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
          <p className="text-red-400 font-bold mb-1 tracking-widest uppercase text-xs">Aimer7 Method · 3D Trainer</p>
          <p className="text-white/40 text-xs mb-8">Based on Aimer7's KovaaK's workout routines — Click Timing · Target Switching · Tracking</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: Activity, label: "Tracking", desc: "Smooth pursuit", color: "text-sky-400" },
              { icon: Zap, label: "Flicking", desc: "Wide arm flicks", color: "text-orange-400" },
              { icon: Target, label: "Switching", desc: "Multi-target clicks", color: "text-purple-400" },
              { icon: Brain, label: "Micro-adj.", desc: "Precise corrections", color: "text-green-400" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl text-left">
                <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                <div>
                  <div className="text-white text-sm font-bold">{label}</div>
                  <div className="text-white/40 text-[11px]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen("select")}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-lg rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 tracking-widest">
            ENTER THE ARENA
          </button>
        </div>
      </div>
    );
  }

  // ── SCENARIO SELECT ───────────────────────────────────────────────────────
  if (screen === "select") {
    return (
      <div className="fixed inset-0 bg-[#08080f] overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setScreen("landing")} className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white/60">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-white font-black text-2xl">SELECT SCENARIO</h2>
              <p className="text-white/40 text-xs">Aimer7's training categories</p>
            </div>
          </div>

          {/* Routines */}
          <div className="mb-6">
            <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <Timer className="w-3 h-3" /> Structured Routines (Aimer7 Method)
            </h3>
            <div className="space-y-3">
              {Object.entries(ROUTINES).map(([key, r]) => (
                <button key={key} onClick={() => { setRoutineKey(key); setRoutinePhase(0); setActiveScenario(r.phases[0].scenario); startArena(r.phases[0].scenario, r, 0); }}
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
            {Object.entries(SCENARIOS).filter(([, v]) => v !== null).map(([key, sc]) => (
              <button key={key} onClick={() => { setActiveScenario(key); setRoutineKey(null); setRoutinePhase(0); startArena(key, null, 0); }}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />
                      <span className="font-bold text-white">{sc.label}</span>
                    </div>
                    <p className="text-white/50 text-xs">{sc.desc}</p>
                    <p className="text-white/25 text-[10px] mt-1 italic">{sc.aimer7}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0 ml-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ARENA ─────────────────────────────────────────────────────────────────
  const scenarioCfg = SCENARIOS[activeScenario] || SCENARIOS["tracking"];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Hit flash */}
      {hitFlash && <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundColor: scenarioCfg.color + '30' }} />}

      {/* Crosshair */}
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

      {/* Click to lock */}
      {!locked && (
        <div className="absolute inset-0 bg-black/65 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center mx-auto mb-3 animate-pulse" style={{ borderColor: scenarioCfg.color }}>
              <Play className="w-7 h-7" style={{ color: scenarioCfg.color }} />
            </div>
            <p className="text-white font-bold text-lg">Click to Start</p>
            <p className="text-white/40 text-xs mt-1">Left-click to lock cursor & shoot</p>
          </div>
        </div>
      )}

      {/* HUD top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-2">
        {/* Scenario badge */}
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: scenarioCfg.color, backgroundColor: scenarioCfg.color + '22', border: `1px solid ${scenarioCfg.color}44` }}>
          {currentPhaseLabel || scenarioCfg.label}
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
        {scenarioCfg.shootMode === "hold" && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <div className="text-sky-400 font-black">{stats.trackTime?.toFixed(1)}s</div>
              <div className="text-white/40 text-[9px]">ON-TARGET</div>
            </div>
          </>
        )}
        {maxTime > 0 && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <div className="text-white font-black">{Math.max(0, maxTime - sessionTime)}s</div>
              <div className="text-white/40 text-[9px]">LEFT</div>
            </div>
          </>
        )}
        <div className="w-px h-6 bg-white/10" />
        <button onClick={resetStats} className="text-white/30 hover:text-white transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Routine phase bar */}
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

      {/* Controls top-left */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button onClick={() => { setScreen("select"); if (document.pointerLockElement) document.exitPointerLock(); }}
          className="w-9 h-9 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setShowSettings(!showSettings)}
          className="w-9 h-9 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings panel */}
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
    </div>
  );
}