import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Play, AlertCircle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Polls imposterRenderStatus every 3s for a given record_id.
 * Shows "rendering..." while pending, embedded <video> when done, error msg on failure.
 */
export default function ImposterVideoRender({ recordId }) {
  const [state, setState] = useState("pending"); // pending | done | error
  const [videoUrl, setVideoUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!recordId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await base44.functions.invoke("imposterRenderStatus", { record_id: recordId });
        const data = res.data || {};
        if (cancelled) return;

        if (data.status === "done" && data.video_url) {
          setVideoUrl(data.video_url);
          setState("done");
          clearInterval(pollRef.current);
          clearInterval(tickRef.current);
        } else if (data.status === "error") {
          setErrorMsg(data.raw?.error || "render failed");
          setState("error");
          clearInterval(pollRef.current);
          clearInterval(tickRef.current);
        }
        // otherwise still pending/rendering — keep polling
      } catch (err) {
        if (cancelled) return;
        // transient error, keep polling
        console.warn("render poll failed:", err?.message);
      }
    };

    // first poll immediately, then every 3s
    poll();
    pollRef.current = setInterval(poll, 3000);
    tickRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);

    // hard timeout at 10 minutes
    const timeout = setTimeout(() => {
      if (cancelled) return;
      if (state === "pending") {
        setErrorMsg("render timed out after 10 minutes");
        setState("error");
        clearInterval(pollRef.current);
        clearInterval(tickRef.current);
      }
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
      clearInterval(tickRef.current);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  if (state === "done" && videoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[90%] rounded-2xl overflow-hidden"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(6,182,212,0.3)" }}
      >
        <video src={videoUrl} controls autoPlay playsInline className="w-full block" style={{ maxHeight: 360 }} />
        <div className="flex items-center justify-between px-3 py-2 text-[11px]">
          <span className="text-cyan-400/80 font-semibold">🎬 render complete</span>
          <a
            href={videoUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
          >
            <Download className="w-3 h-3" /> download
          </a>
        </div>
      </motion.div>
    );
  }

  if (state === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[90%] rounded-2xl px-4 py-3"
        style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)" }}
      >
        <div className="flex items-center gap-2 text-[12px] text-red-400/90 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" /> render failed
        </div>
        <div className="text-[11px] text-white/50 mt-1 break-words">{errorMsg}</div>
      </motion.div>
    );
  }

  // pending
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[90%] rounded-2xl px-4 py-3"
      style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)" }}
    >
      <div className="flex items-center gap-2 text-[12px] text-cyan-400/90 font-semibold">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <Play className="w-3.5 h-3.5" />
        rendering your video…
      </div>
      <div className="text-[10px] text-white/40 mt-1 font-mono">
        {elapsed}s elapsed · id {String(recordId).slice(-8)}
      </div>
    </motion.div>
  );
}