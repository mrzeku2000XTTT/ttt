import React, { useMemo } from "react";
import * as THREE from "three";

// A 3D grid built from three intersecting wireframe planes.
// Ghost mode dramatically lowers opacity so the user can see "through" everything.
export default function UniverseGrid({ size = 40, divisions = 20, ghost = false }) {
  const gridXY = useMemo(() => new THREE.GridHelper(size, divisions, "#22d3ee", "#1e293b"), [size, divisions]);
  const gridXZ = useMemo(() => new THREE.GridHelper(size, divisions, "#a855f7", "#1e1b4b"), [size, divisions]);
  const gridYZ = useMemo(() => new THREE.GridHelper(size, divisions, "#f472b6", "#3b0764"), [size, divisions]);

  const opacity = ghost ? 0.08 : 0.35;

  // Apply opacity to grid materials
  [gridXY, gridXZ, gridYZ].forEach((g) => {
    if (Array.isArray(g.material)) {
      g.material.forEach((m) => { m.transparent = true; m.opacity = opacity; });
    } else if (g.material) {
      g.material.transparent = true;
      g.material.opacity = opacity;
    }
  });

  return (
    <group>
      <primitive object={gridXY} />
      <primitive object={gridXZ} rotation={[Math.PI / 2, 0, 0]} />
      <primitive object={gridYZ} rotation={[0, 0, Math.PI / 2]} />
    </group>
  );
}