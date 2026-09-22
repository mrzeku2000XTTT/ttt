// Uses the existing scene painter. Never turn a suspended iPhone recording
// into a successful, shortened film; the caller retains its scene checkpoint.
export default function waitForNicheIosFrames({ ac, recorder, player, token, duration, t0, draw, onProgress }) {
  return new Promise((resolve, reject) => {
    let settled = false, timer, previous = performance.now(), reported = -1;
    const done = (error) => {
      if (settled) return;
      settled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', interrupted);
      ac.removeEventListener('statechange', audioState);
      recorder.removeEventListener('error', recorderError);
      player.onended = null;
      error ? reject(error) : resolve();
    };
    const interrupted = () => done(new Error('iPhone interrupted video recording. Keep Niche Studio open and tap Resume build; your saved scene images and narration will be reused.'));
    const visibility = () => { if (document.hidden) interrupted(); };
    const audioState = () => { if (ac.state !== 'running') interrupted(); };
    const recorderError = (event) => done(event.error || new Error('iPhone could not finish recording. Resume the saved build.'));
    const tick = () => {
      if (document.hidden || ac.state !== 'running' || performance.now() - previous > 1500) { interrupted(); return; }
      if (token?.cancelled) { done(new Error('Build paused.')); return; }
      previous = performance.now();
      const elapsed = Math.max(0, ac.currentTime - t0);
      try { draw(elapsed); } catch (error) { done(error); return; }
      const percent = Math.min(100, Math.floor(elapsed / duration * 100));
      if (percent !== reported) { reported = percent; onProgress?.(`Stitching your video · ${percent}% · keep this app open`); }
      if (elapsed >= duration) done();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', interrupted);
    ac.addEventListener('statechange', audioState);
    recorder.addEventListener('error', recorderError);
    player.onended = () => {
      if (document.hidden || ac.state !== 'running') { interrupted(); return; }
      try { draw(duration); done(); } catch (error) { done(error); }
    };
    timer = setInterval(tick, 40);
    tick();
  });
}