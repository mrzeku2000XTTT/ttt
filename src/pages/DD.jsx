import React, { useState, useEffect } from "react";
import { Search, Bell, HelpCircle, Home, LayoutGrid, Bot, Activity, User } from "lucide-react";
import DDSidebar, { DD_NAV } from "@/components/dd/DDSidebar";
import DDWalletButton from "@/components/dd/DDWalletButton";
import DDDashboard from "@/components/dd/DDDashboard";
import DDAgent from "@/components/dd/DDAgent";
import DDStore from "@/components/dd/DDStore";
import DDProfile from "@/components/dd/DDProfile";
import DDTasks from "@/components/dd/DDTasks";
import DDProjects from "@/components/dd/DDProjects";
import DDAutomations from "@/components/dd/DDAutomations";
import DDActivity from "@/components/dd/DDActivity";
import DDEmptyPage from "@/components/dd/DDEmptyPage";
import DDOnboarding, { isOnboarded } from "@/components/dd/DDOnboarding";
import { base44 } from "@/api/base44Client";
import { Calendar as CalIcon, Mail as MailIcon, FileText } from "lucide-react";

const MOBILE_NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "apps", label: "Apps", icon: LayoutGrid },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "profile", label: "Profile", icon: User },
];

export default function DD() {
  const [view, setView] = useState("home");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentNonce, setAgentNonce] = useState(0);
  const [userName, setUserName] = useState("");
  const [userPlan, setUserPlan] = useState("Free");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (u?.full_name) setUserName(u.full_name);
        else try { setUserName(localStorage.getItem("dd_profile_name") || ""); } catch {}
        try { setUserPlan(localStorage.getItem("dd_profile_plan") || "Free"); } catch {}
        if (!isOnboarded()) setShowOnboarding(true);
      } catch {
        if (!isOnboarded()) setShowOnboarding(true);
      }
    })();
  }, [view]);

  const nav = (id) => setView(id);
  const askDD = (text) => { setAgentPrompt(text); setAgentNonce((n) => n + 1); setView("agent"); };

  const initials = (name) => {
    const n = (name || "").trim();
    if (!n) return "DD";
    const parts = n.split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || n.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex overflow-x-hidden w-full">
      {showOnboarding && <DDOnboarding onComplete={() => setShowOnboarding(false)} />}
      <DDSidebar active={view} onNav={nav} />

      <div className="flex-1 min-w-0 flex flex-col w-full overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#F9FAFB]/90 backdrop-blur border-b border-neutral-200">
          <div className="h-16 px-4 sm:px-6 flex items-center gap-3 w-full max-w-6xl mx-auto">
            <h2 className="text-base font-semibold text-neutral-900 capitalize">{view}</h2>
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-md flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 h-9">
                <Search className="w-4 h-4 text-neutral-400" />
                <input placeholder="Search anything…" className="flex-1 bg-transparent outline-none text-sm placeholder:text-neutral-400" />
              </div>
            </div>
            <button className="w-9 h-9 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-500"><Bell className="w-4 h-4" /></button>
            <button onClick={() => nav("profile")} className="hidden sm:flex w-9 h-9 rounded-lg hover:bg-neutral-100 items-center justify-center text-neutral-500" title="Help"><HelpCircle className="w-4 h-4" /></button>
            <button onClick={() => nav("profile")} className="hidden sm:flex items-center gap-2 pl-1 rounded-lg hover:bg-neutral-100 pr-2" title="Account">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center">{initials(userName)}</div>
              <div className="leading-tight text-left"><p className="text-xs font-semibold text-neutral-900">{userName || "Guest"}</p><p className="text-[10px] text-neutral-500">{userPlan}</p></div>
            </button>
            <DDWalletButton />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 pb-20 lg:pb-6">
          {view === "home" && <DDDashboard onAskDD={askDD} />}
          {view === "agent" && <DDAgent initialPrompt={agentPrompt} nonce={agentNonce} />}
          {view === "apps" && <DDStore />}
          {view === "tasks" && <DDTasks />}
          {view === "projects" && <DDProjects />}
          {view === "automations" && <DDAutomations />}
          {view === "activity" && <DDActivity />}
          {view === "profile" && <DDProfile />}
          {view === "calendar" && <DDEmptyPage title="Calendar" subtitle="Your schedule, synced." icon={CalIcon} ctaLabel="Browse DD Store" ctaTo="/DD" />}
          {view === "mail" && <DDEmptyPage title="Mail" subtitle="Important emails, unified." icon={MailIcon} ctaLabel="Browse DD Store" ctaTo="/DD" />}
          {view === "files" && <DDEmptyPage title="Files" subtitle="Recent across your tools." icon={FileText} ctaLabel="Browse DD Store" ctaTo="/DD" />}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-neutral-200">
          <div className="flex justify-around h-16">
            {MOBILE_NAV.map((n) => {
              const Icon = n.icon;
              const on = view === n.id;
              return (
                <button key={n.id} onClick={() => nav(n.id)} className={`flex flex-col items-center justify-center gap-1 flex-1 ${on ? "text-neutral-900" : "text-neutral-400"}`}>
                  <Icon className="w-5 h-5" /><span className="text-[10px] font-medium">{n.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}