import React from "react";

const OpenAIMark = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#ECECEC">
    <path d="M22.28 9.82a5.99 5.99 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.99 5.99 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.99 5.99 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zm-9.02 12.61a4.48 4.48 0 0 1-2.87-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.06v5.58a4.5 4.5 0 0 1-4.5 4.49zm-9.66-4.13a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.74 20a4.5 4.5 0 0 1-6.14-1.7zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97v5.67a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.9zm16.6 3.86-5.83-3.39 2.01-1.17a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.66a.79.79 0 0 0-.4-.67zm2.01-3.02-.14-.09-4.77-2.79a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zm-12.6 4.14L6.33 11.7a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08-4.78 2.76a.79.79 0 0 0-.39.68zm1.1-2.37 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z" />
  </svg>
);

const AnthropicMark = ({ size = 16, color = "#D97757" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M12 1.5l1.7 6.1 5.2-3.4-3.4 5.2 6.1 1.7-6.1 1.7 3.4 5.2-5.2-3.4L12 22.5l-1.7-6.1-5.2 3.4 3.4-5.2-6.1-1.7 6.1-1.7-3.4-5.2 5.2 3.4z" />
  </svg>
);

const OrbMark = ({ size = 16 }) => (
  <span className="rounded-full flex-shrink-0 inline-block" style={{
    width: size, height: size,
    background: "radial-gradient(circle at 32% 28%, #a7b8ff 0%, #4d6bfe 42%, #2a2a6a 78%, #0c0c1c 100%)",
    boxShadow: "0 0 8px rgba(77,107,254,0.6)",
  }} />
);

const FableMark = ({ size = 16 }) => (
  <span className="flex-shrink-0 inline-flex items-center justify-center font-black" style={{
    width: size, height: size, fontSize: size * 0.85, lineHeight: 1,
    background: "linear-gradient(135deg, #c084fc, #7c3aed)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    fontFamily: "Georgia, serif", fontStyle: "italic",
  }}>F</span>
);

const SolMark = ({ size = 16 }) => (
  <span className="rounded-full flex-shrink-0 inline-flex items-center justify-center" style={{ width: size, height: size, background: "#111" }}>
    <span className="font-black" style={{
      fontSize: size * 0.62, lineHeight: 1,
      background: "linear-gradient(135deg, #14F195, #9945FF)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    }}>S</span>
  </span>
);

const BasicMark = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="#9ca3af" strokeWidth="2.4" strokeLinecap="round" fill="none">
    <path d="M4 8h16M6 12h12M8 16h8" />
  </svg>
);

export default function ModelLogo({ logo, size = 16 }) {
  if (logo === "openai") return <OpenAIMark size={size} />;
  if (logo === "anthropic") return <AnthropicMark size={size} />;
  if (logo === "orb") return <OrbMark size={size} />;
  if (logo === "fable") return <FableMark size={size} />;
  if (logo === "sol") return <SolMark size={size} />;
  if (logo === "basic") return <BasicMark size={size} />;
  return <OrbMark size={size} />;
}