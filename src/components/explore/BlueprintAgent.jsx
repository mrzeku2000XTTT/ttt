import React, { useState, useRef } from "react";
import { Bot, X, Loader2, Image as ImageIcon, MousePointer2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COLORS } from "./blueprintConstants";

export default function BlueprintAgent({ onGenerate, onUploadImage, loading, onClose, selectedContext }) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async (file) => {
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (err) {
      setError('Failed to upload image');
    }
    setUploading(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageUrl) {
      setError('Enter a prompt or upload an image');
      return;
    }
    setError('');
    try {
      await onGenerate({ prompt: prompt.trim(), imageUrl, selectedContext });
    } catch (err) {
      setError(err.message || 'Generation failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 rounded-xl" style={{ background: '#fff', border: `1px solid ${COLORS.BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" style={{ color: COLORS.BLUE }} />
          <p className="text-sm font-bold" style={{ color: COLORS.TEXT_DARK }}>Ask to Edit</p>
        </div>
        <div className="flex items-center gap-3">
          {imageUrl && (
            <button onClick={() => setImageUrl('')} className="text-[11px]" style={{ color: COLORS.TEXT_MED }}>
              Clear image
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MED }}
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Attached element context — the agent will edit only this element */}
      {selectedContext && (
        <div className="mb-3 flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
          {selectedContext.src ? (
            <img src={selectedContext.src} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" style={{ border: '1px solid #c7d2fe' }} />
          ) : (
            <MousePointer2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: COLORS.BLUE }} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.TEXT_MED }}>Attached element</p>
            <p className="text-[11px] truncate" style={{ color: COLORS.TEXT_DARK }}>
              &lt;{selectedContext.tag.toLowerCase()}&gt; {selectedContext.text ? `"${selectedContext.text.slice(0, 40)}"` : 'selected'}
            </p>
          </div>
        </div>
      )}

      {/* Image upload zone */}
      <div className="mb-3">
        {imageUrl ? (
          <div className="relative rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.BORDER}` }}>
            <img src={imageUrl} alt="Reference" className="w-full max-h-40 object-contain" style={{ background: '#f9fafb' }} />
            <button
              onClick={() => setImageUrl('')}
              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 rounded-lg flex flex-col items-center gap-2 transition-colors hover:bg-gray-50"
            style={{ border: `2px dashed ${COLORS.BORDER}`, background: '#f9fafb' }}
          >
            <ImageIcon className="w-6 h-6" style={{ color: COLORS.TEXT_MED }} />
            <span className="text-[12px]" style={{ color: COLORS.TEXT_MED }}>
              {uploading ? 'Uploading...' : 'Upload a screenshot or mockup'}
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
        />
      </div>

      {/* Prompt input */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={selectedContext ? "Describe how to edit the attached element (only it will change)…" : "Describe the site you want, or say 'recreate the uploaded image as a landing page'..."}
        rows={3}
        className="w-full text-[13px] p-2.5 rounded-lg outline-none resize-none mb-3"
        style={{ border: `1px solid ${COLORS.BORDER}`, color: COLORS.TEXT_DARK, fontFamily: "'Inter', system-ui, sans-serif" }}
      />

      {error && <p className="text-[11px] mb-2" style={{ color: '#dc2626' }}>{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-opacity"
        style={{ background: COLORS.BLUE, color: '#fff', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {selectedContext ? 'Editing element…' : 'Generating landing page…'}</> : <><Bot className="w-4 h-4" /> {selectedContext ? 'Edit element' : 'Generate site'}</>}
      </button>
    </div>
  );
}