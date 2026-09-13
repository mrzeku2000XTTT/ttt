import React from "react";
import ETADirectorVisual from "./ETADirectorVisual";
import ETAAgentBrief from "./ETAAgentBrief";

export default function ETABrief({ brief, onChange, files, onFiles, onGenerate, loading, status, elapsed, error }) {
  return (
    <main className="eta-director-main">
      <div className="eta-director-form-wrap"><ETAAgentBrief brief={brief} onChange={onChange} files={files} onFiles={onFiles} onGenerate={onGenerate} loading={loading} status={status} elapsed={elapsed} error={error} /></div>
      <ETADirectorVisual />
    </main>
  );
}