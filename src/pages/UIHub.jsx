import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { UI_APPS } from "@/components/uihub/uiApps";

export default function UIHub() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { base44.auth.me().then(user => setIsAdmin(user?.role === "admin")).catch(() => setIsAdmin(false)); }, []);
  const apps = UI_APPS.filter(app => !app.admin || isAdmin);
  return <div className="min-h-screen bg-background text-foreground">
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ArrowLeft className="h-5 w-5"/>Store</Link>
        <span className="text-sm font-bold">UI</span><span className="w-14"/>
      </div>
    </nav>
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8"><h1 className="font-heading text-3xl font-bold">UI</h1><p className="mt-2 text-sm text-muted-foreground">Focused tools for presenting, animating, and refining interfaces.</p></header>
      {!apps.length && <p className="text-sm text-muted-foreground">No tools available yet.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {apps.map((app) => <Link key={app.path} to={app.path} className="overflow-hidden rounded-3xl border border-border bg-card p-3 transition-shadow hover:shadow-lg">
          <img src={app.logo} alt={app.name} className="aspect-square w-full rounded-2xl object-cover"/>
          <h2 className="mt-3 text-sm font-semibold">{app.name}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{app.description}</p>
        </Link>)}
      </div>
    </main>
  </div>;
}