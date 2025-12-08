import React, { useEffect } from "react";

export default function KASIAPage() {
  useEffect(() => {
    // Signal to Layout that KASIA iframe should be visible
    const event = new CustomEvent('showKasiaIframe', { detail: { show: true } });
    window.dispatchEvent(event);

    return () => {
      // Hide iframe when leaving KASIA page
      const event = new CustomEvent('showKasiaIframe', { detail: { show: false } });
      window.dispatchEvent(event);
    };
  }, []);

  return null; // Layout handles the iframe rendering
}