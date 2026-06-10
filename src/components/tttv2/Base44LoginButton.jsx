import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LogIn, LogOut } from "lucide-react";

// Brand-new login button using Base44's default hosted auth.
// White styling so it's clearly the new one.
export default function Base44LoginButton() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleLogin = () => {
    // Use our in-app login page — the hosted base44 login gets stuck
    // "Connecting" on this public (no-login-required) app.
    window.location.href = "/login";
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  if (user) {
    return (
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-zinc-900 bg-white hover:bg-zinc-100 border-2 border-zinc-900 px-4 py-1.5 rounded-full transition-colors shadow-md"
        title="Log out"
      >
        <LogOut className="w-3.5 h-3.5" /> Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-zinc-900 bg-white hover:bg-zinc-100 border-2 border-zinc-900 px-4 py-1.5 rounded-full transition-colors shadow-md"
      title="Log in with Base44"
    >
      <LogIn className="w-3.5 h-3.5" /> Login
    </button>
  );
}