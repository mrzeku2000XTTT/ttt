import React from 'react';

// Ambient background video for the wallet lock screens.
// Fully transparent content sits on top of this — no blur, no dim overlay.
const VIDEO_SRC =
  'https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/583149459_vibe-video76.mp4';

export default function WalletBgVideo() {
  return (
    <video
      className="fixed inset-0 w-full h-full object-contain bg-black z-0 pointer-events-none"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      src={VIDEO_SRC}
    />
  );
}