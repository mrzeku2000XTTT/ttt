import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import { ArrowLeft, Target, Zap, Brain, RotateCcw, Settings, X, Play, Trophy, Timer, ChevronRight, Shield, Crosshair, Swords } from "lucide-react";

// ─── GAME MODES ───────────────────────────────────────────────────────────────
const MODES = {
  range_free: {
    label: "Free Range",
    desc: "Unlimited time. Practice at your own pace.",
    icon: Target,
    color: "#22c55e",
    rounds: null,
    botCount: 5,
    botHealth: 100,
    botMove: "strafe",
  },
  deathmatch: {
    label: "Deathmatch",
    desc: "30 seconds. Kill as many bots as possible.",
    icon: Swords,
    color: "#ff2244",
    rounds: 1,
    timeLimit: 30,
    botCount: 6,
    botHealth: 100,
    botMove: "patrol",
  },
  round_battle: {
    label: "Round Battle",
    desc: "5 rounds. Clear all bots per round to advance.",
    icon: Trophy,
    color: "#f97316",
    rounds: 5,
    botCount: 4,
    botHealth: 150,
    botMove: "strafe",
  },
  spike_rush: {
    label: "Spike Rush",
    desc: "Rapid fire — bots respawn instantly. 60s clock.",
    icon: Zap,
    color: "#a855f7",
    rounds: 1,
    timeLimit: 60,
    botCount: 3,
    botHealth: 75,
    botMove: "rush",
  },
  precision: {
    label: "Precision Drill",
    desc: "Headshot only. Hits to body don't count.",
    icon: Crosshair,
    color: "#06b6d4",
    rounds: null,
    botCount: 4,
    botHealth: 1,
    botMove: "strafe",
    headshotOnly: true,
  },
  one_tap: {
    label: "One Tap",
    desc: "One shot one kill. Bots have 1HP headshot zones.",
    icon: Brain,
    color: "#eab308",
    rounds: 3,
    botCount: 3,
    botHealth: 1,
    botMove: "patrol",
  },
};

const DEFAULT_SETTINGS = { sensitivity: 5, fov: 103, showCrosshair: true, weapon: "vandal" };

// Vandal-style crosshair colors
const CROSSHAIR_COLORS = { vandal: "#00ff88", phantom: "#ff4466", operator: "#ffaa00", sheriff: "#8888ff" };

