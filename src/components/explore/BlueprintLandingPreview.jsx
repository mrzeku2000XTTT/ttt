import React, { useState, useRef, useEffect, useCallback } from "react";
import { Monitor, Smartphone, Code, Eye, Copy, Check, Download, MousePointer2, Trash2, Type as TypeIcon } from "lucide-react";
import { COLORS } from "./blueprintConstants";
import { MOTION_RUNTIME_CSS, MOTION_RUNTIME_JS } from "./designSystem";

const IFRAME_SCRIPT = `
(function() {
  var selectedEl = null;
  var hoverEl = null;

  function setOutline(el, val) { el.style.outline = val; }

  document.addEventListener('mouseover', function(e) {
    if (selectedEl) return;
    if (hoverEl && hoverEl !== e.target) { hoverEl.style.outline = ''; }
    hoverEl = e.target;
    if (hoverEl !== document.body && hoverEl !== document.documentElement) {
      hoverEl.style.outline = '2px dashed #5a3fff';
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (hoverEl === e.target && hoverEl !== selectedEl) {
      hoverEl.style.outline = '';
      hoverEl = null;
    }
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (selectedEl) { selectedEl.style.outline = ''; selectedEl.style.cursor = ''; }
    selectedEl = e.target;
    if (selectedEl === document.body || selectedEl === document.documentElement) {
      selectedEl = null;
      parent.postMessage({ type: 'bp-deselect' }, '*');
      return;
    }
    var outerHTML = selectedEl.outerHTML.slice(0, 2000);
    selectedEl.style.outline = '2px solid #5a3fff';
    selectedEl.style.cursor = 'pointer';
    var cs = window.getComputedStyle(selectedEl);
    var imgSrc = '';
    if (selectedEl.tagName === 'IMG') { imgSrc = selectedEl.src; }
    else if (selectedEl.querySelector) { var innerImg = selectedEl.querySelector('img'); if (innerImg) imgSrc = innerImg.src; }
    parent.postMessage({ type: 'bp-select', data: {
      tag: selectedEl.tagName,
      text: selectedEl.innerText || '',
      src: imgSrc,
      outerHTML: outerHTML,
      styles: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        textAlign: cs.textAlign,
      }
    }}, '*');
  }, true);

  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || !msg.type) return;
    if (msg.type === 'bp-update' && selectedEl) {
      if (msg.prop === 'text') { selectedEl.innerText = msg.value; }
      else if (msg.prop === 'src') {
        if (selectedEl.tagName === 'IMG') { selectedEl.src = msg.value; }
        else if (selectedEl.querySelector) { var im = selectedEl.querySelector('img'); if (im) im.src = msg.value; }
      }
      else {
        selectedEl.style[msg.prop] = msg.value;
        // Tailwind gradient buttons paint via background-image, which sits on
        // top of background-color — clear it so the picked color is visible.
        if (msg.prop === 'backgroundColor') { selectedEl.style.backgroundImage = 'none'; }
      }
      parent.postMessage({ type: 'bp-html', html: document.body.innerHTML }, '*');
    }
    if (msg.type === 'bp-delete' && selectedEl) {
      selectedEl.style.outline = '';
      selectedEl.remove();
      selectedEl = null;
      parent.postMessage({ type: 'bp-deselect' }, '*');
      parent.postMessage({ type: 'bp-html', html: document.body.innerHTML }, '*');
    }
    if (msg.type === 'bp-deselect' && selectedEl) {
      selectedEl.style.outline = '';
      selectedEl.style.cursor = '';
      selectedEl = null;
    }
  });
})();
`;

