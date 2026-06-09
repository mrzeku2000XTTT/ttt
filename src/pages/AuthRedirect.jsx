import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Renders the Kaspa loader and immediately calls base44.auth.redirectToLogin().
 * Mounted at /login to prevent base44's server-side fallback page list from
 * flashing before the real login UI appears.
 */
export default function AuthRedirect() {
  useEffect(() => {
    // Guard against the redirect firing twice (which created a /login refresh
    // loop). Only ever trigger the hosted login once per page load.
    if (window.__tttLoginRedirected) return;
    window.__tttLoginRedirected = true;

    const t = setTimeout(() => {
      try {
        base44.auth.redirectToLogin(window.location.origin + "/");
      } catch (e) {
        window.location.replace("/");
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          position: "relative",
          animation: "lr-float 2.4s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-20%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(73,234,200,0.35) 0%, rgba(73,234,200,0) 65%)",
            animation: "lr-pulse 2.4s ease-in-out infinite",
          }}
        />
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: "100%",
            height: "100%",
            animation: "lr-spin 3.2s cubic-bezier(.6,.05,.4,.95) infinite",
            filter: "drop-shadow(0 0 18px rgba(73, 234, 200, 0.55))",
          }}
        >
          <defs>
            <linearGradient id="lr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#70F0CC" />
              <stop offset="100%" stopColor="#26B198" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill="url(#lr-grad)" />
          <path
            d="M70 50 L70 150 M70 100 L130 50 M70 100 L130 150"
            stroke="#0b1b18"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <div
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 13,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
        }}
      >
        Connecting
      </div>
      <style>{`
        @keyframes lr-spin { 0% { transform: rotate(0deg); } 50% { transform: rotate(180deg); } 100% { transform: rotate(360deg); } }
        @keyframes lr-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes lr-pulse { 0%, 100% { opacity: 0.4; transform: scale(0.9); } 50% { opacity: 0.9; transform: scale(1.15); } }
      `}</style>
    </div>
  );
}