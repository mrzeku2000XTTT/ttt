import React from "react";

/**
 * Renders the user's media (image OR video) inside any container.
 * Used by all DeviceFrame variants — replaces raw <img> usage so video plays in-place.
 */
export default function DeviceMedia({ media, className = "", style = {} }) {
  if (!media) return null;
  if (media.type === "video") {
    return (
      <video
        src={media.url}
        className={className}
        style={style}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
      />
    );
  }
  return (
    <img
      src={media.url}
      alt=""
      className={className}
      style={style}
      crossOrigin="anonymous"
    />
  );
}