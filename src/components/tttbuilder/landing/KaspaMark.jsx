import React from "react";

// Official Kaspa logo (KAS coin mark)
export const KASPA_LOGO = "https://cryptologos.cc/logos/kaspa-kas-logo.png";

export default function KaspaMark({ size = 24, glow = false, className = "" }) {
  return (
    <span
      className={`inline-block rounded-full overflow-hidden flex-shrink-0 ${glow ? "shadow-[0_0_32px_rgba(0,255,153,0.55)]" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={KASPA_LOGO} alt="Kaspa" className="w-full h-full object-cover rounded-full" />
    </span>
  );
}