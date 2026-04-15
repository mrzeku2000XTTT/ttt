import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type = 'document', title = 'Document', content = '', recipient = '', style = 'clean' } = body;

  if (!content || content.length < 10) {
    return Response.json({ success: false, error: 'Content is required and must be at least 10 characters.' });
  }

  const themes = {
    clean: { accent: [37, 99, 235], headerBg: [248, 250, 252], text: [26, 26, 46], light: [100, 116, 139] },
    kaspa: { accent: [6, 182, 212], headerBg: [26, 35, 50], text: [226, 232, 240], light: [148, 163, 184] },
    dark: { accent: [167, 139, 250], headerBg: [30, 27, 46], text: [226, 232, 240], light: [148, 163, 184] },
  };
  const t = themes[style] || themes.clean;
  const isDark = style === 'kaspa' || style === 'dark';

  const typeLabels = { document: 'Document', worksheet: 'Worksheet', report: 'Report', invoice: 'Invoice', checklist: 'Checklist' };
  const typeLabel = typeLabels[type] || 'Document';
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Create PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Background for dark themes
  if (isDark) {
    doc.setFillColor(15, 20, 25);
    doc.setTextColor(...t.text);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  } else {
    doc.setTextColor(...t.text);
  }

  const checkNewPage = (needed) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = margin;
      if (isDark) {
        doc.setFillColor(15, 20, 25);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setTextColor(...t.text);
      }
    }
  };

  // Header area
  doc.setFillColor(...t.headerBg);
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');

  // Type label
  doc.setFontSize(9);
  doc.setTextColor(...t.accent);
  doc.text(typeLabel.toUpperCase(), margin + 6, y + 10);

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...t.text);
  doc.text(title, margin + 6, y + 22);

  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...t.light);
  doc.text(now, pageWidth - margin - 6, y + 10, { align: 'right' });

  if (recipient) {
    doc.text(`For: ${recipient}`, pageWidth - margin - 6, y + 18, { align: 'right' });
  }

  y += 38;

  // Parse and render content
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      y += 4;
      continue;
    }

    // Divider
    if (trimmed === '---') {
      checkNewPage(8);
      doc.setDrawColor(...t.light);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      checkNewPage(10);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...t.accent);
      y += 4;
      doc.text(trimmed.slice(4), margin, y);
      y += 7;
      doc.setTextColor(...t.text);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      checkNewPage(12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...t.text);
      y += 6;
      doc.text(trimmed.slice(3), margin, y);
      y += 8;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      checkNewPage(14);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...t.text);
      y += 8;
      doc.text(trimmed.slice(2), margin, y);
      y += 10;
      continue;
    }

    // Checkbox checked
    if (trimmed.match(/^- \[x\] /)) {
      checkNewPage(8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      // Checked box
      doc.setFillColor(...t.accent);
      doc.roundedRect(margin, y - 3, 4, 4, 0.8, 0.8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('✓', margin + 1, y - 0.3);
      // Text with strikethrough
      doc.setFontSize(10);
      doc.setTextColor(...t.light);
      const checkText = trimmed.slice(6);
      doc.text(checkText, margin + 7, y);
      const tw = doc.getTextWidth(checkText);
      doc.setDrawColor(...t.light);
      doc.setLineWidth(0.3);
      doc.line(margin + 7, y - 1, margin + 7 + tw, y - 1);
      y += 6;
      continue;
    }

    // Checkbox unchecked
    if (trimmed.match(/^- \[ \] /)) {
      checkNewPage(8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(...t.light);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y - 3, 4, 4, 0.8, 0.8, 'S');
      doc.setTextColor(...t.text);
      doc.text(trimmed.slice(6), margin + 7, y);
      y += 6;
      continue;
    }

    // Bullet
    if (trimmed.startsWith('- ')) {
      checkNewPage(8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...t.accent);
      doc.text('•', margin + 2, y);
      doc.setTextColor(...t.text);
      const bulletLines = doc.splitTextToSize(trimmed.slice(2), contentWidth - 10);
      doc.text(bulletLines, margin + 7, y);
      y += bulletLines.length * 5 + 2;
      continue;
    }

    // Callout
    const calloutMatch = trimmed.match(/^\{\{(.+)\}\}$/);
    if (calloutMatch) {
      checkNewPage(14);
      doc.setFillColor(...(isDark ? [12, 45, 63] : [239, 246, 255]));
      const calloutLines = doc.splitTextToSize(calloutMatch[1], contentWidth - 16);
      const calloutH = calloutLines.length * 5 + 8;
      doc.roundedRect(margin, y - 2, contentWidth, calloutH, 2, 2, 'F');
      // Left accent bar
      doc.setFillColor(...t.accent);
      doc.rect(margin, y - 2, 1.5, calloutH, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...t.text);
      doc.text(calloutLines, margin + 6, y + 3);
      y += calloutH + 4;
      continue;
    }

    // Regular paragraph — handle bold markers
    checkNewPage(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...t.text);
    // Strip markdown bold for PDF (jsPDF can't inline bold)
    const cleanLine = trimmed.replace(/\*\*(.+?)\*\*/g, '$1');
    const wrappedLines = doc.splitTextToSize(cleanLine, contentWidth);
    doc.text(wrappedLines, margin, y);
    y += wrappedLines.length * 5 + 2;
  }

  // Footer
  checkNewPage(15);
  y = pageHeight - 15;
  doc.setDrawColor(...t.light);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setFontSize(8);
  doc.setTextColor(...t.light);
  doc.text(`Generated by KAI · ${now}`, pageWidth / 2, y + 5, { align: 'center' });

  // Convert to binary and upload
  const pdfBytes = doc.output('arraybuffer');
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const pdfFile = new File([pdfBlob], `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, { type: 'application/pdf' });
  
  const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });

  return Response.json({
    success: true,
    file_url,
    title,
    type,
    style,
  });
});