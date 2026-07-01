import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Rocket, Search, Coins, Terminal } from "lucide-react";
import ZKChatWidget from "@/components/tttz/ZKChatWidget";

const NAV_ITEMS = [
  { label: "Home", path: "/TTTZ", icon: Home },
  { label: "Launch", path: "/TTTZLaunch", icon: Rocket },
  { label: "Explorer", path: "/TTTZExplorer", icon: Search },
  { label: "Token", path: "/TTTZToken", icon: Coins },
];

export default function TTTZLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#e0e0e0" }}>
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/TTTZ" className="flex items-center gap-2">
            <Terminal className="w-5 h-5" style={{ color: "#00ffcc" }} />
            <span className="font-black text-lg tracking-tight" style={{ color: "#00ffcc" }}>TTTZ</span>
            <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#111", color: "#00ffcc", border: "1px solid #1a1a1a" }}>
              TOCCATA
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: active ? "rgba(0,255,204,0.08)" : "transparent",
                    color: active ? "#00ffcc" : "#666",
                    border: active ? "1px solid rgba(0,255,204,0.2)" : "1px solid transparent",
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="pt-14 pb-16 sm:pb-4 max-w-5xl mx-auto px-4">
        <Outlet />
      </main>

      {/* ZK Agent Chat Widget */}
      <ZKChatWidget />

      {/* Mobile Bottom Tab Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around"
        style={{ background: "#0a0a0a", borderColor: "#1a1a1a", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center gap-0.5 py-2 px-4"
              style={{ color: active ? "#00ffcc" : "#444" }}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}