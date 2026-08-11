import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Menu, X } from "lucide-react";
import HikaruSidebar from "@/components/hikaru/HikaruSidebar";
import HikaruImageGen from "@/components/hikaru/HikaruImageGen";
import HikaruUpscaler from "@/components/hikaru/HikaruUpscaler";
import HikaruRelight from "@/components/hikaru/HikaruRelight";
import HikaruEditImage from "@/components/hikaru/HikaruEditImage";
import HikaruGallery from "@/components/hikaru/HikaruGallery";
import HikaruMotionSaaS from "@/components/hikaru/HikaruMotionSaaS";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/36834c19a_generated_image.png";

const TOOLS = {
  explore: { label: "Explore", component: HikaruGallery },
  generate: { label: "Generate Image", component: HikaruImageGen },
  motion: { label: "Motion SaaS", component: HikaruMotionSaaS },
  upscaler: { label: "Upscaler", component: HikaruUpscaler },
  relight: { label: "Relight", component: HikaruRelight },
  edit: { label: "Edit Image", component: HikaruEditImage },
};

export default function HikaruPage() {
  const [activeTool, setActiveTool] = useState("explore");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ActiveComponent = TOOLS[activeTool]?.component || HikaruGallery;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <HikaruSidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          logoUrl={LOGO_URL}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-10">
            <HikaruSidebar
              activeTool={activeTool}
              onToolChange={(t) => { setActiveTool(t); setMobileMenuOpen(false); }}
              logoUrl={LOGO_URL}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl flex items-center px-4 gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-white/50 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to={createPageUrl("AppStore")} className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Hikaru" className="w-7 h-7 rounded-lg object-cover" />
            <h1 className="text-white font-bold text-sm">Hikaru</h1>
            <span className="text-white/20 text-[10px]">AI Creative Studio</span>
          </div>
          <div className="ml-auto text-white/30 text-xs font-medium capitalize">{TOOLS[activeTool]?.label}</div>
        </header>

        {/* Tool content */}
        <div className="flex-1 overflow-y-auto">
          <ActiveComponent onToolChange={setActiveTool} />
        </div>
      </div>
    </div>
  );
}