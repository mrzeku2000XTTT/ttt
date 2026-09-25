import React, { useEffect, useMemo, useRef, useState } from 'react';

/** Renders the built component sheet at its source size, scaled to fit. */
export default function KilnFrame({ html, width = 1440, height = 900, maxWidth = null, className = '' }) {
  const container = useRef(null);
  const frame = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(600);
  const [contentHeight, setContentHeight] = useState(height);
  const sourceWidth = width || 1440;
  const channel = useMemo(() => `kiln-${Math.random().toString(36).slice(2)}`, [html]);

  useEffect(() => {
    const element = container.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setContentHeight(height || 900);
    const receive = (event) => {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== channel) return;
      const next = Number(event.data.height);
      if (Number.isFinite(next) && next > 0 && next <= 50000) setContentHeight(Math.max(height || 0, next));
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [channel, height]);

  const document = useMemo(() => {
    const reporter = `<script>(()=>{const send=()=>parent.postMessage({channel:${JSON.stringify(channel)},height:Math.max(document.body.scrollHeight,document.body.offsetHeight)},'*');new ResizeObserver(send).observe(document.body);window.addEventListener('load',send);document.fonts.ready.then(send);send();})();<\/script>`;
    return html.replace(/<\/body>/i, `${reporter}</body>`);
  }, [html, channel]);

  const scale = Math.min(1, (maxWidth || availableWidth) / sourceWidth);

  return (
    <div ref={container} className={className} style={{ width: '100%' }}>
      <div className="relative mx-auto" style={{ width: sourceWidth * scale, height: contentHeight * scale }}>
        <iframe
          ref={frame}
          title="KILN component preview"
          sandbox="allow-scripts"
          srcDoc={document}
          scrolling="no"
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: sourceWidth, height: contentHeight, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}