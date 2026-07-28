import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Type, Heading, Square, Image as ImageIcon, MousePointerClick,
  Trash2, Layout, Eye, X
} from "lucide-react";

const EMERALD = "#0a3a2d";
const EMERALD_DARK = "#072a22";
const CREAM = "#f4efdf";
const GOLD = "#b89a66";
const GOLD_BRIGHT = "#d4b878";
const CHARCOAL = "#2e2e2e";

const ELEMENT_TYPES = [
  { type: "heading", label: "Heading", icon: Heading, defaultContent: "Your Heading", defaults: { width: 280, fontSize: 26, fontWeight: 700 } },
  { type: "text", label: "Text", icon: Type, defaultContent: "Your paragraph text goes here. Click to edit.", defaults: { width: 280, fontSize: 14, fontWeight: 400 } },
  { type: "button", label: "Button", icon: MousePointerClick, defaultContent: "Get Started", defaults: { width: 140, fontSize: 14, fontWeight: 600 } },
  { type: "box", label: "Section", icon: Square, defaultContent: "", defaults: { width: 300, fontSize: 14, fontWeight: 400 } },
  { type: "image", label: "Image", icon: ImageIcon, defaultContent: "https://images.unsplash.com/photo-1557683316-ea9c9d4e6d70?w=400", defaults: { width: 250, fontSize: 14, fontWeight: 400 } },
];

