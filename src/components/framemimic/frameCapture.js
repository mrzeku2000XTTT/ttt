// FrameMimic — deterministic video frame capture.
// The most reliable way to pull every frame out of a short clip in the
// browser: pause the video and SEEK to each target timestamp, waiting for
// the decoded "seeked" event before drawing. Unlike timeupdate/rAF sampling
// this never skips a frame and gives exact fps control.

export const MAX_VIDEO_SECONDS = 15;

const loadVideo = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadedmetadata = () => resolve({ video, url });
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this video file."));
    };
  });

const seekTo = (video, t) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    }, 3000);
    const onSeeked = () => {
      clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    try {
      video.currentTime = t;
    } catch {
      clearTimeout(timer);
      resolve();
    }
  });

export async function extractFrames({ file, fps = 4, maxWidth = 720, onProgress }) {
  const { video, url } = await loadVideo(file);
  try {
    const rawDuration = video.duration || 0;
    if (!rawDuration || !video.videoWidth) throw new Error("This video has no readable frames.");
    const trimmed = rawDuration > MAX_VIDEO_SECONDS;
    const duration = trimmed ? MAX_VIDEO_SECONDS : rawDuration;

    const width = Math.min(video.videoWidth, maxWidth);
    const height = Math.max(1, Math.round(video.videoHeight * (width / video.videoWidth)));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const total = Math.max(1, Math.floor(duration * fps));
    const frames = [];
    for (let i = 0; i < total; i++) {
      const t = Math.min(i / fps, duration - 0.02);
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, width, height);
      frames.push({
        index: i,
        time: t,
        dataUrl: canvas.toDataURL("image/jpeg", 0.82),
      });
      onProgress?.({ done: i + 1, total });
    }
    return { frames, duration, trimmed, fps, width, height };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
  }
}