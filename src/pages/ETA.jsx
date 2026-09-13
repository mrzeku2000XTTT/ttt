import React, { useState } from "react";
import BackToStore from "@/components/BackToStore";
import ETAHeader from "@/components/eta/ETAHeader";
import ETABrief from "@/components/eta/ETABrief";
import ETAScenePlan from "@/components/eta/ETAScenePlan";
import useElapsed from "@/hooks/useElapsed";
import { createETAPlan } from "@/lib/etaPlan";

const INITIAL = { name: "", url: "", description: "", audience: "", style: "", duration: "25", format: "16:9 landscape" };
export default function ETA() {
  const [brief, setBrief] = useState(INITIAL);
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const elapsed = useElapsed(loading);

  const generate = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try { setPlan(await createETAPlan(brief, files, setStatus)); }
    catch (err) { setError(err?.message || "ETA could not generate this plan. Please try again."); }
    finally { setLoading(false); }
  };
  const updateScene = (index, scene) => setPlan((current) => ({ ...current, scenes: current.scenes.map((item, i) => i === index ? scene : item) }));

  return (
    <div className="eta-app min-h-screen bg-background font-body text-foreground">
      <BackToStore /><ETAHeader />
      {plan ? <ETAScenePlan plan={plan} onBack={() => setPlan(null)} onSceneChange={updateScene} /> : <ETABrief brief={brief} onChange={setBrief} files={files} onFiles={setFiles} onGenerate={generate} loading={loading} status={status} elapsed={elapsed} error={error} />}
    </div>
  );
}