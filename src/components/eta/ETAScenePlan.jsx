import React from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import ETASceneCard from "@/components/eta/ETASceneCard";
import ETAPlanActions from "@/components/eta/ETAPlanActions";

export default function ETAScenePlan({ plan, onBack, onSceneChange, onAddScene, onDeleteScene, onCompile, onEdit }) {
  const total = plan.scenes.reduce((sum, scene) => sum + Number(scene.duration || 0), 0);
  return (
    <main className="eta-plan mx-auto max-w-6xl px-5 py-10">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Edit creative brief</button>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-7 sm:flex-row sm:items-end">
        <div><p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">AI-directed scene plan</p><h1 className="mt-2 font-heading text-3xl font-semibold sm:text-5xl">{plan.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{plan.narrative}</p></div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-xs"><Clock3 className="h-4 w-4" /> {total.toFixed(1)}s · {plan.scenes.length} scenes</div>
      </div>
      <div className="eta-plan-grid">{plan.scenes.map((scene, index) => <ETASceneCard key={index} scene={scene} index={index} onChange={(next) => onSceneChange(index, next)} onDelete={() => onDeleteScene(index)} />)}</div>
      <ETAPlanActions onAdd={onAddScene} onCompile={onCompile} onEdit={onEdit} />
    </main>
  );
}