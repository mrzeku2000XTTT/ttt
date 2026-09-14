import React, { useState } from "react";
import { Check, Copy, Download, ExternalLink, Github, ShieldCheck } from "lucide-react";
import BackToStore from "@/components/BackToStore";

const REPO = "https://github.com/Curious-being99/Kaspa-browser-";
const RELEASE = `${REPO}/releases/tag/v1.0.20260913223625`;
const APK = `${REPO}/releases/download/v1.0.20260913223625/KaspaBrowser-release-signed.apk`;
const CLONE = `git clone ${REPO}.git`;

export default function KaspaBrowser() {
  const [copied, setCopied] = useState(false);
  const copyClone = async () => { await navigator.clipboard.writeText(CLONE); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  return <main className="min-h-screen bg-zinc-950 px-5 py-16 text-white">
    <BackToStore />
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-4">
        <img src="https://raw.githubusercontent.com/Curious-being99/Kaspa-browser-/v1.0.20260913223625/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp" alt="Kaspa Browser" className="h-20 w-20 rounded-2xl" />
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Android release</p><h1 className="text-4xl font-black tracking-tight">Kaspa Browser</h1><p className="mt-1 text-sm text-zinc-400">v1.0.20260913223625 · signed APK</p></div>
      </div>
      <p className="mt-8 text-lg leading-relaxed text-zinc-300">A Kotlin and Jetpack Compose browser combining Chromium WebView, decentralized domain routing, mesh discovery, privacy controls, cryptographic identity, and native Kaspa wallet utilities.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <a href={APK} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300"><Download className="h-4 w-4"/>Download APK</a>
        <a href={REPO} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 font-bold hover:bg-white/10"><Github className="h-4 w-4"/>View source</a>
        <a href={RELEASE} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 font-bold hover:bg-white/10"><ExternalLink className="h-4 w-4"/>Release notes</a>
      </div>
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5"><div className="mb-3 flex items-center gap-2"><Github className="h-5 w-5 text-emerald-400"/><h2 className="font-bold">Clone the repository</h2></div><div className="flex items-center gap-3 rounded-xl bg-black/50 p-3"><code className="min-w-0 flex-1 overflow-x-auto text-sm text-zinc-300">{CLONE}</code><button onClick={copyClone} className="shrink-0 text-zinc-400 hover:text-white" title="Copy clone command">{copied?<Check className="h-5 w-5 text-emerald-400"/>:<Copy className="h-5 w-5"/>}</button></div><p className="mt-3 text-sm text-zinc-400">Open the cloned project in Android Studio, or build it with <code className="text-zinc-200">./gradlew assembleDebug</code>.</p></section>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><span>Apache-2.0 licensed. The signed release asset is 20.8 MB with SHA-256 digest <code className="break-all">5f2754fb32e6d46ef62fc79e06586b85246040f35ae7a1f5c75faba1a027b141</code>.</span></div>
    </div>
  </main>;
}