import React from "react";
import { Aperture } from "lucide-react";

export default function ETAHeader() {
  return (
    <header className="eta-director-header">
      <div className="eta-director-header-inner">
        <div className="eta-director-mark"><Aperture className="h-3.5 w-3.5" /></div>
        <div>
          <p className="eta-director-brand">ETA</p>
          <p className="eta-director-subtitle">Enhanced Timeline Animator</p>
        </div>
      </div>
    </header>
  );
}