import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action = 'compose', to = '', subject = '', body: emailBody = '', from_name = '', tone = 'professional' } = body;

  if (!emailBody || emailBody.length < 10) {
    return Response.json({ success: false, error: 'Email body is required.' });
  }

  const senderName = from_name || user.full_name || user.email;

  // Build styled HTML preview
  const toneColors = {
    professional: { accent: '#2563eb', bg: '#f8fafc', headerBg: '#1e3a5f' },
    casual: { accent: '#06b6d4', bg: '#f0fdfa', headerBg: '#134e4a' },
    formal: { accent: '#4b5563', bg: '#f9fafb', headerBg: '#1f2937' },
    friendly: { accent: '#f59e0b', bg: '#fffbeb', headerBg: '#78350f' },
  };
  const tc = toneColors[tone] || toneColors.professional;

  // Convert newlines to paragraphs
  const htmlBody = emailBody.split('\n').map(line => {
    if (!line.trim()) return '<br>';
    return `<p style="margin:8px 0;line-height:1.7">${line}</p>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Email Preview</title>
<style>
  @media print { .no-print { display: none !important; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; color: #1a1a2e; }
</style>
</head>
<body>
<div style="max-width:640px;margin:0 auto;padding:24px 16px">
  <div class="no-print" style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:16px">
    <button onclick="window.print()" style="background:${tc.accent};color:white;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">🖨️ Print</button>
  </div>
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:${tc.headerBg};padding:20px 24px;color:white">
      <div style="font-size:11px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Email Preview</div>
      <div style="font-size:20px;font-weight:700">${subject || 'No Subject'}</div>
    </div>
    <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b">
      <div style="margin-bottom:4px"><strong style="color:#1a1a2e">From:</strong> ${senderName}</div>
      <div><strong style="color:#1a1a2e">To:</strong> ${to || 'recipient@email.com'}</div>
    </div>
    <div style="padding:24px;font-size:15px;color:#334155">
      ${htmlBody}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center">
      Composed by KAI · TTT Platform
    </div>
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
  const previewDataUrl = `data:text/html;base64,${b64}`;

  // Build send links
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(emailBody);
  const encodedTo = encodeURIComponent(to);

  const sendLinks = {
    gmail: `https://mail.google.com/mail/?view=cm&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`,
  };

  return Response.json({
    success: true,
    preview_data_url: previewDataUrl,
    send_links: sendLinks,
    to,
    subject,
    from_name: senderName,
    tone,
  });
});