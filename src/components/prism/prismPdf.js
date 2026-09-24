import { jsPDF } from 'jspdf';
import { fileSize } from './prismFrames';

/** jsPDF's built-in Helvetica is latin-1 only — keep punctuation inside it. */
const clean = (s) =>
  String(s ?? '')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u00b7\u2022]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '->')
    .replace(/[^\x00-\xFF]/g, '?');

const pad = (n) => String(Math.round(Number(n) * 100) / 100);

export function buildPdf({ source, facts, result, report }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 46;
  const W = pageW - M * 2;
  let y = M;

  const space = (h) => {
    if (y + h > pageH - M) {
      doc.addPage();
      y = M;
    }
  };

  const block = (str, { size = 10, style = 'normal', grey = 45, gap = 7, lead = 4 } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(grey);
    const lines = doc.splitTextToSize(clean(str), W);
    lines.forEach((ln) => {
      space(size + lead);
      doc.text(ln, M, y);
      y += size + lead;
    });
    y += gap;
  };

  const head = (t) => {
    space(34);
    y += 4;
    block(t.toUpperCase(), { size: 11, style: 'bold', grey: 15, gap: 4 });
  };

  const rule = () => {
    space(16);
    doc.setDrawColor(215);
    doc.line(M, y, pageW - M, y);
    y += 14;
  };

  block('PRISM - video report', { size: 19, style: 'bold', grey: 10, gap: 1 });
  block(source?.name || 'video', { size: 9, grey: 125, gap: 4 });
  block(new Date().toLocaleString(), { size: 8, grey: 155, gap: 8 });
  rule();

  head('The file');
  block(
    [
      `Duration ${facts?.duration ? `${pad(facts.duration)}s` : '-'}`,
      `Resolution ${facts?.width || '-'}x${facts?.height || '-'}`,
      `Frame rate ${facts?.fps ? `~${facts.fps} fps` : 'not exposed'}`,
      `Size ${facts?.bytes ? fileSize(facts.bytes) : source?.kind === 'link' ? 'remote' : '-'}`,
    ].join('    '),
    { size: 9, grey: 70, gap: 4 },
  );

  if (result) {
    const s = result.summary;
    head('Measured from the pixels');
    block(
      [
        `Shots ${s.shots}   Cuts detected ${s.cuts}`,
        `Average shot ${s.avgShot}s   shortest ${s.shortestShot}s   longest ${s.longestShot}s   ${s.pacing} pacing`,
        `Motion mean ${s.avgMotion} peak ${s.peakMotion}   Brightness avg ${s.avgBrightness}%   White coverage avg ${s.avgWhite}%`,
      ].join('\n'),
      { size: 9, grey: 70, gap: 6 },
    );

    block('Palette by area', { size: 9, style: 'bold', grey: 40, gap: 3 });
    block(result.palette.map((c) => `${c.hex}  ${c.name}  ${c.share}%`).join('\n'), { size: 9, grey: 70, gap: 8 });

    block('Shot list', { size: 9, style: 'bold', grey: 40, gap: 3 });
    block(
      result.shots
        .map((sh) => `#${sh.index}  ${pad(sh.start)}s-${pad(sh.end)}s  ${sh.length}s  motion ${sh.motion}  ${sh.palette.map((p) => p.hex).join(' ')}`)
        .join('\n'),
      { size: 8, grey: 80, gap: 8 },
    );
  }

  if (report) {
    rule();
    head('The read');
    block(report.what_it_is, { size: 11, style: 'bold', grey: 20, gap: 2 });
    block(report.summary, { size: 9.5, grey: 70, gap: 8 });

    const t = report.typography || {};
    head('Typography');
    block(
      [
        `Faces: ${t.faces}`,
        `Weight: ${t.weights}`,
        `Case: ${t.casing}`,
        `Letter-spacing: ${t.tracking}`,
        `Placement: ${t.placement}`,
        `Treatment: ${t.treatment}`,
      ].join('\n'),
      { size: 9, grey: 70, gap: 4 },
    );
    if (t.notes) block(t.notes, { size: 9, grey: 90, gap: 6 });

    if ((report.animation || []).length) {
      head('Animation');
      report.animation.forEach((a) => {
        block(`${a.element} — ${a.when}`, { size: 9, style: 'bold', grey: 30, gap: 1 });
        block(`${a.motion}\nEasing: ${a.easing}${a.detail ? `  ${a.detail}` : ''}`, { size: 9, grey: 80, gap: 5 });
      });
    }

    if ((report.transitions || []).length) {
      head('At the cuts');
      report.transitions.forEach((x) => block(`${pad(x.at)}s — ${x.type}: ${x.description}`, { size: 9, grey: 75, gap: 4 }));
    }

    head('Lighting, composition, palette');
    block(
      [
        `Lighting: ${report.lighting || 'not determinable'}`,
        `Composition: ${report.composition || 'not determinable'}`,
        `Palette in use: ${report.palette_notes || 'not determinable'}`,
      ].join('\n'),
      { size: 9, grey: 75, gap: 6 },
    );

    if ((report.recipe || []).length) {
      head('Rebuild recipe');
      report.recipe.forEach((r, i) => {
        block(`${i + 1}. ${pad(r.t)}s — ${r.what}`, { size: 9.5, style: 'bold', grey: 20, gap: 1 });
        block(r.how, { size: 9, grey: 75, gap: 5 });
      });
    }

    if (report.rebuild_notes) {
      head('Easy to get wrong');
      block(report.rebuild_notes, { size: 9, grey: 75, gap: 6 });
    }
    if (report.confidence) {
      head('Confidence');
      block(report.confidence, { size: 9, grey: 90, gap: 6 });
    }
  }

  rule();
  block(
    'Measured in the browser by PRISM - a TTT super app. The measurements are taken from the real pixels; the read is an AI interpretation of sampled stills.',
    { size: 8, grey: 150, gap: 0 },
  );

  return doc;
}