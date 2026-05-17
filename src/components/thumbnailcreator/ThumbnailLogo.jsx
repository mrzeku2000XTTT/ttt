import React from "react";

export const THUMBNAIL_CREATOR_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6ac2ec072_generated_image.png";

export default function ThumbnailLogo({ className = "w-14 h-14" }) {
  return (
    <img
      src={THUMBNAIL_CREATOR_LOGO}
      alt="TTT Thumbnail Creator"
      className={`${className} rounded-2xl object-cover shadow-2xl shadow-cyan-500/20 ring-1 ring-white/15`}
    />
  );
}