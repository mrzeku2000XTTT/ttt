import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Store } from "lucide-react";

/**
 * Floating "Exit to App Store" button — top-right, always visible on every
 * app page except the store itself and the top-level landings.
 */
const HIDDEN_PATHS = ["/AppStoreV2", "/AppStore", "/", "/TTTHome", "/TTTGate"];

export default function BackToStore() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")));
  }, [pathname]);

  if (!show) return null;

  const handleBack = () => {
    try {
      localStorage.removeItem("came_from_categories");
    } catch {}
    navigate("/AppStoreV2");
  };

  return (
    <button
      onClick={handleBack}
      className="fixed top-3 right-3 z-[120] flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-900/90 backdrop-blur-md text-white text-[12px] font-medium border border-white/15 shadow-lg shadow-black/30 hover:bg-zinc-800 transition-colors active:scale-95"
    >
      <Store className="w-3.5 h-3.5" />
      <span>Exit to Store</span>
    </button>
  );
}