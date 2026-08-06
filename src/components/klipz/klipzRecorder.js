// Real clip cutting: plays the source MP4 from IN→OUT, paints it to a canvas and
// records video+audio with MediaRecorder. Produces an actual downloadable file
// containing ONLY the selected segment.
export async function recordSegment({ url, start, end, onProgress, onLog }) {
  const duration = Math.max(0.5, end - start);

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.src = url;
  video.preload = "auto";
  video.muted = false;

  await new Promise((res, rej) => {
    video.onloadeddata = res;
    video.onerror = () => rej(new Error("Source video could not be loaded"));
    setTimeout(() => rej(new Error("Source video timed out")), 20000);
  });

  video.currentTime = start;
  await new Promise((res) => { video.onseeked = res; setTimeout(res, 4000); });

  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(30);

  // Mix the source audio into the recording (skipped silently if unavailable)
  let audioCtx = null;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    audioCtx.createMediaElementSource(video).connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  } catch { onLog?.("Audio track unavailable — recording video only", "warn"); }

  const MIMES = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  const mime = MIMES.find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || "video/webm";
  const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    recorder.onerror = (e) => reject(e.error || new Error("Recorder failed"));
    recorder.onstop = () => {
      audioCtx?.close().catch(() => {});
      const blob = new Blob(chunks, { type: mime.split(";")[0] });
      resolve({ blob, url: URL.createObjectURL(blob), ext, duration });
    };

    recorder.start(250);
    video.play().catch(() => {});

    let done = false;
    const timer = setInterval(() => {
      const t = video.currentTime;
      onProgress?.(Math.min(1, (t - start) / duration));
      try { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); } catch {
        clearInterval(timer);
        reject(new Error("Source blocked by CORS — cannot cut this video in-browser"));
        return;
      }
      if (!done && (t >= end || video.ended)) {
        done = true;
        clearInterval(timer);
        video.pause();
        setTimeout(() => { try { recorder.stop(); } catch {} }, 300);
      }
    }, 1000 / 30);
  });
}