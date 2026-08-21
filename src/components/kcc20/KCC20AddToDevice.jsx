import React, { useState } from "react";
import { Smartphone, X, Share, Plus, Chrome, Apple, Globe } from "lucide-react";

const KCC20_URL = "https://kcc-20-wallet.vercel.app";

/**
 * "Add to Device" — guides the user to open the KCC20 wallet as a first-party
 * PWA (Add to Home Screen) so its keys persist, instead of the partitioned
 * iframe storage that keeps wiping on reload.
 */
export default function KCC20AddToDevice() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(KCC20_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-white/70 hover:text-white h-14 px-3 -mr-3 rounded-lg active:bg-white/5"
        title="Add to your device (PWA)"
      >
        <Smartphone className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Add to Device</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0a0a0a] border border-white/10 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 px-4 h-14 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold">Add KCC20 to your device</span>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <p className="text-xs text-white/60 leading-relaxed">
                Saving KCC20 to your home screen runs it as a real app on your phone — its private key stays put
                and you stop being asked to re-import every time.
              </p>

              {/* copy url */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Step 0 · The URL</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono text-amber-300/90 truncate">{KCC20_URL}</code>
                  <button
                    onClick={copyUrl}
                    className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-amber-500 text-black"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* iOS steps */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Apple className="w-4 h-4" /> iPhone / iPad (Safari)
                </div>
                <ol className="space-y-2 text-[12px] text-white/70">
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">1.</span> Tap <b className="text-white">Open</b> at the top right of this screen.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">2.</span> In the new tab, tap the <Share className="w-3.5 h-3.5 inline text-amber-300" /> <b className="text-white">Share</b> button in Safari's toolbar.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">3.</span> Scroll down and tap <b className="text-white">Add to Home Screen</b> <Plus className="w-3.5 h-3.5 inline text-amber-300" />.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">4.</span> Tap <b className="text-white">Add</b>. Launch it from your home screen — keys now persist.</li>
                </ol>
              </div>

              {/* Android steps */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Smartphone className="w-4 h-4" /> Android (Chrome)
                </div>
                <ol className="space-y-2 text-[12px] text-white/70">
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">1.</span> Tap <b className="text-white">Open</b> at the top right of this screen.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">2.</span> In the new tab, tap the <Chrome className="w-3.5 h-3.5 inline text-amber-300" /> three-dot <b className="text-white">menu</b> in Chrome.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">3.</span> Tap <b className="text-white">Add to Home screen</b> or <b className="text-white">Install app</b>.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">4.</span> Tap <b className="text-white">Add</b> / <b className="text-white">Install</b>. Launch from your home screen — keys now persist.</li>
                </ol>
              </div>

              {/* desktop */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="w-4 h-4" /> Desktop (Chrome / Edge)
                </div>
                <ol className="space-y-2 text-[12px] text-white/70">
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">1.</span> Click <b className="text-white">Open</b> at the top right.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">2.</span> Click the <b className="text-white">install</b> icon (⊕) in the address bar.</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold">3.</span> Click <b className="text-white">Install</b>. It opens as a standalone app window.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3">
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Why? The in-app iframe view can't keep your key (browsers wipe third-party iframe storage).
                  Installed as a real app, KCC20 keeps its own storage and your key stays saved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}