import { base44 } from "@/api/base44Client";

// Real video export: renders the timeline to a canvas in real time and records
// it (video + audio) with MediaRecorder. Returns a downloadable webm Blob URL.
export async function exportTimeline({ clips, assets, width = 1280, height = 720, fps = 30, onProgress }) {
  const videoClips = clips.filter((c) => c.track <= 1).sort((a, b) => a.start - b.start);
  const audioClips = clips.filter((c) => c.track === 2);
  const total = Math.max(...clips.map((c) => c.start + c.duration), 1);

  const assetById = (id) => assets.find((a) => a.id === id);

  // Preload media elements
  const media = {};
  await Promise.all(
    [...videoClips, ...audioClips].map(async (clip) => {
      const asset = assetById(clip.assetId);
      if (!asset || media[asset.id]) return;
      if (asset.type === "image") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = asset.url;
        await new Promise((res) => { img.onload = res; img.onerror = res; });
        media[asset.id] = { el: img, kind: "image" };
      } else {
        const el = document.createElement(asset.type === "audio" ? "audio" : "video");
        el.crossOrigin = "anonymous";
        el.src = asset.url;
        el.muted = false;
        el.preload = "auto";
        await new Promise((res) => { el.onloadeddata = res; el.onerror = res; setTimeout(res, 6000); });
        media[asset.id] = { el, kind: asset.type };
      }
    })
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Audio mixing — route every media element into one destination
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();
  Object.values(media).forEach((m) => {
    if (m.kind !== "image") {
      try {
        const src = audioCtx.createMediaElementSource(m.el);
        src.connect(dest);
      } catch { /* element already connected */ }
    }
  });

  const stream = canvas.captureStream(fps);
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const drawCover = (el, w, h) => {
    const sw = el.videoWidth || el.naturalWidth || w;
    const sh = el.videoHeight || el.naturalHeight || h;
    const scale = Math.max(width / sw, height / sh);
    const dw = sw * scale, dh = sh * scale;
    ctx.drawImage(el, (width - dw) / 2, (height - dh) / 2, dw, dh);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      audioCtx.close().catch(() => {});
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve({ blob, url: URL.createObjectURL(blob), duration: total });
    };
    recorder.onerror = (e) => reject(e.error || new Error("Recorder failed"));

    recorder.start(250);
    const startedAt = performance.now();
    let activeVideoId = null;

    const frame = () => {
      const t = (performance.now() - startedAt) / 1000;
      if (t >= total) {
        Object.values(media).forEach((m) => { if (m.kind !== "image") m.el.pause(); });
        recorder.stop();
        return;
      }
      onProgress?.(Math.min(1, t / total));

      // Active visual clip: track 0 wins over track 1
      const active = videoClips.find((c) => c.track === 0 && t >= c.start && t < c.start + c.duration)
        || videoClips.find((c) => t >= c.start && t < c.start + c.duration);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      if (active) {
        const m = media[active.assetId];
        if (m) {
          if (m.kind === "video") {
            if (activeVideoId !== active.id) {
              activeVideoId = active.id;
              m.el.currentTime = (active.trimIn || 0) + (t - active.start);
              m.el.play().catch(() => {});
            }
            drawCover(m.el, width, height);
          } else {
            drawCover(m.el, width, height);
          }
        }
      }

      // Pause videos that are no longer active
      videoClips.forEach((c) => {
        const m = media[c.assetId];
        if (m?.kind === "video" && (!active || c.id !== active.id) && !m.el.paused) {
          // only pause if this asset isn't the active one
          if (!active || active.assetId !== c.assetId) m.el.pause();
        }
      });

      // Audio track playback
      audioClips.forEach((c) => {
        const m = media[c.assetId];
        if (!m || m.kind === "image") return;
        const inRange = t >= c.start && t < c.start + c.duration;
        if (inRange && m.el.paused) {
          m.el.currentTime = (c.trimIn || 0) + (t - c.start);
          m.el.play().catch(() => {});
        } else if (!inRange && !m.el.paused && !videoClips.some((vc) => vc.assetId === c.assetId)) {
          m.el.pause();
        }
      });

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

// Upload the exported blob so it gets a permanent shareable URL
export async function uploadExport(blob, name = "kutt-export.webm") {
  const file = new File([blob], name, { type: "video/webm" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}