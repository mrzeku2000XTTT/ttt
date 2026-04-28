import React, { useState, useMemo } from "react";
import { Copy, Download, Check, Code2 } from "lucide-react";

/**
 * BrandCodeExport — generates a standalone HTML landing page from brand data.
 * 100% client-side, no backend. User can copy or download the .html file.
 */
export default function BrandCodeExport({ brand }) {
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => buildHtml(brand), [brand]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(brand?.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-landing.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!brand?.name && !brand?.tagline && !brand?.hero_copy) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/40">
        <Code2 className="w-8 h-8 mb-3 text-white/30" />
        <p className="text-sm font-bold text-white/60">No code yet</p>
        <p className="text-xs mt-1 max-w-[240px]">
          Keep chatting with the strategist — once your brand has a name, copy, and palette, the landing page code will generate here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold uppercase tracking-widest">
          <Code2 className="w-3 h-3" />
          <span>landing.html</span>
          <span className="text-white/30 normal-case tracking-normal">· {Math.round(html.length / 1024)}KB</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-bold"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-100 text-[11px] font-bold"
          >
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <pre className="px-3 py-3 text-[10.5px] font-mono text-cyan-100/90 whitespace-pre leading-relaxed">
          {html}
        </pre>
      </div>
    </div>
  );
}

