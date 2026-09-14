import React, { useState } from "react";
import BackToStore from "@/components/BackToStore";
import ETAHeader from "@/components/eta/ETAHeader";
import ETABrief from "@/components/eta/ETABrief";
import ETAScenePlan from "@/components/eta/ETAScenePlan";
import ETAAdvancedEditor from "@/components/eta/ETAAdvancedEditor";
import ETACompiledPreview from "@/components/eta/ETACompiledPreview";
import ETAFooter from "@/components/eta/ETAFooter";
import "@/components/eta/etaDirector.css";
import useElapsed from "@/hooks/useElapsed";
import { createBlankETAScene, createETAPlan } from "@/lib/etaPlan";

const INITIAL = { name: "", url: "", description: "", audience: "", style: "", duration: "25", format: "16:9 landscape" };
export default function ETA() {
  const [brief, setBrief] = useState(INITIAL);
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState("plan");
  const elapsed = useElapsed(loading);

  const generate = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try { setPlan(await createETAPlan(brief, files, setStatus)); }
    catch (err) { setError(err?.message || "ETA could not generate this plan. Please try again."); }
    finally { setLoading(false); }
  };
  const updateScene = (index, scene) => setPlan((current) => ({ ...current, scenes: current.scenes.map((item, i) => i === index ? scene : item) }));
  const addScene = (component) => setPlan((current) => ({ ...current, scenes: [...current.scenes, createBlankETAScene(component)] }));
  const deleteScene = (index) => setPlan((current) => current.scenes.length === 1 ? current : ({ ...current, scenes: current.scenes.filter((_, i) => i !== index) }));

  return (
    <div className={`eta-app ${plan ? "" : "eta-landing"} min-h-screen bg-background font-body text-foreground`}>
      <BackToStore /><ETAHeader />
      <div className="eta-workspace">{plan ? (view === "editor" ? <ETAAdvancedEditor plan={plan} onBack={() => setView("plan")} onSceneChange={updateScene} onDelete={deleteScene} onPreview={() => setView("preview")} /> : view === "preview" ? <ETACompiledPreview plan={plan} onBack={() => setView("plan")} onEdit={() => setView("editor")} /> : <ETAScenePlan plan={plan} onBack={() => setPlan(null)} onSceneChange={updateScene} onAddScene={addScene} onDeleteScene={deleteScene} onCompile={() => setView("preview")} onEdit={() => setView("editor")} />) : <><ETABrief brief={brief} onChange={setBrief} files={files} onFiles={setFiles} onGenerate={generate} loading={loading} status={status} elapsed={elapsed} error={error} /><ETAFooter /></>}</div>
    </div>
  );
}