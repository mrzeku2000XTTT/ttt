// Explainer video utilities — shared by the Manual lab and the Automatic chat studio

// 5 animation styles the user can pick from — "neutral" is the default
export const ANIMATION_STYLES = [
  {
    id: 'neutral',
    name: 'Neutral Stick-Man',
    bg: '#ffffff',
    ink: '#111111',
    prompt: (action) =>
      `Minimalist hand-drawn stick figure explainer illustration showing: ${action}. One simple black stick-figure character with expressive stick arms and legs mid-action on a clean pure white background, thin marker ink lines, doodle sketch style, generous white space, wide 16:9 composition. Depict the scene purely as artwork. The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`
  },
  {
    id: 'comic',
    name: 'Comic Book',
    bg: '#ffffff',
    ink: '#111111',
    prompt: (action) =>
      `Bold black-and-white comic book illustration showing: ${action}. One expressive character mid-action, thick confident ink outlines, halftone dot shading, dramatic pose, clean white background, wide 16:9 comic panel composition. Depict the scene purely as artwork. The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`
  },
  {
    id: 'papercut',
    name: 'Paper Cutout',
    bg: '#f7f4ee',
    ink: '#26221c',
    prompt: (action) =>
      `Layered construction-paper cutout collage illustration showing: ${action}. One paper character built from simple flat cut shapes with soft drop shadows, textured paper edges, muted craft colors, wide 16:9 composition. Depict the scene purely as artwork. The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`
  },
  {
    id: 'isometric',
    name: 'Isometric Vector',
    bg: '#ffffff',
    ink: '#1b2430',
    prompt: (action) =>
      `Clean flat isometric vector illustration showing: ${action}. One friendly minimal character mid-action, soft pastel color palette, subtle long shadows, simple geometric props, white background, wide 16:9 composition. Depict the scene purely as artwork. The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`
  },
  {
    id: 'chalkboard',
    name: 'Chalkboard',
    bg: '#1c1c1c',
    ink: '#f5f5f5',
    prompt: (action) =>
      `Chalkboard illustration showing: ${action}. One simple character sketched in white chalk mid-action on a dark blackboard background, rough chalk strokes, faint chalk dust texture, wide 16:9 composition. Depict the scene purely as artwork. The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`
  },
  {
    // Vox Documentary — taught from the "Fern" paper-collage documentary engine doc.
    // Hand-cut paper collage on aged newsprint + archival maps, halftone photo cutouts,
    // red string, brass pins, stamps, typewriter strips; desaturated tan/ink/halftone-gray
    // with one hot red accent + mustard yellow secondary. For documentary topics.
    id: 'vox',
    name: 'Vox Documentary',
    bg: '#0e0d0b',
    ink: '#f2ece0',
    selfColor: true,
    prompt: (action, colorMode) =>
      colorMode === 'mono'
        ? `Hand-cut documentary paper collage illustration, archival grayscale: ${action}. Aged newsprint and archival map surfaces, black and white halftone photograph cutouts with rough scissor-cut edges and offset accent strokes, torn paper edges, masking tape fragments, typewriter caption strips, rubber stamp marks, red string and brass pins where the story calls for connections, desaturated grayscale palette of ink black, halftone gray and aged paper tan with no color accents, visible print grain and paper fiber, matte, flat even documentary lighting with soft cutout drop shadows. One hero element with 2-3 supporting elements, generous negative space, 16:9 composition. Every element must appear physically hand-cut and layered from real paper, with visible cutout edges, halftone print texture, and soft shadow separation between layers. NOT digital illustration, NOT cartoon, NOT 3D render, NOT glossy, no gradients, no clutter, no watermark, no logos. The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`
        : `Hand-cut documentary paper collage illustration: ${action}. Aged newsprint and archival map surfaces, black and white halftone photograph cutouts with rough scissor-cut edges and offset accent strokes, torn paper edges, masking tape fragments, typewriter caption strips, rubber stamp marks, red string and brass pins where the story calls for connections, desaturated archival palette of tan, ink black, and halftone gray with ONE hot red signal accent and a restrained mustard yellow secondary, visible print grain and paper fiber, matte, flat even documentary lighting with soft cutout drop shadows. One hero element with 2-3 supporting elements, generous negative space, 16:9 composition. Every element must appear physically hand-cut and layered from real paper, with visible cutout edges, halftone print texture, and soft shadow separation between layers. NOT digital illustration, NOT cartoon, NOT 3D render, NOT glossy, no gradients, no clutter, no watermark, no logos. The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`
  },
  {
    id: 'real-ui',
    name: 'Real UI Clone',
    bg: '#0a0a0a',
    ink: '#f5f5f5',
    // prompt() is unused for this style — clones are built via realUiPrompt()
    prompt: (action) => action
  }
];

