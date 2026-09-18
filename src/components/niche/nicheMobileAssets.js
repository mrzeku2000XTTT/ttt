// Only the current scene is decoded. Release its surfaces before loading another.
export default async function nicheMobileAssets(scene, ac, token) {
  const images = [];
  let audio = null;
  const check = () => { if (token?.cancelled) throw new Error('Build paused.'); };
  const release = () => { images.forEach(image => { image.width = image.height = 0; }); images.length = 0; audio = null; };
  try {
    check();
    const response = await fetch(scene.audio);
    if (!response.ok) throw new Error('Could not load narration.');
    const bytes = await response.arrayBuffer();
    check();
    audio = await ac.decodeAudioData(bytes);
    for (const url of scene.images) {
      check();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Could not load a scene image.'));
          img.src = url;
        });
        check();
        const scale = Math.min(1, 1440 / Math.max(img.naturalWidth, img.naturalHeight));
        const surface = document.createElement('canvas');
        surface.width = Math.max(1, Math.round(img.naturalWidth * scale));
        surface.height = Math.max(1, Math.round(img.naturalHeight * scale));
        images.push(surface);
        surface.getContext('2d').drawImage(img, 0, 0, surface.width, surface.height);
      } finally {
        img.onload = img.onerror = null;
        img.removeAttribute('src');
      }
    }
    return { images, get audio() { return audio; }, release };
  } catch (error) {
    release();
    throw error;
  }
}