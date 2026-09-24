import { timecode, fileSize } from './prismFrames';

const pad = (n) => String(Math.round(n * 100) / 100);

export function buildMarkdown({ source, facts, result, sheet, report }) {
  const lines = [];
  lines.push(`# PRISM report — ${source?.name || 'video'}`);
  lines.push('');
  lines.push(`Generated ${new Date().toLocaleString()}`);
  lines.push('');

  lines.push('## The file');
  lines.push(`- Source: ${source?.kind === 'link' ? source.name : `${source?.name || 'local file'}`}`);
  lines.push(`- Duration: ${pad(facts?.duration || 0)}s (${timecode(facts?.duration || 0)})`);
  lines.push(`- Resolution: ${facts?.width}×${facts?.height} (${((facts?.width || 1) / (facts?.height || 1)).toFixed(2)}:1)`);
  if (facts?.fps) lines.push(`- Frame rate: ~${facts.fps} fps (measured in the browser)`);
  if (facts?.bytes) lines.push(`- Size: ${fileSize(facts.bytes)}`);
  lines.push('');

  if (result) {
    const s = result.summary;
    lines.push('## Measured from the pixels');
    lines.push(`- Shots: ${s.shots} · cuts detected: ${s.cuts}`);
    lines.push(`- Average shot: ${s.avgShot}s · shortest ${s.shortestShot}s · longest ${s.longestShot}s`);
    lines.push(`- Pacing: ${s.pacing}`);
    lines.push(`- Motion: mean ${s.avgMotion}, peak ${s.peakMotion} (per-sample pixel change, 0–100)`);
    lines.push(`- Brightness: avg ${s.avgBrightness}% · white coverage avg ${s.avgWhite}%`);
    lines.push(`- Sample interval: every ${s.sampleInterval}s`);
    lines.push('');
    lines.push('### Palette by area');
    result.palette.forEach((c) => lines.push(`- ${c.hex} — ${c.name} — ${c.share}%`));
    lines.push('');
    lines.push('### Shots');
    lines.push('| # | in | out | length | motion | palette |');
    lines.push('|---|---|---|---|---|---|');
    result.shots.forEach((sh) => {
      lines.push(`| ${sh.index} | ${pad(sh.start)}s | ${pad(sh.end)}s | ${sh.length}s | ${sh.motion} | ${sh.palette.map((p) => p.hex).join(' ')} |`);
    });
    lines.push('');
  }

  if (report) {
    lines.push('## The read');
    lines.push(`**${report.what_it_is}**`);
    lines.push('');
    lines.push(report.summary);
    lines.push('');
    const t = report.typography || {};
    lines.push('### Typography');
    lines.push(`- Faces: ${t.faces}`);
    lines.push(`- Weight: ${t.weights}`);
    lines.push(`- Case: ${t.casing}`);
    lines.push(`- Letter-spacing: ${t.tracking}`);
    lines.push(`- Placement: ${t.placement}`);
    lines.push(`- Treatment: ${t.treatment}`);
    if (t.notes) lines.push(`- Notes: ${t.notes}`);
    lines.push('');
    if ((report.animation || []).length) {
      lines.push('### Animation');
      report.animation.forEach((a) => lines.push(`- **${a.element}** (${a.when}) — ${a.motion} · easing: ${a.easing}${a.detail ? ` · ${a.detail}` : ''}`));
      lines.push('');
    }
    if ((report.transitions || []).length) {
      lines.push('### At the cuts');
      report.transitions.forEach((x) => lines.push(`- ${pad(x.at)}s — ${x.type}: ${x.description}`));
      lines.push('');
    }
    lines.push('### Lighting / composition / palette');
    lines.push(`- Lighting: ${report.lighting || 'not determinable'}`);
    lines.push(`- Composition: ${report.composition || 'not determinable'}`);
    lines.push(`- Palette in use: ${report.palette_notes || 'not determinable'}`);
    lines.push('');
    if ((report.recipe || []).length) {
      lines.push('### Rebuild recipe');
      report.recipe.forEach((r, i) => lines.push(`${i + 1}. **${pad(r.t)}s** — ${r.what}  \n   ${r.how}`));
      lines.push('');
    }
    if (report.rebuild_notes) {
      lines.push('### Easy to get wrong');
      lines.push(report.rebuild_notes);
      lines.push('');
    }
    if (report.confidence) {
      lines.push('### Confidence');
      lines.push(report.confidence);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('Measured in the browser by PRISM · a TTT super app. The read is an AI interpretation of sampled stills; the measurements are taken from the real pixels.');
  return lines.join('\n');
}

export function buildJson({ source, facts, result, sheet, report }) {
  return JSON.stringify(
    {
      prism: 'PRISM video report',
      generated: new Date().toISOString(),
      source,
      file: facts,
      measurements: result
        ? {
          summary: result.summary,
          cuts: result.cuts,
          shots: result.shots,
          palette: result.palette,
          motion: result.motion,
          brightness: result.brightness,
          white: result.white,
        }
        : null,
      sampled_frames: sheet.map((f) => ({ t: f.t, thumbnail: f.url })),
      read: report,
    },
    null,
    2,
  );
}

export function download(name, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Minimal markdown → HTML, enough for a clean paste into a document. */
export function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const out = [];
  let inList = false;
  md.split('\n').forEach((raw) => {
    const line = raw.trimEnd();
    if (line.startsWith('|') || /^-{3,}$/.test(line.trim())) return;
    const li = line.match(/^-\s+(.*)$/);
    if (li) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      return;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      return;
    }
    if (!line) return;
    out.push(`<p>${inline(line)}</p>`);
  });
  if (inList) out.push('</ul>');
  return out.join('\n');
}

export async function copyRich(html, text) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return true;
    }
  } catch {
    // fall through to plain text
  }
  return copyText(text);
}