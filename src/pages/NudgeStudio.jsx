import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import NudgeStudio from "@/components/nudge/NudgeStudio";

const ENTERED = "nudge_entered";

/** Direct link to the studio — still landing-first: without the session flag it
 *  sends the visitor back to the landing page to come in the normal way. */
export default function NudgeStudioPage() {
  const [entered, setEntered] = useState(null);

  useEffect(() => {
    try { setEntered(sessionStorage.getItem(ENTERED) === "1"); } catch { setEntered(false); }
  }, []);

  if (entered === null) return <div className="min-h-screen bg-[#060608]" />;
  if (!entered) return <Navigate to="/Nudge" replace />;

  const home = () => {
    try { sessionStorage.removeItem(ENTERED); } catch {}
    window.location.href = "/Nudge";
  };

  return <NudgeStudio seed={null} onHome={home} />;
}