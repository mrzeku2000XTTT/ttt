import nicheMobileSceneQueue from '@/components/niche/nicheMobileSceneQueue';
import nicheMobilePainter from '@/components/niche/nicheMobilePainter';
import nicheMobileSegment from '@/components/niche/nicheMobileSegment';
import finalizeNicheMp4 from '@/components/niche/finalizeNicheMp4';

// One continuous recording and audio clock, with bounded look-ahead asset loading.
// Never pause/resume the recorder between scenes: Safari may retain those timestamp gaps.
export default async function compileNicheMobileVideo({ scenes, audioContext: ac, style, styleId, cameras = [], motion = false, stopMotion = false, colorMode, musicUrl = '', musicVolume = 0.12, onProgress, token }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280; canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const paint = nicheMobilePainter({ style, styleId, cameras, motion, count: scenes.length, stopMotion, colorMode });
  const queue = nicheMobileSceneQueue(scenes, ac, token);
  const sources = new Map();
  let stream, recorder, dest, monitor, music, musicNode, musicGain;
  let recordedSeconds = 0, result, error = null;
  const chunks = [];
  const clear = () => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = stopMotion ? (colorMode === 'color' ? '#0b0b0e' : '#050507') : style.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  const check = () => {
    if (token?.cancelled) throw new Error('Build paused.');
    if (document.hidden) throw new Error('Keep this tab visible; use Resume build if offered, or try again.');
    if (error) throw error;
  };
  const releaseSource = (index) => {
    const source = sources.get(index);
    if (source) { try { source.stop(); } catch {} source.disconnect(); source.buffer = null; sources.delete(index); }
  };
  const schedule = (index, at) => {
    if (index >= scenes.length || sources.has(index)) return;
    const source = ac.createBufferSource();
    source.buffer = queue.get(index).audio;
    source.connect(dest); source.connect(monitor);
    sources.set(index, source);
    source.start(at);
  };
  try {
    check();
    await Promise.race([ac.resume(), new Promise(resolve => setTimeout(resolve, 1500))]);
    if (ac.state !== 'running') throw new Error('Audio could not start. Tap Resume build if offered, or try again.');
    for (let i = 0; i < Math.min(3, scenes.length); i++) {
      onProgress?.(`Preparing scene ${i + 1}/${scenes.length}`);
      await queue.load(i); check();
    }
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
    clear();
    paint(ctx, queue.get(0), scenes[0].caption, 0, 0, 0);
    check();
    const recordingAt = ac.currentTime;
    const origin = recordingAt + 0.1;
    recorder.start();
    music?.play().catch(() => {});
    let sceneStart = 0;
    for (let i = 0; i < scenes.length; i++) {
      check();
      const assets = queue.get(i);
      const lead = i === 0 ? 0.25 : 0;
      const duration = lead + Math.max(assets.audio.duration, 3.5) + 0.45 + (i === scenes.length - 1 ? 0.4 : 0);
      // Schedule the next narration before this scene ends, on the SAME clock.
      schedule(i, origin + sceneStart + lead);
      schedule(i + 1, origin + sceneStart + duration);
      await nicheMobileSegment({ ac, start: origin + sceneStart, duration, token, recorderError: () => error, onProgress, scene: i, count: scenes.length, fps: stopMotion ? 60 : 25,
        draw: (p, elapsed) => {
          clear();
          const fade = !stopMotion && i + 1 < scenes.length ? Math.min(1, Math.max(0, (elapsed - (duration - 0.35)) / 0.35)) : 0;
          paint(ctx, assets, scenes[i].caption, i, p, sceneStart + elapsed, 1 - fade);
          // Original transition: next scene fades in at the END of the prior scene.
          if (fade) paint(ctx, queue.get(i + 1), scenes[i + 1].caption, i + 1, 0, sceneStart + elapsed, fade);
        }
      });
      sceneStart += duration;
      releaseSource(i); queue.release(i);
      queue.load(i + 3);
    }
    // Keep the original short tail; asset downloads never enter the media timeline.
    await new Promise(resolve => setTimeout(resolve, 400));
    check();
    recordedSeconds = ac.currentTime - recordingAt;
    recorder.stop(); await stopped;
    result = new Blob(chunks, { type: mimeType.split(';')[0] });
  } finally {
    if (recorder) { recorder.ondataavailable = null; if (recorder.state !== 'inactive') recorder.stop(); }
    sources.forEach((_, index) => releaseSource(index));
    queue.dispose();
    stream?.getTracks().forEach(track => track.stop());
    if (music) { music.pause(); music.removeAttribute('src'); music.load(); }
    musicNode?.disconnect(); musicGain?.disconnect(); monitor?.disconnect(); dest?.disconnect();
    if (ac.state !== 'closed') await ac.close();
    canvas.width = canvas.height = 0;
    chunks.length = 0;
  }
  check();
  onProgress?.('Finalizing video timing…');
  return finalizeNicheMp4(result, recordedSeconds);
}