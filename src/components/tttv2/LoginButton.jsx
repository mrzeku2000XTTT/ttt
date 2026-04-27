import React from "react";
import { LogIn, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LoginButton({ currentUser, onLogout }) {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  if (currentUser) {
    return (
      <button
        onClick={onLogout}
        className="text-[13px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
        title={currentUser.full_name || currentUser.email}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="text-[13px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Login</span>
    </button>
  );
}