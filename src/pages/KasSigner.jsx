import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, ShieldAlert, QrCode } from "lucide-react";

const KASSIGNER_APP_URL = "https://base44.app/api/apps/6a444b036408e68ec8d6f2a6/functions/kassignerApp";

export default function KasSigner() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Back button */}
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            KasSigner — Air-Gapped Signer
          </h1>
        </div>

        {/* Launch button */}
        <a
          href={KASSIGNER_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-16 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_45px_rgba(6,182,212,0.6)] mb-8"
        >
          Launch KasSigner on Phone B →
          <ExternalLink className="w-5 h-5" />
        </a>
        <p className="text-xs text-white/40 text-center -mt-5 mb-8">
          Opens the KasSigner PWA in a new tab. Works on any phone's browser.
        </p>

        <div className="space-y-5">
          {/* How it works */}
          <div className="rounded-3xl bg-zinc-900/70 border border-white/10 p-6 backdrop-blur-xl">
            <h2 className="text-white font-bold mb-4">How it works</h2>
            <ol className="space-y-2.5 text-sm text-white/70 list-decimal list-inside">
              <li>On Phone A: use AWA Signer to generate a payment QR code</li>
              <li>On Phone B: open KasSigner (the button above), scan the QR</li>
              <li>Review the transaction — amount, destination, fee</li>
              <li>Approve and sign with your private key</li>
              <li>Scan the signed QR back to Phone A</li>
              <li>Phone A broadcasts the signed payment to Kaspa</li>
            </ol>
          </div>

          {/* Security warning */}
          <div className="rounded-3xl bg-yellow-500/5 border border-yellow-500/30 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-200/90 leading-relaxed">
                <span className="font-bold text-yellow-300">Security:</span> KasSigner stores your private key
                only in the browser's local storage on your device. Keys never leave your phone.
                Clear browser data = key erased. Always keep a backup of your private key.
              </p>
            </div>
          </div>

          {/* Already open */}
          <div className="rounded-3xl bg-zinc-900/70 border border-white/10 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <QrCode className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/80 font-semibold">
                  Already have the app open? Just scan the QR from AWA Signer.
                </p>
                <p className="text-xs text-white/40 mt-1.5">
                  The KasSigner app works fully offline after first load. No internet connection needed during signing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}