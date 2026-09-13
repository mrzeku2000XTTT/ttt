import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ETARemotionPreview from './ETARemotionPreview';

export default function ETACompiledPreview({ plan, onBack, onEdit }) {
  return <main className="mx-auto max-w-5xl px-5 py-8"><div className="mb-5 flex items-center justify-between gap-3"><div><button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Scene plan</button><h1 className="mt-3 font-heading text-3xl font-semibold">60 FPS Showroom</h1><p className="mt-1 text-sm text-muted-foreground">Review every scene independently or play the complete combined film.</p></div><button onClick={onEdit} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">Edit scenes</button></div><ETARemotionPreview plan={plan} /></main>;
}