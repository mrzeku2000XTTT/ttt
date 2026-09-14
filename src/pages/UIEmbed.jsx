import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { UI_APPS } from "@/components/uihub/uiApps";

export default function UIEmbed() {
  const app = UI_APPS[0];
  return <div className="flex h-[100dvh] flex-col bg-background text-foreground">
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-5">
      <Link to="/UI" className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ArrowLeft className="h-5 w-5"/>UI</Link>
      <span className="text-sm font-bold">{app.name}</span>
      <a href={app.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-muted-foreground">Open <ExternalLink className="h-4 w-4"/></a>
    </header>
    <iframe title={app.name} src={app.url} allow="clipboard-read; clipboard-write; fullscreen" className="min-h-0 w-full flex-1 border-0 bg-background"/>
  </div>;
}