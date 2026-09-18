// Follow the audio clock; don't produce a corrupt silent file if iOS suspends it.
export default function nicheMobileSegment({ ac, start, duration, draw, token, recorderError, onProgress, scene, count, fps }) {
  return new Promise((resolve, reject) => {
    let timer, previousProgress = -1;
    const finish = (error) => { clearInterval(timer); error ? reject(error) : resolve(); };
    const tick = () => {
      try {
        if (token?.cancelled) throw new Error('Build paused.');
        if (document.hidden || ac.state !== 'running') throw new Error('Rendering was interrupted. Keep this tab visible; use Resume build if offered, or try again.');
        if (recorderError()) throw recorderError();
        const elapsed = Math.max(0, ac.currentTime - start);
        draw(Math.min(1, elapsed / duration), elapsed);
        const progress = Math.min(100, Math.floor(elapsed / duration * 100));
        if (progress !== previousProgress && progress % 5 === 0) {
          previousProgress = progress;
          onProgress?.(`Stitching scene ${scene + 1}/${count} · ${progress}% — keep this tab open`);
        }
        if (elapsed >= duration) finish();
      } catch (error) { finish(error); }
    };
    timer = setInterval(tick, Math.round(1000 / fps));
    tick();
  });
}