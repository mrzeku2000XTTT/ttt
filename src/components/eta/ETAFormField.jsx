import React from 'react';

export default function ETAFormField({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
}

export const etaInput = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring';