import React, { useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { base44 } from "@/api/base44Client";
import UniverseGrid from "@/components/antimatter/UniverseGrid";
import MatterObject from "@/components/antimatter/MatterObject";
import FloatingTextBox from "@/components/antimatter/FloatingTextBox";
import FloatingPlusSign from "@/components/antimatter/FloatingPlusSign";
import UniverseHUD from "@/components/antimatter/UniverseHUD";
import { Loader2 } from "lucide-react";

// Random spawn position within a small radius near origin
const randPos = () => ({
  x: (Math.random() - 0.5) * 8,
  y: (Math.random() - 0.5) * 4,
  z: (Math.random() - 0.5) * 8,
});

export default function AntimatterPage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [elements, setElements] = useState([]);
  const [ghost, setGhost] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user + their universe
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const list = await base44.entities.UniverseElement.filter({ owner_email: me.email });
        setElements(list);
      } catch {
        setUser(null);
      }
      setAuthChecked(true);
      setLoading(false);
    })();
  }, []);

  const spawn = useCallback(async (kind) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setSaving(true);
    const colorMap = { matter: "#22d3ee", antimatter: "#a855f7", textbox: "#f472b6" };
    const created = await base44.entities.UniverseElement.create({
      owner_email: user.email,
      kind,
      position: randPos(),
      scale: kind === "textbox" ? 1 : 0.6 + Math.random() * 0.6,
      color: colorMap[kind],
      text_title: kind === "textbox" ? "Note" : undefined,
      text_content: kind === "textbox" ? "" : undefined,
    });
    setElements((prev) => [...prev, created]);
    setSelectedId(created.id);
    setSaving(false);
  }, [user]);

  const updateElement = useCallback(async (id, partial) => {
    setSaving(true);
    const updated = await base44.entities.UniverseElement.update(id, partial);
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    setSaving(false);
  }, []);

  const deleteElement = useCallback(async (id) => {
    setSaving(true);
    await base44.entities.UniverseElement.delete(id);
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    setSaving(false);
  }, [selectedId]);

  const clearAll = useCallback(async () => {
    if (!confirm("Delete every element in your universe?")) return;
    setSaving(true);
    await Promise.all(elements.map((e) => base44.entities.UniverseElement.delete(e.id)));
    setElements([]);
    setSelectedId(null);
    setSaving(false);
  }, [elements]);

  if (!authChecked || loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-center p-6">
        <div className="max-w-sm">
          <h1 className="text-3xl font-black text-white mb-2">Antimatter</h1>
          <p className="text-white/50 text-sm mb-6">Sign in to create your universe.</p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-5 h-10 rounded-full bg-white text-black text-sm font-black"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <Canvas
        camera={{ position: [0, 5, 16], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 25, 70]} />

        {/* Cosmic backdrop */}
        <Stars radius={120} depth={60} count={4000} factor={3} saturation={0} fade speed={0.5} />

        {/* Lighting */}
        <ambientLight intensity={0.25} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#a855f7" />
        <pointLight position={[0, 12, 0]} intensity={0.6} color="#ffffff" />

        {/* The 3D grid (ghost mode toggles its visibility) */}
        <UniverseGrid size={40} divisions={20} ghost={ghost} />

        {/* Floating spawn buttons */}
        <FloatingPlusSign position={[-6, 4, 0]} color="#22d3ee" label="Matter" kind="matter" onSpawn={spawn} ghost={ghost} />
        <FloatingPlusSign position={[6, 4, 0]} color="#a855f7" label="Antimatter" kind="antimatter" onSpawn={spawn} ghost={ghost} />
        <FloatingPlusSign position={[0, 4, -6]} color="#f472b6" label="Note" kind="textbox" onSpawn={spawn} ghost={ghost} />

        {/* All saved elements */}
        {elements.map((el) => {
          if (el.kind === "textbox") {
            return (
              <FloatingTextBox
                key={el.id}
                element={el}
                selected={selectedId === el.id}
                ghost={ghost}
                onSelect={(e) => setSelectedId(e.id)}
                onSave={updateElement}
                onDelete={deleteElement}
              />
            );
          }
          return (
            <MatterObject
              key={el.id}
              element={el}
              selected={selectedId === el.id}
              ghost={ghost}
              onSelect={(e) => setSelectedId(e.id)}
            />
          );
        })}

        {/* Camera controls — orbit from any angle */}
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={50}
          rotateSpeed={0.7}
        />
      </Canvas>

      <UniverseHUD
        ghost={ghost}
        onToggleGhost={() => setGhost((g) => !g)}
        count={elements.length}
        saving={saving}
        onClearAll={clearAll}
      />
    </div>
  );
}