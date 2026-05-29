import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ThumbnailSourceUploader({ imageUrls = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const result = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(result.file_url);
    }
    await onChange([...(imageUrls || []), ...uploaded], uploaded);
    setUploading(false);
    event.target.value = "";
  };

  const removeImage = (url) => onChange(imageUrls.filter((item) => item !== url));

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/40 px-4 py-4 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "Uploading references..." : "Ingest reference images"}
      </button>
      {!!imageUrls.length && (
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
              <img src={url} alt="Reference" className="aspect-video w-full object-cover" />
              <button onClick={() => removeImage(url)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}