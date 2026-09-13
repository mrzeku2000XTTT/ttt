import React from "react";

const frames = Array.from({ length: 9 });
export default function ETADirectorVisual() {
  return (
    <section className="eta-director-visual" aria-label="ETA cinematic storyboard preview">
      <div className="eta-art-grid" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="eta-hero-copy">
        <p>ATE · Automated Timeline Experience</p>
        <h1>Describe the launch. ETA directs the motion.</h1>
      </div>
      <div className="eta-timeline" aria-hidden="true">
        {frames.map((_, index) => <span key={index} className={`eta-frame eta-frame-${index + 1}`} />)}
        <b /><em />
      </div>
      <p className="eta-hero-description">Turn a product brief, link, and visual references into an editable sequence of scenes, motion, pacing, narration, and transitions.</p>
    </section>
  );
}