export default function ValorantRange() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameRef = useRef(0);

  // Input refs
  const lockedRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const pendingYawRef = useRef(0);
  const pendingPitchRef = useRef(0);
  const settingsRef = useRef(DEFAULT_SETTINGS);

  // Game state refs
  const botsRef = useRef(new Map()); // uuid → {mesh, head, body, hp, basePos, vel, phase, dir, state}
  const meshesToBotRef = useRef(new Map()); // mesh.uuid → bot uuid (for fast raycast lookup)
  const raycasterRef = useRef(new THREE.Raycaster());
  const screenCenter = useRef(new THREE.Vector2(0, 0));
  const modeKeyRef = useRef("range_free");
  const gameStateRef = useRef("idle"); // idle | playing | round_end | game_over
  const roundRef = useRef(1);
  const killsRef = useRef(0);
  const shotsRef = useRef(0);
  const headshotsRef = useRef(0);
  const timeLeftRef = useRef(0);
  const timerIntervalRef = useRef(null);

  // UI state
  const [screen, setScreen] = useState("landing"); // landing | select | game
  const [locked, setLocked] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [activeModeKey, setActiveModeKey] = useState("range_free");
  const [kills, setKills] = useState(0);
  const [shots, setShots] = useState(0);
  const [headshots, setHeadshots] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState("idle");
  const [hitFlash, setHitFlash] = useState(false);
  const [headshotFlash, setHeadshotFlash] = useState(false);
  const [fps, setFps] = useState(0);
  const [roundMsg, setRoundMsg] = useState("");
  const [botsAlive, setBotsAlive] = useState(0);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // ─── Bot management ────────────────────────────────────────────────────────
  const clearBots = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    botsRef.current.forEach(({ mesh }) => {
      scene.remove(mesh);
      mesh.traverse(c => { if (c.isMesh) { c.geometry?.dispose(); c.material?.dispose(); } });
    });
    botsRef.current.clear();
    meshesToBotRef.current.clear();
  }, []);

  const spawnBot = useCallback((index, total, moveType) => {
    const scene = sceneRef.current;
    if (!scene) return null;
    const cfg = MODES[modeKeyRef.current];

    // Position bots in a semi-circle in front of the player
    const spread = Math.PI * 1.0;
    const angle = (index / Math.max(total - 1, 1) - 0.5) * spread;
    const dist = 12 + Math.random() * 8;
    const bx = Math.sin(angle) * dist;
    const bz = -Math.cos(Math.abs(angle * 0.6)) * dist - 4;
    const by = 0;

    const group = new THREE.Group();
    group.position.set(bx, by, bz);

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 1.0, 0.3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a3e });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.15;
    group.add(body);

    // Chest plate
    const chestGeo = new THREE.BoxGeometry(0.46, 0.55, 0.32);
    const chestMat = new THREE.MeshLambertMaterial({ color: 0xff2244 });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.y = 1.3;
    group.add(chest);

    // Head — larger hitbox for headshots
    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.85;
    group.add(head);

    // Helmet
    const helmetGeo = new THREE.BoxGeometry(0.46, 0.22, 0.46);
    const helmetMat = new THREE.MeshLambertMaterial({ color: 0x333366 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 2.0;
    group.add(helmet);

    // Legs
    [-0.15, 0.15].forEach((ox, li) => {
      const legGeo = new THREE.BoxGeometry(0.22, 0.8, 0.25);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x111133 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(ox, 0.4, 0);
      group.add(leg);
    });

    // HP bar (always faces camera via billboarding in animate loop)
    const hpBgGeo = new THREE.PlaneGeometry(0.6, 0.07);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x330000, depthTest: false, transparent: true, opacity: 0.9 });
    const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
    hpBg.position.y = 2.35;
    group.add(hpBg);

    const hpFgGeo = new THREE.PlaneGeometry(0.58, 0.05);
    const hpFgMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, depthTest: false, transparent: true, opacity: 0.95 });
    const hpFg = new THREE.Mesh(hpFgGeo, hpFgMat);
    hpFg.position.y = 2.35;
    hpFg.position.z = 0.01;
    group.add(hpFg);

    scene.add(group);

    const botId = group.uuid;
    const botData = {
      mesh: group,
      head,
      body,
      hpFg,
      hpFgMat,
      hp: cfg.botHealth,
      maxHp: cfg.botHealth,
      basePos: new THREE.Vector3(bx, by, bz),
      phase: Math.random() * Math.PI * 2,
      dir: Math.random() > 0.5 ? 1 : -1,
      moveType,
      alive: true,
      deathTime: 0,
    };

    // Register all meshes for raycast
    group.traverse(c => {
      if (c.isMesh) meshesToBotRef.current.set(c.uuid, botId);
    });
    botsRef.current.set(botId, botData);
    return botData;
  }, []);

  const spawnAllBots = useCallback(() => {
    clearBots();
    const cfg = MODES[modeKeyRef.current];
    for (let i = 0; i < cfg.botCount; i++) {
      spawnBot(i, cfg.botCount, cfg.botMove);
    }
    setBotsAlive(cfg.botCount);
  }, [clearBots, spawnBot]);

  // ─── Build scene ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "game") return;
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth, H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", stencil: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a14);
    scene.fog = new THREE.Fog(0x0a0a14, 20, 80);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(settingsRef.current.fov, W / H, 0.05, 200);
    camera.position.set(0, 1.7, 6);
    camera.rotation.order = "YXZ";
    cameraRef.current = camera;

    // Lighting — realistic
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffd4aa, 1.2);
    sun.position.set(5, 12, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4466ff, 0.3);
    fill.position.set(-8, 4, -10);
    scene.add(fill);

    // ── Floor — Valorant range tile pattern ───
    const floorGeo = new THREE.PlaneGeometry(60, 80, 12, 16);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1c1c2e });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -10;
    scene.add(floor);

    // Floor grid lines
    const gridHelper = new THREE.GridHelper(60, 24, 0xff2244, 0x222244);
    gridHelper.position.y = 0.01;
    gridHelper.position.z = -10;
    scene.add(gridHelper);

    // ── Walls ───
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x12122a });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), wallMat);
    backWall.position.set(0, 9, -40);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), wallMat.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-30, 9, -10);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), wallMat.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(30, 9, -10);
    scene.add(rightWall);

    // ── Ceiling ───
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), new THREE.MeshLambertMaterial({ color: 0x080818 }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 10, -10);
    scene.add(ceil);

    // ── Valorant-style cover boxes ───
    const boxes = [
      { x: -5, z: -14, w: 2, h: 1.2, d: 1 },
      { x: 5, z: -14, w: 2, h: 1.2, d: 1 },
      { x: -10, z: -20, w: 1, h: 2, d: 1 },
      { x: 10, z: -20, w: 1, h: 2, d: 1 },
      { x: 0, z: -18, w: 3, h: 0.8, d: 1 },
    ];
    boxes.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshLambertMaterial({ color: 0x2a1a3e });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      scene.add(mesh);

      // Edge highlight
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xff2244, linewidth: 1.5 }));
      mesh.add(edges);
    });

    // ── Range distance markers ───
    [-10, -15, -20, -25, -30].forEach((z, i) => {
      const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(-28, 0.02, z);
      scene.add(marker);
    });

    // ── Weapon model (simple Vandal-ish shape) ───
    const gunGroup = new THREE.Group();
    const barrelGeo = new THREE.BoxGeometry(0.06, 0.06, 0.7);
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0.18, -0.28, -0.55);
    gunGroup.add(barrel);

    const bodyGun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.5), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    bodyGun.position.set(0.18, -0.26, -0.35);
    gunGroup.add(bodyGun);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.1), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    handle.position.set(0.18, -0.38, -0.22);
    gunGroup.add(handle);

    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.25), new THREE.MeshLambertMaterial({ color: 0x444444 }));
    scope.position.set(0.18, -0.21, -0.3);
    gunGroup.add(scope);

    camera.add(gunGroup);
    scene.add(camera);

    // Spawn initial bots
    spawnAllBots();

    // ─── Input ─────────────────────────────────────────────────────────────
    const canvas = renderer.domElement;

    const tryLock = () => { if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.(); };

    const handleShoot = () => {
      shotsRef.current++;
      setShots(s => s + 1);

      const cam = cameraRef.current;
      if (!cam) return;
      const rc = raycasterRef.current;
      rc.setFromCamera(screenCenter.current, cam);

      // Collect all bot meshes
      const allMeshes = [];
      botsRef.current.forEach(bot => {
        if (bot.alive) {
          bot.mesh.traverse(c => { if (c.isMesh) allMeshes.push(c); });
        }
      });

      const intersects = rc.intersectObjects(allMeshes, false);
      if (intersects.length === 0) return;

      const hitMesh = intersects[0].object;
      const botId = meshesToBotRef.current.get(hitMesh.uuid);
      if (!botId) return;
      const bot = botsRef.current.get(botId);
      if (!bot || !bot.alive) return;

      const isHeadshot = hitMesh === bot.head || hitMesh.position.y > 1.7;
      const cfg = MODES[modeKeyRef.current];

      // Precision / headshotOnly mode
      if (cfg.headshotOnly && !isHeadshot) {
        setHitFlash(true);
        setTimeout(() => setHitFlash(false), 60);
        return;
      }

      const dmg = isHeadshot ? (cfg.botHealth <= 1 ? 999 : Math.floor(cfg.botHealth * 0.6)) : Math.floor(cfg.botHealth * 0.25);
      bot.hp = Math.max(0, bot.hp - dmg);

      // Update HP bar
      const ratio = bot.hp / bot.maxHp;
      bot.hpFg.scale.x = Math.max(0.01, ratio);
      bot.hpFg.position.x = -(1 - ratio) * 0.29;
      if (ratio < 0.35) bot.hpFgMat.color.setHex(0xff4400);
      else if (ratio < 0.65) bot.hpFgMat.color.setHex(0xffaa00);

      if (isHeadshot) {
        headshotsRef.current++;
        setHeadshots(h => h + 1);
        setHeadshotFlash(true);
        setTimeout(() => setHeadshotFlash(false), 120);
      } else {
        setHitFlash(true);
        setTimeout(() => setHitFlash(false), 60);
      }

      if (bot.hp <= 0) {
        bot.alive = false;
        bot.deathTime = performance.now();
        killsRef.current++;
        setKills(k => k + 1);

        // Death animation — sink into floor
        const interval = setInterval(() => {
          bot.mesh.position.y -= 0.08;
          if (bot.mesh.position.y < -2) {
            clearInterval(interval);
            sceneRef.current?.remove(bot.mesh);

            // Respawn logic
            const modeCfg = MODES[modeKeyRef.current];
            const gs = gameStateRef.current;
            if (gs !== "playing") return;

            if (modeCfg.botMove === "rush" || !modeCfg.rounds) {
              // Free range / spike rush — instant respawn
              setTimeout(() => respawnSingleBot(botId), 800);
            } else {
              // Check if round cleared
              const alive = [...botsRef.current.values()].filter(b => b.alive).length;
              setBotsAlive(alive);
              if (alive === 0) onRoundClear();
            }
          }
        }, 16);
      }
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (!lockedRef.current) { tryLock(); return; }
      if (gameStateRef.current === "playing") handleShoot();
    };

    const onMouseMove = (e) => {
      if (!lockedRef.current) return;
      const s = settingsRef.current.sensitivity * 0.0007;
      pendingYawRef.current -= e.movementX * s;
      pendingPitchRef.current -= e.movementY * s;
    };

    const onLockChange = () => {
      lockedRef.current = document.pointerLockElement === canvas;
      setLocked(lockedRef.current);
    };

    const onResize = () => {
      const mw = mountRef.current?.clientWidth, mh = mountRef.current?.clientHeight;
      if (!mw || !mh) return;
      camera.aspect = mw / mh;
      camera.updateProjectionMatrix();
      renderer.setSize(mw, mh);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);
    window.addEventListener("resize", onResize);

    // ─── Animation loop ─────────────────────────────────────────────────────
    let lastTs = performance.now();
    let fpsFrames = 0, fpsAccum = 0;
    const PITCH_LIMIT = Math.PI / 2.1;

    const animate = (ts) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const cam = cameraRef.current;
      if (!cam) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      const t = ts * 0.001;

      // Camera
      yawRef.current += pendingYawRef.current;
      pitchRef.current += pendingPitchRef.current;
      pendingYawRef.current = 0;
      pendingPitchRef.current = 0;
      pitchRef.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitchRef.current));
      cam.rotation.y = yawRef.current;
      cam.rotation.x = pitchRef.current;
      if (cam.fov !== settingsRef.current.fov) {
        cam.fov = settingsRef.current.fov;
        cam.updateProjectionMatrix();
      }

      // Weapon bob
      if (cam.children.length) {
        const gun = cam.children[0];
        if (gun) {
          gun.position.y = Math.sin(t * 1.5) * 0.005;
          gun.rotation.z = Math.sin(t * 0.8) * 0.008;
        }
      }

      // Bot movement & HP bar billboarding
      botsRef.current.forEach((bot) => {
        if (!bot.alive) return;
        const mt = bot.moveType;
        const p = bot.phase;

        if (mt === "strafe") {
          bot.mesh.position.x = bot.basePos.x + Math.sin(t * 1.2 + p) * 2.5;
          // slight crouch bob
          bot.mesh.position.y = bot.basePos.y + Math.abs(Math.sin(t * 2.4 + p)) * 0.08;
        } else if (mt === "patrol") {
          const patrolT = t * 0.6 + p;
          bot.mesh.position.x = bot.basePos.x + Math.sin(patrolT) * 4;
          bot.mesh.position.z = bot.basePos.z + Math.cos(patrolT * 0.5) * 1.5;
        } else if (mt === "rush") {
          // Rush toward player
          const dx = cam.position.x - bot.mesh.position.x;
          const dz = cam.position.z - bot.mesh.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 3) {
            bot.mesh.position.x += (dx / dist) * dt * 2.5;
            bot.mesh.position.z += (dz / dist) * dt * 2.5;
          }
        }

        // Billboard HP bars
        if (bot.hpFg) {
          const dir = new THREE.Vector3();
          cam.getWorldDirection(dir);
          bot.hpFg.parent.quaternion.copy(cam.quaternion);
        }

        // Face player (yaw only)
        const dx2 = cam.position.x - bot.mesh.position.x;
        const dz2 = cam.position.z - bot.mesh.position.z;
        bot.mesh.rotation.y = Math.atan2(dx2, dz2);
      });

      renderer.render(scene, cam);

      fpsFrames++;
      fpsAccum += dt;
      if (fpsAccum >= 0.5) {
        setFps(Math.round(fpsFrames / fpsAccum));
        fpsFrames = 0;
        fpsAccum = 0;
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerIntervalRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      window.removeEventListener("resize", onResize);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      clearBots();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      yawRef.current = 0;
      pitchRef.current = 0;
    };
  }, [screen]);

  // Respawn single bot
  const respawnSingleBot = useCallback((oldId) => {
    const scene = sceneRef.current;
    if (!scene) return;
    botsRef.current.delete(oldId);
    const cfg = MODES[modeKeyRef.current];
    const total = cfg.botCount;
    const idx = Math.floor(Math.random() * total);
    spawnBot(idx, total, cfg.botMove);
    setBotsAlive([...botsRef.current.values()].filter(b => b.alive).length);
  }, [spawnBot]);

  // ─── Game flow ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const cfg = MODES[modeKeyRef.current];
    gameStateRef.current = "playing";
    roundRef.current = 1;
    killsRef.current = 0;
    shotsRef.current = 0;
    headshotsRef.current = 0;
    setKills(0); setShots(0); setHeadshots(0);
    setRound(1);
    setGameState("playing");
    setRoundMsg("");
    spawnAllBots();

    if (cfg.timeLimit) {
      timeLeftRef.current = cfg.timeLimit;
      setTimeLeft(cfg.timeLimit);
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        timeLeftRef.current--;
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerIntervalRef.current);
            endGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }, [spawnAllBots]);

  const onRoundClear = useCallback(() => {
    const cfg = MODES[modeKeyRef.current];
    const nextRound = roundRef.current + 1;
    if (cfg.rounds && nextRound > cfg.rounds) {
      endGame();
      return;
    }
    roundRef.current = nextRound;
    setRound(nextRound);
    setRoundMsg(`ROUND ${nextRound - 1} CLEAR!`);
    setTimeout(() => {
      setRoundMsg("");
      spawnAllBots();
    }, 1800);
  }, [spawnAllBots]);

  const endGame = useCallback(() => {
    gameStateRef.current = "game_over";
    setGameState("game_over");
    clearInterval(timerIntervalRef.current);
    if (document.pointerLockElement) document.exitPointerLock();
  }, []);

  // Start timer when game starts
  useEffect(() => {
    if (gameState === "playing") { /* handled in startGame */ }
  }, [gameState]);

  const accuracy = shots > 0 ? Math.round((kills / shots) * 100) : 0;
  const hsRate = shots > 0 ? Math.round((headshots / shots) * 100) : 0;
  const modeCfg = MODES[activeModeKey];
  const crossColor = CROSSHAIR_COLORS[settings.weapon] || "#00ff88";

  // ── LANDING ──────────────────────────────────────────────────────────────
  if (screen === "landing") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(255,34,68,0.15) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,34,68,0.03) 40px, rgba(255,34,68,0.03) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,34,68,0.03) 40px, rgba(255,34,68,0.03) 41px)" }} />

        <Link to="/ValorantArena" className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center">
          <div className="w-24 h-24 rounded-2xl mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ff2244, #aa0022)", boxShadow: "0 0 60px rgba(255,34,68,0.5)" }}>
            <Target className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-2 tracking-wider" style={{ textShadow: "0 0 40px rgba(255,34,68,0.8)" }}>TRAINING<br />RANGE</h1>
          <p className="text-red-400 tracking-widest text-sm font-bold mb-2 uppercase">Valorant · Realistic 3D · Bot Training</p>
          <p className="text-white/30 text-xs mb-10 max-w-sm">Moving bots · Multiple modes · Headshot detection · Round system</p>

          <div className="grid grid-cols-3 gap-3 mb-10 max-w-lg w-full">
            {Object.entries(MODES).slice(0, 6).map(([k, m]) => {
              const Icon = m.icon;
              return (
                <div key={k} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border" style={{ borderColor: m.color + "33", background: m.color + "11" }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                  <span className="text-white text-[11px] font-bold">{m.label}</span>
                </div>
              );
            })}
          </div>

          <button onClick={() => setScreen("select")}
            className="px-16 py-4 font-black text-xl text-white rounded-2xl tracking-widest transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #ff2244, #cc0022)", boxShadow: "0 4px 40px rgba(255,34,68,0.5)" }}>
            ENTER RANGE
          </button>
        </div>
      </div>
    );
  }

  // ── MODE SELECT ───────────────────────────────────────────────────────────
  if (screen === "select") {
    return (
      <div className="fixed inset-0 bg-[#08080f] overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setScreen("landing")} className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white/60">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-white font-black text-2xl">SELECT MODE</h2>
              <p className="text-white/40 text-xs">Choose your training mode</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(MODES).map(([key, m]) => {
              const Icon = m.icon;
              return (
                <button key={key}
                  onClick={() => { modeKeyRef.current = key; setActiveModeKey(key); setScreen("game"); setTimeout(startGame, 200); }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: m.color + "22", border: `1px solid ${m.color}44` }}>
                      <Icon className="w-6 h-6" style={{ color: m.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-black">{m.label}</span>
                        {m.rounds && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ color: m.color, background: m.color + "22" }}>{m.rounds} ROUNDS</span>}
                        {m.timeLimit && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-white/60">{m.timeLimit}s</span>}
                      </div>
                      <p className="text-white/50 text-xs">{m.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Hit flash */}
      {hitFlash && <div className="absolute inset-0 pointer-events-none z-10 bg-red-500/20" />}
      {headshotFlash && <div className="absolute inset-0 pointer-events-none z-10 bg-yellow-400/30 flex items-center justify-center">
        <span className="text-yellow-400 font-black text-2xl tracking-widest" style={{ textShadow: "0 0 20px rgba(250,204,21,0.9)" }}>HEADSHOT</span>
      </div>}

      {/* Crosshair */}
      {settings.showCrosshair && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative w-6 h-6">
            <div className="absolute left-1/2 top-0 w-[2px] h-2 -translate-x-1/2" style={{ background: crossColor }} />
            <div className="absolute left-1/2 bottom-0 w-[2px] h-2 -translate-x-1/2" style={{ background: crossColor }} />
            <div className="absolute top-1/2 left-0 h-[2px] w-2 -translate-y-1/2" style={{ background: crossColor }} />
            <div className="absolute top-1/2 right-0 h-[2px] w-2 -translate-y-1/2" style={{ background: crossColor }} />
            <div className="absolute inset-0 m-auto w-1 h-1 rounded-full" style={{ background: crossColor }} />
          </div>
        </div>
      )}

      {/* Click to start overlay */}
      {!locked && gameState !== "game_over" && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40 pointer-events-none">
          <div className="text-center px-8 py-6 bg-black/90 backdrop-blur-lg rounded-2xl border-2 border-red-500 shadow-2xl">
            <div className="w-16 h-16 rounded-xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Play className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-black text-2xl tracking-widest">CLICK TO PLAY</p>
            <p className="text-white/60 text-sm mt-1">Left-click to lock · ESC to release</p>
            <div className="mt-3 px-3 py-1 rounded-full text-xs font-bold inline-block" style={{ color: modeCfg.color, background: modeCfg.color + "22" }}>
              {modeCfg.label}
            </div>
          </div>
        </div>
      )}

      {/* HUD top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-2">
        <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ color: modeCfg.color, background: modeCfg.color + "22" }}>
          {modeCfg.label}
        </span>
        <div className="w-px h-5 bg-white/10" />
        {modeCfg.rounds && (
          <>
            <div className="text-center"><div className="text-white font-black">{round}</div><div className="text-white/40 text-[9px]">ROUND</div></div>
            <div className="w-px h-5 bg-white/10" />
          </>
        )}
        <div className="text-center"><div className="text-white font-black">{kills}</div><div className="text-white/40 text-[9px]">KILLS</div></div>
        <div className="w-px h-5 bg-white/10" />
        <div className="text-center"><div className="text-white font-black">{headshots}</div><div className="text-white/40 text-[9px]">HS</div></div>
        <div className="w-px h-5 bg-white/10" />
        <div className="text-center"><div className={`font-black ${hsRate >= 50 ? "text-yellow-400" : hsRate >= 25 ? "text-green-400" : "text-white"}`}>{hsRate}%</div><div className="text-white/40 text-[9px]">HS%</div></div>
        <div className="w-px h-5 bg-white/10" />
        <div className="text-center"><div className="text-white font-black">{botsAlive}</div><div className="text-white/40 text-[9px]">ALIVE</div></div>
        {modeCfg.timeLimit && (
          <>
            <div className="w-px h-5 bg-white/10" />
            <div className="text-center">
              <div className={`font-black ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</div>
              <div className="text-white/40 text-[9px]">TIME</div>
            </div>
          </>
        )}
        <div className="w-px h-5 bg-white/10" />
        <div className="text-center"><div className={`font-black text-xs ${fps >= 120 ? "text-green-400" : fps >= 60 ? "text-yellow-400" : "text-red-400"}`}>{fps}</div><div className="text-white/40 text-[9px]">FPS</div></div>
      </div>

      {/* Round message */}
      {roundMsg && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="text-center">
            <p className="text-5xl font-black text-green-400 tracking-widest" style={{ textShadow: "0 0 40px rgba(34,197,94,0.8)" }}>{roundMsg}</p>
            <p className="text-white/60 mt-2">Next round starting...</p>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {gameState === "game_over" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="text-center px-10 py-8 bg-black/95 border-2 border-red-500 rounded-3xl max-w-sm w-full">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-6 tracking-widest">RESULTS</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "Kills", value: kills, color: "#ff2244" },
                { label: "Shots", value: shots, color: "#aaaaaa" },
                { label: "Headshots", value: headshots, color: "#eab308" },
                { label: "HS Rate", value: `${hsRate}%`, color: "#06b6d4" },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-white/40 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setGameState("idle"); startGame(); }}
                className="flex-1 py-3 font-black text-white rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg, #ff2244, #cc0022)" }}>
                PLAY AGAIN
              </button>
              <button onClick={() => { setScreen("select"); if (document.pointerLockElement) document.exitPointerLock(); }}
                className="flex-1 py-3 font-black text-white/70 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                MODES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top-left controls */}
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        <button onClick={() => { setScreen("select"); if (document.pointerLockElement) document.exitPointerLock(); }}
          className="w-9 h-9 bg-black/85 hover:bg-red-600 border border-white/20 rounded-lg flex items-center justify-center text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setShowSettings(!showSettings)}
          className="w-9 h-9 bg-black/85 hover:bg-red-600 border border-white/20 rounded-lg flex items-center justify-center text-white transition-all">
          <Settings className="w-4 h-4" />
        </button>
        {gameState === "playing" && (
          <button onClick={() => { clearBots(); spawnAllBots(); setKills(0); setShots(0); setHeadshots(0); killsRef.current = 0; shotsRef.current = 0; headshotsRef.current = 0; }}
            className="h-9 px-3 bg-black/85 hover:bg-orange-600 border border-white/20 rounded-lg flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-bold transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-16 left-4 z-40 w-64 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">Settings</h3>
            <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-white/40 hover:text-white" /></button>
          </div>
          {[{ key: "sensitivity", label: "Sensitivity", min: 1, max: 20 }, { key: "fov", label: "FOV", min: 70, max: 120 }].map(({ key, label, min, max }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <label className="text-white/50 text-xs uppercase">{label}</label>
                <span className="text-red-400 text-xs font-bold">{settings[key]}</span>
              </div>
              <input type="range" min={min} max={max} value={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))} className="w-full accent-red-500" />
            </div>
          ))}
          <div>
            <label className="text-white/50 text-xs uppercase block mb-2">Weapon</label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.keys(CROSSHAIR_COLORS).map(w => (
                <button key={w} onClick={() => setSettings(s => ({ ...s, weapon: w }))}
                  className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${settings.weapon === w ? "text-white" : "text-white/40 bg-white/5"}`}
                  style={settings.weapon === w ? { background: CROSSHAIR_COLORS[w] + "44", color: CROSSHAIR_COLORS[w], border: `1px solid ${CROSSHAIR_COLORS[w]}66` } : {}}>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-white/50 text-xs uppercase">Crosshair</label>
            <button onClick={() => setSettings(s => ({ ...s, showCrosshair: !s.showCrosshair }))}
              className={`w-10 h-5 rounded-full relative transition-all ${settings.showCrosshair ? "bg-red-600" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.showCrosshair ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}