import React from "react";
import { Aperture } from "lucide-react";

export default function ETAHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground">
          <Aperture className="h-4 w-4" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold leading-none">ETA</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Enhanced Timeline Animator</p>
        </div>
      </div>
    </header>
  );
}