export default function BlueprintBuilder({ idea, concept }) {
  const [elements, setElements] = useState(() => {
    const init = [];
    if (concept?.name) {
      init.push(
        { id: 'el-init-1', type: 'heading', x: 20, y: 20, content: concept.name, width: 320, fontSize: 30, fontWeight: 700, color: CHARCOAL, bg: 'transparent' },
        { id: 'el-init-2', type: 'text', x: 20, y: 70, content: concept.one_liner || idea || "", width: 320, fontSize: 14, fontWeight: 400, color: `${CHARCOAL}aa`, bg: 'transparent' },
      );
      if (concept.features) {
        init.push({ id: 'el-init-3', type: 'text', x: 20, y: 130, content: concept.features.map((f) => `• ${f}`).join('\n'), width: 320, fontSize: 13, fontWeight: 400, color: `${CHARCOAL}cc`, bg: 'transparent' });
      }
    } else if (idea) {
      init.push({ id: 'el-init-1', type: 'heading', x: 20, y: 20, content: idea.slice(0, 60), width: 320, fontSize: 26, fontWeight: 700, color: CHARCOAL, bg: 'transparent' });
    }
    return init;
  });
  const [selectedId, setSelectedId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const canvasRef = useRef(null);
  const idCounter = useRef(Date.now());

  const addElement = (typeDef) => {
    const id = `el-${idCounter.current++}`;
    setElements(prev => [...prev, {
      id,
      type: typeDef.type,
      x: 30 + Math.random() * 60,
      y: 30 + Math.random() * 60,
      content: typeDef.defaultContent,
      width: typeDef.defaults.width,
      fontSize: typeDef.defaults.fontSize,
      fontWeight: typeDef.defaults.fontWeight,
      color: CHARCOAL,
      bg: typeDef.type === 'button' ? GOLD : typeDef.type === 'box' ? `${GOLD}11` : 'transparent',
    }]);
    setSelectedId(id);
    setPropsOpen(true);
  };

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(null);
    setPropsOpen(false);
  };

  const selected = elements.find(e => e.id === selectedId);

  const renderElementContent = (el) => {
    const baseStyle = { fontFamily: "'Fraunces', Georgia, serif" };
    switch (el.type) {
      case 'heading':
        return <div style={{ ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color }}>{el.content}</div>;
      case 'text':
        return <div style={{ ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{el.content}</div>;
      case 'button':
        return (
          <div style={{
            ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight,
            color: EMERALD_DARK, background: el.bg, padding: '10px 24px',
            borderRadius: 999, border: `1px solid ${GOLD}`, textAlign: 'center',
            boxShadow: `0 2px 8px ${GOLD}33`,
          }}>{el.content}</div>
        );
      case 'box':
        return <div style={{ width: '100%', height: '100%', minHeight: 80, background: el.bg, borderRadius: 8, border: `1px solid ${GOLD}44` }} />;
      case 'image':
        return <img src={el.content} alt="" style={{ width: '100%', borderRadius: 8, display: 'block' }} draggable={false} />;
      default:
        return null;
    }
  };

  const renderElement = (el) => {
    const isSelected = el.id === selectedId && !previewMode;
    return (
      <motion.div
        key={el.id}
        drag={!previewMode}
        dragMomentum={false}
        dragConstraints={canvasRef}
        onDragEnd={(e, info) => {
          updateElement(el.id, {
            x: Math.max(0, el.x + info.offset.x),
            y: Math.max(0, el.y + info.offset.y),
          });
        }}
        onClick={(e) => { e.stopPropagation(); if (!previewMode) { setSelectedId(el.id); setPropsOpen(true); } }}
        initial={false}
        animate={{ x: el.x, y: el.y }}
        className="cursor-move"
        style={{
          position: 'absolute',
          width: el.width,
          maxWidth: '90%',
          outline: isSelected ? `2px solid ${GOLD}` : 'none',
          outlineOffset: '4px',
          borderRadius: el.type === 'box' ? 8 : 0,
          touchAction: 'none',
        }}
      >
        {renderElementContent(el)}
      </motion.div>
    );
  };

  const PropertiesContent = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold uppercase" style={{ color: GOLD, letterSpacing: '0.15em' }}>Properties</p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => deleteElement(selected.id)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
            style={{ background: '#dc262620', border: '1px solid #dc262655' }}
            title="Delete element"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
          </button>
          <button
            onClick={() => setPropsOpen(false)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors lg:hidden"
            style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33` }}
            title="Close"
          >
            <X className="w-4 h-4" style={{ color: CHARCOAL }} />
          </button>
        </div>
      </div>

      {selected.type !== 'image' && selected.type !== 'box' && (
        <div className="mb-3">
          <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Content</label>
          <textarea
            value={selected.content}
            onChange={e => updateElement(selected.id, { content: e.target.value })}
            rows={selected.type === 'text' ? 3 : 2}
            className="w-full text-[12px] p-2 rounded-md outline-none resize-none"
            style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33`, color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
          />
        </div>
      )}

      {selected.type === 'image' && (
        <div className="mb-3">
          <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Image URL</label>
          <input
            type="text"
            value={selected.content}
            onChange={e => updateElement(selected.id, { content: e.target.value })}
            className="w-full text-[11px] p-2 rounded-md outline-none"
            style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33`, color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Width</label>
          <input
            type="number"
            value={selected.width}
            onChange={e => updateElement(selected.id, { width: parseInt(e.target.value) || 100 })}
            className="w-full text-[12px] p-2 rounded-md outline-none"
            style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33`, color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
          />
        </div>
        {selected.type !== 'image' && selected.type !== 'box' && (
          <div>
            <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Size</label>
            <input
              type="number"
              value={selected.fontSize}
              onChange={e => updateElement(selected.id, { fontSize: parseInt(e.target.value) || 14 })}
              className="w-full text-[12px] p-2 rounded-md outline-none"
              style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33`, color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
            />
          </div>
        )}
      </div>

      {selected.type !== 'image' && selected.type !== 'box' && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Weight</label>
            <select
              value={selected.fontWeight}
              onChange={e => updateElement(selected.id, { fontWeight: parseInt(e.target.value) })}
              className="w-full text-[12px] p-2 rounded-md outline-none"
              style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33`, color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
            >
              <option value={400}>Regular</option>
              <option value={600}>Semibold</option>
              <option value={700}>Bold</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Color</label>
            <input
              type="color"
              value={selected.color.startsWith('#') && selected.color.length === 7 ? selected.color : '#2e2e2e'}
              onChange={e => updateElement(selected.id, { color: e.target.value })}
              className="w-full h-9 rounded-md cursor-pointer"
              style={{ border: `1px solid ${GOLD}33` }}
            />
          </div>
        </div>
      )}

      {(selected.type === 'button' || selected.type === 'box') && (
        <div className="mb-3">
          <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Background</label>
          <input
            type="color"
            value={selected.bg.startsWith('#') && selected.bg.length === 7 ? selected.bg : '#b89a66'}
            onChange={e => updateElement(selected.id, { bg: e.target.value })}
            className="w-full h-9 rounded-md cursor-pointer"
            style={{ border: `1px solid ${GOLD}33` }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>X</label>
          <input
            type="number"
            value={Math.round(selected.x)}
            onChange={e => updateElement(selected.id, { x: parseInt(e.target.value) || 0 })}
            className="w-full text-[12px] p-2 rounded-md outline-none"
            style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33`, color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium block mb-1" style={{ color: `${CHARCOAL}88` }}>Y</label>
          <input
            type="number"
            value={Math.round(selected.y)}
            onChange={e => updateElement(selected.id, { y: parseInt(e.target.value) || 0 })}
            className="w-full text-[12px] p-2 rounded-md outline-none"
            style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33`, color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
          />
        </div>
      </div>
    </>
  );

  return (
    <div
      className="flex flex-col lg:flex-row gap-2 lg:gap-3"
      style={{ height: 'calc(100dvh - 5rem)', fontFamily: "'Fraunces', Georgia, serif" }}
    >
      {/* Toolbar — horizontal scroll on mobile, vertical sidebar on desktop */}
      {!previewMode && (
        <div
          className="lg:w-48 rounded-lg p-2 lg:p-3 flex flex-wrap lg:flex-nowrap lg:flex-col gap-2 lg:overflow-y-auto flex-shrink-0"
          style={{ background: CREAM, border: `1px solid ${GOLD}55` }}
        >
          <p className="hidden lg:block text-[9px] font-bold uppercase mb-1" style={{ color: GOLD, letterSpacing: '0.15em' }}>Add Element</p>
          {ELEMENT_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.type}
                onClick={() => addElement(t)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px]"
                style={{ color: CHARCOAL, background: `${GOLD}11`, border: `1px solid ${GOLD}33`, touchAction: 'manipulation' }}
              >
                <Icon className="w-4 h-4" style={{ color: GOLD }} />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => setPreviewMode(true)}
            disabled={elements.length === 0}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-[12px] font-medium transition-colors flex-shrink-0 min-h-[44px]"
            style={{ color: EMERALD_DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: `1px solid ${GOLD}` }}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={() => { if (!previewMode) { setSelectedId(null); setPropsOpen(false); } }}
        className="flex-1 rounded-lg overflow-auto relative min-h-0"
        style={{
          background: previewMode ? '#fff' : `repeating-conic-gradient(${CREAM} 0% 25%, #ebe5d4 0% 50%) 50% / 24px 24px`,
          border: `1px solid ${GOLD}55`,
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 600 }}>
          {elements.map(renderElement)}
          {elements.length === 0 && !previewMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
              <div className="text-center">
                <Layout className="w-10 h-10 mx-auto mb-2" style={{ color: `${GOLD}44` }} />
                <p className="text-[13px]" style={{ color: `${CHARCOAL}66` }}>Add elements from the toolbar to start building</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties — desktop: right sidebar, mobile: slide-up bottom sheet */}
      {!previewMode && selected && propsOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => { setSelectedId(null); setPropsOpen(false); }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="lg:w-56 rounded-t-xl lg:rounded-lg p-4 overflow-y-auto fixed lg:static bottom-0 left-0 right-0 z-50 lg:z-auto max-h-[60vh] lg:max-h-none"
            style={{ background: CREAM, border: `1px solid ${GOLD}55` }}
          >
            {PropertiesContent()}
          </motion.div>
        </>
      )}

      {/* Preview mode banner */}
      {previewMode && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex items-center gap-2"
          style={{ background: EMERALD_DARK, border: `1px solid ${GOLD}`, boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}
        >
          <Eye className="w-4 h-4" style={{ color: GOLD_BRIGHT }} />
          <span className="text-[12px] font-medium" style={{ color: CREAM }}>Preview Mode</span>
          <button
            onClick={() => setPreviewMode(false)}
            className="text-[12px] font-semibold underline ml-2"
            style={{ color: GOLD_BRIGHT }}
          >Exit</button>
        </div>
      )}
    </div>
  );
}