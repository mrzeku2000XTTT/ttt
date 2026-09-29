// Text motion: how the caption arrives, and when.
//
// The mouth is driven by the voice track, so the words are cut out of the same run
// of time. The track's own duration is shared out across the words — weighted by
// how long each one takes to say — and the caption shows only the card the voice
// has reached, so what is on the frame is what is being said. Sync nudges the whole
// run earlier or later, which is how the words are lined up with the voice by ear.
//
// Everything here is derived from the caption and the track, so the renderer can
// ask for the current words on every frame without any state of its own.

export const MOTION_MODES = [
  { id: "off", label: "Whole line" },
  { id: "word", label: "One word" },
  { id: "chunk", label: "Phrase" },
];

export const MOTION_STYLES = [
  { id: "pop", label: "Pop" },
  { id: "rise", label: "Rise" },
  { id: "fade", label: "Fade" },
  { id: "type", label: "Type" },
  { id: "snap", label: "Snap" },
];

// Held on the caption itself, so a saved scene reopens with the words moving the
// way they were left. "off" is the whole caption on the frame, as it always was.
export const MOTION_DEFAULTS = { anim: "off", motionStyle: "pop", chunk: 3, syncOffset: 0 };

// How long a card takes to arrive, at most. Never longer than the card is on
// screen, so a quick word still lands before the next one starts.
export const MOTION_ENTER = 0.26;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** The words, cut the way the caption is read. */
export function groupWords(text, mode, chunk) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  if (!mode || mode === "off") return [words.join(" ")];
  const size = mode === "word" ? 1 : clamp(Math.round(chunk || 3), 2, 6);
  const groups = [];
  for (let i = 0; i < words.length; i += size) groups.push(words.slice(i, i + size).join(" "));
  return groups;
}

// How long a word takes to say. Syllables track the voice far more closely than
// letters do, which over-run on long vowel-heavy words and under-run on clipped
// ones — the drift that puts the words ahead of the voice by the end of a take.
const VOWELS = /[aeiouy]+/g;

function syllables(word) {
  const clean = String(word).toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 1;
  const found = clean.match(VOWELS);
  let count = found ? found.length : 1;
  // A trailing silent "e" is not its own beat.
  if (count > 1 && clean.endsWith("e")) count -= 1;
  return Math.max(1, count);
}

// The breath after a card. A full stop holds longer than a comma, so the words do
// not run ahead of the voice across the pauses in a sentence.
function breath(group) {
  if (/[.!?…]["')\]]?$/.test(group)) return 2.4;
  if (/[,;:—–]["')\]]?$/.test(group)) return 1.2;
  return 0;
}

// A card's share of the track: the syllables it takes to say, plus the pause that
// follows it, with a floor so a short word still gets its moment rather than
// flashing past.
const weight = (group) => {
  const spoken = String(group)
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + syllables(word), 0);
  return Math.max(1.7, spoken + breath(group));
};

/**
 * The cue sheet: one entry per card, with the moment it starts and ends. Cached,
 * because the renderer asks for it sixty times a second.
 */
let cache = null;

export function cueSheet(caption, duration) {
  const text = String(caption?.text || "").trim();
  const mode = caption?.anim || "off";
  const chunk = caption?.chunk ?? 3;
  const offset = caption?.syncOffset || 0;
  const span = Number(duration) > 0 ? Number(duration) : 0;
  const key = `${mode}|${chunk}|${offset}|${span}|${text}`;
  if (cache && cache.key === key) return cache.cues;

  const groups = groupWords(text, mode, chunk);
  const total = groups.reduce((sum, group) => sum + weight(group), 0) || 1;
  let at = 0;
  const cues = groups.map((group) => {
    const length = span * (weight(group) / total);
    const cue = { text: group, start: at + offset, end: at + length + offset };
    at += length;
    return cue;
  });

  cache = { key, cues };
  return cues;
}

/** The card the voice has reached. */
export function cueAt(cues, time) {
  if (!cues.length) return null;
  return cues.find((cue) => time < cue.end) || cues[cues.length - 1];
}

/**
 * The caption to paint at this moment: the card the voice has reached, plus how
 * long it has been on screen for its entrance.
 *
 * With motion off — or with no track loaded — the whole block is handed straight
 * back, so a caption can always be written and placed before there is any voice to
 * sync it to.
 */
export function shownCaption(caption, { time, duration, running }) {
  if (!caption || (caption.anim || "off") === "off") return caption;
  if (!(Number(duration) > 0)) return caption;

  const cue = cueAt(cueSheet(caption, duration), time);
  if (!cue) return caption;

  return {
    ...caption,
    text: cue.text,
    // Held still while the track is paused, so a scrub shows the card crisply and
    // the playhead can be lined up against the mouth.
    motionAge: running ? Number(time) - cue.start : Infinity,
    motionLife: Math.max(0.08, cue.end - cue.start),
  };
}

/**
 * The longest card, so the drag outline on the stage covers the whole area the
 * words will move through rather than just one of them.
 */
export function sampleCaption(caption) {
  if (!caption || (caption.anim || "off") === "off") return caption;
  const groups = groupWords(caption.text, caption.anim, caption.chunk);
  if (!groups.length) return caption;
  const longest = groups.reduce((best, group) => (group.length > best.length ? group : best), groups[0]);
  return { ...caption, text: longest };
}