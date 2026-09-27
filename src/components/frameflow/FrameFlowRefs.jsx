import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { readImageFile } from "./frameFlowUpload";

/** The two references the whole sequence hangs on: where it starts and where it lands. */
export default function FrameFlowRefs({ refs, onPick, disabled, onError }) {
  const startInput = useRef(null);
  const endInput = useRef(null);
  const [dragging, setDragging] = useState("");

  const take = async (file, key) => {
    try {
      const dataUrl = await readImageFile(file);
      onPick(key, dataUrl);
    } catch (error) {
      onError(error.message);
    }
  };

  const slot = (key, label, hint, inputRef) => (
    <div className="ff-ref">
      <span className="ff-ref-label">{label}</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) take(file, key);
          event.target.value = "";
        }}
      />

      {refs[key] ? (
        <>
          <img src={refs[key].dataUrl} alt={`${label} reference`} className="ff-ref-img" />
          <button
            type="button"
            className="ff-btn ff-btn-small absolute right-3 top-3 z-10"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Replace
          </button>
        </>
      ) : (
        <button
          type="button"
          className={`ff-drop ${dragging === key ? "is-drag" : ""}`}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(key);
          }}
          onDragLeave={() => setDragging("")}
          onDrop={(event) => {
            event.preventDefault();
            setDragging("");
            const file = event.dataTransfer.files?.[0];
            if (file) take(file, key);
          }}
        >
          <Upload className="h-9 w-9 opacity-60" />
          <strong>{hint}</strong>
          <span>or click to browse</span>
        </button>
      )}
    </div>
  );

  return (
    <section className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">REFERENCE FRAMES</span>
        <span className="ff-dim text-[11px]">PNG / JPG / WEBP</span>
      </div>
      <div className="ff-ref-grid">
        {slot("start", "START", "Drop start frame", startInput)}
        {slot("end", "END", "Drop end frame", endInput)}
      </div>
    </section>
  );
}