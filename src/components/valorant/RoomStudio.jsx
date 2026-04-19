import React, { useState, useRef } from "react";
import { X, Upload, Sparkles, Loader2, Check, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Preset rooms — proper 360° equirectangular panoramas (2:1 aspect) for skybox use
const PRESET_ROOMS = [
  { id: "default", label: "Default Arena", thumb: null, url: null },
  { id: "cyber-range", label: "Cyber Range 360°", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e1f00117b_generated_image.png" },
  { id: "dust", label: "Desert Ruins", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80" },
  { id: "tokyo", label: "Neon Tokyo", url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1600&q=80" },
  { id: "warehouse", label: "Warehouse", url: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1600&q=80" },
  { id: "forest", label: "Dark Forest", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80" },
  { id: "space", label: "Space Station", url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80" },
  { id: "bunker", label: "Bunker", url: "https://images.unsplash.com/photo-1519974719765-e6559eac2575?w=1600&q=80" },
];

export default function RoomStudio({ currentRoomUrl, onSelect, onClose }) {
  const [tab, setTab] = useState("presets"); // presets | upload | generate
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(currentRoomUrl);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSelectedUrl(file_url);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `360-degree equirectangular panoramic photo, 2:1 aspect ratio, seamless spherical panorama for skybox/VR use. ${prompt}. Wide wrap-around view, clean horizon line, evenly lit for seamless edges, no visible seams at left/right edges, high detail, cinematic, professional 360 HDRI environment map style, game-ready skybox.`,
      });
      setSelectedUrl(url);
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const apply = () => {
    onSelect(selectedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#0d0d18] border border-white/10 rounded-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-xl tracking-wide">CUSTOM ROOM</h2>
            <p className="text-white/40 text-xs">Pick, upload, or generate your arena environment</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-white/10">
          {[
            { id: "presets", label: "Presets", Icon: ImageIcon },
            { id: "upload", label: "Upload", Icon: Upload },
            { id: "generate", label: "Generate", Icon: Sparkles },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === id ? "bg-red-600/20 text-red-400 border border-red-500/40" : "text-white/50 hover:text-white hover:bg-white/5"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "presets" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_ROOMS.map((r) => {
                const isSelected = selectedUrl === r.url;
                return (
                  <button key={r.id} onClick={() => setSelectedUrl(r.url)}
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected ? "border-red-500 scale-[1.02]" : "border-white/10 hover:border-white/30"
                    }`}>
                    {r.url ? (
                      <img src={r.url} alt={r.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
                        <span className="text-white/40 text-xs">Default</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 text-white text-xs font-bold">{r.label}</div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {tab === "upload" && (
            <div className="space-y-4">
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-50">
                {uploading ? (
                  <><Loader2 className="w-8 h-8 text-red-500 animate-spin" /><span className="text-white/60 text-sm">Uploading…</span></>
                ) : selectedUrl && tab === "upload" ? (
                  <img src={selectedUrl} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <><Upload className="w-10 h-10 text-white/40" /><span className="text-white/60 text-sm font-bold">Click to upload image</span><span className="text-white/30 text-xs">JPG, PNG — wide/panoramic works best</span></>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              {selectedUrl && (
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                  <img src={selectedUrl} alt="Selected" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {tab === "generate" && (
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Describe your arena</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. abandoned spaceship corridor with red emergency lights, sci-fi, industrial"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 outline-none focus:border-red-500/50 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "cyberpunk rooftop at night",
                    "medieval castle courtyard",
                    "underwater research base",
                    "Mars surface outpost",
                    "snowy mountain bunker",
                  ].map((s) => (
                    <button key={s} onClick={() => setPrompt(s)} className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded-full">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleGenerate} disabled={generating || !prompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Room</>}
              </button>
              {selectedUrl && (
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                  <img src={selectedUrl} alt="Generated" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold rounded-xl">
            Cancel
          </button>
          <button onClick={apply}
            className="flex-[2] py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all">
            Apply Room
          </button>
        </div>
      </div>
    </div>
  );
}