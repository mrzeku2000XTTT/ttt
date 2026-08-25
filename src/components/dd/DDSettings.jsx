import React, { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, CheckCircle2, XCircle, Plug, Trash2, LogIn, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { GoogleDriveLogo, GoogleDocsLogo, GoogleSheetsLogo, GoogleCalendarLogo, GmailLogo, ChatGPTLogo } from "@/components/dd/DDGoogleLogos";
import { isInWalletIframe } from "@/lib/kcc20Pwa";

// Connector IDs from workspace registration.
// Google Sheets uses the Drive connector (no separate Sheets connector registered).
const CONNECTORS = [
  { id: "6a8cde30137d405112693b7a", type: "googledrive", name: "Google Drive", desc: "List, read, and manage your Drive files", Logo: GoogleDriveLogo },
  { id: "6a8cde51e37e03bca068b3b2", type: "googledocs", name: "Google Docs", desc: "Create and edit Google Docs documents", Logo: GoogleDocsLogo },
  { id: "6a8cde30137d405112693b7a", type: "googlesheets", name: "Google Sheets", desc: "Create spreadsheets (uses Drive connection)", Logo: GoogleSheetsLogo },
  { id: "6a8cde500c8f9518850896d0", type: "googlecalendar", name: "Google Calendar", desc: "View and manage your calendar events", Logo: GoogleCalendarLogo },
  { id: "6a8cde4f5e2470cbe4b913d5", type: "gmail", name: "Gmail", desc: "Send and read your emails", Logo: GmailLogo },
];

export default function DDSettings({ onConnectionChange }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({}); // { [type]: "connected" | "disconnected" | "checking" }
  const [busy, setBusy] = useState({}); // { [type]: true/false }
  const [authed, setAuthed] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  const checkConnections = useCallback(async () => {
    if (!authed) return;
    const next = {};
    for (const c of CONNECTORS) {
      try {
        await base44.functions.invoke("ddGoogleAction", { action: "status", connectorType: c.type, connectorId: c.id });
        next[c.type] = "connected";
      } catch {
        next[c.type] = "disconnected";
      }
    }
    setStatus(next);
  }, [authed]);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (a) => {
      setAuthed(a);
      if (a) await checkConnections();
    });
    // Detect wallet-only users (KCC20 iframe) so we can explain why login is needed
    try {
      const inIframe = isInWalletIframe();
      const localWallet = localStorage.getItem("dd_wallet_connected") || sessionStorage.getItem("dd_wallet_connected");
      const tttWallet = localStorage.getItem("ttt_wallet_address");
      setWalletConnected(inIframe || !!localWallet || !!tttWallet);
    } catch {}
  }, [checkConnections]);

  const handleConnect = async (c) => {
    if (!authed) { base44.auth.redirectToLogin("/DD"); return; }
    setBusy((b) => ({ ...b, [c.type]: true }));
    try {
      const url = await base44.connectors.connectAppUser(c.id);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnections();
          onConnectionChange?.();
        }
      }, 500);
    } catch {}
    setBusy((b) => ({ ...b, [c.type]: false }));
  };

  const handleDisconnect = async (c) => {
    setBusy((b) => ({ ...b, [c.type]: true }));
    try {
      await base44.connectors.disconnectAppUser(c.id);
      setStatus((s) => ({ ...s, [c.type]: "disconnected" }));
      onConnectionChange?.();
    } catch {}
    setBusy((b) => ({ ...b, [c.type]: false }));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 px-3 h-9 rounded-lg hover:bg-neutral-100"
      >
        <Settings className="w-4 h-4" /> Settings
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">Agent Settings</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-neutral-500 mb-4">Connect your Google account so DD can read your files, calendar, and email to help organize your day.</p>

              {!authed && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {walletConnected ? "Wallet connected — now sign up to link Google" : "Sign up to connect Google & ChatGPT"}
                      </p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        {walletConnected
                          ? "Your Kaspa wallet is connected, but Google and ChatGPT need a free email account to store the OAuth connection securely."
                          : "Google and ChatGPT integrations need a free account to store your connection. Sign up with your email — it takes 10 seconds."}
                      </p>
                      <button
                        onClick={() => base44.auth.redirectToLogin("/DD")}
                        className="mt-2 h-8 px-3 rounded-lg bg-amber-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-amber-700"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Sign up / Log in
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {CONNECTORS.map((c) => {
                  const st = status[c.type] || "checking";
                  const isBusy = busy[c.type];
                  const isConnected = st === "connected";
                  return (
                    <div key={c.type} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                        <c.Logo className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{c.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{c.desc}</p>
                      </div>
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                      ) : isConnected ? (
                        <button
                          onClick={() => handleDisconnect(c)}
                          className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(c)}
                          className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800"
                        >
                          <Plug className="w-3.5 h-3.5" /> Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <ChatGPTLogo className="w-5 h-5" />
                  <p className="text-sm font-semibold text-neutral-900">ChatGPT (Research)</p>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  ChatGPT powers DD's web research. It uses a shared key by default — no setup needed. Just ask DD to "research" any topic and it will search the web and cite sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}