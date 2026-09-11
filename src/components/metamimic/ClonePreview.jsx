import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function ClonePreview({ html, width = 1200, height = 800 }) {
  const container = useRef(null);
  const frame = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(400);
  const [contentHeight, setContentHeight] = useState(height);
  const sourceWidth = width || 1200;
  const channel = useMemo(() => `clone-${crypto.randomUUID()}`, [html]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setContentHeight(height || 800);
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
  const scale = Math.min(1, availableWidth / sourceWidth);
  return (
    <div ref={container} className="w-full overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative mx-auto" style={{ width: sourceWidth * scale, height: contentHeight * scale }}>
        <iframe ref={frame} title="Full-page clone preview" sandbox="allow-scripts" srcDoc={document} scrolling="no" className="absolute left-0 top-0 origin-top-left border-0" style={{ width: sourceWidth, height: contentHeight, transform: `scale(${scale})` }} />
      </div>
    </div>
  );
}