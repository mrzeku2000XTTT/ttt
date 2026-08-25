import React, { useState } from "react";
import { DD_APP_DOMAINS, DD_APP_COLORS } from "@/components/dd/ddAppDomains";
import { GOOGLE_LOGOS } from "@/components/dd/DDGoogleLogos";

// Renders a real brand logo for any DD Store app.
// Priority: custom SVG (Google Workspace / Claude / Gemini / ChatGPT) → favicon img → letter avatar.
export default function DDAppLogo({ name, className = "w-6 h-6" }) {
  const [imgError, setImgError] = useState(false);

  // 1. Try a custom SVG from the GOOGLE_LOGOS registry
  const key = name?.toLowerCase().replace(/\s/g, "");
  const CustomLogo = GOOGLE_LOGOS[key];
  if (CustomLogo) return <CustomLogo className={className} />;

  // 2. Try a favicon from Google's favicon service
  const domain = DD_APP_DOMAINS[name];
  if (domain && !imgError) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={name}
        className={className}
        style={{ objectFit: "contain" }}
        onError={() => setImgError(true)}
      />
    );
  }

  // 3. Fallback: colored letter avatar
  const letter = (name || "?")[0].toUpperCase();
  const color = DD_APP_COLORS[name] || "#6b7280";
  return (
    <div
      className={`${className} rounded-md flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: color, fontSize: "0.6rem" }}
    >
      {letter}
    </div>
  );
}