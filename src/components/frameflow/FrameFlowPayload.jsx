import React from "react";

/** The exact request sent for the sequence — motion, timing, camera and style lock. */
export default function FrameFlowPayload({ payload }) {
  return (
    <section className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">GENERATION REQUEST</span>
        <span className="ff-dim text-[11px]">one call per in-between</span>
      </div>
      <div className="p-[18px]">
        <pre className="ff-pre">{payload ? JSON.stringify(payload, null, 2) : "No request yet."}</pre>
      </div>
    </section>
  );
}