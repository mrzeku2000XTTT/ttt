export default function parseEtaAdvanced(value) {
  if (value && typeof value === "object") return value;
  const source = String(value || "").trim();
  const start = source.indexOf("{");
  if (start < 0) throw new Error("ETA returned an invalid animation configuration.");

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (escaped) { escaped = false; continue; }
    if (character === "\\" && quoted) { escaped = true; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  throw new Error("ETA returned an incomplete animation configuration.");
}