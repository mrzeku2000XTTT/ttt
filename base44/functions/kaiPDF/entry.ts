import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    clean: { bg: '#ffffff', text: '#1a1a2e', accent: '#2563eb', headerBg: '#f8fafc', border: '#e2e8f0', callout: '#eff6ff', calloutBorder: '#3b82f6' },
    kaspa: { bg: '#0f1419', text: '#e2e8f0', accent: '#06b6d4', headerBg: '#1a2332', border: '#1e3a4f', callout: '#0c2d3f', calloutBorder: '#06b6d4' },
    dark: { bg: '#13111c', text: '#e2e8f0', accent: '#a78bfa', headerBg: '#1e1b2e', border: '#2d2640', callout: '#1e1833', calloutBorder: '#8b5cf6' },
  };
  const t = themes[style] || themes.clean;

  // Convert markdown-style content to HTML
  const convertContent = (md) => {
    return md
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('### ')) return `<h3 style="font-size:16px;font-weight:700;margin:18px 0 8px;color:${t.accent}">${line.slice(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2 style="font-size:20px;font-weight:700;margin:24px 0 10px;color:${t.text}">${line.slice(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1 style="font-size:26px;font-weight:800;margin:28px 0 12px;color:${t.text}">${line.slice(2)}</h1>`;
        // Divider
        if (line.trim() === '---') return `<hr style="border:none;border-top:1px solid ${t.border};margin:20px 0">`;
        // Checkbox checked
        if (line.match(/^- \[x\] /)) return `<div style="display:flex;align-items:center;gap:8px;margin:6px 0;padding:6px 0"><span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;background:${t.accent};color:white;font-size:12px">✓</span><span style="text-decoration:line-through;opacity:0.6">${line.slice(6)}</span></div>`;
        // Checkbox unchecked
        if (line.match(/^- \[ \] /)) return `<div style="display:flex;align-items:center;gap:8px;margin:6px 0;padding:6px 0"><span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;border:2px solid ${t.border}"></span><span>${line.slice(6)}</span></div>`;
        // Bullet list
        if (line.startsWith('- ')) return `<div style="display:flex;gap:8px;margin:4px 0;padding:2px 0"><span style="color:${t.accent};font-weight:bold">•</span><span>${line.slice(2)}</span></div>`;
        // Callout
        const calloutMatch = line.match(/^\{\{(.+)\}\}$/);
        if (calloutMatch) return `<div style="background:${t.callout};border-left:4px solid ${t.calloutBorder};padding:12px 16px;border-radius:6px;margin:12px 0;font-weight:500">${calloutMatch[1]}</div>`;
        // Bold
        let processed = line.replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:700">$1</strong>`);
        // Empty line
        if (!processed.trim()) return '<div style="height:12px"></div>';
        return `<p style="margin:6px 0;line-height:1.7">${processed}</p>`;
      })
      .join('\n');
  };

  const typeLabels = { document: '📄 Document', worksheet: '📝 Worksheet', report: '📊 Report', invoice: '🧾 Invoice', checklist: '✅ Checklist' };
  const typeLabel = typeLabels[type] || '📄 Document';
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @media print { .no-print { display: none !important; } body { margin: 0; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${t.bg}; color: ${t.text}; }
</style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;padding:40px 32px">
  <div class="no-print" style="display:flex;justify-content:flex-end;margin-bottom:20px">
    <button onclick="window.print()" style="background:${t.accent};color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">🖨️ Print / Save as PDF</button>
  </div>
  <div style="background:${t.headerBg};border:1px solid ${t.border};border-radius:12px;padding:28px 32px;margin-bottom:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-size:12px;font-weight:600;color:${t.accent};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${typeLabel}</div>
        <h1 style="font-size:28px;font-weight:800;margin:0">${title}</h1>
        ${recipient ? `<div style="margin-top:8px;font-size:14px;opacity:0.7">For: ${recipient}</div>` : ''}
      </div>
      <div style="text-align:right;font-size:13px;opacity:0.6">
        <div>${now}</div>
        <div>by ${user.full_name || user.email}</div>
      </div>
    </div>
  </div>
  <div style="padding:0 8px">${convertContent(content)}</div>
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid ${t.border};font-size:11px;opacity:0.4;text-align:center">
    Generated by KAI · TTT Platform · ${now}
  </div>
</div>
</body>
</html>`;

  // Base64 encode
  const encoder = new TextEncoder();
  const bytes = encoder.encode(html);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  const dataUrl = `data:text/html;base64,${b64}`;

  return Response.json({
    success: true,
    data_url: dataUrl,
    title,
    type,
    style,
  });
});