import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Settings, X, Target, Crosshair, Zap, RotateCcw } from "lucide-react";

const MODES = ["Static", "Moving", "Flick", "Tracking"];

const DEFAULT_SETTINGS = {
  sensitivity: 5,
  targetSize: 5,
  targetSpeed: 4,
  targetCount: 6,
  mode: "Moving",
  fov: 90,
  showCrosshair: true,
};

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
  const statsRef = useRef({ hits: 0, misses: 0, shots: 0 });
  const clockRef = useRef(new THREE.Clock());
  const raycasterRef = useRef(new THREE.Raycaster());

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ hits: 0, misses: 0, shots: 0 });
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);

  // keep ref in sync
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const spawnTargets = useCallback((scene, count, mode, size, speed) => {
    // remove old
    targetsRef.current.forEach(t => scene.remove(t.mesh));
    targetsRef.current = [];

    const geo = new THREE.SphereGeometry(size * 0.05, 16, 16);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.3, metalness: 0.6 });
      const mesh = new THREE.Mesh(geo, mat);
      // random position in arena
      mesh.position.set(
        (Math.random() - 0.5) * 18,
        1 + Math.random() * 5,
        -8 - Math.random() * 10
      );
      scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * speed * 0.04,
        (Math.random() - 0.5) * speed * 0.02,
        0
      );
      targetsRef.current.push({ mesh, vel, baseY: mesh.position.y, phase: Math.random() * Math.PI * 2 });
    }
  }, []);

  useEffect(() => {
    if (!started) return;
    const mount = mountRef.current;
    const w = mount.clientWidth, h = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);
    scene.fog = new THREE.Fog(0x0a0a12, 20, 60);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(settings.fov, w / h, 0.1, 200);
    camera.position.set(0, 1.7, 4);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xff3333, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x4488ff, 1, 30);
    pointLight.position.set(0, 8, -10);
    scene.add(pointLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid lines on floor
    const grid = new THREE.GridHelper(40, 40, 0xff2244, 0x222233);
    grid.position.y = 0.01;
    scene.add(grid);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a28, roughness: 0.8 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), wallMat);
    backWall.position.set(0, 10, -20);
    scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), wallMat);
    leftWall.position.set(-20, 10, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), wallMat);
    rightWall.position.set(20, 10, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // VALORANT logo text on back wall
    const loader = new THREE.TextureLoader();
    loader.load('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0aeac6876_image.png', (tex) => {
      const logoMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.15 })
      );
      logoMesh.position.set(0, 6, -19.9);
      scene.add(logoMesh);
    });

    // Spawn targets
    const s = settingsRef.current;
    spawnTargets(scene, s.targetCount, s.mode, s.targetSize, s.targetSpeed);

    // Pointer lock
    const canvas = renderer.domElement;
    const onMouseDown = (e) => {
      if (!lockedRef.current) { canvas.requestPointerLock(); return; }
      // Fire
      statsRef.current.shots++;
      const rc = raycasterRef.current;
      rc.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = rc.intersectObjects(targetsRef.current.map(t => t.mesh));
      if (hits.length > 0) {
        statsRef.current.hits++;
        const hitMesh = hits[0].object;
        // flash red then respawn
        hitMesh.material.color.set(0xffff00);
        setHitFlash(true);
        setTimeout(() => setHitFlash(false), 100);
        setTimeout(() => {
          hitMesh.position.set(
            (Math.random() - 0.5) * 18,
            1 + Math.random() * 5,
            -8 - Math.random() * 10
          );
          hitMesh.material.color.set(0xff2244);
        }, 150);
      } else {
        statsRef.current.misses++;
      }
      setStats({ ...statsRef.current });
    };

    const onMouseMove = (e) => {
      if (!lockedRef.current) return;
      const sens = settingsRef.current.sensitivity * 0.0006;
      yawRef.current -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current));
    };

    const onLockChange = () => {
      lockedRef.current = document.pointerLockElement === canvas;
      setLocked(lockedRef.current);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = clockRef.current.getDelta();
      const s = settingsRef.current;

      // Update camera rotation
      camera.rotation.order = "YXZ";
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;
      camera.fov = s.fov;
      camera.updateProjectionMatrix();

      // Update targets
      targetsRef.current.forEach((t, i) => {
        if (s.mode === "Static") return;
        if (s.mode === "Tracking" || s.mode === "Moving") {
          t.mesh.position.x += t.vel.x;
          t.mesh.position.y = t.baseY + Math.sin(Date.now() * 0.001 + t.phase) * 1.5;
          if (Math.abs(t.mesh.position.x) > 10) t.vel.x *= -1;
        } else if (s.mode === "Flick") {
          // random teleport every 1.5s
          if (!t.lastFlick || Date.now() - t.lastFlick > 1500) {
            t.mesh.position.set(
              (Math.random() - 0.5) * 18,
              1 + Math.random() * 5,
              -8 - Math.random() * 8
            );
            t.lastFlick = Date.now();
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      window.removeEventListener("resize", onResize);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      renderer.dispose();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, [started]);

  // Re-spawn when relevant settings change
  useEffect(() => {
    if (!sceneRef.current || !started) return;
    spawnTargets(sceneRef.current, settings.targetCount, settings.mode, settings.targetSize, settings.targetSpeed);
  }, [settings.targetCount, settings.mode, settings.targetSize, settings.targetSpeed, started]);

  const resetStats = () => {
    statsRef.current = { hits: 0, misses: 0, shots: 0 };
    setStats({ hits: 0, misses: 0, shots: 0 });
  };

  const accuracy = stats.shots > 0 ? Math.round((stats.hits / stats.shots) * 100) : 0;

  // Landing screen
  if (!started) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1542751371-adc38448a05e?w=2000&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-red-950/30 to-black/90" />

        <Link to={createPageUrl("Valorant")} className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="relative z-10 text-center max-w-xl px-6">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0aeac6876_image.png"
            alt="Valorant" className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-5xl font-black text-white mb-2 tracking-widest">AIM ARENA</h1>
          <p className="text-red-400 font-bold mb-2 tracking-widest uppercase text-sm">3D Aim Trainer</p>
          <p className="text-white/50 text-sm mb-8">Click to lock cursor · Left-click to shoot · ESC to unlock</p>

          <div className="grid grid-cols-3 gap-3 mb-8 text-center">
            {[["Modes", "4"], ["Real-time", "Settings"], ["3D", "Arena"]].map(([l, v]) => (
              <div key={l} className="bg-white/5 border border-red-500/20 rounded-xl p-3">
                <div className="text-red-400 font-black text-xl">{v}</div>
                <div className="text-white/50 text-xs">{l}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStarted(true)}
            className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-lg rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 tracking-widest"
          >
            ENTER THE ARENA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 3D Canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Hit flash */}
      {hitFlash && <div className="absolute inset-0 bg-red-500/20 pointer-events-none z-10" />}

      {/* Crosshair */}
      {settings.showCrosshair && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative w-6 h-6">
            <div className="absolute left-1/2 top-0 w-0.5 h-2 bg-red-400 -translate-x-1/2" />
            <div className="absolute left-1/2 bottom-0 w-0.5 h-2 bg-red-400 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 h-0.5 w-2 bg-red-400 -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 h-0.5 w-2 bg-red-400 -translate-y-1/2" />
            <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-red-400" />
          </div>
        </div>
      )}

      {/* Click to lock overlay */}
      {!locked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center">
            <Crosshair className="w-12 h-12 text-red-400 mx-auto mb-3 animate-pulse" />
            <p className="text-white font-bold text-xl">Click to Start</p>
            <p className="text-white/50 text-sm mt-1">Left-click anywhere to lock cursor</p>
          </div>
        </div>
      )}

      {/* HUD - Stats */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/60 backdrop-blur-sm border border-red-500/30 rounded-xl px-6 py-2">
        <div className="text-center">
          <div className="text-red-400 font-black text-xl">{stats.hits}</div>
          <div className="text-white/50 text-[10px] uppercase">Hits</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-white font-black text-xl">{stats.shots}</div>
          <div className="text-white/50 text-[10px] uppercase">Shots</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className={`font-black text-xl ${accuracy >= 60 ? 'text-green-400' : accuracy >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</div>
          <div className="text-white/50 text-[10px] uppercase">Accuracy</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <button onClick={resetStats} className="text-white/40 hover:text-white transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Back + Settings buttons */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Link to={createPageUrl("Valorant")} className="w-9 h-9 bg-black/60 hover:bg-black/80 border border-white/20 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <button onClick={() => setShowSettings(!showSettings)} className="w-9 h-9 bg-black/60 hover:bg-black/80 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Mode badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-red-600/20 border border-red-500/40 rounded-lg px-3 py-1.5">
        <Zap className="w-3 h-3 text-red-400" />
        <span className="text-red-400 text-xs font-bold uppercase">{settings.mode}</span>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 left-4 z-30 w-72 bg-black/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-bold flex items-center gap-2"><Settings className="w-4 h-4 text-red-400" /> Settings</h3>
            <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-white/40 hover:text-white" /></button>
          </div>

          {/* Mode */}
          <div>
            <label className="text-white/50 text-xs uppercase mb-2 block">Mode</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MODES.map(m => (
                <button key={m} onClick={() => setSettings(s => ({ ...s, mode: m }))}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${settings.mode === m ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          {[
            { key: "sensitivity", label: "Sensitivity", min: 1, max: 20 },
            { key: "targetSize", label: "Target Size", min: 1, max: 12 },
            { key: "targetSpeed", label: "Target Speed", min: 1, max: 15 },
            { key: "targetCount", label: "Target Count", min: 1, max: 15 },
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

          {/* Crosshair toggle */}
          <div className="flex items-center justify-between">
            <label className="text-white/50 text-xs uppercase">Crosshair</label>
            <button onClick={() => setSettings(s => ({ ...s, showCrosshair: !s.showCrosshair }))}
              className={`w-10 h-5 rounded-full transition-all ${settings.showCrosshair ? 'bg-red-600' : 'bg-white/10'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-all mx-0.5 ${settings.showCrosshair ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button onClick={() => { setSettings(DEFAULT_SETTINGS); if (sceneRef.current) spawnTargets(sceneRef.current, DEFAULT_SETTINGS.targetCount, DEFAULT_SETTINGS.mode, DEFAULT_SETTINGS.targetSize, DEFAULT_SETTINGS.targetSpeed); }}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 text-xs transition-all">
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}