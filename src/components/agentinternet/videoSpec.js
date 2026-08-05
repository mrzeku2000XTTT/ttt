/**
 * Video spec gate.
 * Motion can only render at fixed sizes and lengths, so before we burn a render
 * we make sure we actually know the four things that change the output:
 * aspect ratio, duration, background treatment and cut style.
 */
const VIDEO_INTENT = /\b(video|promo|trailer|ad|advert|commercial|reel|short|clip|teaser|launch film)\b/i;

export function isVideoRequest(text) {
  return VIDEO_INTENT.test(text || "");
}

export function parseSpec(text) {
  const t = (text || "").toLowerCase();
  const spec = {};

  if (/\b(9:16|vertical|portrait|tiktok|reel|shorts?|story)\b/.test(t)) spec.aspect_ratio = "9:16";
  else if (/\b(16:9|horizontal|landscape|widescreen|youtube)\b/.test(t)) spec.aspect_ratio = "16:9";

  const secs = t.match(/\b([468])\s*(?:s\b|sec|second)/);
  if (secs) spec.duration = Number(secs[1]);

  if (/\b(video background|moving background|live footage|motion background|b-?roll)\b/.test(t)) spec.background = "video";
  else if (/\b(image background|photo background|still background|static)\b/.test(t)) spec.background = "image";

  if (/\b(zoom cuts?|punch ins?|punch-ins?|fast cuts?|snap cuts?|hard cuts?)\b/.test(t)) spec.cuts = "zoom cuts";
  else if (/\b(one shot|single take|no cuts|slow|smooth)\b/.test(t)) spec.cuts = "single continuous take";

  return spec;
}

const LABELS = {
  aspect_ratio: "Size — 9:16 vertical or 16:9 widescreen?",
  duration: "Length — 4, 6 or 8 seconds?",
  background: "Background — a moving video plate, or a static rendered image?",
  cuts: "Cutting — punchy zoom cuts on the beats, or one continuous take?",
};

export function missingSpec(spec) {
  return ["aspect_ratio", "duration", "background", "cuts"].filter((k) => !spec[k]);
}

export function specQuestion(missing) {
  return `Before I render, four quick calls:\n${missing.map((k) => `• ${LABELS[k]}`).join("\n")}\n\nAnswer in one line, or say "your call" and I'll pick 9:16, 6s, video background with zoom cuts.`;
}

export const DEFAULT_SPEC = { aspect_ratio: "9:16", duration: 6, background: "video", cuts: "zoom cuts" };

const DEFER = /\b(your call|you (?:decide|pick|choose)|whatever|any|just do it|surprise me|default)\b/i;

/**
 * Resolves the spec from the current message plus the prior turns of this chat
 * (so an answer like "9:16, 8s, video bg, zoom cuts" attaches to the earlier ask).
 */
export function resolveSpec(text, history) {
  if (DEFER.test(text || "")) return DEFAULT_SPEC;
  const prior = (history || [])
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.text)
    .join(" ");
  return { ...parseSpec(prior), ...parseSpec(text) };
}