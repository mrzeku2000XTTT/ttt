import React from "react";
import { AbsoluteFill, Sequence, Img, Video, Audio } from "remotion";

const FPS = 30;
const cover = { width: "100%", height: "100%", objectFit: "cover" };

// Real Remotion composition — maps the KUTT timeline (clips + assets) to Sequences.
export default function KuttComposition({ clips = [], assets = [] }) {
  const byId = (id) => assets.find((a) => a.id === id);
  const sorted = [...clips].sort((a, b) => a.track - b.track); // higher tracks render on top

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {sorted.map((c) => {
        const asset = byId(c.assetId);
        if (!asset) return null;
        const from = Math.round(c.start * FPS);
        const durationInFrames = Math.max(1, Math.round(c.duration * FPS));
        const startFrom = Math.round((c.trimIn || 0) * FPS);
        return (
          <Sequence key={c.id} from={from} durationInFrames={durationInFrames}>
            {asset.type === "image" && <Img src={asset.url} style={cover} />}
            {asset.type === "video" && <Video src={asset.url} startFrom={startFrom} style={cover} />}
            {asset.type === "audio" && <Audio src={asset.url} startFrom={startFrom} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}