// Turns the current sprite sheet into a standalone HTML file: the same frames,
// laid out as a grid that plays itself. Nothing is re-generated — the sheet is
// simply written out as code.

import { frameLabel } from "./frameFlowPresets";

const escapeAttr = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const pad = (index) => String(index + 1).padStart(2, "0");

/** One HTML file holding the whole sheet, ready to save and open on its own. */
export function buildSpriteSheetHtml(frames, { fps = 12, title = "FrameFlow sprite sheet" } = {}) {
  const usable = (frames || []).filter((frame) => frame?.image);
  if (usable.length < 2) return "";

  const tiles = usable
    .map((frame, index) => {
      const label = `${frameLabel(index, usable.length)} · F${pad(index)}`;
      const active = index === 0 ? ' class="is-active"' : "";
      return `      <figure${active}>\n        <figcaption>${escapeAttr(label)}</figcaption>\n        <img src="${escapeAttr(
        frame.image
      )}" alt="${escapeAttr(label)}" />\n      </figure>`;
    })
    .join("\n");

  const step = Math.max(40, Math.round(1000 / (fps || 12)));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeAttr(title)}</title>
<style>
  :root { --ink: #0b0c0d; --line: #24282e; --paper: #ededed; --accent: #c8ff4d; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: var(--ink); color: #e8ebee;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  h1 { margin: 0 0 4px; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; }
  p.meta { margin: 0 0 16px; font-size: 11px; letter-spacing: 0.06em; color: #6d747d; }
  .sheet { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  figure { position: relative; margin: 0; border: 1px solid var(--line); border-radius: 10px;
    overflow: hidden; background: #111315; }
  figure.is-active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  figure img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: contain; background: var(--paper); }
  figcaption { position: absolute; left: 8px; top: 8px; z-index: 2; padding: 3px 6px; border-radius: 4px;
    background: rgba(0, 0, 0, 0.72); font-size: 8px; letter-spacing: 0.08em; white-space: nowrap; }
  @media (max-width: 900px) { .sheet { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
</head>
<body>
<h1>${escapeAttr(title)}</h1>
<p class="meta">${usable.length} frames · start → in-betweens → end · ${fps} fps</p>
<div class="sheet" id="frameflow-sheet">
${tiles}
</div>
<script>
  // Steps the highlight through the sheet at the sequence frame rate.
  var tiles = [].slice.call(document.querySelectorAll("#frameflow-sheet figure"));
  var at = 0;
  tiles[0].classList.add("is-active");
  setInterval(function () {
    tiles.forEach(function (tile, i) { tile.classList.toggle("is-active", i === at); });
    at = (at + 1) % tiles.length;
  }, ${step});
</script>
</body>
</html>
`;
}