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

function reminderBody(b) {
  const meta = [
    b.where ? `Where: ${b.where}` : "",
    b.who ? `With: ${b.who}` : "",
    b.notes ? `Note: ${b.notes}` : "",
  ].filter(Boolean);

  return [
    `${b.title}`,
    `${b.when}${b.minutes ? ` · ${b.minutes} min` : ""}`,
    ...(meta.length ? ["", ...meta] : []),
    "",
    "Sent from NUDGE via FluxKmail. Your appointments stay on the device — this reminder is the one copy that left it, routed to your Kaspa address.",
  ].join("\n");
}

// FLUXKMAIL_API_URL may still be the app root; normalize to the sendMail endpoint.
function resolveEndpoint(url) {
  if (!url) return "";
  const trimmed = String(url).trim().replace(/\/$/, "");
  if (trimmed.includes("/functions/")) return trimmed;
  return `${trimmed}/functions/sendMail`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ signedIn: false, connected: false }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action === "remind" ? "remind" : "status";

    const address = user.created_wallet_address || user.data?.kaspa_address || "";
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

      const subject = `Reminder: ${title} · ${when}`;
      const text = reminderBody({
        title,
        when,
        minutes: Math.min(600, Math.max(0, Math.round(Number(entry?.minutes) || 0))),
        where: clip(entry?.where, 80),
        who: clip(entry?.who, 60),
        notes: clip(entry?.notes, 240),
      });

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": key },
          body: JSON.stringify({ to: address, subject, body: text, from_name: "NUDGE" }),
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