export const styleById = (id) => ANIMATION_STYLES.find((s) => s.id === id) || ANIMATION_STYLES[0];

// Every style can be rendered black & white (default) or fully colored
export const COLOR_MODES = [
  { id: 'mono', name: 'Black & white', clause: '' },
  {
    id: 'color',
    name: 'Colored',
    clause: ' Render this scene in vivid, harmonious full color — the artwork is fully colored, not black and white.'
  }
];

export const stylePrompt = (styleId, action, colorMode) => {
  const s = styleById(styleId);
  // vox manages its own color grading (archival palette vs grayscale) so the
  // generic "vivid full color" clause would wreck it — let it handle colorMode.
  if (s.selfColor) return s.prompt(action, colorMode);
  const base = s.prompt(action);
  return colorMode === 'color' ? `${base}${COLOR_MODES[1].clause}` : base;
};

// Builds an image prompt in a style the AI learned from a user's video or images
export const customStylePrompt = (styleDescription, action, colorMode) =>
  `Wordless illustration, 16:9 wide composition. Recreate this exact learned visual style: ${styleDescription}. Depict this scene purely as artwork: ${action}.${colorMode === 'color' ? COLOR_MODES[1].clause : ''} The frame must contain no written language of any kind — no words, letters, numbers, labels, signs, logos, captions or typography anywhere. Never transcribe any part of this description into the image.`;

// Research a real app's UI from the web (Google Play / App Store / official site)
// and return a description used to clone that UI in generated scene images.
export async function researchAppUi(appName) {
  const { base44 } = await import("@/api/base44Client");
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Research the real mobile app "${appName}" from live web sources (Google Play, Apple App Store, official website, reviews, screenshots). Describe its UI as accurately as possible: signature colors (with hex where possible), dark/light theme, home screen layout, key screens, typography, button styles, navigation patterns, and overall visual identity. This will be used to generate faithful UI clone screenshots. Be specific and factual.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        description: { type: "string" },
        app_name: { type: "string" }
      }
    }
  });
  return {
    app: res?.app_name || appName,
    description: (res?.description || "").trim()
  };
}

// Build an image prompt that clones the real app's UI for a given scene action.
// Unlike the stick-man styles, UI clones DO contain realistic app text (buttons,
// balances, labels) — that's the whole point of cloning a real interface.
export function realUiPrompt(appName, uiDesc, action, colorMode) {
  return `High-fidelity vertical phone screenshot faithfully cloning the real UI of the mobile app "${appName}". ${uiDesc}. Depict this scene as a realistic, pixel-perfect, modern, premium app interface showing: ${action}. Render as a clean 9:19.5 phone screen, sharp, professional, the actual app's real color palette and typography. Realistic UI text and labels (buttons, balances, menu items, headings) belong in the frame — this is a UI clone, not a cartoon. No watermark, no mockup frame, no stick figures — just the screen content.${colorMode === 'color' ? '' : ''}`;
}

// Camera moves for the Ken Burns motion added to still scenes during stitching.
// The AI picks one per scene; if it doesn't, autoCameras() varies them so the
// video never feels static.
export const CAMERA_MOVES = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'static'];

export const autoCameras = (n) => {
  const pool = ['zoom-in', 'pan-left', 'zoom-out', 'pan-right', 'pan-up', 'zoom-in', 'pan-down', 'zoom-out'];
  const out = [];
  for (let i = 0; i < n; i++) {
    let m = pool[i % pool.length];
    if (i && out[i - 1] === m) m = pool[(i + 1) % pool.length];
    out.push(m);
  }
  return out;
};

