import nicheMobileAssets from '@/components/niche/nicheMobileAssets';
import nicheMobilePainter from '@/components/niche/nicheMobilePainter';
import nicheMobileSegment from '@/components/niche/nicheMobileSegment';
import finalizeNicheMp4 from '@/components/niche/finalizeNicheMp4';

// Bounded-memory 720p renderer: one scene, no full-film PCM/offline mix, one recorder.
export default async function compileNicheMobileVideo({ scenes, audioContext: ac, style, styleId, cameras = [], motion = false, stopMotion = false, colorMode, musicUrl = '', musicVolume = 0.12, onProgress, token }) {
  const canvas = document.createElement('canvas'), previous = document.createElement('canvas');
  canvas.width = previous.width = 1280; canvas.height = previous.height = 720;
  const ctx = canvas.getContext('2d'), previousCtx = previous.getContext('2d');
  const paint = nicheMobilePainter({ style, styleId, cameras, motion, count: scenes.length, stopMotion, colorMode });
  let stream, recorder, assets, source, dest, monitor, music, musicNode, musicGain;
  let recordedSeconds = 0, result, error = null;
  const chunks = [];
  const check = () => {
    if (token?.cancelled) throw new Error('Build paused.');
    if (document.hidden) throw new Error('Keep this tab visible; use Resume build if offered, or try again.');
    if (error) throw error;
  };
  const releaseSource = () => {
    if (source) { try { source.stop(); } catch {} source.disconnect(); source.buffer = null; source = null; }
    assets?.release(); assets = null;
  };
  try {
    check();
    await Promise.race([ac.resume(), new Promise(resolve => setTimeout(resolve, 1500))]);
    if (ac.state !== 'running') throw new Error('Audio could not start. Tap Resume build if offered, or try again.');
    dest = ac.createMediaStreamDestination(); dest.channelCount = 2;
    monitor = ac.createGain(); monitor.gain.value = 0; monitor.connect(ac.destination);
    stream = canvas.captureStream(stopMotion ? 60 : 25);
    dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    const mimeType = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error('Video recording is not supported in this browser.');
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000, audioBitsPerSecond: 128_000 });
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => { error = event.error || new Error('Video recording failed.'); reject(error); };
    });
    stopped.catch(() => {});
    if (musicUrl) {
      // Stream the soundtrack instead of decoding an entire long song into RAM.
      music = new Audio(); music.crossOrigin = 'anonymous'; music.loop = true; music.preload = 'none'; music.src = musicUrl;
      musicNode = ac.createMediaElementSource(music); musicGain = ac.createGain(); musicGain.gain.value = musicVolume;
      musicNode.connect(musicGain); musicGain.connect(dest); musicGain.connect(monitor);
    }
    for (let i = 0; i < scenes.length; i++) {
      check();
      onProgress?.(`Preparing scene ${i + 1}/${scenes.length} — keeping mobile memory low`);
      assets = await nicheMobileAssets(scenes[i], ac, token);
      check();
      paint(ctx, assets, scenes[i].caption, i, 0, recordedSeconds);
      if (i && !stopMotion) ctx.drawImage(previous, 0, 0);
      // Pause only the recorder during asset loading; loading time is not video time.
      if (i === 0) recorder.start(); else recorder.resume();
      const activeAt = performance.now();
      music?.play().catch(() => {});
      const lead = i === 0 ? 0.25 : 0;
      const duration = lead + Math.max(assets.audio.duration, 3.5) + 0.45 + (i === scenes.length - 1 ? 0.4 : 0);
      source = ac.createBufferSource(); source.buffer = assets.audio; source.connect(dest); source.connect(monitor);
      const start = ac.currentTime + 0.05;
      source.start(start + lead);
      await nicheMobileSegment({ ac, start, duration, lead, token, recorderError: () => error, onProgress, scene: i, count: scenes.length, fps: stopMotion ? 60 : 25,
        draw: (p, elapsed) => {
          paint(ctx, assets, scenes[i].caption, i, p, recordedSeconds + elapsed);
          if (i && !stopMotion && elapsed < 0.35) { ctx.save(); ctx.globalAlpha = 1 - elapsed / 0.35; ctx.drawImage(previous, 0, 0); ctx.restore(); }
        }
      });
      recorder.pause(); music?.pause();
      recordedSeconds += (performance.now() - activeAt) / 1000;
      previousCtx.drawImage(canvas, 0, 0);
      releaseSource();
    }
    check();
    recorder.stop(); await stopped;
    result = new Blob(chunks, { type: mimeType.split(';')[0] });
  } finally {
    if (recorder) { recorder.ondataavailable = null; if (recorder.state !== 'inactive') recorder.stop(); }
    releaseSource();
    stream?.getTracks().forEach(track => track.stop());
    if (music) { music.pause(); music.removeAttribute('src'); music.load(); }
    musicNode?.disconnect(); musicGain?.disconnect(); monitor?.disconnect(); dest?.disconnect();
    if (ac.state !== 'closed') await ac.close();
    canvas.width = canvas.height = previous.width = previous.height = 0;
    chunks.length = 0;
  }
  check();
  onProgress?.('Finalizing video timing…');
  return finalizeNicheMp4(result, recordedSeconds);
}