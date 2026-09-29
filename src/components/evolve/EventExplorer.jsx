import React from "react";
import PanelShell from "./PanelShell";
import RecentEvents from "./RecentEvents";

/** EventExplorer — the full event log, filterable by category. */
export default function EventExplorer({ onClose, onPick }) {
  return (
    <PanelShell title="Event Explorer" subtitle="Every state change in the experiment" onClose={onClose} width={400}>
      <RecentEvents limit={260} onPick={onPick} />
    </PanelShell>
  );
}