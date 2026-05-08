import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FrameZHeader from "@/components/framez/FrameZHeader";
import FrameZTabs from "@/components/framez/FrameZTabs";
import FrameZChat from "@/components/framez/FrameZChat";
import FrameZBottomBar from "@/components/framez/FrameZBottomBar";

/**
 * FrameZ — admin-only AI deck builder (faces.app clone).
 * Mobile-first layout that pixel-matches the reference screenshot,
 * with desktop scaling that frames the same UI in a phone-shaped column
 * surrounded by a workspace canvas (so the same components serve both).
 */
export default function FrameZPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        if (u?.role !== "admin") {
          navigate("/AppStoreV2");
          return;
        }
        setUser(u);
      })
      .catch(() => navigate("/AppStoreV2"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-zinc-100 overflow-hidden flex items-stretch lg:items-center justify-center">
      {/* Phone-shaped frame (full screen on mobile, centered cinematic frame on desktop) */}
      <div className="w-full h-full lg:w-[470px] lg:h-[920px] lg:rounded-[44px] lg:shadow-2xl lg:ring-1 lg:ring-black/10 lg:overflow-hidden bg-zinc-50 flex flex-col">
        {/* iOS-style status bar (visible on desktop frame and respected on mobile via safe-area) */}
        <div
          className="hidden lg:flex items-center justify-between px-7 pt-3 pb-1 text-[13px] font-semibold text-zinc-900 bg-zinc-50"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          <span>2:04</span>
          <span className="flex items-center gap-1">
            <span className="text-[10px]">●</span>
            <span>5G+</span>
            <span className="px-1.5 py-0.5 bg-black text-white rounded-md text-[10px]">71</span>
          </span>
        </div>

        <FrameZHeader />
        <FrameZTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "chat" && <FrameZChat initialPrompt="TTT" />}
        {activeTab === "content" && <PlaceholderTab title="Content" subtitle="Slides will appear here as the agent generates them." />}
        {activeTab === "controls" && <PlaceholderTab title="Controls" subtitle="Theme, animations, and deck-level settings." />}

        <FrameZBottomBar domain="framez.app" />
      </div>

      {/* Desktop helper text */}
      <div className="hidden lg:block absolute bottom-6 right-6 text-[11px] text-zinc-400">
        FrameZ · Admin preview
      </div>
    </div>
  );
}

function PlaceholderTab({ title, subtitle }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="text-base font-bold text-zinc-700 mb-1">{title}</div>
      <div className="text-xs text-zinc-400">{subtitle}</div>
    </div>
  );
}