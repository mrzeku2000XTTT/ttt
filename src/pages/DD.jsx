import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, HelpCircle, Home, LayoutGrid, Bot, Activity, User } from "lucide-react";
import DDSidebar, { DD_NAV } from "@/components/dd/DDSidebar";
import DDWalletButton from "@/components/dd/DDWalletButton";
import DDDashboard from "@/components/dd/DDDashboard";
import DDAgent from "@/components/dd/DDAgent";
import DDStore from "@/components/dd/DDStore";
import { DD_USER, DD_EVENTS, DD_PRIORITIES, DD_FILES, DD_EMAILS, DD_ACTIVITY } from "@/components/dd/ddData";

function SimpleView({ title, subtitle, children }) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Row({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-sm">{icon}</div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-neutral-900 truncate">{title}</p><p className="text-xs text-neutral-400">{sub}</p></div>
    </div>
  );
}

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

  const nav = (id) => setView(id);
  const askDD = (text) => { setAgentPrompt(text + " " + Date.now()); setView("agent"); };

  const isProfile = view === "profile";

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex overflow-x-hidden w-full">
      <DDSidebar active={view} onNav={nav} />

      <div className="flex-1 min-w-0 flex flex-col w-full overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#F9FAFB]/90 backdrop-blur border-b border-neutral-200">
          <div className="h-16 px-4 sm:px-6 flex items-center gap-3 w-full max-w-6xl mx-auto">
            <h2 className="text-base font-semibold text-neutral-900 capitalize">{view === "profile" ? "Profile" : view}</h2>
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-md flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 h-9">
                <Search className="w-4 h-4 text-neutral-400" />
                <input placeholder="Search anything…" className="flex-1 bg-transparent outline-none text-sm placeholder:text-neutral-400" />
              </div>
            </div>
            <button className="w-9 h-9 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-500"><Bell className="w-4 h-4" /></button>
            <button onClick={() => nav("profile")} className="hidden sm:flex w-9 h-9 rounded-lg hover:bg-neutral-100 items-center justify-center text-neutral-500" title="Help"><HelpCircle className="w-4 h-4" /></button>
            <button onClick={() => nav("profile")} className="hidden sm:flex items-center gap-2 pl-1 rounded-lg hover:bg-neutral-100 pr-2" title="Account & Premium">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-xs font-semibold flex items-center justify-center">AS</div>
              <div className="leading-tight text-left"><p className="text-xs font-semibold text-neutral-900">{DD_USER.name}</p><p className="text-[10px] text-violet-600">{DD_USER.plan}</p></div>
            </button>
            <DDWalletButton />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 pb-20 lg:pb-6">
          {view === "home" && <DDDashboard onAskDD={askDD} />}
          {view === "agent" && <DDAgent initialPrompt={agentPrompt} />}
          {view === "apps" && <DDStore />}
          {view === "tasks" && (
            <SimpleView title="Tasks" subtitle="Your priorities, in focus.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                {DD_PRIORITIES.map((p) => <Row key={p.id} icon="✅" title={p.title} sub={p.done ? "Completed" : "Pending"} />)}
              </div>
            </SimpleView>
          )}
          {view === "calendar" && (
            <SimpleView title="Calendar" subtitle="Today's schedule.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                {DD_EVENTS.map((e) => <Row key={e.id} icon={e.icon} title={e.title} sub={e.time} />)}
              </div>
            </SimpleView>
          )}
          {view === "mail" && (
            <SimpleView title="Mail" subtitle="Important emails, unified.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                {DD_EMAILS.map((m) => <Row key={m.id} icon="✉️" title={m.sender} sub={m.time} />)}
              </div>
            </SimpleView>
          )}
          {view === "files" && (
            <SimpleView title="Files" subtitle="Recent across your tools.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                {DD_FILES.map((f) => <Row key={f.id} icon={f.icon} title={f.name} sub={f.app} />)}
              </div>
            </SimpleView>
          )}
          {view === "projects" && (
            <SimpleView title="Projects" subtitle="Coming soon — organize work into projects.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-sm text-neutral-400">No projects yet.</div>
            </SimpleView>
          )}
          {view === "automations" && (
            <SimpleView title="Automations" subtitle="Coming soon — let DD run the busywork.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-sm text-neutral-400">No automations yet.</div>
            </SimpleView>
          )}
          {view === "activity" && (
            <SimpleView title="Activity" subtitle="What DD has been doing.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                {DD_ACTIVITY.map((a) => <Row key={a.id} icon={a.icon} title={a.text} sub={a.time} />)}
              </div>
            </SimpleView>
          )}
          {isProfile && (
            <SimpleView title="Profile" subtitle="Your DD account.">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-lg font-semibold flex items-center justify-center">AS</div>
                <div><p className="font-semibold text-neutral-900">{DD_USER.name}</p><p className="text-sm text-violet-600">{DD_USER.plan} plan</p></div>
                <Link to="/AppStoreV2" className="ml-auto text-xs text-neutral-400 hover:text-neutral-900">← Back to TTT</Link>
              </div>
            </SimpleView>
          )}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-neutral-200">
          <div className="flex justify-around h-16">
            {MOBILE_NAV.map((n) => {
              const Icon = n.icon;
              const on = view === n.id;
              return (
                <button key={n.id} onClick={() => nav(n.id)} className={`flex flex-col items-center justify-center gap-1 flex-1 ${on ? "text-violet-600" : "text-neutral-400"}`}>
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