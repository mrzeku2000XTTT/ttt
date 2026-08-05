import React from "react";
import PowerInput from "@/components/agentinternet/PowerInput";

/**
 * PowerConsole — the live power input on the landing. On submit, the command
 * is forwarded up so the landing opens the fullscreen Agent Internet chat
 * (real output, not inline words).
 */
export default function PowerConsole({ onSubmit }) {
  return (
    <div className="w-full">
      <PowerInput onSubmit={onSubmit} />
    </div>
  );
}