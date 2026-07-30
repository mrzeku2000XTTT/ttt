// Renders a real npm/React project inside the static Preview iframe.
// JSX is transformed in-browser with Babel standalone; bare imports resolve via esm.sh.

const ENTRY_CANDIDATES = [
  "src/main.jsx", "src/main.js", "src/main.tsx", "src/main.ts",
  "src/index.jsx", "src/index.js", "src/index.tsx", "src/App.jsx",
];

export const findEntry = (files) => {
  const paths = files.map((f) => f.path);
  return ENTRY_CANDIDATES.find((c) => paths.includes(c)) || null;
};

export const isReactProject = (files) =>
  files.some((f) => f.path === "package.json") && !!findEntry(files);

export function buildReactPreview(files) {
  const entry = findEntry(files);
  if (!entry) return "";

  const map = {};
  files.forEach((f) => { map[f.path] = f.content || ""; });

  let deps = {};
  try {
    const pkg = JSON.parse(map["package.json"] || "{}");
    deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  } catch {}

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>html,body{margin:0;background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif}
#__err{display:none;position:fixed;inset:0;padding:20px;background:#0d1117;color:#ff7b72;font:12px/1.6 ui-monospace,monospace;white-space:pre-wrap;overflow:auto;z-index:9999}</style>
<script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<pre id="__err"></pre>
<script>
const FILES = ${JSON.stringify(map)};
const DEPS = ${JSON.stringify(deps)};
const ENTRY = ${JSON.stringify(entry)};
const CDN = "https://esm.sh/";
const fail = (m) => { const e = document.getElementById("__err"); e.style.display = "block"; e.textContent = String(m && m.stack || m); };
window.addEventListener("error", (e) => fail(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => fail(e.reason));

const EXTS = ["", ".jsx", ".js", ".tsx", ".ts", "/index.jsx", "/index.js"];
function resolvePath(fromPath, spec) {
  const base = fromPath.split("/").slice(0, -1);
  const parts = spec.split("/");
  const out = [...base];
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  const joined = out.join("/");
  for (const ext of EXTS) if (FILES[joined + ext] !== undefined) return joined + ext;
  return null;
}

function cdnUrl(spec) {
  const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
  const version = DEPS[name] ? "@" + String(DEPS[name]).replace(/^[\\^~]/, "") : "";
  const sub = spec.slice(name.length);
  return CDN + name + version + sub;
}

const cache = {};
function buildModule(path) {
  if (cache[path]) return cache[path];
  let code = FILES[path] || "";

  if (/\\.css$/.test(path)) {
    const url = URL.createObjectURL(new Blob(["const s=document.createElement('style');s.textContent=" + JSON.stringify(code) + ";document.head.appendChild(s);"], { type: "text/javascript" }));
    cache[path] = url;
    return url;
  }
  if (/\\.json$/.test(path)) {
    const url = URL.createObjectURL(new Blob(["export default " + code], { type: "text/javascript" }));
    cache[path] = url;
    return url;
  }

  code = Babel.transform(code, {
    presets: [["react", { runtime: "automatic" }], ["typescript", { isTSX: true, allExtensions: true }]],
    filename: path,
  }).code;

  // Rewrite every import/export specifier
  code = code.replace(/(from\\s*|import\\s*|import\\(\\s*)(["'])([^"']+)\\2/g, (full, kw, q, spec) => {
    let target;
    if (spec.startsWith(".") || spec.startsWith("/")) {
      const p = resolvePath(path, spec);
      target = p ? buildModule(p) : spec;
    } else {
      target = cdnUrl(spec);
    }
    return kw + q + target + q;
  });

  const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  cache[path] = url;
  return url;
}

try {
  const entryUrl = buildModule(ENTRY);
  const s = document.createElement("script");
  s.type = "module";
  s.src = entryUrl;
  document.body.appendChild(s);
} catch (e) { fail(e); }
</script>
</body>
</html>`;
}