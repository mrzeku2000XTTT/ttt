import React, { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { usePercentDrag } from "./usePercentDrag";

export default function AngleCanvas({ imageUrl, dummies, camera, onDragDummy, onDragCamera, onRemoveDummy }) {
  const areaRef = useRef(null);
  const [ratio, setRatio] = useState("16 / 9");
  const drag = usePercentDrag(areaRef, (id, x, y) =>
    id === "camera" ? onDragCamera(x, y) : onDragDummy(id, x, y)
  );

  const character = dummies.find((d) => d.kind === "character");
  const aim =
    character
      ? (Math.atan2(character.y + character.h / 2 - camera.y, character.x + character.w / 2 - camera.x) * 180) / Math.PI + 90
      : 0;

  return (
    <div
      ref={areaRef}
      onPointerMove={drag.move}
      onPointerUp={drag.end}
      onPointerLeave={drag.end}
      className="relative w-full touch-none overflow-hidden rounded-2xl border border-white/15 bg-black"
      style={{ aspectRatio: ratio }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="reference"
          draggable={false}
          onLoad={(e) => setRatio(`${e.currentTarget.naturalWidth} / ${e.currentTarget.naturalHeight}`)}
          className="absolute inset-0 h-full w-full object-contain opacity-40"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40">
          Upload a reference image to begin
        </div>
      )}

      {dummies.map((d) => (
        <div
          key={d.id}
          onPointerDown={drag.start(d.id)}
          className="group absolute cursor-move"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%` }}
        >
          <div
            className="h-full w-full rounded-lg border border-dashed border-white/80 bg-cover bg-no-repeat"
            style={{
              backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
              backgroundSize: `${(10000 / d.w).toFixed(2)}% ${(10000 / d.h).toFixed(2)}%`,
              backgroundPosition: `${((d.x / (100 - d.w)) * 100).toFixed(2)}% ${((d.y / (100 - d.h)) * 100).toFixed(2)}%`
            }}
          />
          {d.kind === "character" && (
            <div className="absolute left-1/2 top-0 h-[24%] w-[62%] -translate-x-1/2 rounded-b-full bg-black/85 backdrop-blur-[2px]" />
          )}
          <span className="absolute -top-1 left-0 -translate-y-full whitespace-nowrap rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-black">
            {d.label}
          </span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRemoveDummy(d.id)}
            className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-white text-black group-hover:flex"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <div
        onPointerDown={drag.start("camera")}
        className="absolute z-10 cursor-grab"
        style={{ left: `${camera.x}%`, top: `${camera.y}%`, transform: "translate(-50%, -50%)" }}
        title="Camera — drag to place"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-black text-white shadow-lg shadow-white/20"
          style={{ transform: `rotate(${aim}deg)` }}
        >
          <Camera className="h-5 w-5" />
        </div>
        <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-black">
          CAM
        </span>
      </div>
    </div>
  );
}