function rgbToHex(rgb) {
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#ffffff';
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return '#000000';
  return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

function pxToNum(val) {
  if (!val) return 0;
  const m = val.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function BlueprintLandingPreview({ html, onUpdateHtml, loading, onSelectContext, onClearContext }) {
  const [device, setDevice] = useState('desktop');
  const [showCode, setShowCode] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedEl, setSelectedEl] = useState(null);
  const iframeRef = useRef(null);
  const skipRewriteRef = useRef(false);

  const fullHtml = React.useMemo(() => {
    if (!html) return '';
    const base = html.includes('<html') || html.includes('<!DOCTYPE') ? html :
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { -webkit-font-smoothing: antialiased; }
  body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
  ${MOTION_RUNTIME_CSS}
</style>
</head>
<body>
${html}
</body>
</html>`;
    return base.replace('</body>', `<script>${MOTION_RUNTIME_JS}<\/script><script>${IFRAME_SCRIPT}<\/script></body>`);
  }, [html, editMode]);

  useEffect(() => {
    // When the html update came from the iframe's own bp-html round-trip (a
    // live property edit), DON'T rewrite the iframe — that would destroy the
    // live DOM mutation, flash the preview, and reset the selected element so
    // every edit after the first is silently dropped. Skip and keep the DOM.
    if (skipRewriteRef.current) {
      skipRewriteRef.current = false;
      return;
    }
    if (iframeRef.current && fullHtml) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    }
  }, [fullHtml, device, showCode]);

  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;
      if (!msg || !msg.type) return;
      if (msg.type === 'bp-select') {
        setSelectedEl({
          tag: msg.data.tag,
          text: msg.data.text,
          src: msg.data.src || '',
          html: msg.data.outerHTML,
          color: rgbToHex(msg.data.styles.color),
          backgroundColor: rgbToHex(msg.data.styles.backgroundColor),
          fontSize: pxToNum(msg.data.styles.fontSize),
          fontWeight: msg.data.styles.fontWeight,
          padding: pxToNum(msg.data.styles.padding),
          borderRadius: pxToNum(msg.data.styles.borderRadius),
          textAlign: msg.data.styles.textAlign,
        });
        onSelectContext && onSelectContext({ tag: msg.data.tag, text: msg.data.text, src: msg.data.src || '', html: msg.data.outerHTML });
      } else if (msg.type === 'bp-deselect') {
        setSelectedEl(null);
        onClearContext && onClearContext();
      } else if (msg.type === 'bp-html') {
        // Live edit from the iframe — persist to html (for Code view / export)
        // but skip the destructive iframe rewrite (see the useEffect above).
        skipRewriteRef.current = true;
        onUpdateHtml && onUpdateHtml(msg.html);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onUpdateHtml, onSelectContext, onClearContext]);

  const sendToIframe = useCallback((msg) => {
    const win = iframeRef.current?.contentWindow;
    if (win) win.postMessage(msg, '*');
  }, []);

  const handlePropChange = (prop, value) => {
    setSelectedEl(prev => prev ? { ...prev, [prop === 'text' ? 'text' : prop]: value } : null);
    sendToIframe({ type: 'bp-update', prop, value });
  };

  const handleDelete = () => {
    sendToIframe({ type: 'bp-delete' });
    setSelectedEl(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(html || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!html) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: COLORS.CANVAS_BG }}>
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <>
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-[13px] font-medium" style={{ color: COLORS.TEXT_MED }}>Generating your landing page…</p>
              <p className="text-[11px]" style={{ color: COLORS.TEXT_LIGHT }}>Crafting sections, copy, and styling</p>
            </>
          ) : (
            <p className="text-[13px] text-center" style={{ color: COLORS.TEXT_MED }}>
              Open the <span className="font-semibold" style={{ color: COLORS.BLUE }}>Ask to Edit</span> panel and describe the site you want to generate.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: COLORS.CANVAS_BG }}>
      {/* Device toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: '#fff', borderColor: COLORS.BORDER }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${!editMode ? 'hover:bg-gray-100' : ''}`}
            style={editMode ? { background: COLORS.BLUE, color: '#fff' } : { color: COLORS.TEXT_MED }}
            title="Edit components"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 mx-0.5" style={{ background: COLORS.BORDER }} />
          <button
            onClick={() => setDevice('desktop')}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${device === 'desktop' ? '' : 'hover:bg-gray-100'}`}
            style={device === 'desktop' ? { background: COLORS.BLUE, color: '#fff' } : { color: COLORS.TEXT_MED }}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${device === 'mobile' ? '' : 'hover:bg-gray-100'}`}
            style={device === 'mobile' ? { background: COLORS.BLUE, color: '#fff' } : { color: COLORS.TEXT_MED }}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-medium transition-colors hover:bg-gray-100"
            style={{ color: showCode ? COLORS.BLUE : COLORS.TEXT_MED }}
            title="Edit code"
          >
            {showCode ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            {showCode ? 'Preview' : 'Code'}
          </button>
          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: copied ? '#16a34a' : COLORS.TEXT_MED }}
            title="Copy HTML"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MED }}
            title="Download HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-start justify-center pt-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="w-3.5 h-3.5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-[12px] font-medium" style={{ color: COLORS.TEXT_DARK }}>Editing your page…</span>
            </div>
          </div>
        )}
        {showCode ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <textarea
              value={html}
              onChange={e => onUpdateHtml(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-3 text-[11px] font-mono outline-none resize-none"
              style={{ background: '#1e1e1e', color: '#e0e0e0', lineHeight: 1.6 }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto flex justify-center p-4">
            <div
              className="bg-white rounded-lg overflow-hidden shadow-lg transition-all"
              style={{
                width: device === 'mobile' ? 390 : '100%',
                maxWidth: device === 'mobile' ? 390 : 1200,
                height: '100%',
                minHeight: 600,
              }}
            >
              <iframe
                ref={iframeRef}
                title="Landing Page Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* Component edit panel */}
        {editMode && selectedEl && !showCode && (
          <ComponentEditPanel
            selected={selectedEl}
            onPropChange={handlePropChange}
            onDelete={handleDelete}
            onClose={() => { sendToIframe({ type: 'bp-deselect' }); setSelectedEl(null); }}
          />
        )}
      </div>
    </div>
  );
}

function ComponentEditPanel({ selected, onPropChange, onDelete, onClose }) {
  const inputCls = "w-full px-2 py-1.5 text-[12px] rounded-md outline-none border";
  const labelCls = "text-[10px] font-semibold uppercase tracking-wide";
  const borderStyle = { borderColor: COLORS.BORDER };

  return (
    <div className="w-64 flex-shrink-0 border-l overflow-y-auto" style={{ background: '#fff', borderColor: COLORS.BORDER }}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b sticky top-0" style={{ ...borderStyle, background: '#fff' }}>
        <div className="flex items-center gap-1.5">
          <TypeIcon className="w-3 h-3" style={{ color: COLORS.BLUE }} />
          <span className="text-[12px] font-bold" style={{ color: COLORS.TEXT_DARK }}>
            {selected.tag.toLowerCase()}
          </span>
        </div>
        <button onClick={onClose} className="text-[11px] hover:underline" style={{ color: COLORS.TEXT_MED }}>✕</button>
      </div>

      <div className="p-3 space-y-3">
        {selected.src && (
          <div>
            <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Image</label>
            <img
              src={selected.src}
              alt="Selected element"
              className="w-full rounded-md border mt-1 mb-1.5"
              style={{ ...borderStyle, maxHeight: 120, objectFit: 'contain', background: '#f9fafb' }}
            />
            <input
              type="text"
              value={selected.src}
              onChange={e => onPropChange('src', e.target.value)}
              placeholder="Image URL"
              className={inputCls}
              style={borderStyle}
            />
          </div>
        )}
        <div>
          <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Text Content</label>
          <textarea
            value={selected.text}
            onChange={e => onPropChange('text', e.target.value)}
            rows={3}
            className={`${inputCls} mt-1 resize-none`}
            style={borderStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Text Color</label>
            <input type="color" value={selected.color} onChange={e => onPropChange('color', e.target.value)}
              className="w-full h-8 mt-1 rounded-md cursor-pointer border" style={borderStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Background</label>
            <input type="color" value={selected.backgroundColor} onChange={e => onPropChange('backgroundColor', e.target.value)}
              className="w-full h-8 mt-1 rounded-md cursor-pointer border" style={borderStyle} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Font Size (px)</label>
            <input type="number" value={selected.fontSize} onChange={e => onPropChange('fontSize', e.target.value + 'px')}
              className={`${inputCls} mt-1`} style={borderStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Font Weight</label>
            <select value={selected.fontWeight} onChange={e => onPropChange('fontWeight', e.target.value)}
              className={`${inputCls} mt-1`} style={borderStyle}>
              {['300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Padding (px)</label>
            <input type="number" value={selected.padding} onChange={e => onPropChange('padding', e.target.value + 'px')}
              className={`${inputCls} mt-1`} style={borderStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Radius (px)</label>
            <input type="number" value={selected.borderRadius} onChange={e => onPropChange('borderRadius', e.target.value + 'px')}
              className={`${inputCls} mt-1`} style={borderStyle} />
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: COLORS.TEXT_MED }}>Text Align</label>
          <div className="flex gap-1 mt-1">
            {['left','center','right'].map(a => (
              <button key={a} onClick={() => onPropChange('textAlign', a)}
                className="flex-1 py-1.5 text-[11px] rounded-md capitalize transition-colors"
                style={selected.textAlign === a
                  ? { background: COLORS.BLUE, color: '#fff' }
                  : { background: '#f3f4f6', color: COLORS.TEXT_MED }}>{a}</button>
            ))}
          </div>
        </div>

        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[12px] font-medium mt-2 transition-colors"
          style={{ background: '#fee2e2', color: '#dc2626' }}>
          <Trash2 className="w-3.5 h-3.5" /> Delete Element
        </button>
      </div>
    </div>
  );
}