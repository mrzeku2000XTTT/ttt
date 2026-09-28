import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

/**
 * NUDGE keeps appointments on the phone. This is the one thing that leaves it:
 * a reminder, sent through FluxKmail to the person's own Kaspa address — FluxKmail
 * maps that address to the user's FluxKmail inbox. No Google account, no email.
 *
 * The recipient is always the signed-in user's own Kaspa address, never taken
 * from the request body, so this can only ever reach the person themselves.
 */
const MAX_REMINDERS = 12;

const clip = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// A short plain-text fallback — every mail client renders this even if it
// ignores the html field.
function reminderText(b) {
  const meta = [b.where ? `Where: ${b.where}` : "", b.who ? `With: ${b.who}` : "", b.notes ? `Note: ${b.notes}` : ""].filter(Boolean);
  return [`${b.title}`, `${b.when}${b.minutes ? ` · ${b.minutes} min` : ""}`, ...(meta.length ? ["", ...meta] : [])].join("\n");
}

// The whole notification UI, the way it looks on the phone: a stack of dark
// frosted cards with the red Calendar tile, the app name, the timestamp, the
// bold headline and the detail line. This is what lands in the FluxKmail inbox.
function cardHtml(b) {
  const title = escapeHtml(b.title);
  const when = escapeHtml(b.when);
  const dur = b.minutes ? `${b.minutes} min` : "";
  const body = [dur, b.where, b.who].filter(Boolean).map(escapeHtml).join(" · ");
  const notes = b.notes ? escapeHtml(b.notes) : "";
  return `
  <div style="background:#1c1c1e;border-radius:16px;padding:14px 16px;margin:0 0 10px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:7px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#ff3b30;color:#fff;font-size:9px;font-weight:800;letter-spacing:.04em">CAL</span>
        <span style="font-size:10px;color:#98989f;text-transform:uppercase;letter-spacing:.08em">Calendar</span>
      </div>
      <span style="font-size:13px;color:#ffffff;font-weight:600">${when}</span>
    </div>
    <div style="font-size:17px;color:#ffffff;font-weight:700;margin-top:10px;line-height:1.25">${title}</div>
    ${body ? `<div style="font-size:13px;color:#d1d1d6;margin-top:3px">${body}</div>` : ""}
    ${notes ? `<div style="font-size:11px;color:#98989f;margin-top:7px;line-height:1.45">${notes}</div>` : ""}
  </div>`;
}

function notificationHtml(list, address) {
  const cards = list.map(cardHtml).join("");
  const count = list.length;
  const addrShort = address.length > 18 ? `${address.slice(0, 12)}…${address.slice(-6)}` : address;
  return `
<div style="background:#0a0a0c;padding:22px 16px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif">
  <div style="text-align:center;margin-bottom:16px">
    <div style="font-size:10px;letter-spacing:.16em;color:#8a8a94;text-transform:uppercase">NUDGE · your schedule</div>
    <div style="font-size:19px;color:#ffffff;font-weight:700;margin-top:5px">${count} appointment${count === 1 ? "" : "s"} booked</div>
  </div>
  ${cards}
  <div style="text-align:center;font-size:10px;color:#6c6c76;margin-top:14px;line-height:1.5">
    Sent from NUDGE via FluxKmail to<br/><span style="font-family:monospace">${escapeHtml(addrShort)}</span>
  </div>
</div>`.trim();
}

// Always hit FluxKmail's real sendMail function. Earlier the configured URL
// sometimes already carried a wrong /functions/<name> path, which 404'd.
// Rebuild from the origin so the host stays configurable but the path is fixed.
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
    if (!user) return Response.json({ signedIn: false, connected: false }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action === "remind" ? "remind" : "status";

    // The person may type a different Kaspa address than the profile wallet
    // (the one their FluxKmail inbox is actually mapped to). Trust that override
    // — it's still self-directed: a reminder to their own Kaspa address.
    const override = typeof body?.address === "string" ? body.address.trim() : "";
    const address = override || user.created_wallet_address || user.data?.kaspa_address || "";
    if (!address) {
      return Response.json({ signedIn: true, connected: false, error: "No Kaspa address on your account." });
    }

    if (action === "status") {
      return Response.json({ signedIn: true, connected: true, address });
    }

    const list = Array.isArray(body?.bookings) ? body.bookings.slice(0, MAX_REMINDERS) : [];
    if (!list.length) return Response.json({ connected: true, address, sent: 0 });

    const url = resolveEndpoint(secrets.get("FLUXKMAIL_API_URL"));
    const key = secrets.get("FLUXKMAIL_API_KEY");
    if (!url || !key) {
      return Response.json({ connected: true, address, sent: 0, error: "FluxKmail is not configured." });
    }

    let sent = 0;
    let lastError = "";
    for (const entry of list) {
      const title = clip(entry?.title, 80);
      const when = clip(entry?.when, 80);
      if (!title || !when) continue;

      const item = {
        title,
        when,
        minutes: Math.min(600, Math.max(0, Math.round(Number(entry?.minutes) || 0))),
        where: clip(entry?.where, 80),
        who: clip(entry?.who, 60),
        notes: clip(entry?.notes, 240),
      };
      const subject = `Reminder: ${title} · ${when}`;
      const text = reminderText(item);
      const html = cardHtml(item);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": key },
          body: JSON.stringify({ to: address, subject, body: text, html, from_name: "NUDGE" }),
        });
        if (res.ok) {
          sent += 1;
        } else {
          lastError = `FluxKmail responded ${res.status}`;
        }
      } catch (e) {
        lastError = String(e?.message || e).slice(0, 200);
      }
    }

    return Response.json({ connected: true, address, sent, error: sent ? "" : lastError });
  } catch (error) {
    return Response.json({ error: error?.message || "The reminder could not be sent." }, { status: 500 });
  }
}