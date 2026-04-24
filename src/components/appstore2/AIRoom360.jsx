import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Gamepad2 } from "lucide-react";

/**
 * GTA-style first-person simulation inside the agent's world.
 * - WASD / Arrow keys = move
 * - Mouse drag / touch = look
 * - Space = jump
 * - Shift = sprint
 * - Mobile: on-screen joystick + drag-to-look
 */
export default function AIRoom360({ agent, onClose }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [hud, setHud] = useState({ speed: 0, x: 0, z: 0 });

  // Mobile joystick state
  const joystickRef = useRef({ active: false, x: 0, y: 0, startX: 0, startY: 0 });
  const [joystickVisible, setJoystickVisible] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!agent || !mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // ---------- SCENE ----------
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000011, 50, 300);

    // Player camera (first person, eye height = 1.7m)
    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1000);
    camera.position.set(0, 1.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ---------- SKYBOX (agent's world) ----------
    const skyGeo = new THREE.SphereGeometry(500, 64, 32);
    skyGeo.scale(-1, 1, 1);
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    loader.load(
      agent.image,
      (texture) => {
        const skyMat = new THREE.MeshBasicMaterial({ map: texture });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        scene.add(sky);
        setLoading(false);
      },
      undefined,
      () => setLoading(false)
    );

    // ---------- LIGHTING ----------
    scene.add(new THREE.AmbientLight(0x6699ff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    // ---------- GROUND ----------
    const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      roughness: 0.8,
      metalness: 0.3,
      wireframe: false,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Neon grid on ground
    const gridHelper = new THREE.GridHelper(200, 40, 0x22d3ee, 0x22d3ee);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // ---------- BUILDINGS (random city blocks as collision objects) ----------
    const buildings = [];
    const colors = [0x22d3ee, 0xa855f7, 0xec4899, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 25; i++) {
      const w = 4 + Math.random() * 6;
      const h = 8 + Math.random() * 20;
      const d = 4 + Math.random() * 6;
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x111122,
        emissive: colors[Math.floor(Math.random() * colors.length)],
        emissiveIntensity: 0.15,
        roughness: 0.3,
        metalness: 0.7,
      });
      const building = new THREE.Mesh(geo, mat);

      // Scatter around but not too close to spawn
      let x, z;
      do {
        x = (Math.random() - 0.5) * 160;
        z = (Math.random() - 0.5) * 160;
      } while (Math.sqrt(x * x + z * z) < 15);

      building.position.set(x, h / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);

      buildings.push({
        mesh: building,
        minX: x - w / 2 - 0.5,
        maxX: x + w / 2 + 0.5,
        minZ: z - d / 2 - 0.5,
        maxZ: z + d / 2 + 0.5,
      });
    }

    // Central floating agent orb
    const orbGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 1,
      wireframe: true,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0, 3, -10);
    scene.add(orb);

    const orbLight = new THREE.PointLight(0x22d3ee, 2, 30);
    orbLight.position.copy(orb.position);
    scene.add(orbLight);

    // ---------- PLAYER PHYSICS ----------
    const player = {
      position: new THREE.Vector3(0, 1.7, 5),
      velocity: new THREE.Vector3(0, 0, 0),
      onGround: true,
      yaw: 0,
      pitch: 0,
    };

    const MOVE_SPEED = 8;
    const SPRINT_MULT = 1.8;
    const JUMP_VEL = 7;
    const GRAVITY = 20;
    const PLAYER_RADIUS = 0.5;
    const WORLD_BOUND = 95;

    // ---------- INPUT ----------
    const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };

    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.w = true;
      if (k === "s" || k === "arrowdown") keys.s = true;
      if (k === "a" || k === "arrowleft") keys.a = true;
      if (k === "d" || k === "arrowright") keys.d = true;
      if (k === "shift") keys.shift = true;
      if (k === " ") { keys.space = true; e.preventDefault(); }
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.w = false;
      if (k === "s" || k === "arrowdown") keys.s = false;
      if (k === "a" || k === "arrowleft") keys.a = false;
      if (k === "d" || k === "arrowright") keys.d = false;
      if (k === "shift") keys.shift = false;
      if (k === " ") keys.space = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Mouse look (drag)
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const getPoint = (e) => {
      if (e.touches && e.touches.length > 0) {
        // Only use touches that aren't the joystick
        for (const t of e.touches) {
          const isRightHalf = t.clientX > window.innerWidth / 2;
          if (isRightHalf) return { x: t.clientX, y: t.clientY };
        }
        return null;
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onPointerDown = (e) => {
      const p = getPoint(e);
      if (!p) return;
      isDragging = true;
      lastX = p.x;
      lastY = p.y;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const p = getPoint(e);
      if (!p) return;
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      player.yaw -= dx * 0.003;
      player.pitch -= dy * 0.003;
      player.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, player.pitch));
      lastX = p.x;
      lastY = p.y;
    };
    const onPointerUp = () => { isDragging = false; };

    const canvas = renderer.domElement;
    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("mousemove", onPointerMove);
    canvas.addEventListener("mouseup", onPointerUp);
    canvas.addEventListener("mouseleave", onPointerUp);
    canvas.addEventListener("touchstart", onPointerDown, { passive: true });
    canvas.addEventListener("touchmove", onPointerMove, { passive: true });
    canvas.addEventListener("touchend", onPointerUp);

    // ---------- COLLISION ----------
    const tryMove = (nx, nz) => {
      // Bounds
      if (Math.abs(nx) > WORLD_BOUND || Math.abs(nz) > WORLD_BOUND) return false;
      // Buildings
      for (const b of buildings) {
        if (nx > b.minX && nx < b.maxX && nz > b.minZ && nz < b.maxZ) return false;
      }
      return true;
    };

    // ---------- RESIZE ----------
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ---------- GAME LOOP ----------
    const clock = new THREE.Clock();
    let frameId;
    let hudTimer = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);

      // Orb spin
      orb.rotation.y += dt * 0.5;
      orb.rotation.x += dt * 0.3;
      orb.position.y = 3 + Math.sin(clock.elapsedTime * 2) * 0.3;
      orbLight.position.copy(orb.position);

      // Movement input direction
      let forward = 0, strafe = 0;
      if (keys.w) forward += 1;
      if (keys.s) forward -= 1;
      if (keys.d) strafe += 1;
      if (keys.a) strafe -= 1;

      // Joystick input
      if (joystickRef.current.active) {
        forward -= joystickRef.current.y;
        strafe += joystickRef.current.x;
      }

      // Normalize
      const mag = Math.sqrt(forward * forward + strafe * strafe);
      if (mag > 1) { forward /= mag; strafe /= mag; }

      const speed = MOVE_SPEED * (keys.shift ? SPRINT_MULT : 1);

      // Convert to world movement based on yaw
      const sinY = Math.sin(player.yaw);
      const cosY = Math.cos(player.yaw);
      const moveX = (strafe * cosY - forward * sinY) * speed * dt;
      const moveZ = (-strafe * sinY - forward * cosY) * speed * dt;

      // Apply with collision
      const newX = player.position.x + moveX;
      const newZ = player.position.z + moveZ;
      if (tryMove(newX, player.position.z)) player.position.x = newX;
      if (tryMove(player.position.x, newZ)) player.position.z = newZ;

      // Jump + gravity
      if (keys.space && player.onGround) {
        player.velocity.y = JUMP_VEL;
        player.onGround = false;
      }
      player.velocity.y -= GRAVITY * dt;
      player.position.y += player.velocity.y * dt;
      if (player.position.y <= 1.7) {
        player.position.y = 1.7;
        player.velocity.y = 0;
        player.onGround = true;
      }

      // Apply to camera
      camera.position.copy(player.position);
      camera.rotation.order = "YXZ";
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch;

      // HUD update (throttled)
      hudTimer += dt;
      if (hudTimer > 0.15) {
        hudTimer = 0;
        const currentSpeed = Math.sqrt(moveX * moveX + moveZ * moveZ) / dt;
        setHud({
          speed: Math.round(currentSpeed * 3.6), // km/h-ish
          x: Math.round(player.position.x),
          z: Math.round(player.position.z),
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // ---------- CLEANUP ----------
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onPointerDown);
      canvas.removeEventListener("mousemove", onPointerMove);
      canvas.removeEventListener("mouseup", onPointerUp);
      canvas.removeEventListener("mouseleave", onPointerUp);
      canvas.removeEventListener("touchstart", onPointerDown);
      canvas.removeEventListener("touchmove", onPointerMove);
      canvas.removeEventListener("touchend", onPointerUp);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [agent]);

  // ---------- JOYSTICK HANDLERS ----------
  const onJoyStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    joystickRef.current.active = true;
    joystickRef.current.startX = t.clientX;
    joystickRef.current.startY = t.clientY;
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    setJoystickVisible({ x: 0, y: 0, active: true });
  };
  const onJoyMove = (e) => {
    if (!joystickRef.current.active) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - joystickRef.current.startX;
    const dy = t.clientY - joystickRef.current.startY;
    const max = 50;
    const clampedX = Math.max(-max, Math.min(max, dx)) / max;
    const clampedY = Math.max(-max, Math.min(max, dy)) / max;
    joystickRef.current.x = clampedX;
    joystickRef.current.y = clampedY;
    setJoystickVisible({ x: clampedX * max, y: clampedY * max, active: true });
  };
  const onJoyEnd = () => {
    joystickRef.current.active = false;
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    setJoystickVisible({ x: 0, y: 0, active: false });
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
        <div ref={mountRef} className="absolute inset-0" />

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10"
            >
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-cyan-300 text-sm font-bold tracking-widest uppercase">Loading {agent.name}'s City</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top HUD */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-start justify-between pointer-events-none"
        >
          <div className="pointer-events-auto bg-black/60 backdrop-blur-xl ring-1 ring-cyan-500/30 rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2 mb-0.5">
              <Gamepad2 className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-300 text-[10px] font-bold tracking-[0.2em] uppercase">Sim Active</span>
            </div>
            <h2 className="text-white text-lg sm:text-xl font-[900] tracking-tight">{agent.name}</h2>
            <p className="text-white/50 text-[10px]">{agent.tagline}</p>
          </div>

          <button
            onClick={onClose}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur ring-1 ring-white/20 flex items-center justify-center text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Speed / Position HUD (bottom right) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-xl ring-1 ring-cyan-500/30 rounded-xl px-3 py-2 font-mono text-[10px] text-cyan-300"
        >
          <div>SPD <span className="text-white font-bold">{hud.speed}</span> km/h</div>
          <div>POS <span className="text-white">{hud.x}, {hud.z}</span></div>
        </motion.div>

        {/* Controls hint (desktop) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-xl ring-1 ring-white/10 rounded-full px-4 py-2"
        >
          <div className="flex items-center gap-3 text-[10px] text-white/70 font-mono">
            <span><kbd className="text-cyan-300">WASD</kbd> Move</span>
            <span className="text-white/20">·</span>
            <span><kbd className="text-cyan-300">Mouse</kbd> Look</span>
            <span className="text-white/20">·</span>
            <span><kbd className="text-cyan-300">Space</kbd> Jump</span>
            <span className="text-white/20">·</span>
            <span><kbd className="text-cyan-300">Shift</kbd> Sprint</span>
          </div>
        </motion.div>

        {/* Mobile Joystick (left side) */}
        <div
          className="md:hidden absolute bottom-8 left-8 z-20 w-32 h-32 touch-none"
          onTouchStart={onJoyStart}
          onTouchMove={onJoyMove}
          onTouchEnd={onJoyEnd}
        >
          <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-xl ring-1 ring-cyan-500/30 relative">
            <div
              className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-cyan-500/60 ring-2 ring-cyan-300 transition-transform"
              style={{
                transform: `translate(calc(-50% + ${joystickVisible.x}px), calc(-50% + ${joystickVisible.y}px))`,
              }}
            />
          </div>
          <div className="text-center text-[9px] text-cyan-300/70 font-mono mt-1 tracking-widest">MOVE</div>
        </div>

        {/* Mobile Jump button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            const evt = new KeyboardEvent("keydown", { key: " " });
            window.dispatchEvent(evt);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            const evt = new KeyboardEvent("keyup", { key: " " });
            window.dispatchEvent(evt);
          }}
          className="md:hidden absolute bottom-12 right-8 z-20 w-20 h-20 rounded-full bg-cyan-500/60 ring-2 ring-cyan-300 backdrop-blur flex items-center justify-center text-black font-black text-sm active:scale-95 transition-transform"
        >
          JUMP
        </button>
      </motion.div>
    </AnimatePresence>
  );
}