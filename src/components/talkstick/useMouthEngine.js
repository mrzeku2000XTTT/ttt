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
export default function useMouthEngine({ canvasRef, meterRef, image, mouth, settings }) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Waiting for voice");

  const live = useRef({ image, mouth, settings });
  const audio = useRef({ ctx: null, analyser: null, stream: null, el: null, data: null });
  const level = useRef(0);

  // The loop below reads these every frame, so they always stay current.
  useEffect(() => {
    live.current = { image, mouth, settings };
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
  };

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const { image: art, mouth: spot, settings: config } = live.current;

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
        drawFrame(ctx, canvas, art, spot, config, level.current);
        if (meterRef.current) meterRef.current.style.width = `${Math.round(level.current * 100)}%`;
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [canvasRef, meterRef]);

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
    el.loop = true;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.15;
    ctx.createMediaElementSource(el).connect(analyser);
    analyser.connect(ctx.destination);
    el.play().catch(() => {});
    audio.current = { ctx, analyser, stream: null, el, data: null };
    setListening(true);
    setStatus("Playing — the mouth follows the audio");
  };

  return { listening, status, toggleMic, playFile };
}