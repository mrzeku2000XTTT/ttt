import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Monitor } from "lucide-react";
import BackToStore from "@/components/BackToStore";

const KACHAT_URL = "https://kachat.app/";
const KACHAT_LOGO = "https://play-lh.googleusercontent.com/EWz3-rGxKEkQSvqpfP8-RNoj2HVYn8_eA5WrbdGlH5ipbTzn-Qawz1o0YPDIjk6JSsH1pXANtkPH9RKN25uXzg=w240-h480-rw";

export default function KaChat() {
  return <div className="flex h-[100dvh] flex-col overflow-hidden bg-black text-white">
    <BackToStore />
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-zinc-950 px-3 sm:px-5">
      <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Store</Link>
      <div className="flex min-w-0 items-center gap-2"><img src={KACHAT_LOGO} alt="KaChat" className="h-8 w-8 rounded-lg object-cover"/><strong className="truncate text-sm">KaChat</strong><Monitor className="h-4 w-4 text-emerald-300" aria-label="Desktop app"/></div>
      <a href={KACHAT_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white">Open <ExternalLink className="h-4 w-4"/></a>
    </header>
    <iframe title="KaChat" src={KACHAT_URL} allow="clipboard-read; clipboard-write; fullscreen" className="min-h-0 w-full flex-1 border-0 bg-white"/>
  </div>;
}