const kenBurns = (move, p) => {
  const e = Math.min(1, Math.max(0, p));
  switch (move) {
    case 'zoom-in':  return { z: 1 + 0.12 * e, dx: 0, dy: 0 };
    case 'zoom-out': return { z: 1.12 - 0.12 * e, dx: 0, dy: 0 };
    case 'pan-left':  return { z: 1.12, dx: 0.5 - e, dy: 0 };
    case 'pan-right': return { z: 1.12, dx: -0.5 + e, dy: 0 };
    case 'pan-up':    return { z: 1.12, dx: 0, dy: 0.5 - e };
    case 'pan-down':  return { z: 1.12, dx: 0, dy: -0.5 + e };
    default:          return { z: 1, dx: 0, dy: 0 };
  }
};

// "mp4" for MP4 blobs, "webm" only if the browser truly can't record MP4
export const videoExt = (type = '') => (type.includes('mp4') ? 'mp4' : 'webm');

const CAPTION_MAX = 42;

const wrapCaption = (text) => {
  const words = String(text || '').split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > CAPTION_MAX) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 2);
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// MP4 first — webm only as a last-resort fallback for browsers without MP4 recording
const RECORDER_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm'
];

// Stitches scene images + narration audio into one downloadable video,
// drawing each scene's caption at the bottom in the chosen style's palette.
// Create the AudioContext synchronously inside a user tap/click — iOS Safari
// refuses to start audio (and stalls forever) if it is created later in an async chain.
export function createAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ac = new AudioCtx();
  ac.resume?.().catch(() => {});
  return ac;
}

