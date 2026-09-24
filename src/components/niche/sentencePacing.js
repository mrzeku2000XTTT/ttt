// Sentence pacing — one image per spoken sentence instead of one image held for
// a whole scene. The script AI returns a "beats" list per scene (line + visual);
// when it doesn't, the voiceover is split into sentences client-side so the
// toggle always works either way.

// Manual scan (no lookbehind regex — older iOS Safari refuses to parse those)
export const splitSentences = (text) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const out = [];
  let current = '';
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    current += ch;
    if ((ch === '.' || ch === '!' || ch === '?') && (i === clean.length - 1 || clean[i + 1] === ' ')) {
      out.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
};

// Flattens scenes into ordered beats: every beat is one sentence with its own
// image (action), narration line and the scene's camera move on its first beat.
export const buildSentenceBeats = (scenes = []) => {
  const beats = [];
  scenes.forEach((scene, sceneIndex) => {
    const aiBeats = Array.isArray(scene.beats)
      ? scene.beats
          .filter((b) => b && String(b.line || b.visual || '').trim())
          .map((b) => ({ line: String(b.line || '').trim(), visual: String(b.visual || '').trim() }))
      : [];
    // The narration text always comes from the scene's FINAL voiceover (the
    // fact-check pass can reword it), with the AI's per-sentence visuals paired
    // in position — so images stay in sync with the lines actually spoken.
    const spoken = splitSentences(scene.voiceover);
    const lines = spoken.length ? spoken : aiBeats.map((b) => b.line);
    const visuals = aiBeats.map((b) => b.visual).filter(Boolean);
    const raw = (lines.length ? lines : [String(scene.voiceover || '').trim()]).map((line, i) => ({
      line,
      visual: visuals[i] || ''
    }));
    raw.forEach((b, i) => {
      beats.push({
        sceneIndex,
        first: i === 0,
        line: b.line,
        // the visual for this sentence: the AI's per-sentence moment, else the scene action
        action: b.visual || scene.action || '',
        caption: i === 0 ? scene.caption || '' : '',
        camera: i === 0 ? scene.camera : undefined
      });
    });
  });
  return beats;
};

// Caption for a beat, matching the lab's Summary / Real TTS caption modes.
export const beatCaption = (beat, captionMode) =>
  captionMode === 'tts'
    ? beat.line || ''
    : beat.caption || String(beat.line || '').split(' ').slice(0, 8).join(' ');