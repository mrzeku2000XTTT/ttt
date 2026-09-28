import { useEffect, useRef, useState } from "react";
import { drawFrame } from "./talkStickRender";

/**
 * The voice → mouth engine.
 *
 * The microphone or an audio file is analysed with the Web Audio API and the
 * level drives the mouth on every animation frame. The level stays in a ref, so
 * nothing re-renders sixty times a second — only the meter width is written
 * straight to the DOM.
 */
export default function useMouthEngine({ canvasRef, meterRef, scrubRef, image, rig, settings, scene }) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Waiting for voice");
  // The timeline transport: which track is loaded, whether it is running, and how
  // long it is. The playhead itself is written straight to the scrubber's DOM.
  const [audioFile, setAudioFile] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const live = useRef({ image, rig, settings, scene });
  const audio = useRef({ ctx: null, analyser: null, stream: null, el: null, data: null });
  const level = useRef(0);
  // The loaded file, so play can pick it back up after the microphone has had the
  // stage. `scrubbing` stops the playhead fighting the drag.
  const fileRef = useRef(null);
  const scrubbing = useRef(false);

  // The loop below reads these every frame, so they always stay current.
  useEffect(() => {
    live.current = { image, rig, settings, scene };
  });

  const release = () => {
    const current = audio.current;
    if (current.stream) {
      current.stream.getTracks().forEach((track) => track.stop());
      current.stream = null;
    }
    if (current.el) {
      current.el.pause();
      current.el = null;
    }
    if (current.ctx) {
      current.ctx.close().catch(() => {});
      current.ctx = null;
    }
    current.analyser = null;
    current.data = null;
    setListening(false);
    setPlaying(false);
  };

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const { image: art, rig, settings: config, scene: staged } = live.current;

      if (canvas && ctx && art) {
        let target = 0;
        const analyser = audio.current.analyser;
        if (analyser) {
          if (!audio.current.data) audio.current.data = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(audio.current.data);
          let sum = 0;
          for (let i = 0; i < audio.current.data.length; i += 1) {
            const v = (audio.current.data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / audio.current.data.length);
          target = Math.min(1, Math.max(0, (rms * config.sensitivity - 0.015) * 2.8));
        }
        level.current = level.current * config.smoothing + target * (1 - config.smoothing);
        drawFrame(ctx, canvas, art, rig, config, level.current, staged);
        if (meterRef.current) meterRef.current.style.width = `${Math.round(level.current * 100)}%`;
      }

      // The playhead follows the track, unless the scrubber is being dragged.
      const el = audio.current.el;
      if (el && scrubRef?.current && !scrubbing.current) {
        scrubRef.current.value = String(el.currentTime || 0);
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [canvasRef, meterRef, scrubRef]);

  useEffect(() => () => release(), []);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      release();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.15;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audio.current = { ctx, analyser, stream, el: null, data: null };
      setListening(true);
      setStatus("Listening — the mouth follows your voice");
    } catch (error) {
      setStatus("Microphone permission was blocked.");
    }
  };

  const toggleMic = () => {
    if (listening) {
      release();
      setStatus("Microphone stopped");
    } else {
      startMic();
    }
  };

  const playFile = (file) => {
    if (!file) return;
    release();
    const el = new Audio(URL.createObjectURL(file));
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.15;
    ctx.createMediaElementSource(el).connect(analyser);
    analyser.connect(ctx.destination);
    // The timeline owns the run of the track, so it plays through once rather
    // than looping — and the transport shows where it has got to.
    el.addEventListener("loadedmetadata", () => setDuration(el.duration || 0));
    el.addEventListener("ended", () => setPlaying(false));
    el.play().catch(() => {});
    audio.current = { ctx, analyser, stream: null, el, data: null };
    fileRef.current = file;
    setAudioFile(file);
    setDuration(el.duration || 0);
    setPlaying(true);
    setListening(true);
    setStatus("Playing — the mouth follows the audio");
  };

  const togglePlay = () => {
    const el = audio.current.el;
    if (!el) {
      // The microphone had the stage; the last track can take it back.
      if (fileRef.current) playFile(fileRef.current);
      return;
    }
    if (el.paused) {
      // Starting again from the end replays from the top.
      if (el.duration && el.currentTime >= el.duration - 0.05) el.currentTime = 0;
      el.play().catch(() => {});
      setPlaying(true);
      setStatus("Playing — the mouth follows the audio");
    } else {
      el.pause();
      setPlaying(false);
      setStatus("Paused");
    }
  };

  const seek = (seconds) => {
    const el = audio.current.el;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(seconds, el.duration || seconds));
  };

  return {
    listening,
    status,
    toggleMic,
    playFile,
    audioFile,
    playing,
    duration,
    togglePlay,
    seek,
    scrubbing,
  };
}