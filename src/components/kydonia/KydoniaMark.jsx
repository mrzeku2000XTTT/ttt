import React from "react";
import KydoniaAscii from "./KydoniaAscii";

// The same globe as the hero, at mark scale — used in the header and studio bar.
export default function KydoniaMark({ className = "" }) {
  return (
    <div
      className={`kyd-mark overflow-hidden rounded-[9px] border border-[#23262d] bg-[#0b0d11] p-[3px] ${className}`}
      style={{ width: 34 }}
    >
      <KydoniaAscii rows={9} cols={16} label="KYDONIA" />
    </div>
  );
}