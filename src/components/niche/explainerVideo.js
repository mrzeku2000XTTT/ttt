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
  const base = styleById(styleId).prompt(action);
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

export async function compileExplainerVideo({ images, audios, captions = [], style: styleId, onProgress, audioContext }) {
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

  const stream = canvas.captureStream(25);
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  const mimeType = RECORDER_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/mp4';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });
  recorder.start(250);

  // Schedule narration back-to-back; remember the window for each scene
  const segments = [];
  let t = ac.currentTime + 0.15;
  buffers.forEach((buf, i) => {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(dest);
    src.start(t);
    segments.push({ start: t, end: t + buf.duration, img: imgEls[i], caption: captions[i] || '' });
    t += buf.duration;
  });

  const drawFrame = (seg) => {
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, W, H);
    const { img } = seg;
    const r = Math.min(W / img.width, (H - 100) / img.height);
    const dw = img.width * r;
    const dh = img.height * r;
    ctx.drawImage(img, (W - dw) / 2, (H - 100 - dh) / 2, dw, dh);
    const lines = wrapCaption(seg.caption);
    ctx.font = 'bold 34px "Nunito", sans-serif';
    ctx.fillStyle = style.ink;
    ctx.textAlign = 'center';
    lines.forEach((line, li) => {
      ctx.fillText(line, W / 2, H - 56 + li * 42);
    });
  };

  onProgress?.('Stitching your video…');
  // setInterval (not requestAnimationFrame) so the capture loop keeps drawing
  // even when the user leaves the tab — rAF is paused in background tabs.
  const wallStart = Date.now();
  const totalMs = (t - ac.currentTime + 2) * 1000;
  await new Promise((resolve) => {
    const tick = () => {
      const now = ac.currentTime;
      const seg = segments.find((s) => now >= s.start && now < s.end) || segments[segments.length - 1];
      if (seg) drawFrame(seg);
      // wall-clock guard: finish even if the audio clock stalls
      if (now >= t + 0.3 || Date.now() - wallStart > totalMs) {
        clearInterval(timer);
        resolve();
      }
    };
    const timer = setInterval(tick, 100);
    tick();
  });

  recorder.stop();
  await stopped;
  await ac.close();
  return new Blob(chunks, { type: mimeType.split(';')[0] });
}