import React, { useRef } from "react";
import { Plus, Type, Bot, Download, Loader2, Settings2, Upload } from "lucide-react";

/**
 * Compact bottom action bar for phones.
 * Sticks to the bottom of the screen with safe-area padding.
 * Buttons are 48px tall (iOS HIG) with large tap targets.
 */
export default function MockMobileBar({
  placementMode,
  onTogglePlacement,
  onAddText,
  onOpenAgent,
  onExport,
  onReset,
  onOpenControls,
  onUploadFile, // (file) => void — uploads to selected device, or auto-creates one
  exporting,
  hasSelection,
}) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) onUploadFile(file);
    e.target.value = "";
  };

  return (
    <div className="lg:hidden bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl mt-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        onChange={handleFile}
        className="hidden"
      />
      <div className="flex items-stretch gap-1 px-2 py-2">
        <button
          onClick={onOpenAgent}
          className="flex-1 flex flex-col items-center justify-center h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white active:opacity-80"
          aria-label="Ask AI"
        >
          <Bot className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">AI</span>
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex flex-col items-center justify-center h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white active:opacity-80"
          aria-label="Upload image or video"
        >
          <Upload className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">Upload</span>
        </button>
        <button
          onClick={onTogglePlacement}
          className={`flex-1 flex flex-col items-center justify-center h-12 rounded-xl active:opacity-80 ${
            placementMode
              ? "bg-cyan-400 text-black"
              : "bg-white/5 border border-white/10 text-white/80"
          }`}
          aria-label="Add device"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">Device</span>
        </button>
        <button
          onClick={onAddText}
          className="flex-1 flex flex-col items-center justify-center h-12 rounded-xl bg-white/5 border border-white/10 text-white/80 active:opacity-80"
          aria-label="Add text"
        >
          <Type className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">Text</span>
        </button>
        <button
          onClick={onOpenControls}
          className={`flex-1 flex flex-col items-center justify-center h-12 rounded-xl active:opacity-80 ${
            hasSelection
              ? "bg-white/10 border border-white/20 text-white"
              : "bg-white/5 border border-white/10 text-white/50"
          }`}
          aria-label="Edit selected"
        >
          <Settings2 className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">Edit</span>
        </button>
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex-1 flex flex-col items-center justify-center h-12 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white active:opacity-80 disabled:opacity-40"
          aria-label="Export"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="text-[9px] font-bold mt-0.5">{exporting ? "…" : "PNG"}</span>
        </button>
      </div>
    </div>
  );
}