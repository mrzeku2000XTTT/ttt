import React, { useEffect, useRef, useState } from 'react';

/**
 * Type directly on the canvas. The stage stops drawing its own words while this
 * is up, so the editable type — matching the scene's font, weight, size and
 * gradient — sits exactly where the render puts it.
 */
export default function LumiflyTextEditor({ scene, onText, onDone }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Uncontrolled on purpose: React must never rewrite the node's text while the
  // caret is in it, or every keystroke would jump back to the start.
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.textContent = scene.text || '';
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);

  const unit = box.h / 1080;
  const fontPx = Math.max(10, (Number(scene.fontSize) || 300) * unit);
  const offsetX = (Number(scene.slideEnd) || 0) * unit;
  const colors = scene.textColors?.length === 3 ? scene.textColors : ['#ffffff', '#ffe9d6', '#d8a47f'];
  const pos = scene.textPos || { x: 0.5, y: 0.5 };

  return (
    <div
      ref={boxRef}
      onMouseDown={(e) => {
        if (e.target === boxRef.current) onDone();
      }}
      className="absolute inset-0 bg-black/45"
    >
      <div
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(e) => {
          const value = e.currentTarget.innerText.replace(/\s*\n+\s*/g, ' ');
          onText(value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            onDone();
          }
        }}
        className="max-w-[90%] cursor-text text-center outline-none"
        style={{
          position: 'absolute',
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          fontSize: `${fontPx}px`,
          fontFamily: `"${scene.fontFamily || 'SF Pro Display'}", system-ui, -apple-system, sans-serif`,
          fontWeight: Number(scene.weight) || 700,
          lineHeight: 1.14,
          minHeight: `${fontPx}px`,
          transform: `translate(-50%, -50%) translateX(${offsetX}px)`,
          backgroundImage: `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          caretColor: '#ffffff',
        }}
      />
    </div>
  );
}