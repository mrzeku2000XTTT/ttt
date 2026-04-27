import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { X, MessageCircle, Send, Loader2, Compass, Maximize2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Walkable / look-around 360 world built from a single AI image.
 * - Wraps the image on the inside of a sphere (equirectangular-style)
 * - Mouse / touch drag to look around, scroll to zoom (FOV)
 * - W/A/S/D + arrow keys nudge the camera position ("walk")
 * - Side chat that talks to the LLM with the image as visual context
 */
export default function World360Viewer({ imageUrl, onClose }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    yaw: 0, pitch: 0, fov: 75,
    pos: new THREE.Vector3(0, 0, 0),
    keys: {}, dragging: false, lastX: 0, lastY: 0,
  });

  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "You're inside the scene. Drag to look around, WASD to walk. Ask me anything about what you see." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // Three.js setup
  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Inside-out sphere
    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const texture = loader.load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Resize handling
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Pointer drag → look
    const onDown = (e) => {
      const t = e.touches?.[0] || e;
      stateRef.current.dragging = true;
      stateRef.current.lastX = t.clientX;
      stateRef.current.lastY = t.clientY;
    };
    const onMove = (e) => {
      if (!stateRef.current.dragging) return;
      const t = e.touches?.[0] || e;
      const dx = t.clientX - stateRef.current.lastX;
      const dy = t.clientY - stateRef.current.lastY;
      stateRef.current.lastX = t.clientX;
      stateRef.current.lastY = t.clientY;
      stateRef.current.yaw -= dx * 0.005;
      stateRef.current.pitch -= dy * 0.005;
      stateRef.current.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, stateRef.current.pitch));
    };
    const onUp = () => { stateRef.current.dragging = false; };
    const onWheel = (e) => {
      e.preventDefault();
      stateRef.current.fov = Math.max(30, Math.min(100, stateRef.current.fov + e.deltaY * 0.05));
      camera.fov = stateRef.current.fov;
      camera.updateProjectionMatrix();
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onDown);
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseup", onUp);
    dom.addEventListener("mouseleave", onUp);
    dom.addEventListener("touchstart", onDown, { passive: true });
    dom.addEventListener("touchmove", onMove, { passive: true });
    dom.addEventListener("touchend", onUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // Keyboard "walk"
    const onKeyDown = (e) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const onKeyUp = (e) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Render loop
    let raf;
    const tick = () => {
      const s = stateRef.current;

      // Walk: forward vector from yaw/pitch
      const forward = new THREE.Vector3(
        Math.cos(s.pitch) * Math.sin(s.yaw),
        Math.sin(s.pitch),
        Math.cos(s.pitch) * Math.cos(s.yaw),
      );
      const right = new THREE.Vector3(Math.sin(s.yaw - Math.PI / 2), 0, Math.cos(s.yaw - Math.PI / 2));
      const speed = 0.8;
      if (s.keys["w"] || s.keys["arrowup"]) s.pos.addScaledVector(forward, speed);
      if (s.keys["s"] || s.keys["arrowdown"]) s.pos.addScaledVector(forward, -speed);
      if (s.keys["a"] || s.keys["arrowleft"]) s.pos.addScaledVector(right, -speed);
      if (s.keys["d"] || s.keys["arrowright"]) s.pos.addScaledVector(right, speed);

      // Clamp inside sphere so user never escapes
      const maxR = 380;
      if (s.pos.length() > maxR) s.pos.setLength(maxR);

      camera.position.copy(s.pos);
      const target = new THREE.Vector3().copy(s.pos).add(forward);
      camera.lookAt(target);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      dom.removeEventListener("mousedown", onDown);
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseup", onUp);
      dom.removeEventListener("mouseleave", onUp);
      dom.removeEventListener("touchstart", onDown);
      dom.removeEventListener("touchmove", onMove);
      dom.removeEventListener("touchend", onUp);
      dom.removeEventListener("wheel", onWheel);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, [imageUrl]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setThinking(true);
    try {
      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a guide standing inside this 360° AI-generated world. The user is exploring it like a Google Street View / world simulator. Answer their question about the scene as if you can see it with them — describe what's around, hidden details, mood, lore. Keep it under 120 words, vivid, second person.\n\nUser: ${text}`,
        file_urls: [imageUrl],
      });
      setMessages((m) => [...m, { role: "assistant", content: String(reply || "...") }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Couldn't reach the world: ${e.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex">
      {/* 3D viewport */}
      <div className="relative flex-1">
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white text-[11px] font-bold tracking-wider">360° WORLD</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setChatOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-full text-white text-[11px] font-bold"
            >
              <MessageCircle className="w-3.5 h-3.5" /> {chatOpen ? "Hide" : "Talk"}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-full text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/70 text-[10px] font-medium pointer-events-none flex items-center gap-2">
          <Maximize2 className="w-3 h-3" />
          Drag to look · WASD to walk · Scroll to zoom
        </div>
      </div>

      {/* Chat */}
      {chatOpen && (
        <div className="w-full sm:w-96 max-w-[100vw] sm:max-w-[24rem] border-l border-white/10 bg-black/80 backdrop-blur-xl flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm leading-none">World Guide</h3>
              <p className="text-white/40 text-[10px]">Ask about this scene</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-cyan-500/20 border border-cyan-500/30 text-cyan-50"
                    : "bg-white/5 border border-white/10 text-white/90"
                }`}
              >
                {m.content}
              </div>
            ))}
            {thinking && (
              <div className="bg-white/5 border border-white/10 text-white/60 text-[12px] px-3 py-2 rounded-xl inline-flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Looking around...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="What's in this world?"
              className="flex-1 px-3 py-2 bg-black/40 border border-white/10 focus:border-cyan-400 rounded-lg text-white text-sm outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || thinking}
              className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 rounded-lg text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}