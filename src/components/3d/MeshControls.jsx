import React from "react";
import { Slider } from "@/components/ui/slider";

export default function MeshControls({
  depthMultiplier,
  onDepthChange,
  roughness,
  onRoughnessChange,
  metalness,
  onMetalnessChange,
  lightIntensity,
  onLightIntensityChange,
  saturation,
  onSaturationChange,
}) {
  return (
    <div className="space-y-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div>
        <label className="text-white/70 text-xs font-medium block mb-2">
          Depth Displacement: {depthMultiplier.toFixed(2)}
        </label>
        <Slider
          value={[depthMultiplier]}
          onValueChange={(val) => onDepthChange(val[0])}
          min={0.05}
          max={0.5}
          step={0.02}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-white/70 text-xs font-medium block mb-2">
          Surface Roughness: {roughness.toFixed(2)}
        </label>
        <Slider
          value={[roughness]}
          onValueChange={(val) => onRoughnessChange(val[0])}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-white/70 text-xs font-medium block mb-2">
          Metallic: {metalness.toFixed(2)}
        </label>
        <Slider
          value={[metalness]}
          onValueChange={(val) => onMetalnessChange(val[0])}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-white/70 text-xs font-medium block mb-2">
          Light Intensity: {lightIntensity.toFixed(1)}x
        </label>
        <Slider
          value={[lightIntensity]}
          onValueChange={(val) => onLightIntensityChange(val[0])}
          min={0.3}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-white/70 text-xs font-medium block mb-2">
          Color Saturation: {saturation.toFixed(2)}
        </label>
        <Slider
          value={[saturation]}
          onValueChange={(val) => onSaturationChange(val[0])}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>
    </div>
  );
}