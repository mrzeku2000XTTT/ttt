export function loadCameraMedia(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = file.type.startsWith('video/');
    const element = document.createElement(video ? 'video' : 'img');
    const dispose = () => { if (video) { element.pause(); element.removeAttribute('src'); element.load(); } URL.revokeObjectURL(url); };
    const ready = () => resolve({ element, video, width: video ? element.videoWidth : element.naturalWidth, height: video ? element.videoHeight : element.naturalHeight, dispose });
    element.onerror = () => { dispose(); reject(new Error('This media could not be decoded. Try a PNG, JPG, or H.264 MP4.')); };
    if (video) { element.muted = true; element.loop = true; element.playsInline = true; element.preload = 'auto'; element.onloadeddata = ready; }
    else element.onload = ready;
    element.src = url;
  });
}
export function seekCameraVideo(video, time = 0) {
  if (Math.abs(video.currentTime - time) < 0.015) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const done = () => { video.removeEventListener('seeked', done); video.removeEventListener('error', fail); resolve(); };
    const fail = () => { video.removeEventListener('seeked', done); reject(new Error('Unable to seek this video.')); };
    video.addEventListener('seeked', done, { once: true }); video.addEventListener('error', fail, { once: true }); video.currentTime = time;
  });
}