function esc(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(brand) {
  const name = brand?.name || "Your Brand";
  const tagline = brand?.tagline || "";
  const description = brand?.description || "";
  const heroCopy = brand?.hero_copy || tagline || description;
  const palette = Array.isArray(brand?.palette) && brand.palette.length ? brand.palette : ["#0ea5e9", "#a855f7", "#f59e0b", "#10b981", "#ef4444"];
  const primary = palette[0];
  const accent = palette[1] || palette[0];
  const logo = brand?.logo_url || "";
  const audience = brand?.target_audience || "";
  const voice = brand?.voice || "";
  const social = brand?.social_bios || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(name)}${tagline ? " — " + esc(tagline) : ""}</title>
<meta name="description" content="${esc(description || tagline)}" />
<style>
  *,*::before,*::after { box-sizing: border-box; }
  html, body { margin:0; padding:0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #0a0a0a;
    color: #fff;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  a { color: ${primary}; text-decoration: none; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
  nav {
    display:flex; align-items:center; justify-content:space-between;
    padding: 24px 0;
  }
  .logo { display:flex; align-items:center; gap:10px; font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
  .logo img { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
  .logo .badge { width:32px; height:32px; border-radius:8px; background: linear-gradient(135deg, ${primary}, ${accent}); display:flex; align-items:center; justify-content:center; font-weight:900; }
  nav .cta { padding: 10px 18px; background: #fff; color:#000; border-radius: 999px; font-weight: 700; font-size: 13px; }

  .hero {
    padding: 80px 0 100px;
    text-align: center;
    background:
      radial-gradient(ellipse at top, ${primary}22, transparent 60%),
      radial-gradient(ellipse at bottom right, ${accent}22, transparent 60%);
  }
  .hero h1 {
    font-size: clamp(40px, 7vw, 72px);
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin: 0 0 20px;
    background: linear-gradient(135deg, #fff, ${primary});
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero p {
    font-size: clamp(16px, 2vw, 19px);
    color: rgba(255,255,255,0.65);
    max-width: 620px;
    margin: 0 auto 36px;
  }
  .hero .row { display:flex; gap:12px; justify-content:center; flex-wrap: wrap; }
  .btn-primary {
    padding: 14px 28px; border-radius: 999px;
    background: linear-gradient(135deg, ${primary}, ${accent});
    color: #fff; font-weight: 800; font-size: 14px;
    box-shadow: 0 10px 30px ${primary}55;
    border: none; cursor: pointer;
  }
  .btn-ghost {
    padding: 14px 28px; border-radius: 999px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff; font-weight: 700; font-size: 14px;
    cursor: pointer;
  }

  section { padding: 80px 0; }
  .section-head { text-align:center; margin-bottom: 48px; }
  .section-head .eyebrow {
    color: ${primary}; font-size: 12px; font-weight: 800;
    letter-spacing: 0.2em; text-transform: uppercase;
    margin-bottom: 12px;
  }
  .section-head h2 {
    font-size: clamp(28px, 4vw, 42px); font-weight: 900;
    letter-spacing: -0.02em; margin: 0;
  }

  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
  .card {
    padding: 28px;
    border-radius: 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .card .dot { width: 32px; height:32px; border-radius: 10px; margin-bottom: 14px; }
  .card h3 { margin:0 0 8px; font-size:18px; font-weight: 800; }
  .card p { margin:0; color: rgba(255,255,255,0.55); font-size: 14px; }

  .palette { display:flex; gap:8px; flex-wrap: wrap; justify-content:center; margin-top: 24px; }
  .palette span { width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }

  .cta-band {
    text-align: center;
    padding: 80px 24px;
    background: linear-gradient(135deg, ${primary}33, ${accent}33);
    border-top: 1px solid rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .cta-band h2 { font-size: clamp(28px, 4vw, 42px); font-weight: 900; margin: 0 0 12px; }
  .cta-band p { color: rgba(255,255,255,0.7); margin: 0 0 28px; }

  footer {
    padding: 40px 0;
    text-align: center;
    color: rgba(255,255,255,0.4);
    font-size: 13px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  footer .socials { display:flex; gap:18px; justify-content:center; margin-bottom: 16px; }
  footer a { color: rgba(255,255,255,0.6); }

  @media (max-width: 600px) {
    .hero { padding: 60px 0 80px; }
    section { padding: 60px 0; }
  }
</style>
</head>
<body>

<header class="wrap">
  <nav>
    <div class="logo">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" />` : `<div class="badge">${esc(name.charAt(0))}</div>`}
      <span>${esc(name)}</span>
    </div>
    <a class="cta" href="#cta">Get started</a>
  </nav>
</header>

<section class="hero">
  <div class="wrap">
    <h1>${esc(heroCopy || name)}</h1>
    ${tagline ? `<p>${esc(tagline)}</p>` : ""}
    <div class="row">
      <button class="btn-primary">Get started</button>
      <button class="btn-ghost">Learn more</button>
    </div>
  </div>
</section>

${description ? `
<section>
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">About</div>
      <h2>What we do</h2>
    </div>
    <p style="text-align:center; max-width:680px; margin:0 auto; color:rgba(255,255,255,0.7); font-size:17px; line-height:1.7;">
      ${esc(description)}
    </p>
  </div>
</section>` : ""}

${audience || voice ? `
<section>
  <div class="wrap">
    <div class="grid">
      ${audience ? `
      <div class="card">
        <div class="dot" style="background: linear-gradient(135deg, ${primary}, ${accent});"></div>
        <h3>Built for</h3>
        <p>${esc(audience)}</p>
      </div>` : ""}
      ${voice ? `
      <div class="card">
        <div class="dot" style="background: ${accent};"></div>
        <h3>Our voice</h3>
        <p>${esc(voice)}</p>
      </div>` : ""}
      <div class="card">
        <div class="dot" style="background: ${palette[2] || primary};"></div>
        <h3>Our palette</h3>
        <div class="palette" style="justify-content:flex-start; margin-top:8px;">
          ${palette.map(c => `<span style="background:${esc(c)}; width:28px; height:28px;"></span>`).join("")}
        </div>
      </div>
    </div>
  </div>
</section>` : ""}

<section class="cta-band" id="cta">
  <h2>Ready to begin?</h2>
  <p>Join us — be part of what's next.</p>
  <button class="btn-primary">Get started today</button>
</section>

<footer>
  <div class="socials">
    ${social.twitter ? `<a href="#">Twitter</a>` : ""}
    ${social.instagram ? `<a href="#">Instagram</a>` : ""}
    ${social.linkedin ? `<a href="#">LinkedIn</a>` : ""}
  </div>
  <div>© ${new Date().getFullYear()} ${esc(name)}. All rights reserved.</div>
</footer>

</body>
</html>`;
}