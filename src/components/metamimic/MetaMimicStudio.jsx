import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Code2, Eye, Copy, Download, Check, AlertCircle } from "lucide-react";

export default function MetaMimicStudio() {
  const fileInputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("preview");
  const [copied, setCopied] = useState(false);

  const pickFile = () => fileInputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setHtml("");
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (err) {
      setError("Upload failed. Please try another image.");
    }
    setUploading(false);
  };

  const generate = async () => {
    if (!imageUrl || generating) return;
    setError("");
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("metaMimicClone", { imageUrl });
      if (res?.data?.html) {
        setHtml(res.data.html);
        setTab("preview");
      } else {
        setError(res?.data?.error || "Could not generate HTML. Try another image.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Generation failed. Please try again.");
    }
    setGenerating(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metamimic-clone.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="studio" className="px-6 py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10 text-center">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[#4A90E2]">
            Studio
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-black tracking-tight">
            Drop an image — get HTML
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload panel */}
          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={pickFile}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-black/20 px-6 py-12 text-center transition hover:border-[#4A90E2]/60 hover:bg-black/30"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#4A90E2]" />
              ) : imageUrl ? (
                <img src={imageUrl} alt="upload preview" className="max-h-48 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-[#4A90E2]" />
                  <span className="text-sm font-semibold text-white">Click to upload a screenshot</span>
                  <span className="text-xs text-white/50">PNG, JPG — a UI or web page works best</span>
                </>
              )}
            </button>

            <button
              onClick={generate}
              disabled={!imageUrl || generating || uploading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#2C3E50] px-7 py-3.5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cloning… (~60s)
                </>
              ) : (
                <>
                  <Code2 className="h-4 w-4" /> Generate HTML clone
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Result panel */}
          <div className="flex min-h-[320px] flex-col rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-3">
            {!html ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-white/40">
                <Eye className="h-7 w-7" />
                <p className="text-sm">Your clone preview & code appear here</p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex gap-1 rounded-full bg-black/30 p-1">
                    <button
                      onClick={() => setTab("preview")}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === "preview" ? "bg-[#4A90E2] text-white" : "text-white/60"}`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => setTab("code")}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === "code" ? "bg-[#4A90E2] text-white" : "text-white/60"}`}
                    >
                      <Code2 className="h-3.5 w-3.5" /> Code
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={copyCode} className="rounded-lg bg-white/5 p-2 text-white/70 transition hover:bg-white/10" title="Copy code">
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button onClick={download} className="rounded-lg bg-white/5 p-2 text-white/70 transition hover:bg-white/10" title="Download .html">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {tab === "preview" ? (
                  <iframe
                    title="clone preview"
                    srcDoc={html}
                    className="h-[420px] w-full rounded-xl border border-white/10 bg-white"
                  />
                ) : (
                  <pre className="h-[420px] w-full overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-[11px] leading-relaxed text-green-200">
                    <code>{html}</code>
                  </pre>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}