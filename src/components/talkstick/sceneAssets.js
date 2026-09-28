// Scene assets are everything that isn't the character itself: a background
// plate and any number of props. Each one is a plain serialisable object, so a
// whole scene can be written to storage and rebuilt on the next visit.

export const KIND_BACKGROUND = "background";
export const KIND_PROP = "prop";

export const KIND_LABELS = {
  [KIND_BACKGROUND]: "Background",
  [KIND_PROP]: "Prop",
};

/**
 * Whether an asset is painted behind the character. A background plate always
 * is; a prop is too unless it has been sent to the front. New props start
 * behind, so nothing ever lands on top of the artwork uninvited.
 */
export const isBehind = (asset) => asset.kind === KIND_BACKGROUND || asset.back !== false;

// The three layers, bottom to top: backgrounds, props behind the character,
// props in front of it.
const rank = (asset) => (asset.kind === KIND_BACKGROUND ? 0 : asset.back !== false ? 1 : 2);

/**
 * The order assets are stacked in — the single source of truth for both the
 * canvas and the stage overlay, so what you see is what gets painted. Every
 * background goes down first, then the props behind the character, then the
 * props in front. Within each layer the scene's own order is kept, which is
 * what "bring forward" and "send back" move around.
 */
export const paintOrder = (assets) =>
  assets
    .map((asset, index) => ({ asset, index }))
    .sort((a, b) => rank(a.asset) - rank(b.asset) || a.index - b.index)
    .map((entry) => entry.asset);

/**
 * Moves an asset one place up or down inside its own layer. It never crosses the
 * character, so a prop sitting behind the artwork can never jump in front of it
 * by accident — the layer button is what changes sides.
 */
export function shiftLayer(assets, id, delta) {
  const order = paintOrder(assets);
  const at = order.findIndex((asset) => asset.id === id);
  const to = at + delta;
  if (at < 0 || to < 0 || to >= order.length) return assets;
  if (rank(order[at]) !== rank(order[to])) return assets;
  const next = order.slice();
  [next[at], next[to]] = [next[to], next[at]];
  return next;
}

let counter = 0;

/** A new asset, dropped at the middle of the stage at a sensible size. */
export function newAsset({ url, ratio, kind, name, prompt }) {
  const background = kind === KIND_BACKGROUND;
  counter += 1;
  return {
    id: `a${Date.now().toString(36)}${counter}`,
    url,
    ratio: ratio || 1,
    kind: background ? KIND_BACKGROUND : KIND_PROP,
    name: name || (background ? "Background" : "Prop"),
    prompt: prompt || "",
    x: 50,
    y: 50,
    width: background ? 100 : 32,
    back: true,
  };
}

/** Where an asset sits and how big it is, in canvas pixels. */
export function assetBox(asset, canvas) {
  const w = canvas.width * (asset.width / 100);
  return {
    x: canvas.width * (asset.x / 100),
    y: canvas.height * (asset.y / 100),
    w,
    h: w / (asset.ratio || 1),
  };
}

/** Reads an image file into a data URL, so it survives a refresh. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("That file could not be read"));
    reader.readAsDataURL(file);
  });
}

/**
 * An asset from an image file the user supplied. Transparent PNGs stay
 * transparent — nothing is flattened on the way in.
 */
export function assetFromFile(file, kind) {
  return fileToDataUrl(file).then(
    (url) =>
      new Promise((resolve, reject) => {
        const probe = new Image();
        probe.onload = () =>
          resolve(
            newAsset({
              url,
              ratio: probe.naturalWidth / probe.naturalHeight,
              kind,
              name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Asset",
            })
          );
        probe.onerror = () => reject(new Error("That file is not an image"));
        probe.src = url;
      })
  );
}