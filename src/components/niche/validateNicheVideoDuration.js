// Check the playable MP4 itself, not a guessed duration label in the UI.
export default async function validateNicheVideoDuration(blob, expectedSeconds) {
  if (!blob.type.includes('mp4')) return blob;
  const video = document.createElement('video');
  const url = URL.createObjectURL(blob);
  let timer;
  try {
    video.preload = 'metadata'; video.muted = true; video.playsInline = true;
    await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Could not verify the exported MP4 duration.')), 15000);
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error('The exported MP4 could not be read.'));
      video.src = url;
    });
    if (!Number.isFinite(video.duration) || Math.abs(video.duration - expectedSeconds) > 2) {
      throw new Error('The recorded MP4 timing does not match the scene timeline. It was not saved as a finished video; resume the build to retry.');
    }
    return blob;
  } finally {
    clearTimeout(timer);
    video.onloadedmetadata = video.onerror = null;
    video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url);
  }
}