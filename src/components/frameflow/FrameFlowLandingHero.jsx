import React, { useRef, useState } from "react";
import { ArrowRight, Loader2, Upload } from "lucide-react";
import FrameFlowHeroMockup from "./FrameFlowHeroMockup";
import { readImageFile } from "./frameFlowUpload";

export default function FrameFlowLandingHero({ onSeed, onEnter, onExit }) {
  const inputRef = useRef(null);
  const [startSrc, setStartSrc] = useState(null);
  const [endSrc, setEndSrc] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  const take = async (file, key) => {
    try {
      setReading(true);
      setError("");
      const dataUrl = await readImageFile(file);
      if (key === "start") setStartSrc(dataUrl);
      else setEndSrc(dataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) take(file, startSrc ? "end" : "start");
  };

  return (
    <section className="ff-grid-bg border-b border-[#292c30]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <span className="ff-chip w-fit">AI keyframe interpolation</span>

          <h1 className="mt-6 text-[34px] leading-[1.05] sm:text-[46px]">
            Start frame → motion →
            <br />
            <span className="ff-grad-text">end frame.</span>
          </h1>

          <p className="ff-dim mt-5 max-w-lg text-[14px] leading-relaxed">
            Upload two references, describe the movement, and get a connected sequence of hand-drawn in-between
            frames. The permanent drawing style stays locked, so every frame speaks the same visual language — and any
            single bad frame can be regenerated on its own.
          </p>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`ff-panel mt-8 max-w-lg p-5 ${dragging ? "is-drag" : ""}`}
            style={dragging ? { outline: "1px dashed #6f757d", outlineOffset: "-10px" } : undefined}
          >
            <div className="ff-row mb-3">
              <span className="text-[12px] font-bold tracking-[0.1em] uppercase">Your start frame</span>
              <span className="ff-dim text-[10px]">PNG / JPG / WEBP</span>
            </div>

            {startSrc ? (
              <img src={startSrc} alt="Start frame" className="max-h-52 w-full rounded-[10px] object-contain bg-[#ededed]" />
            ) : (
              <div className="ff-dim flex flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#33383f] py-10 text-[12px]">
                <Upload className="h-6 w-6 opacity-60" />
                Drop your start frame here
                <span className="text-[11px]">or browse below</span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) take(file, startSrc ? "end" : "start");
                  event.target.value = "";
                }}
              />
              <button type="button" className="ff-btn flex-1" onClick={() => inputRef.current?.click()} disabled={reading}>
                {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {startSrc ? "Add the end frame" : "Choose start frame"}
              </button>
              <button
                type="button"
                className="ff-btn ff-btn-primary flex-1"
                onClick={() => onSeed(startSrc, endSrc)}
              >
                Open the studio
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="ff-dim mt-3 text-[11px]">
              {startSrc && endSrc
                ? "Both references ready — the studio opens with them loaded."
                : "Frames are uploaded privately, then signed only for the length of a generation run."}
            </p>
            {error && <p className="mt-2 text-[12px] text-[#ff6b6b]">{error}</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className="ff-btn" onClick={onEnter}>
              Skip straight into the studio
            </button>
            <span className="ff-dim text-[11px] tracking-[0.08em] uppercase">No wallet, no account</span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <FrameFlowHeroMockup startSrc={startSrc} endSrc={endSrc} />
        </div>
      </div>
    </section>
  );
}