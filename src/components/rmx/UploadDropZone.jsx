import React, { useState, useRef } from 'react';
import { Loader2, X } from 'lucide-react';

/**
 * Reusable upload zone with click-to-browse AND drag-and-drop support.
 *
 * Why this component exists: a `<label>` wrapping a hidden file input will
 * intercept native drop events (the browser tries to send the dropped file
 * INTO the file input, which only works for click-selected files). To make
 * drag-and-drop reliable we manage state explicitly and call the consumer's
 * onUpload(file) for both click AND drop events.
 */
export default function UploadDropZone({
  value,           // current image url (or null)
  onUpload,        // (file: File) => void
  onClear,         // () => void
  uploading,       // boolean
  label,           // small caption shown when empty
  hint,            // secondary hint text
  className = '',
  iconSlot,        // optional ReactNode shown when empty (defaults handled by caller)
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleClick = () => {
    if (!uploading && !value) inputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = ''; // allow re-uploading same file
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    console.log('[UploadDropZone] drop fired:', { file, type: file?.type, name: file?.name });
    if (file && file.type?.startsWith('image/')) {
      console.log('[UploadDropZone] calling onUpload with file');
      onUpload(file);
    } else if (file) {
      alert('Please drop an image file');
    } else {
      console.warn('[UploadDropZone] No file in drop event');
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-zinc-900 border-2 border-dashed rounded-lg overflow-hidden transition-colors cursor-pointer ${
        isDragOver
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-zinc-700 hover:border-zinc-600'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />

      {value ? (
        <>
          <img src={value} alt={label || 'upload'} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          {onClear && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1 right-1 w-6 h-6 bg-black/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </>
      ) : uploading ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {iconSlot}
          {label && <span className="text-zinc-700 text-[8px] mt-1">{label}</span>}
          {hint && <span className="text-zinc-700 text-[7px]">{hint}</span>}
        </div>
      )}
    </div>
  );
}