export async function compileExplainerVideo({ images, audios, captions = [], style: styleId, cameras = [], musicUrl = '', musicVolume = 0.12, onProgress, audioContext }) {
  const style = styleById(styleId);
  const W = 1280;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  onProgress?.('Loading scenes…');
  const imgEls = await Promise.all(images.map(loadImage));

  onProgress?.('Preparing narration…');
  const ac = audioContext || createAudioContext();
  // never hang here — iOS can leave resume() pending forever
  await Promise.race([ac.resume().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
  if (ac.state !== 'running') {
    throw new Error('Audio could not start on this device — tap the screen once, then try again.');
  }
  const dest = ac.createMediaStreamDestination();
  const buffers = await Promise.all(
    audios.map(async (u) => {
      const buf = await (await fetch(u)).arrayBuffer();
      return new Promise((resolve, reject) => ac.decodeAudioData(buf, resolve, reject));
    })
  );

  // Optional background soundtrack — fetch + decode a royalty-free audio URL
  // (e.g. a Pixabay download link) to mix under the narration. Failures (CORS,
  // bad URL) are swallowed so the video still renders without music.
  let musicBuf = null;
  if (musicUrl) {
    try {
      const marr = await (await fetch(musicUrl)).arrayBuffer();
      musicBuf = await new Promise((resolve, reject) => ac.decodeAudioData(marr, resolve, reject));
    } catch {
      musicBuf = null;
    }
  }

  // Mix every narration line into ONE continuous track offline, with a short breath
  // between scenes. A single source can't drift or overlap the way many scheduled
  // sources can, and it gives us the exact scene boundaries for the visuals.
  onProgress?.('Laying out narration…');
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const LEAD = 0.25;
  const GAP = 0.45;
  const timeline = [];
  let cursor = LEAD;
  buffers.forEach((buf, i) => {
    timeline.push({ at: cursor, dur: buf.duration, buf, img: imgEls[i], caption: captions[i] || '' });
    cursor += buf.duration + GAP;
  });
  const totalDur = cursor + 0.4;
  const offline = new OfflineCtx(2, Math.ceil(totalDur * ac.sampleRate), ac.sampleRate);
  timeline.forEach((seg) => {
    const s = offline.createBufferSource();
    s.buffer = seg.buf;
    s.connect(offline.destination);
    s.start(seg.at);
  });
  if (musicBuf) {
    const mg = offline.createGain();
    mg.gain.value = musicVolume;
    const ms = offline.createBufferSource();
    ms.buffer = musicBuf;
    ms.loop = true;
    ms.connect(mg);
    mg.connect(offline.destination);
    ms.start(0);
    ms.stop(totalDur);
  }
  const mixed = await offline.startRendering();

  // Scene windows: each image stays up for its own line plus the breath after it
  const segments = timeline.map((seg, i) => ({
    start: i === 0 ? 0 : seg.at,
    end: i === timeline.length - 1 ? totalDur : seg.at + seg.dur + GAP,
    img: seg.img,
    caption: seg.caption
  }));

  const stream = canvas.captureStream(25);
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  const mimeType = RECORDER_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/mp4';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  // Draw the first scene before recording starts so the video never opens on a blank frame
  const player = ac.createBufferSource();
  player.buffer = mixed;
  player.connect(dest);
  // iOS Safari only keeps a Web Audio graph running when it reaches the real output.
  // A source connected only to a MediaStreamAudioDestinationNode sits idle on phones,
  // so the recorded file ends up with no audio. Route a silent (0-gain) monitor to the
  // output so the graph stays live while the MediaStreamDestination captures the audio.
  const monitor = ac.createGain();
  monitor.gain.value = 0;
  player.connect(monitor);
  monitor.connect(ac.destination);

  // Ken Burns camera moves + crossfade transitions bring the stills to life.
  // The AI picks a camera move per scene; if absent, autoCameras() varies them.
  const XFADE = 0.35;
  const cams = (cameras && cameras.length === segments.length) ? cameras : autoCameras(segments.length);
  const isUi = styleId === 'real-ui';
  const drawH = H - 100;

  const drawContent = (idx, p, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    const seg = segments[idx];
    const { img } = seg;
    const move = isUi ? 'static' : (cams[idx] || 'static');
    const { z, dx, dy } = kenBurns(move, p);
    // UI clones stay contained (full phone screen visible, never cropped); every
    // other style uses cover so there is always overflow to pan and zoom into.
    const baseFit = isUi ? Math.min(W / img.width, drawH / img.height) : Math.max(W / img.width, drawH / img.height);
    const scale = baseFit * z;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const panX = dx * Math.max(0, dw - W) / 2;
    const panY = dy * Math.max(0, dh - drawH) / 2;
    ctx.drawImage(img, (W - dw) / 2 + panX, (drawH - dh) / 2 + panY, dw, dh);
    const lines = wrapCaption(seg.caption);
    ctx.font = 'bold 34px "Nunito", sans-serif';
    ctx.fillStyle = style.ink;
    ctx.textAlign = 'center';
    lines.forEach((line, li) => {
      ctx.fillText(line, W / 2, H - 56 + li * 42);
    });
    ctx.restore();
  };

  const clear = () => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, W, H);
  };

  onProgress?.('Stitching your video…');
  clear();
  drawContent(0, 0, 1);

  // Start the narration and the recording together, then follow the audio clock
  const t0 = ac.currentTime + 0.1;
  player.start(t0);
  recorder.start(250);

  // setInterval (not requestAnimationFrame) so the capture loop keeps drawing
  // even when the user leaves the tab — rAF is paused in background tabs.
  const wallStart = Date.now();
  const guardMs = (totalDur + 12) * 1000; // generous: mobile audio clocks can drift
  await new Promise((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; clearInterval(timer); resolve(); } };
    // Backup: resolve the moment the mixed narration actually finishes playing,
    // so the recorder never stops before the last line is spoken.
    player.onended = done;
    const tick = () => {
      const elapsed = ac.currentTime - t0;
      let idx = segments.findIndex((s) => elapsed >= s.start && elapsed < s.end);
      if (idx === -1) idx = elapsed >= totalDur ? segments.length - 1 : 0;
      const seg = segments[idx];
      const segDur = seg.end - seg.start;
      const localP = segDur > 0 ? (elapsed - seg.start) / segDur : 0;
      const xfadeStart = seg.end - XFADE;
      clear();
      if (idx < segments.length - 1 && elapsed >= xfadeStart && elapsed < seg.end) {
        // crossfade the next scene in during the breath gap between narration lines
        const t = Math.min(1, (elapsed - xfadeStart) / XFADE);
        drawContent(idx, localP, 1 - t);
        drawContent(idx + 1, 0, t);
      } else {
        drawContent(idx, localP, 1);
      }
      // wall-clock guard: finish even if the audio clock stalls
      if (elapsed >= totalDur || Date.now() - wallStart > guardMs) {
        done();
      }
    };
    const timer = setInterval(tick, 40);
    tick();
  });

  // small tail so the last words are never clipped off the end of the file
  await new Promise((r) => setTimeout(r, 400));
  recorder.stop();
  await stopped;
  await ac.close();
  return new Blob(chunks, { type: mimeType.split(';')[0] });
}