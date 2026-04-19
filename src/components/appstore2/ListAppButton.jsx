import React, { useState } from "react";
import { Plus, LogIn } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ProposeAppModal from "@/components/appstore/ProposeAppModal";

export default function ListAppButton({ user }) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-700 transition-colors"
      >
        {user ? <Plus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
        {user ? "List your app" : "Sign in to list"}
      </button>

      <AnimatePresence>
        {open && user && (
          <ProposeAppModal user={user} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}