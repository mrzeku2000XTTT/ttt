import React from "react";
import DDLogo from "@/components/dd/DDLogo";
import { Home, Bot, LayoutGrid, CheckSquare, Calendar, Mail, FileText, FolderKanban, Workflow, Activity, Plus, Store, Crown } from "lucide-react";

export const DD_NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "apps", label: "Apps", icon: LayoutGrid },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "mail", label: "Mail", icon: Mail },
  { id: "files", label: "Files", icon: FileText },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "automations", label: "Automations", icon: Workflow },
  { id: "activity", label: "Activity", icon: Activity },
];

export default function DDSidebar({ active, onNav }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-neutral-200 bg-white h-screen sticky top-0">
      <div className="px-5 h-16 flex items-center"><DDLogo size={28} animate={false} /></div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {DD_NAV.map((n) => {
          const Icon = n.icon;
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => onNav(n.id)} className={`w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition ${on ? "bg-violet-50 text-violet-700 font-semibold" : "text-neutral-600 hover:bg-neutral-50"}`}>
              <Icon className="w-4 h-4" /> {n.label}
            </button>
          );
        })}
      </nav>
      <div className="px-3 pb-3 space-y-1">
        <button onClick={() => onNav("apps")} className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50">
          <Plus className="w-4 h-4" /> Add app
        </button>
        <button onClick={() => onNav("apps")} className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50">
          <Store className="w-4 h-4" /> DD Store
        </button>
        <div className="mt-2 rounded-xl border border-neutral-200 p-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-neutral-900">Premium Plan</span>
          </div>
          <button className="mt-2 text-[11px] text-violet-600 font-medium hover:underline">Manage plan</button>
        </div>
      </div>
    </aside>
  );
}