import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import KCC20AddToDevice from "@/components/kcc20/KCC20AddToDevice";
import { loadKcc20Sdk, getPending, clearPending, setResult } from "@/lib/kcc20Pwa";

const KCC20_URL = "https://kcc-20-wallet.vercel.app";
const KCC20_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f0152b845_image.png";

export default function KCC20Page() {
  const [loaded, setLoaded] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Fulfill a pending KCC20 request placed by DD (sessionStorage bridge).
  useEffect(() => {
    const pending = getPending();
    if (!pending) return;
    clearPending();
    let cancelled = false;
    setStatusMsg("Opening KCC20 wallet…");
    (async () => {
      try {
        const p = await loadKcc20Sdk();
        let result;
        if (pending.type === "connect") {
          const r = typeof p.request === "function" ? await p.request("connect") : await p.connect();
          const address = r?.address || r?.accounts?.[0] || (Array.isArray(r) ? r[0] : "");
          if (!address) throw new Error("KCC20 Wallet did not return an address");
          result = { id: pending.id, type: "connect", address };
        } else if (pending.type === "signPskt") {
          const r = typeof p.request === "function"
            ? await p.request("signPskt", { txJsonString: pending.txJsonString, options: { signInputs: pending.signInputs || [] } })
            : await p.signPskt({ txJsonString: pending.txJsonString, options: { signInputs: pending.signInputs || [] } });
          result = { id: pending.id, type: "signPskt", signed: r };
        } else {
          result = { id: pending.id, error: "Unknown request type" };
        }
        if (cancelled) return;
        setResult(result);
        setStatusMsg("Done — returning to DD…");
        if (pending.returnUrl) setTimeout(() => { window.location.href = pending.returnUrl; }, 400);
      } catch (e) {
        if (cancelled) return;
        setResult({ id: pending.id, error: String(e?.message || e) });
        setStatusMsg("Failed — returning to DD…");
        if (pending.returnUrl) setTimeout(() => { window.location.href = pending.returnUrl; }, 1200);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <nav
        className="flex items-center justify-between px-3 sm:px-5 bg-black/90 backdrop-blur-xl border-b border-white/10 z-20"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Link
          to="/AppStoreV2"
          className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors h-14 px-3 -ml-3 rounded-lg active:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Store</span>
        </Link>
        <div className="flex items-center gap-2">
          <img src={KCC20_LOGO} alt="KCC20" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-sm font-bold text-white">KCC20</span>
        </div>
        <KCC20AddToDevice />
        <a
          href={KCC20_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white/70 hover:text-white h-14 px-3 rounded-lg active:bg-white/5"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Open</span>
        </a>
      </nav>

      {/* Iframe */}
      <div className="relative flex-1 bg-black">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-widest">{statusMsg || "Loading KCC20 wallet…"}</span>
          </div>
        )}
        {statusMsg && loaded && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-amber-500/90 text-black text-[11px] font-medium whitespace-nowrap">
            {statusMsg}
          </div>
        )}
        <iframe
          src={KCC20_URL}
          title="KCC20 Wallet"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full border-0 bg-black"
          allow="camera; microphone; clipboard-read; clipboard-write; publickey-credentials-get; webauthn"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation allow-modals allow-downloads"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}