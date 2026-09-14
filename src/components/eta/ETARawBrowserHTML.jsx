import React from 'react';

const STAGE_WIDTH = 672;

export default function ETARawBrowserHTML({ html, viewportWidth = 1400, viewportHeight = 895 }) {
  const width = Math.max(320, Number(viewportWidth) || 1400);
  const height = Math.max(240, Number(viewportHeight) || 895);
  const scale = STAGE_WIDTH / width;

  return <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: `${width} / ${height}` }}>
    <iframe
      title="Generated browser interface"
      srcDoc={String(html)}
      sandbox=""
      tabIndex={-1}
      className="pointer-events-none absolute left-0 top-0 border-0"
      style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
    />
  </div>;
}