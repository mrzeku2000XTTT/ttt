import React from "react";
import { Player } from "@remotion/player";
import KuttComposition from "./KuttComposition";

const FPS = 30;

// Frame-accurate Remotion playback of the KUTT timeline.
export default function KuttRemotionPreview({ clips, assets, duration }) {
  if (!clips.length) {
    return (
      <div className="h-full flex items-center justify-center text-white/30 text-xs">
        Timeline is empty — add clips to preview with Remotion
      </div>
    );
  }
  return (
    <div className="h-full flex items-center justify-center bg-black p-2">
      <Player
        component={KuttComposition}
        inputProps={{ clips, assets }}
        durationInFrames={Math.max(FPS, Math.ceil(duration * FPS))}
        fps={FPS}
        compositionWidth={1280}
        compositionHeight={720}
        controls
        acknowledgeRemotionLicense
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}