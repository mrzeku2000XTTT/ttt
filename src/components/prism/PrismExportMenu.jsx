import React, { useRef, useState } from 'react';
import { Braces, ChevronDown, Copy, ExternalLink, FileDown, FileText } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buildJson, buildMarkdown, copyRich, copyText, download, mdToHtml } from './prismExport';
import { buildPdf } from './prismPdf';

/**
 * One export control for the whole report: clipboard, PDF, Markdown, JSON, and a
 * paste-into-Docs route.
 */
export default function PrismExportMenu({ payload }) {
  const [note, setNote] = useState('');
  const timer = useRef(null);

  const flash = (msg) => {
    setNote(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2600);
  };

  const stem = (payload.source?.name || 'video').replace(/\.[^.]+$/, '');

  const doCopy = async () => {
    const ok = await copyText(buildMarkdown(payload));
    flash(ok ? 'Copied to the clipboard' : 'Copying is blocked here');
  };

  const doPdf = () => {
    buildPdf(payload).save(`prism-${stem}.pdf`);
    flash('PDF saved');
  };

  const doMd = () => {
    download(`prism-${stem}.md`, buildMarkdown(payload), 'text/markdown');
    flash('Markdown saved');
  };

  const doJson = () => {
    download(`prism-${stem}.json`, buildJson(payload), 'application/json');
    flash('JSON saved');
  };

  const doDocs = async () => {
    const md = buildMarkdown(payload);
    const ok = await copyRich(mdToHtml(md), md);
    window.open('https://docs.google.com/document/create', '_blank', 'noopener');
    flash(ok ? 'Copied — paste into the new doc' : 'Copying is blocked here');
  };

  return (
    <span className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-full border border-[#e6e6e6] text-[11px] px-3.5 py-2 text-[#4a4a4a] hover:text-[#121212] hover:border-[#c9c9c9] transition-colors">
            <FileDown className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3 h-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Take the report with you
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={doCopy} className="gap-2 text-[11px]">
            <Copy className="w-3.5 h-3.5" />
            Copy report
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={doPdf} className="gap-2 text-[11px]">
            <FileDown className="w-3.5 h-3.5" />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={doMd} className="gap-2 text-[11px]">
            <FileText className="w-3.5 h-3.5" />
            Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={doJson} className="gap-2 text-[11px]">
            <Braces className="w-3.5 h-3.5" />
            JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={doDocs} className="gap-2 text-[11px]">
            <ExternalLink className="w-3.5 h-3.5" />
            Google Docs
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {note && <span className="text-[10px] text-[#6f6f6f]">{note}</span>}
    </span>
  );
}