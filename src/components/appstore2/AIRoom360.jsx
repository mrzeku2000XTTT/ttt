import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, Sparkles, MessageCircle } from "lucide-react";
import AgentChatPanel from "./AgentChatPanel";
import FlyerDetailCard from "./FlyerDetailCard";
import ImaginePortalPrompt from "./ImaginePortalPrompt";
import KaSshiFloatingWidget from "./KaSshiFloatingWidget";
import { base44 } from "@/api/base44Client";
import { createImagineEmitter, createKasshiEmitter, distanceToVolume } from "./spatialAudio";

export default function AIRoom360({ agent, onClose }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pinkRoom, setPinkRoom] = useState(false);
  const [activeFlyer, setActiveFlyer] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [imagineOpen, setImagineOpen] = useState(false);
  const [kasshiOpen, setKasshiOpen] = useState(false);
  const [imagineLoading, setImagineLoading] = useState(false);
  const [hasCustomSky, setHasCustomSky] = useState(false);
  const [portalRemaining, setPortalRemaining] = useState(3);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRefs = useRef({ ctx: null, master: null, imagine: null, kasshi: null, started: false });
  const sceneRefs = useRef({ scene: null, originalImage: null, skyMesh: null, geometry: null });
  const autoRotateRef = useRef(true);
  const pinkRoomRef = useRef(false);
  const joystickRef = useRef({ active: false, x: 0, y: 0, startX: 0, startY: 0 });
  const [joyVisual, setJoyVisual] = useState({ x: 0, y: 0, active: false });

  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { pinkRoomRef.current = pinkRoom; }, [pinkRoom]);

  // Only the Sealed Wallet Analyzer has the secret pink lock portal
  const hasPinkLock = agent?.name === "Sealed Wallet Analyzer";

  useEffect(() => {
    if (!agent || !mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();

    // Camera at center, looking outward
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1100);
    camera.position.set(0, 0, 0.1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // 360 sphere
    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    let skyMesh = null;
    let skyMaterial = null;
    loader.load(
      agent.image,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        skyMaterial = new THREE.MeshBasicMaterial({
          map: texture,
        });
        skyMesh = new THREE.Mesh(geometry, skyMaterial);
        scene.add(skyMesh);
        setLoading(false);
      },
      undefined,
      () => setLoading(false)
    );

    // Light-blue atmospheric haze layer — soft glow over the dark base
    let shimmerMesh = null;
    let shimmerMaterial = null;
    loader.load(
      agent.image,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        const shimmerGeo = new THREE.SphereGeometry(480, 48, 24);
        shimmerGeo.scale(-1, 1, 1);
        shimmerMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          color: 0x7dd3fc, // light blue atmospheric tint
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
        });
        shimmerMesh = new THREE.Mesh(shimmerGeo, shimmerMaterial);
        scene.add(shimmerMesh);
      }
    );

    // Inner volumetric blue glow sphere — atmospheric depth
    const glowGeo = new THREE.SphereGeometry(450, 32, 16);
    glowGeo.scale(-1, 1, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x1e3a5f,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMaterial);
    scene.add(glowMesh);

    // ---------- PINK LOCK PORTAL (Sealed Wallet Analyzer only) ----------
    let pinkLock = null;
    let pinkLockHalo = null;
    if (hasPinkLock) {
      // Glowing pink orb with a lock symbol — floats in front of the user
      const lockCanvas = document.createElement("canvas");
      lockCanvas.width = 256;
      lockCanvas.height = 256;
      const lctx = lockCanvas.getContext("2d");
      // Radial pink glow
      const lgrad = lctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      lgrad.addColorStop(0, "rgba(255, 105, 180, 1)");
      lgrad.addColorStop(0.5, "rgba(236, 72, 153, 0.8)");
      lgrad.addColorStop(1, "rgba(190, 24, 93, 0)");
      lctx.fillStyle = lgrad;
      lctx.fillRect(0, 0, 256, 256);
      // Lock icon
      lctx.fillStyle = "#fff";
      lctx.strokeStyle = "#fff";
      lctx.lineWidth = 8;
      // Shackle
      lctx.beginPath();
      lctx.arc(128, 105, 28, Math.PI, 0, false);
      lctx.stroke();
      // Body
      lctx.fillRect(94, 105, 68, 60);
      // Keyhole
      lctx.fillStyle = "#be185d";
      lctx.beginPath();
      lctx.arc(128, 130, 7, 0, Math.PI * 2);
      lctx.fill();
      lctx.fillRect(125, 130, 6, 18);

      const lockTex = new THREE.CanvasTexture(lockCanvas);
      const lockMat = new THREE.SpriteMaterial({
        map: lockTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      pinkLock = new THREE.Sprite(lockMat);
      pinkLock.scale.set(14, 14, 1);
      pinkLock.position.set(0, 4, -35); // floats in front
      pinkLock.userData.isPinkLock = true;
      pinkLock.userData.basePos = pinkLock.position.clone();
      scene.add(pinkLock);

      // Halo behind the lock
      const haloMat = new THREE.SpriteMaterial({
        map: lockTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.5,
        depthWrite: false,
      });
      pinkLockHalo = new THREE.Sprite(haloMat);
      pinkLockHalo.scale.set(28, 28, 1);
      pinkLockHalo.position.copy(pinkLock.position);
      scene.add(pinkLockHalo);
    }

    // ---------- IMAGINE PORTAL BOX (every room) ----------
    // Glowing purple box with sparkle — click to reshape the room
    const imagineCanvas = document.createElement("canvas");
    imagineCanvas.width = 256;
    imagineCanvas.height = 256;
    const ictx = imagineCanvas.getContext("2d");
    const igrad = ictx.createRadialGradient(128, 128, 10, 128, 128, 128);
    igrad.addColorStop(0, "rgba(216, 180, 254, 1)");
    igrad.addColorStop(0.5, "rgba(168, 85, 247, 0.85)");
    igrad.addColorStop(1, "rgba(88, 28, 135, 0)");
    ictx.fillStyle = igrad;
    ictx.fillRect(0, 0, 256, 256);
    // Frame box
    ictx.strokeStyle = "#fff";
    ictx.lineWidth = 6;
    ictx.strokeRect(78, 78, 100, 100);
    // Sparkle dot
    ictx.fillStyle = "#fff";
    ictx.beginPath();
    ictx.arc(128, 128, 8, 0, Math.PI * 2);
    ictx.fill();
    // Sparkle rays
    ictx.lineWidth = 4;
    [[128,100],[128,156],[100,128],[156,128]].forEach(([x,y]) => {
      ictx.beginPath();
      ictx.moveTo(128, 128);
      ictx.lineTo(x, y);
      ictx.stroke();
    });

    const imagineTex = new THREE.CanvasTexture(imagineCanvas);
    const imagineMat = new THREE.SpriteMaterial({
      map: imagineTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const imagineBox = new THREE.Sprite(imagineMat);
    imagineBox.scale.set(11, 11, 1);
    imagineBox.position.set(-25, 3, -30);
    imagineBox.userData.basePos = imagineBox.position.clone();
    imagineBox.userData.isImagine = true;
    scene.add(imagineBox);

    const imagineHaloMat = new THREE.SpriteMaterial({
      map: imagineTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.4,
      depthWrite: false,
    });
    const imagineHalo = new THREE.Sprite(imagineHaloMat);
    imagineHalo.scale.set(22, 22, 1);
    imagineHalo.position.copy(imagineBox.position);
    scene.add(imagineHalo);

    // ---------- KASSHI LIVE VIDEO SPRITE (every room) ----------
    // Red glowing TV/play icon — click to open the live KaSshi feed widget
    const kasshiCanvas = document.createElement("canvas");
    kasshiCanvas.width = 256;
    kasshiCanvas.height = 256;
    const kctx = kasshiCanvas.getContext("2d");
    const kgrad = kctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    kgrad.addColorStop(0, "rgba(252, 165, 165, 1)");
    kgrad.addColorStop(0.5, "rgba(239, 68, 68, 0.9)");
    kgrad.addColorStop(1, "rgba(127, 29, 29, 0)");
    kctx.fillStyle = kgrad;
    kctx.fillRect(0, 0, 256, 256);
    // TV frame
    kctx.strokeStyle = "#fff";
    kctx.lineWidth = 6;
    kctx.strokeRect(70, 80, 116, 80);
    // Play triangle
    kctx.fillStyle = "#fff";
    kctx.beginPath();
    kctx.moveTo(115, 105);
    kctx.lineTo(115, 135);
    kctx.lineTo(145, 120);
    kctx.closePath();
    kctx.fill();
    // TV legs
    kctx.lineWidth = 4;
    kctx.beginPath();
    kctx.moveTo(100, 160); kctx.lineTo(90, 175);
    kctx.moveTo(156, 160); kctx.lineTo(166, 175);
    kctx.stroke();
    // LIVE label
    kctx.fillStyle = "#fff";
    kctx.font = "bold 20px sans-serif";
    kctx.fillText("LIVE", 102, 200);

    const kasshiTex = new THREE.CanvasTexture(kasshiCanvas);
    const kasshiMat = new THREE.SpriteMaterial({
      map: kasshiTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const kasshiSprite = new THREE.Sprite(kasshiMat);
    kasshiSprite.scale.set(11, 11, 1);
    kasshiSprite.position.set(25, 3, -30);
    kasshiSprite.userData.basePos = kasshiSprite.position.clone();
    kasshiSprite.userData.isKasshi = true;
    scene.add(kasshiSprite);

    const kasshiHaloMat = new THREE.SpriteMaterial({
      map: kasshiTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.4,
      depthWrite: false,
    });
    const kasshiHalo = new THREE.Sprite(kasshiHaloMat);
    kasshiHalo.scale.set(22, 22, 1);
    kasshiHalo.position.copy(kasshiSprite.position);
    scene.add(kasshiHalo);

    // Expose scene/sphere refs so portal generation can swap textures
    sceneRefs.current.scene = scene;
    sceneRefs.current.geometry = geometry;
    sceneRefs.current.getSkyMesh = () => skyMesh;
    sceneRefs.current.setSkyMesh = (m) => { skyMesh = m; };
    sceneRefs.current.getSkyMaterial = () => skyMaterial;
    sceneRefs.current.setSkyMaterial = (m) => { skyMaterial = m; };
    sceneRefs.current.originalImage = agent.image;
    sceneRefs.current.loader = loader;
    sceneRefs.current.imagineBoxPos = imagineBox.position;
    sceneRefs.current.kasshiSpritePos = kasshiSprite.position;
    sceneRefs.current.camera = camera;

    // Raycaster for clicking the lock and flyers
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragMoved = false;
    let dragStartX = 0, dragStartY = 0;
    const onPointerDownTrack = (e) => {
      const cx = e.clientX !== undefined ? e.clientX : e.changedTouches?.[0]?.clientX;
      const cy = e.clientY !== undefined ? e.clientY : e.changedTouches?.[0]?.clientY;
      dragStartX = cx; dragStartY = cy; dragMoved = false;
    };
    const onPointerMoveTrack = (e) => {
      const cx = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      const cy = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
      if (cx === undefined) return;
      if (Math.abs(cx - dragStartX) > 5 || Math.abs(cy - dragStartY) > 5) dragMoved = true;
    };

    const onClickScene = (e) => {
      if (dragMoved) return; // ignore drag-look gestures
      const rect = renderer.domElement.getBoundingClientRect();
      const cx = (e.clientX !== undefined ? e.clientX : e.changedTouches?.[0]?.clientX) - rect.left;
      const cy = (e.clientY !== undefined ? e.clientY : e.changedTouches?.[0]?.clientY) - rect.top;
      pointer.x = (cx / rect.width) * 2 - 1;
      pointer.y = -(cy / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // Check pink lock first
      if (pinkLock && !pinkRoomRef.current) {
        const lockHits = raycaster.intersectObject(pinkLock);
        if (lockHits.length > 0) {
          setPinkRoom(true);
          return;
        }
      }
      // Check imagine portal box
      const imagineHits = raycaster.intersectObject(imagineBox);
      if (imagineHits.length > 0) {
        setImagineOpen(true);
        return;
      }
      // Check KaSshi live sprite
      const kasshiHits = raycaster.intersectObject(kasshiSprite);
      if (kasshiHits.length > 0) {
        setKasshiOpen(true);
        return;
      }
      // Check flyers
      const flyerHits = raycaster.intersectObjects(flyerMeshes);
      if (flyerHits.length > 0) {
        const data = flyerHits[0].object.userData.flyerData;
        if (data) setActiveFlyer(data);
      }
    };
    renderer.domElement.addEventListener("click", onClickScene);
    renderer.domElement.addEventListener("mousedown", onPointerDownTrack);
    renderer.domElement.addEventListener("mousemove", onPointerMoveTrack);
    renderer.domElement.addEventListener("touchstart", onPointerDownTrack, { passive: true });
    renderer.domElement.addEventListener("touchmove", onPointerMoveTrack, { passive: true });

    // ---------- FLOATING FLYERS / BILLBOARDS ----------
    const flyerTextures = [];

    const makeFlyerTexture = (title, subtitle, accent = "#22d3ee") => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, 320);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
      grad.addColorStop(1, "rgba(10, 10, 30, 0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 320);

      // Border
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 496, 304);

      // Corner brackets
      ctx.lineWidth = 6;
      const corners = [[16, 16], [496, 16], [16, 304], [496, 304]];
      corners.forEach(([x, y], i) => {
        ctx.beginPath();
        const dx = i % 2 === 0 ? 20 : -20;
        const dy = i < 2 ? 20 : -20;
        ctx.moveTo(x + dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy);
        ctx.stroke();
      });

      // Accent badge
      ctx.fillStyle = accent;
      ctx.fillRect(32, 36, 80, 6);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText(title, 32, 120);

      // Subtitle
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "22px sans-serif";
      wrapText(ctx, subtitle, 32, 170, 450, 30);

      // Footer tag
      ctx.fillStyle = accent;
      ctx.font = "bold 14px monospace";
      ctx.fillText("TTT · AI AGENT", 32, 288);

      const texture = new THREE.CanvasTexture(canvas);
      flyerTextures.push(texture);
      return texture;
    };

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      let yy = y;
      for (let n = 0; n < words.length; n++) {
        const test = line + words[n] + " ";
        if (ctx.measureText(test).width > maxWidth && n > 0) {
          ctx.fillText(line, x, yy);
          line = words[n] + " ";
          yy += lineHeight;
          if (yy > y + lineHeight * 3) break;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, x, yy);
    }

    const flyers = [
      {
        tex: makeFlyerTexture(agent.name, agent.tagline || "AI Agent", "#22d3ee"),
        position: [30, 5, -80],
        rotation: [0, 0.3, 0],
        data: {
          label: "Identity",
          title: agent.name,
          body: agent.tagline || "An AI agent in the TTT ecosystem.",
          accent: "#22d3ee",
        },
      },
      {
        tex: makeFlyerTexture("ABOUT", agent.description || "Part of the TTT ecosystem", "#a855f7"),
        position: [-60, 0, -50],
        rotation: [0, -0.5, 0],
        data: {
          label: "About",
          title: `What ${agent.name} does`,
          body: agent.description || "Part of the TTT ecosystem.",
          accent: "#a855f7",
        },
      },
      {
        tex: makeFlyerTexture("STATUS", agent.badge || "ONLINE", "#10b981"),
        position: [-20, 10, 60],
        rotation: [0, Math.PI + 0.3, 0],
        data: {
          label: "Status",
          title: agent.badge || "Online",
          body: `${agent.name} is currently ${(agent.badge || "online").toLowerCase()} and ready to chat. Tap below to start a conversation.`,
          accent: "#10b981",
        },
      },
      {
        tex: makeFlyerTexture("CATEGORY", agent.category || "AI AGENT", "#ec4899"),
        position: [70, -5, 40],
        rotation: [0, -Math.PI / 2 - 0.3, 0],
        data: {
          label: "Category",
          title: agent.category || "AI Agent",
          body: `${agent.name} belongs to the ${agent.category || "AI Agent"} category — ${agent.tagline}.`,
          accent: "#ec4899",
        },
      },
    ];

    const flyerMeshes = [];
    flyers.forEach((f) => {
      const flyerGeo = new THREE.PlaneGeometry(20, 12.5);
      const flyerMat = new THREE.MeshBasicMaterial({
        map: f.tex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const flyerMesh = new THREE.Mesh(flyerGeo, flyerMat);
      flyerMesh.position.set(...f.position);
      flyerMesh.rotation.set(...f.rotation);
      flyerMesh.userData.basePos = flyerMesh.position.clone();
      flyerMesh.userData.floatOffset = Math.random() * Math.PI * 2;
      flyerMesh.userData.flyerData = f.data;
      scene.add(flyerMesh);
      flyerMeshes.push(flyerMesh);
    });

    // Ambient particles
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 150;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x93c5fd, // ice blue
      size: 0.6,
      transparent: true,
      opacity: 0.7,
      fog: true,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Drag to look
    let isDragging = false;
    let lon = 0, lat = 0;
    let downLon = 0, downLat = 0, downX = 0, downY = 0;

    // Player position (walking)
    const playerPos = new THREE.Vector3(0, 0, 0);
    const MOVE_SPEED = 25; // units per second
    const WALK_BOUND = 80; // stay well inside 500-radius sphere

    const getPt = (e) => {
      if (e.touches && e.touches.length > 0) {
        // Ignore touches on the left half (joystick area) for look control
        for (const t of e.touches) {
          if (t.clientX > window.innerWidth * 0.35) {
            return { x: t.clientX, y: t.clientY };
          }
        }
        return null;
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onDown = (e) => {
      const p = getPt(e);
      if (!p) return;
      isDragging = true;
      setAutoRotate(false);
      downX = p.x; downY = p.y;
      downLon = lon; downLat = lat;
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const p = getPt(e);
      if (!p) return;
      lon = (downX - p.x) * 0.15 + downLon;
      lat = (p.y - downY) * 0.15 + downLat;
    };
    const onUp = () => { isDragging = false; };

    const canvas = renderer.domElement;
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onUp);

    // Keyboard walking
    const keys = { w: false, a: false, s: false, d: false };
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.w = true;
      if (k === "s" || k === "arrowdown") keys.s = true;
      if (k === "a" || k === "arrowleft") keys.a = true;
      if (k === "d" || k === "arrowright") keys.d = true;
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.w = false;
      if (k === "s" || k === "arrowdown") keys.s = false;
      if (k === "a" || k === "arrowleft") keys.a = false;
      if (k === "d" || k === "arrowright") keys.d = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.elapsedTime;

      if (autoRotateRef.current && !isDragging) lon += 3 * dt;

      lat = Math.max(-85, Math.min(85, lat));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      // Look direction vector
      const lookX = Math.sin(phi) * Math.cos(theta);
      const lookZ = Math.sin(phi) * Math.sin(theta);

      // Walking input
      let forward = 0, strafe = 0;
      if (keys.w) forward += 1;
      if (keys.s) forward -= 1;
      if (keys.d) strafe += 1;
      if (keys.a) strafe -= 1;
      if (joystickRef.current.active) {
        forward -= joystickRef.current.y;
        strafe += joystickRef.current.x;
      }
      const mag = Math.sqrt(forward * forward + strafe * strafe);
      if (mag > 1) { forward /= mag; strafe /= mag; }

      // Move along look direction (horizontal plane only)
      const flatLen = Math.sqrt(lookX * lookX + lookZ * lookZ) || 1;
      const fX = lookX / flatLen;
      const fZ = lookZ / flatLen;
      // Right vector (perpendicular on XZ)
      const rX = -fZ;
      const rZ = fX;

      const dx = (fX * forward + rX * strafe) * MOVE_SPEED * dt;
      const dz = (fZ * forward + rZ * strafe) * MOVE_SPEED * dt;

      playerPos.x = Math.max(-WALK_BOUND, Math.min(WALK_BOUND, playerPos.x + dx));
      playerPos.z = Math.max(-WALK_BOUND, Math.min(WALK_BOUND, playerPos.z + dz));

      camera.position.copy(playerPos);
      camera.lookAt(
        playerPos.x + 500 * lookX,
        playerPos.y + 500 * Math.cos(phi),
        playerPos.z + 500 * lookZ
      );

      // Float & gently turn flyers toward camera
      flyerMeshes.forEach((m, i) => {
        m.position.y = m.userData.basePos.y + Math.sin(t * 0.8 + m.userData.floatOffset) * 2;
        m.rotation.z = Math.sin(t * 0.5 + i) * 0.04;
      });

      // HyperFrames-style motion: subtle texture UV pan + brightness pulse
      if (skyMaterial && skyMaterial.map) {
        skyMaterial.map.offset.x = Math.sin(t * 0.05) * 0.01;
        skyMaterial.map.offset.y = Math.cos(t * 0.03) * 0.005;
      }
      if (skyMesh) {
        skyMesh.rotation.y = Math.sin(t * 0.08) * 0.02;
      }
      // Light-blue haze: slow counter-rotation + pulsing for atmospheric breathing
      // When pink room active, shift haze to pink
      if (shimmerMesh && shimmerMaterial) {
        shimmerMesh.rotation.y = -t * 0.015;
        shimmerMaterial.opacity = 0.12 + Math.sin(t * 0.5) * 0.08;
        const targetColor = pinkRoomRef.current ? 0xff6bcf : 0x7dd3fc;
        shimmerMaterial.color.setHex(targetColor);
      }
      // Inner glow breathes slowly — pink when in pink room
      glowMaterial.opacity = pinkRoomRef.current
        ? 0.28 + Math.sin(t * 0.6) * 0.08
        : 0.12 + Math.sin(t * 0.4) * 0.05;
      glowMaterial.color.setHex(pinkRoomRef.current ? 0xec4899 : 0x1e3a5f);

      // Pink lock floats and pulses
      if (pinkLock) {
        pinkLock.position.y = pinkLock.userData.basePos.y + Math.sin(t * 1.5) * 0.8;
        const pulse = 1 + Math.sin(t * 2) * 0.08;
        pinkLock.scale.set(14 * pulse, 14 * pulse, 1);
        if (pinkLockHalo) {
          pinkLockHalo.position.copy(pinkLock.position);
          pinkLockHalo.material.opacity = 0.4 + Math.sin(t * 2) * 0.2;
          const haloPulse = 1 + Math.sin(t * 1.2) * 0.15;
          pinkLockHalo.scale.set(28 * haloPulse, 28 * haloPulse, 1);
        }
        // Hide lock once pink room entered
        pinkLock.visible = !pinkRoomRef.current;
        if (pinkLockHalo) pinkLockHalo.visible = !pinkRoomRef.current;
      }

      particles.rotation.y += 0.0005;
      particles.position.y = Math.sin(t * 0.3) * 2;

      // Imagine box float + pulse
      imagineBox.position.y = imagineBox.userData.basePos.y + Math.sin(t * 1.2 + 1) * 0.6;
      const ipulse = 1 + Math.sin(t * 1.8) * 0.07;
      imagineBox.scale.set(11 * ipulse, 11 * ipulse, 1);
      imagineHalo.position.copy(imagineBox.position);
      imagineHalo.material.opacity = 0.3 + Math.sin(t * 1.5) * 0.15;
      const ihaloPulse = 1 + Math.sin(t * 1) * 0.12;
      imagineHalo.scale.set(22 * ihaloPulse, 22 * ihaloPulse, 1);

      // KaSshi sprite float + pulse
      kasshiSprite.position.y = kasshiSprite.userData.basePos.y + Math.sin(t * 1.4 + 2) * 0.7;
      const kpulse = 1 + Math.sin(t * 2.2) * 0.08;
      kasshiSprite.scale.set(11 * kpulse, 11 * kpulse, 1);
      kasshiHalo.position.copy(kasshiSprite.position);
      kasshiHalo.material.opacity = 0.3 + Math.sin(t * 1.8) * 0.18;
      const khaloPulse = 1 + Math.sin(t * 1.2) * 0.14;
      kasshiHalo.scale.set(22 * khaloPulse, 22 * khaloPulse, 1);

      // ---------- SPATIAL AUDIO: proximity volume ----------
      if (audioRefs.current.started && audioRefs.current.ctx) {
        const ctx = audioRefs.current.ctx;
        const camPos = camera.position;
        const dxI = camPos.x - imagineBox.position.x;
        const dyI = camPos.y - imagineBox.position.y;
        const dzI = camPos.z - imagineBox.position.z;
        const distImagine = Math.sqrt(dxI * dxI + dyI * dyI + dzI * dzI);
        const dxK = camPos.x - kasshiSprite.position.x;
        const dyK = camPos.y - kasshiSprite.position.y;
        const dzK = camPos.z - kasshiSprite.position.z;
        const distKasshi = Math.sqrt(dxK * dxK + dyK * dyK + dzK * dzK);
        if (audioRefs.current.imagine) {
          audioRefs.current.imagine.setVolume(distanceToVolume(distImagine), ctx.currentTime);
        }
        if (audioRefs.current.kasshi) {
          audioRefs.current.kasshi.setVolume(distanceToVolume(distKasshi), ctx.currentTime);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      renderer.domElement.removeEventListener("click", onClickScene);
      renderer.domElement.removeEventListener("mousedown", onPointerDownTrack);
      renderer.domElement.removeEventListener("mousemove", onPointerMoveTrack);
      renderer.domElement.removeEventListener("touchstart", onPointerDownTrack);
      renderer.domElement.removeEventListener("touchmove", onPointerMoveTrack);
      if (pinkLock) {
        pinkLock.material.map?.dispose();
        pinkLock.material.dispose();
      }
      if (pinkLockHalo) {
        pinkLockHalo.material.dispose();
      }
      imagineTex.dispose();
      imagineMat.dispose();
      imagineHaloMat.dispose();
      kasshiTex.dispose();
      kasshiMat.dispose();
      kasshiHaloMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      geometry.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      flyerTextures.forEach(t => t.dispose());
      flyerMeshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
      if (skyMaterial) { skyMaterial.map?.dispose(); skyMaterial.dispose(); }
      if (shimmerMesh) { shimmerMesh.geometry.dispose(); }
      if (shimmerMaterial) { shimmerMaterial.map?.dispose(); shimmerMaterial.dispose(); }
      glowGeo.dispose();
      glowMaterial.dispose();
      renderer.dispose();
    };
  }, [agent]);

  // Joystick handlers
  const onJoyStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    joystickRef.current.active = true;
    joystickRef.current.startX = t.clientX;
    joystickRef.current.startY = t.clientY;
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    setJoyVisual({ x: 0, y: 0, active: true });
  };
  const onJoyMove = (e) => {
    if (!joystickRef.current.active) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - joystickRef.current.startX;
    const dy = t.clientY - joystickRef.current.startY;
    const max = 45;
    const cx = Math.max(-max, Math.min(max, dx)) / max;
    const cy = Math.max(-max, Math.min(max, dy)) / max;
    joystickRef.current.x = cx;
    joystickRef.current.y = cy;
    setJoyVisual({ x: cx * max, y: cy * max, active: true });
  };
  const onJoyEnd = () => {
    joystickRef.current.active = false;
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    setJoyVisual({ x: 0, y: 0, active: false });
  };

  // Initialize spatial audio on first user gesture (browser autoplay policy)
  const enableSpatialAudio = async () => {
    if (audioRefs.current.started) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
      const imagine = createImagineEmitter(ctx, master);
      const kasshi = createKasshiEmitter(ctx, master);
      audioRefs.current = { ctx, master, imagine, kasshi, started: true };
      setAudioEnabled(true);
    } catch (e) {
      console.warn("[SpatialAudio] init failed:", e);
    }
  };

  const disableSpatialAudio = () => {
    const a = audioRefs.current;
    if (!a.started) return;
    try { a.imagine?.stop(); a.kasshi?.stop(); a.master?.disconnect(); a.ctx?.close(); } catch {}
    audioRefs.current = { ctx: null, master: null, imagine: null, kasshi: null, started: false };
    setAudioEnabled(false);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      const a = audioRefs.current;
      if (a.started) {
        try { a.imagine?.stop(); a.kasshi?.stop(); a.master?.disconnect(); a.ctx?.close(); } catch {}
      }
    };
  }, []);

  // Frame-by-frame world swap: generate image, then reveal as 24 vertical strips
  const handleGenerateWorld = async (userPrompt) => {
    if (imagineLoading || portalRemaining <= 0) return;
    console.log("[ImaginePortal] generating with prompt:", userPrompt);
    setImagineLoading(true);
    try {
      const fullPrompt = `Equirectangular 360-degree panorama, seamless wrap, immersive: ${userPrompt}. Cinematic lighting, ultra wide horizon, no people facing camera.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
      console.log("[ImaginePortal] GenerateImage response:", res);
      const imgUrl = res?.url;
      if (!imgUrl) throw new Error("No image URL returned");

      await swapSkyFrameByFrame(imgUrl);
      setHasCustomSky(true);
      setPortalRemaining((n) => Math.max(0, n - 1));
      setImagineOpen(false);
    } catch (e) {
      console.error("[ImaginePortal] generation failed:", e);
      alert("Imagine Portal failed: " + (e?.message || "unknown error"));
    }
    setImagineLoading(false);
  };

  const handleRestoreOriginal = async () => {
    if (imagineLoading) return;
    setImagineLoading(true);
    try {
      await swapSkyFrameByFrame(sceneRefs.current.originalImage);
      setHasCustomSky(false);
      setImagineOpen(false);
    } catch (e) {}
    setImagineLoading(false);
  };

  // Reveal new sky as 24 vertical strips fading in around the sphere
  const swapSkyFrameByFrame = (imageUrl) => {
    return new Promise((resolve) => {
      const refs = sceneRefs.current;
      if (!refs.scene || !refs.loader) { resolve(); return; }
      refs.loader.setCrossOrigin("anonymous");
      refs.loader.load(imageUrl, (texture) => {
        console.log("[ImaginePortal] texture loaded for", imageUrl);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const STRIPS = 24;
        const stripMeshes = [];
        for (let i = 0; i < STRIPS; i++) {
          const phiStart = (i / STRIPS) * Math.PI * 2;
          const phiLength = (Math.PI * 2) / STRIPS;
          const stripGeo = new THREE.SphereGeometry(499, 8, 32, phiStart, phiLength);
          stripGeo.scale(-1, 1, 1);
          const stripMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
          });
          const stripMesh = new THREE.Mesh(stripGeo, stripMat);
          refs.scene.add(stripMesh);
          stripMeshes.push({ mesh: stripMesh, mat: stripMat, geo: stripGeo });
        }

        // Fade strips in sequentially
        const REVEAL_MS = 1800;
        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          const progress = Math.min(1, elapsed / REVEAL_MS);
          stripMeshes.forEach((s, i) => {
            const stripDelay = i / STRIPS;
            const stripProgress = Math.max(0, Math.min(1, (progress - stripDelay * 0.6) / 0.4));
            s.mat.opacity = stripProgress;
          });
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            // Swap the base sphere's texture to the new one, then remove strips
            const skyMaterial = refs.getSkyMaterial();
            const skyMesh = refs.getSkyMesh();
            if (skyMaterial) {
              const oldMap = skyMaterial.map;
              skyMaterial.map = texture;
              skyMaterial.needsUpdate = true;
              if (oldMap && oldMap !== texture) oldMap.dispose();
            } else if (skyMesh && skyMesh.material) {
              const oldMap = skyMesh.material.map;
              skyMesh.material.map = texture;
              skyMesh.material.needsUpdate = true;
              if (oldMap && oldMap !== texture) oldMap.dispose();
            }
            // Cleanup strips (do NOT dispose the shared texture)
            stripMeshes.forEach((s) => {
              refs.scene.remove(s.mesh);
              s.geo.dispose();
              s.mat.map = null;
              s.mat.dispose();
            });
            resolve();
          }
        };
        requestAnimationFrame(tick);
      }, undefined, (err) => {
        console.error("[ImaginePortal] texture load failed:", err);
        resolve();
      });
    });
  };

  if (!agent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black"
      >
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10"
            >
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-cyan-300 text-sm font-bold tracking-widest uppercase">Entering {agent.name}'s Room</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
        >
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${pinkRoom ? "bg-pink-400" : "bg-cyan-400"}`} />
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${pinkRoom ? "text-pink-300" : "text-cyan-300"}`}>
                {pinkRoom ? "Pink Room · 360°" : "Live · 360°"}
              </span>
            </div>
            <h2 className="text-white text-2xl sm:text-3xl font-[900] tracking-tight drop-shadow-2xl">{agent.name}</h2>
            <p className="text-white/70 text-xs sm:text-sm drop-shadow-lg">
              {pinkRoom ? "You unlocked the pink chamber" : agent.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => audioEnabled ? disableSpatialAudio() : enableSpatialAudio()}
              className={`w-10 h-10 rounded-full backdrop-blur ring-1 ring-white/20 flex items-center justify-center transition-colors ${
                audioEnabled ? "bg-purple-500/30 text-purple-200" : "bg-black/60 text-white/80 hover:bg-black/80"
              }`}
              title={audioEnabled ? "Mute spatial audio" : "Enable spatial audio"}
            >
              {audioEnabled ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              )}
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`w-10 h-10 rounded-full backdrop-blur ring-1 ring-white/20 flex items-center justify-center transition-colors ${
                autoRotate ? "bg-cyan-500/30 text-cyan-200" : "bg-black/60 text-white/80 hover:bg-black/80"
              }`}
              title="Auto-rotate"
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "4s" }} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur ring-1 ring-white/20 flex items-center justify-center text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Bottom info card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none"
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-black/60 backdrop-blur-xl ring-1 ring-white/10">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{agent.description}</p>
                <div className="mt-2 text-white/40 text-[10px] tracking-wider hidden md:block">
                  <kbd className="text-cyan-300">WASD</kbd> Walk · <kbd className="text-cyan-300">Drag</kbd> Look
                </div>
                <div className="mt-2 text-white/40 text-[10px] tracking-wider md:hidden">
                  Left joystick to walk · Drag right side to look
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pink lock hint (Sealed Wallet Analyzer only, before unlock) */}
        {hasPinkLock && !pinkRoom && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="px-3 py-1.5 rounded-full bg-pink-500/20 backdrop-blur ring-1 ring-pink-400/40 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-pink-200 text-[10px] font-bold tracking-wider uppercase">
                Tap the pink lock to enter the secret room
              </span>
            </div>
          </motion.div>
        )}

        {/* Pink room exit hint */}
        {pinkRoom && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setPinkRoom(false)}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-pink-500/30 backdrop-blur ring-1 ring-pink-400/60 hover:bg-pink-500/40"
          >
            <span className="text-pink-100 text-[10px] font-bold tracking-wider uppercase">
              ← Exit Pink Room
            </span>
          </motion.button>
        )}

        {/* Talk to Agent floating button */}
        {!chatOpen && !loading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            onClick={() => setChatOpen(true)}
            className={`absolute right-4 sm:right-6 bottom-44 sm:bottom-32 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r ${agent.color} text-white font-bold text-sm shadow-2xl hover:scale-105 transition-transform`}
            style={{ boxShadow: "0 0 40px rgba(34,211,238,0.4)" }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Talk to {agent.name}</span>
            <span className="sm:hidden">Chat</span>
          </motion.button>
        )}

        {/* Flyer detail popup */}
        <FlyerDetailCard
          flyer={activeFlyer}
          agentName={agent.name}
          onClose={() => setActiveFlyer(null)}
          onChat={() => { setActiveFlyer(null); setChatOpen(true); }}
        />

        {/* Chat panel */}
        <AgentChatPanel agent={agent} open={chatOpen} onClose={() => setChatOpen(false)} />

        {/* KaSshi floating live widget */}
        <KaSshiFloatingWidget open={kasshiOpen} onClose={() => setKasshiOpen(false)} />

        {/* Imagine Portal prompt */}
        <ImaginePortalPrompt
          open={imagineOpen}
          onClose={() => setImagineOpen(false)}
          onGenerate={handleGenerateWorld}
          onRestore={handleRestoreOriginal}
          loading={imagineLoading}
          hasCustom={hasCustomSky}
          remaining={portalRemaining}
        />

        {/* Frame-by-frame loading overlay */}
        {imagineLoading && !imagineOpen && (
          <div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center">
            <div className="px-4 py-2 rounded-full bg-purple-500/20 backdrop-blur ring-1 ring-purple-400/40 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-200 text-[10px] font-bold tracking-wider uppercase">
                Reshaping reality, frame by frame...
              </span>
            </div>
          </div>
        )}

        {/* Imagine portal hint */}
        {!imagineOpen && !imagineLoading && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="absolute top-36 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="px-3 py-1.5 rounded-full bg-purple-500/20 backdrop-blur ring-1 ring-purple-400/40 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-200 text-[10px] font-bold tracking-wider uppercase">
                Tap the purple sparkle box to reshape this room
              </span>
            </div>
          </motion.div>
        )}

        {/* Mobile Joystick */}
        <div
          className="md:hidden absolute bottom-32 left-6 z-30 w-28 h-28 touch-none"
          onTouchStart={onJoyStart}
          onTouchMove={onJoyMove}
          onTouchEnd={onJoyEnd}
        >
          <div className="w-full h-full rounded-full bg-black/50 backdrop-blur-xl ring-1 ring-cyan-500/40 relative">
            <div
              className="absolute top-1/2 left-1/2 w-11 h-11 rounded-full bg-cyan-500/70 ring-2 ring-cyan-300 transition-transform"
              style={{ transform: `translate(calc(-50% + ${joyVisual.x}px), calc(-50% + ${joyVisual.y}px))` }}
            />
          </div>
          <div className="text-center text-[9px] text-cyan-300/70 font-mono mt-1 tracking-widest">WALK</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}