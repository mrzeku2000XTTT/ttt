import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Renders agent name tags as plain DOM elements positioned over the Canvas.
 * Lives INSIDE the Canvas (for camera/size access) but creates NO R3F elements
 * — it imperatively builds DOM divs in the overlay container and updates their
 * screen position every frame via Vector3.project(camera). This avoids any
 * drei <Html> / troika-three-text R3F reconciliation issues.
 */
export default function NameTagLayer({ agents, positionsRef, selectedId, onSelect, overlayRef }) {
  const { camera, size } = useThree();
  const tagEls = useRef({});
  const vec = useMemo(() => new THREE.Vector3(), []);

  // Build / rebuild DOM elements when agent list changes
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    overlay.innerHTML = "";
    tagEls.current = {};

    for (const a of agents) {
      const el = document.createElement("div");
      el.textContent = a.name;
      el.style.cssText = [
        "position:absolute",
        "transform:translate(-50%,-50%)",
        "padding:3px 10px",
        "border-radius:6px",
        "font-size:13px",
        "font-weight:800",
        "white-space:nowrap",
        "user-select:none",
        "pointer-events:auto",
        "cursor:pointer",
        "font-family:monospace",
        "letter-spacing:0.05em",
        "opacity:0",
        "transition:opacity 0.15s",
        "will-change:transform",
        "z-index:5",
      ].join(";");
      el.addEventListener("click", () => onSelect(a.id));
      overlay.appendChild(el);
      tagEls.current[a.id] = el;
    }

    return () => {
      if (overlay) overlay.innerHTML = "";
      tagEls.current = {};
    };
  }, [agents, onSelect, overlayRef]);

  // Update tag colors on selection change
  useEffect(() => {
    for (const a of agents) {
      const el = tagEls.current[a.id];
      if (!el) continue;
      if (a.id === selectedId) {
        el.style.background = "rgba(6,182,212,0.9)";
        el.style.color = "#000";
      } else {
        el.style.background = "rgba(0,0,0,0.75)";
        el.style.color = "#fff";
      }
    }
  }, [selectedId, agents]);

  // Project 3D world position → 2D screen position every frame
  useFrame(() => {
    const w = size.width;
    const h = size.height;
    for (const a of agents) {
      const el = tagEls.current[a.id];
      const p = positionsRef.current[a.id];
      if (!el || !p) continue;
      vec.set(p.x, 3.05, p.z);
      vec.project(camera);
      const x = (vec.x * 0.5 + 0.5) * w;
      const y = (-vec.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
      el.style.opacity = vec.z < 1 ? "1" : "0";
    }
  });

  return null;
}