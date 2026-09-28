import React, { useState, useEffect } from "react";
import NudgeLanding from "@/components/nudge/NudgeLanding";
import NudgeStudio from "@/components/nudge/NudgeStudio";

const ENTERED = "nudge_entered";

/**
 * NUDGE always opens on the landing page. The studio only appears once the
 * visitor has come in through it, and the session remembers that choice.
 */
export default function NudgePage() {
  const [entered, setEntered] = useState(false);
  const [seed, setSeed] = useState(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    try { setEntered(sessionStorage.getItem(ENTERED) === "1"); } catch {}
    setBooted(true);
  }, []);

  if (!booted) return <div className="min-h-screen bg-white" />;

  const enter = (payload) => {
    setSeed(payload || null);
    try { sessionStorage.setItem(ENTERED, "1"); } catch {}
    setEntered(true);
  };

  const home = () => {
    try { sessionStorage.removeItem(ENTERED); } catch {}
    setEntered(false);
  };

  return entered
    ? <NudgeStudio seed={seed} onHome={home} />
    : <NudgeLanding onEnter={enter} />;
}