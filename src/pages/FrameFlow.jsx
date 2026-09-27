import React, { useState } from "react";
import FrameFlowLanding from "@/components/frameflow/FrameFlowLanding";
import FrameFlowStudio from "@/components/frameflow/FrameFlowStudio";
import "@/components/frameflow/frameflow.css";

export default function FrameFlowPage() {
  const [entered, setEntered] = useState(() => sessionStorage.getItem("frameflow_entered") === "1");
  const [seed, setSeed] = useState({ start: null, end: null });

  // The landing's drop zone feeds the studio's own references, so a visitor who
  // starts on the landing never has to upload the same frame twice.
  const enter = (start, end) => {
    const startFrame = typeof start === "string" ? start : null;
    const endFrame = typeof end === "string" ? end : null;
    if (startFrame || endFrame) setSeed({ start: startFrame, end: endFrame });
    sessionStorage.setItem("frameflow_entered", "1");
    setEntered(true);
  };

  const home = () => {
    sessionStorage.removeItem("frameflow_entered");
    setEntered(false);
  };

  if (!entered) {
    return (
      <FrameFlowLanding
        onSeed={enter}
        onEnter={() => enter()}
        onExit={() => {
          window.location.href = "/AppStoreV2";
        }}
      />
    );
  }

  return <FrameFlowStudio onHome={home} seedStart={seed.start} seedEnd={seed.end} />;
}