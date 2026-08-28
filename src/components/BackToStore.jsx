import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";

/**
 * Floating "Exit to Store" button — shows when the user arrived from
 * AppStoreV2 (localStorage flag `came_from_categories` === 'true').
 * Renders nothing if the user didn't come from the store.
 */
export default function BackToStore() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setShow(localStorage.getItem("came_from_categories") === "true");
    } catch {
      setShow(false);
    }
  }, []);

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
      className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-medium shadow-lg shadow-black/20 hover:bg-zinc-800 transition-colors active:scale-95"
    >
      <Store className="w-4 h-4" />
      <span>Exit to Store</span>
    </button>
  );
}