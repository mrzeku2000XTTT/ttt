import React, { useRef } from "react";
import { Camera, User, Box } from "lucide-react";
import { usePercentDrag } from "./usePercentDrag";

export default function Map3D({ items, camera, yaw, onDragItem, onDragCamera }) {
  const areaRef = useRef(null);
  const drag = usePercentDrag(areaRef, (id, x, y) =>
    id === "camera" ? onDragCamera(x, y) : onDragItem(id, x, y)
  );

  return (
    <div
      ref={areaRef}
      onPointerMove={drag.move}
      onPointerUp={drag.end}
      onPointerLeave={drag.end}
      className="relative w-full touch-none overflow-hidden rounded-2xl border border-white/15 bg-black"
      style={{
        aspectRatio: "16 / 9",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "10% 10%"
      }}
    >
      <div className="pointer-events-none absolute left-2 top-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60">
        Scene map — top-down
      </div>

      {items.map((it) => (
        <div
          key={it.id}
          onPointerDown={drag.start(it.id)}
          className="absolute cursor-move"
          style={{ left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%, -50%)" }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-zinc-900 text-white">
            {it.kind === "character" ? <User className="h-4 w-4" /> : <Box className="h-4 w-4" />}
          </div>
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-black">
            {it.label}
          </span>
        </div>
      ))}

      <div
        onPointerDown={drag.start("camera")}
        className="absolute z-10 cursor-grab"
        style={{ left: `${camera.x}%`, top: `${camera.y}%`, transform: "translate(-50%, -50%)" }}
        title="Camera — drag to place"
      >
        <div className="pointer-events-none absolute" style={{ left: "50%", top: "50%" }}>
          <div
            className="h-28 w-44"
            style={{
              transform: `translateX(-50%) rotate(${yaw}deg)`,
              transformOrigin: "50% 0%",
              clipPath: "polygon(50% 0%, 14% 100%, 86% 100%)",
              background: "rgba(255,255,255,0.09)"
            }}
          />
        </div>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg">
          <Camera className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}