// Explodes a cloned HTML document into individual visual layers (text, artwork
// crops, backdrops, shapes) with their measured geometry & styles — the same
// MetaMimic clone engine output, decomposed for the CAM Fusion 3D stage.
const SKIP = new Set(['script', 'style', 'link', 'meta', 'title', 'head', 'noscript', 'br', 'hr', 'iframe']);

export function extractLayers(html, srcW, srcH) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    Object.assign(frame.style, {
      position: 'fixed', left: '0', top: '0', width: `${srcW}px`, height: `${srcH}px`,
      visibility: 'hidden', pointerEvents: 'none', border: '0', zIndex: '-1',
    });
    document.body.appendChild(frame);
    frame.onload = async () => {
      const out = [];
      try {
        const doc = frame.contentDocument;
        try { await doc.fonts?.ready; } catch {}
        const win = frame.contentWindow;
        for (const el of doc.body.querySelectorAll('*')) {
          if (out.length >= 80) break;
          const tag = el.tagName.toLowerCase();
          if (SKIP.has(tag) || tag === 'body') continue;
          const r = el.getBoundingClientRect();
          if (r.width < 3 || r.height < 3 || r.bottom < 0 || r.right < 0 || r.top > srcH || r.left > srcW) continue;
          const cs = win.getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
          const css = {
            fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle,
            color: cs.color, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform,
            textAlign: cs.textAlign, padding: cs.padding, bgColor: cs.backgroundColor, bgImage: cs.backgroundImage,
            bgSize: cs.backgroundSize, bgPos: cs.backgroundPosition, bgRepeat: cs.backgroundRepeat,
            radius: cs.borderRadius, border: cs.border,
          };
          const base = { tag, x: r.left, y: r.top, w: r.width, h: r.height, css };
          const innerImg = el.querySelector('img');
          if (tag === 'img') {
            out.push({ ...base, kind: 'crop', src: el.currentSrc || el.src, ox: 0, oy: 0, iw: r.width, ih: r.height });
            continue;
          }
          if (innerImg && cs.overflow.includes('hidden')) {
            const ir = innerImg.getBoundingClientRect();
            if (ir.width > r.width + 2 || ir.height > r.height + 2) {
              out.push({ ...base, kind: 'crop', src: innerImg.currentSrc || innerImg.src, ox: ir.left - r.left, oy: ir.top - r.top, iw: ir.width, ih: ir.height });
              continue;
            }
          }
          const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
          if (text) { out.push({ ...base, kind: 'text', text }); continue; }
          if (cs.backgroundImage !== 'none') { out.push({ ...base, kind: 'bg' }); continue; }
          if (!el.children.length && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') out.push({ ...base, kind: 'shape' });
        }
      } catch (err) {
        console.warn('Fusion extraction issue:', err);
      }
      frame.remove();
      resolve(out);
    };
    frame.srcdoc = html;
  });
}