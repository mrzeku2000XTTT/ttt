import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

/**
 * EVOLVE: send a FluxKmail message to another human player's Kaspa address.
 * FluxKmail maps a kaspatest: address to that user's FluxKmail inbox, so this
 * is how one player reaches another inside EVOLVE — no email, no per-user OAuth.
 *
 * The recipient address is supplied by the caller (the player's public TN-10
 * address from their actor record). We validate it is a real kaspatest: address
 * before forwarding; a mock: address (player spawned without Scorpion) cannot
 * receive FluxKmail and is rejected with a clear message.
 */
const MAX_SUBJECT = 120;
const MAX_BODY = 2000;

function resolveEndpoint(url) {
  const fallback = "https://fluxkmail.base44.app/functions/sendMail";
  if (!url) return fallback;
  try {
    return `${new URL(String(url).trim()).origin}/functions/sendMail`;
  } catch {
    return fallback;
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const to = String(body?.to || "").trim();
    const subject = String(body?.subject || "").trim().slice(0, MAX_SUBJECT);
    const text = String(body?.body || "").trim().slice(0, MAX_BODY);
    const fromName = String(body?.from_name || user.full_name || user.email || "EVOLVE Player").slice(0, 60);

    if (!to) return Response.json({ ok: false, error: "Recipient address is required." });
    if (!to.startsWith("kaspatest:")) {
      return Response.json({ ok: false, error: "That player has no real Kaspa address (mock address). They must connect a TN-10 wallet first." });
    }
    if (!subject) return Response.json({ ok: false, error: "Subject is required." });
    if (!text) return Response.json({ ok: false, error: "Message body is required." });

    const url = resolveEndpoint(secrets.get("FLUXKMAIL_API_URL"));
    const key = secrets.get("FLUXKMAIL_API_KEY");
    if (!key) return Response.json({ ok: false, error: "FluxKmail is not configured." });

    const html = `<div style="background:#0a0a0c;padding:20px 14px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif">
  <div style="font-size:10px;letter-spacing:.16em;color:#8a8a94;text-transform:uppercase;margin-bottom:10px">EVOLVE · message from ${fromName}</div>
  <div style="background:#1c1c1e;border-radius:14px;padding:16px 18px">
    <div style="font-size:16px;color:#ffffff;font-weight:700;margin-bottom:10px">${subject.replace(/</g, "&lt;")}</div>
    <div style="font-size:14px;color:#d1d1d6;line-height:1.55;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</div>
  </div>
  <div style="font-size:10px;color:#6c6c76;margin-top:12px">Sent via FluxKmail to ${to.slice(0, 14)}…${to.slice(-6)}</div>
</div>`.trim();

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify({ to, subject, body: text, html, from_name: fromName }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json({ ok: false, error: `FluxKmail responded ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ""}` });
    }

    return Response.json({ ok: true, sent: true, to });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || "The mail could not be sent." }, { status: 500 });
  }
}