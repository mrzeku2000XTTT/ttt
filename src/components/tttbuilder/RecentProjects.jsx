import React, { useEffect, useRef, useState } from "react";
import { Clock, FileCode2 } from "lucide-react";
import { loadProjects } from "@/components/tttbuilder/ProjectsPanel";
import BuilderOrb from "@/components/tttbuilder/BuilderOrb";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function indexHtmlOf(p) {
  return p.files?.find((f) => f.path === "index.html")?.content || null;
}

// Renders the project's HTML in an offscreen sandboxed iframe (no scripts) and
// rasterizes it with html2canvas → a real screenshot of the app UI.
async function captureThumb(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-same-origin");
  iframe.srcdoc = html;
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:480px;height:360px;border:0;background:#0a0a0a;";
  document.body.appendChild(iframe);
  try {
    await new Promise((resolve) => {
      iframe.onload = () => setTimeout(resolve, 400);
      setTimeout(resolve, 2000);
    });
    const doc = iframe.contentDocument;
    if (!doc?.body) return null;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(doc.body, {
      width: 480,
      height: 360,
      scale: 0.55,
      backgroundColor: "#0a0a0a",
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  } finally {
    iframe.remove();
  }
}

export default function RecentProjects({ onOpen, onSeeAll }) {
  const [projects, setProjects] = useState([]);
  const [thumbs, setThumbs] = useState({});
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const list = loadProjects().slice(0, 6);
    setProjects(list);

    (async () => {
      for (const p of list) {
        if (cancelled.current) return;
        const html = indexHtmlOf(p);
        if (!html) continue;
        const shot = await captureThumb(html);
        if (cancelled.current) return;
        if (shot) setThumbs((t) => ({ ...t, [p.id]: shot }));
      }
    })();

    return () => { cancelled.current = true; };
  }, []);

  if (!projects.length) {
    return (
      <div className="text-center">
        <div className="inline-flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-[#121212]/70 backdrop-blur-sm border border-[#00ff99]/15">
          <BuilderOrb size={36} />
          <div className="text-sm font-semibold text-white">No builds yet</div>
          <div className="text-xs text-white/40">Pick a template below to start your first project.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-left">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Recent projects</h3>
        <button onClick={onSeeAll} className="text-xs font-semibold text-[#00ff99] hover:text-[#33ffb0]">
          See all
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {projects.map((p) => {
          const html = indexHtmlOf(p);
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#121212]/70 backdrop-blur-sm border border-[#00ff99]/15 hover:border-[#00ff99]/50 text-left transition-colors"
            >
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#0a0a0a] flex items-center justify-center flex-shrink-0 relative border border-[#00ff99]/10">
                {thumbs[p.id] ? (
                  <img src={thumbs[p.id]} alt={p.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                ) : html ? (
                  <div className="w-full h-full bg-[#00ff99]/5 animate-pulse" />
                ) : (
                  <FileCode2 className="w-4 h-4 text-[#00ff99]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(p.savedAt)} · {p.files?.length || 0} files
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}