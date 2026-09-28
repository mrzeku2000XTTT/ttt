import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, ShieldCheck } from "lucide-react";
import { fileToDataUrl } from "../sceneAssets";
import { stashPendingCharacter } from "../talkStickStore";
import TalkStickHeroPreview from "./TalkStickHeroPreview";

/** The front door: a real drop zone that opens the studio with your artwork. */
export default function TalkStickLandingHero() {
  const navigate = useNavigate();
  const [over, setOver] = useState(false);

  const open = (file) => {
    if (!file) return;
    fileToDataUrl(file).then((url) => {
      stashPendingCharacter(url);
      navigate("/TalkStickStudio");
    });
  };

  return (
    <section className="tsl-hero">
      <div className="tsl-hero-copy">
        <span className="tsl-badge">Real-time face engine</span>
        <h1 className="tsl-h1">
          Give any drawing
          <span className="tsl-grad">a mouth that moves</span>
        </h1>
        <p className="tsl-sub">
          Drop in a character, click once on its face, then talk. Add a background and props around it, and keep the
          whole scene to come back to.
        </p>

        <label
          className={`tsl-drop ${over ? "is-over" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            open(event.dataTransfer?.files?.[0]);
          }}
        >
          <ImagePlus className="tsl-drop-icon" />
          <span className="tsl-drop-title">Drop a PNG or JPG here</span>
          <span className="tsl-drop-sub">A transparent PNG works especially well — or click to choose a file</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => open(event.target.files?.[0])}
          />
        </label>

        <p className="tsl-privacy">
          <ShieldCheck className="tsl-privacy-icon" />
          Everything runs in your browser. Your artwork never leaves it.
        </p>
      </div>

      <TalkStickHeroPreview />
    </section>
  );
}