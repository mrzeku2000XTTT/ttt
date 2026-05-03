import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, Mail, Upload, Video, Wand2 } from "lucide-react";

/**
 * Floating status overlay shown when UltraMock is auto-rendering from URL params
 * (i.e. triggered by NODA's "UltraMock MP4" node). Gives the user clear feedback
 * during the multi-second flow: build → record → upload → email.
 */
const ICONS = {
  building: Wand2,
  recording: Video,
  uploading: Upload,
  sending: Mail,
  done: CheckCircle2,
  error: AlertTriangle,
};

const COLORS = {
  building: "from-cyan-500 to-blue-500",
  recording: "from-red-500 to-pink-500",
  uploading: "from-purple-500 to-fuchsia-500",
  sending: "from-amber-500 to-orange-500",
  done: "from-emerald-500 to-green-500",
  error: "from-red-600 to-rose-600",
};

export default function AutoRenderStatus({ status }) {
  if (!status) return null;
  const Icon = ICONS[status.phase] || Loader2;
  const color = COLORS[status.phase] || "from-zinc-500 to-zinc-600";
  const isWorking = !["done", "error"].includes(status.phase);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl max-w-sm">
        <div className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {isWorking ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Icon className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm leading-tight">
            {status.message}
          </div>
          {status.error && (
            <div className="text-red-300 text-[11px] mt-0.5 truncate" title={status.error}>
              {status.error}
            </div>
          )}
          {status.phase === "done" && status.fileUrl && (
            <a
              href={status.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-200 text-[11px] underline mt-0.5 inline-block"
            >
              Open download link
            </a>
          )}
          {isWorking && (
            <div className="text-white/40 text-[10px] mt-0.5">
              Keep this tab open until done
            </div>
          )}
        </div>
      </div>
    </div>
  );
}