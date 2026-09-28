import React from "react";

/** One numbered block of the studio panel. */
export default function PanelSection({ number, title, children }) {
  return (
    <section className="ts-section">
      <h2 className="ts-section-title">
        <span className="ts-num">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}