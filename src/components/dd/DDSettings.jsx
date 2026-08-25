import React, { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, CheckCircle2, XCircle, Plug, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { GoogleDriveLogo, GoogleDocsLogo, GoogleCalendarLogo, GmailLogo, ChatGPTLogo } from "@/components/dd/DDGoogleLogos";

// Connector IDs from workspace registration
const CONNECTORS = [
  { id: "6a8cde30137d405112693b7a", type: "googledrive", name: "Google Drive", desc: "List, read, and manage your Drive files", Logo: GoogleDriveLogo },
  { id: "6a8cde51e37e03bca068b3b2", type: "googledocs", name: "Google Docs", desc: "Create and edit Google Docs documents", Logo: GoogleDocsLogo },
  { id: "6a8cde500c8f9518850896d0", type: "googlecalendar", name: "Google Calendar", desc: "View and manage your calendar events", Logo: GoogleCalendarLogo },
  { id: "6a8cde4f5e2470cbe4b913d5", type: "gmail", name: "Gmail", desc: "Send and read your emails", Logo: GmailLogo },
];

export default function DDSettings() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({}); // { [type]: "connected" | "disconnected" | "checking" }
  const [busy, setBusy] = useState({}); // { [type]: true/false }
  const [authed, setAuthed] = useState(false);

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
  }, [checkConnections]);

  const handleConnect = async (c) => {
    if (!authed) { base44.auth.redirectToLogin(); return; }
    setBusy((b) => ({ ...b, [c.type]: true }));
    try {
      const url = await base44.connectors.connectAppUser(c.id);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnections();
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
                  <p className="text-sm text-amber-700">Please log in first to connect your Google account.</p>
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
                <p className="text-xs text-neutral-400">ChatGPT integration uses your own API key (BYOK). Configure it in your profile settings.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}