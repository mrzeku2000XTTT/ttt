import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
export default function AngleResultDialog({actions:a}) {
  return <Dialog open={!!a.result} onOpenChange={open=>{if(!open)a.closeResult();}}><DialogContent className="angle-editor max-h-[90dvh] max-w-4xl overflow-auto border-border bg-card text-foreground"><DialogTitle>Generated camera angle</DialogTitle>{a.result&&<><img src={a.result.url} alt="AI image generated from your camera composition" className="max-h-[65dvh] w-full rounded-lg object-contain"/><a href={a.result.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-3 text-sm"><ExternalLink size={14}/>Open full-size image</a></>}</DialogContent></Dialog>;
}