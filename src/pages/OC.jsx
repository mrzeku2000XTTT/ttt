import React, { useState } from "react";
import { useMotionEditor } from "@/components/oc/useMotionEditor";
import Toolbar from "@/components/oc/Toolbar";
import Stage from "@/components/oc/Stage";
import Timeline from "@/components/oc/Timeline";
import Inspector from "@/components/oc/Inspector";

export default function OCPage() {
  const editor = useMotionEditor();
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileInspector, setMobileInspector] = useState(false);
  const toggleFullscreen = () => setFullscreen((v) => !v);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f5f7]" style={{ fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif' }}>
      {!fullscreen && <Toolbar fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} />}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <Stage editor={editor} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} onOpenInspector={() => setMobileInspector(true)} />
        <div className="hidden md:flex md:flex-col flex-shrink-0">
          {!fullscreen && <Inspector editor={editor} />}
        </div>
      </div>
      {!fullscreen && <Timeline editor={editor} />}

      {/* Mobile inspector bottom sheet */}
      {!fullscreen && mobileInspector && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileInspector(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-2xl flex flex-col max-h-[78vh]">
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>
            <div className="overflow-y-auto">
              <Inspector editor={editor} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}