import React, { useRef } from "react";
import { MousePointer2, Hand, Square, Upload, Eye, EyeOff, Bot, Code, Plus, Minus, Type, Image as ImageIcon, Video, FileCode, Layout } from "lucide-react";
import { COLORS, ELEMENT_TYPES } from "./blueprintConstants";

const TOOL_ICONS = {
  heading: Type,
  text: Type,
  button: MousePointer2,
  box: Square,
  image: ImageIcon,
  video: Video,
};

export default function BlueprintToolbar({
  tool, setTool, previewMode, setPreviewMode, agentMode, setAgentMode,
  zoom, onZoomChange, onAddElement, onUploadFile, codeMode, setCodeMode, onImportHtml,
  landingMode, setLandingMode
}) {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-2xl" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', border: `1px solid ${COLORS.BORDER}` }}>
        {/* Selection tool */}
        <ToolButton active={tool === 'select' && !previewMode} onClick={() => { setTool('select'); setPreviewMode(false); }} icon={MousePointer2} />

        {/* Pan tool */}
        <ToolButton active={tool === 'pan' && !previewMode} onClick={() => { setTool('pan'); setPreviewMode(false); }} icon={Hand} />

        {/* Shape (adds box) */}
        <ToolButton onClick={() => onAddElement('box')} icon={Square} />

        {/* Upload */}
        <ToolButton onClick={() => fileInputRef.current?.click()} icon={Upload} />

        {/* Import HTML */}
        <ToolButton onClick={onImportHtml} icon={FileCode} />

        {/* Divider */}
        <div className="w-px h-6 mx-0.5" style={{ background: COLORS.BORDER }} />

        {/* Ask to edit (agent toggle) */}
        <button
          onClick={() => setAgentMode(!agentMode)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap"
          style={agentMode
            ? { background: COLORS.BLUE, color: '#fff' }
            : { background: '#eef2ff', color: COLORS.BLUE, border: `1px solid #c7d2fe` }}
        >
          <Bot className="w-3.5 h-3.5" />
          {agentMode ? 'Agent ON' : 'Ask to edit'}
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-0.5" style={{ background: COLORS.BORDER }} />

        {/* Landing mode toggle */}
        <ToolButton active={landingMode} onClick={() => { setLandingMode(!landingMode); setCodeMode(false); }} icon={Layout} />

        {/* Code mode toggle */}
        <ToolButton active={codeMode} onClick={() => setCodeMode(!codeMode)} icon={Code} />

        {/* Preview toggle */}
        <ToolButton active={previewMode} onClick={() => setPreviewMode(!previewMode)} icon={previewMode ? EyeOff : Eye} />

        {/* Divider */}
        <div className="w-px h-6 mx-0.5" style={{ background: COLORS.BORDER }} />

        {/* Zoom controls */}
        <button
          onClick={() => onZoomChange(z => Math.max(0.1, z - 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <Minus className="w-3.5 h-3.5" style={{ color: COLORS.TEXT_DARK }} />
        </button>
        <span className="text-[11px] font-medium px-1 min-w-[36px] text-center" style={{ color: COLORS.TEXT_DARK }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(z => Math.min(3, z + 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: COLORS.TEXT_DARK }} />
        </button>
      </div>
    </>
  );
}

function ToolButton({ active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors min-h-[44px] min-w-[44px] lg:min-h-[32px] lg:min-w-[32px]"
      style={active
        ? { background: COLORS.BLUE, color: '#fff' }
        : { color: COLORS.TEXT_DARK }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f3f4f6'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}