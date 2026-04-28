import React, { useState, useRef } from "react";
import { Image as ImageIcon, Sparkles, Upload, X, Loader2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MotionPromptChat({ onAttachReference, attachedRefs, onRemoveRef, onAppendToPrompt }) {
  const [chatInput, setChatInput] = useState("");
  const [imgPrompt, setImgPrompt] = useState("");
  const [showImgGen, setShowImgGen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onAttachReference({ url: file_url, label: file.name, source: "upload" });
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadLoading(false);
      e.target.value = "";
    }
  };

  const handleGenerateImage = async () => {
    if (!imgPrompt.trim()) return;
    setGenLoading(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: imgPrompt });
      onAttachReference({ url, label: imgPrompt.slice(0, 40), source: "ai" });
      setImgPrompt("");
      setShowImgGen(false);
    } catch (err) {
      alert("Image generation failed: " + err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onAppendToPrompt(chatInput);
    setChatInput("");
  };

  return (
    <div className="border-t border-white/10 bg-black/40">
      {/* Attached reference images */}
      {attachedRefs && attachedRefs.length > 0 && (
        <div className="px-3 pt-3 flex gap-2 flex-wrap">
          {attachedRefs.map((ref, i) => (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden border border-white/15 w-16 h-16"
            >
              <img src={ref.url} alt={ref.label} className="w-full h-full object-cover" />
              <button
                onClick={() => onRemoveRef(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
              <div
                className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[8px] text-white/90 truncate"
                style={{ background: ref.source === "ai" ? "rgba(168,85,247,0.7)" : "rgba(6,182,212,0.7)" }}
              >
                {ref.source === "ai" ? "✨ AI" : "📎"} {ref.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Image generation panel */}
      {showImgGen && (
        <div className="p-3 border-b border-white/5 bg-purple-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-bold text-purple-300">Generate reference image with AI</span>
            <button
              onClick={() => setShowImgGen(false)}
              className="ml-auto text-white/40 hover:text-white text-[10px]"
            >
              cancel
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !genLoading && handleGenerateImage()}
              placeholder="e.g. dark cyberpunk hero illustration with neon"
              className="flex-1 h-9 px-3 bg-black/40 border border-white/10 rounded-lg text-[12px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              disabled={genLoading}
            />
            <button
              onClick={handleGenerateImage}
              disabled={genLoading || !imgPrompt.trim()}
              className="px-3 h-9 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5"
            >
              {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              {genLoading ? "..." : "Generate"}
            </button>
          </div>
        </div>
      )}

      {/* Chat input bar */}
      <div className="p-3 flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadLoading}
          title="Upload reference image"
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 flex items-center justify-center disabled:opacity-50"
        >
          {uploadLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setShowImgGen((v) => !v)}
          title="Generate reference image with AI"
          className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
            showImgGen
              ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendChat();
            }
          }}
          placeholder="Add an instruction… (e.g. 'make it darker', 'add a pricing section')"
          rows={1}
          className="flex-1 min-h-[36px] max-h-[100px] px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[12px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 resize-none"
        />

        <button
          onClick={handleSendChat}
          disabled={!chatInput.trim()}
          className="flex-shrink-0 h-9 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white text-[11px] font-bold"
        >
          Add
        </button>
      </div>
    </div>
  );
}