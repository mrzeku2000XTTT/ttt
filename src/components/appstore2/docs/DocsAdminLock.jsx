import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ChevronDown, ShieldCheck, KeyRound, Users, Wallet } from "lucide-react";
import { createPageUrl } from "@/utils";

// Shown on a docs page when the app is admin-only. Explains that the app is
// locked to non-admins and lists the requirements to gain admin powers.
export default function DocsAdminLock({ app }) {
  const [open, setOpen] = useState(false);

  const requirements = [
    {
      icon: KeyRound,
      title: "Create a TTT ID",
      desc: "Register your verified TTT identity — your Kaspa wallet is your login.",
    },
    {
      icon: Wallet,
      title: "Connect a Kaspa wallet",
      desc: "Link a Kaspa wallet (Kastle, Kasware, or Terra) to your TTT account.",
    },
    {
      icon: Users,
      title: "Join the TTT community",
      desc: "Become an active member in the TTT Community Hub and ecosystem.",
    },
    {
      icon: ShieldCheck,
      title: "Request admin access",
      desc: "Message the TTT team from the Community Hub with your TTT ID + wallet. Admin powers are granted to trusted builders and contributors.",
    },
  ];

  return (
    <div className="mt-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-[800] text-amber-900">Admin App — Locked</h3>
          <p className="text-[13px] text-amber-700/90 mt-0.5 leading-relaxed">
            {app.name} is currently restricted to TTT admins. You can read the docs, but opening the app requires admin powers.
          </p>
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-amber-700 hover:text-amber-900"
          >
            How to gain admin powers
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-3 space-y-2.5">
              {requirements.map((r, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <r.icon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12.5px] font-semibold text-amber-900">{r.title}</div>
                    <div className="text-[12px] text-amber-700/80 leading-relaxed">{r.desc}</div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to={createPageUrl("RegisterTTTID")}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-amber-600 text-white text-[12px] font-semibold hover:bg-amber-700"
                >
                  Get a TTT ID
                </Link>
                <Link
                  to={createPageUrl("CommunityHub")}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white text-amber-700 ring-1 ring-amber-300 text-[12px] font-semibold hover:bg-amber-50"
                >
                  Community Hub
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}