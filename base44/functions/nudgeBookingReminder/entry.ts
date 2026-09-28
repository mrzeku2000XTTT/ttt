import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

/**
 * NUDGE keeps the appointments on the phone. This is the one thing that leaves it:
 * a reminder, sent from the Gmail that person connected, to their own address.
 *
 * The recipient is never taken from the request — it always comes back from the
 * connected account — so this can only ever mail someone their own reminders.
 */
const GMAIL_CONNECTOR_ID = "6a8cde4f5e2470cbe4b913d5";
const PROFILE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const MAX_REMINDERS = 12;

const utf8 = (value) => new TextEncoder().encode(String(value ?? ""));

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const base64Url = (bytes) => toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const clip = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// A header carrying anything but plain ASCII has to be encoded, or it arrives scrambled.
function headerText(value) {
  const text = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  return /^[\x20-\x7E]*$/.test(text) ? text : `=?UTF-8?B?${base64Url(utf8(text))}?=`;
}

// The body is base64 so the whole message stays 7-bit on the wire.
function buildRaw({ to, subject, body }) {
  const message = [
    `To: ${to}`,
    `Subject: ${headerText(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    toBase64(utf8(body)),
  ].join("\r\n");

  return base64Url(utf8(message));
}

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
    "Sent from NUDGE on your phone. Your appointments stay on the device — this reminder is the one copy that left it, and it went to your own inbox.",
  ].join("\n");
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ signedIn: false, connected: false }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action === "remind" ? "remind" : "status";

    // Not connected yet is an answer, not a failure — it is what turns the row
    // in the Booking app into a Connect button.
    let accessToken;
    try {
      const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);
      accessToken = connection.accessToken;
    } catch {
      return Response.json({ signedIn: true, connected: false });
    }

    const auth = { Authorization: `Bearer ${accessToken}` };

    const profile = await fetch(PROFILE_URL, { headers: auth });
    if (!profile.ok) return Response.json({ signedIn: true, connected: false });
    const { emailAddress } = await profile.json();
    if (!emailAddress) return Response.json({ signedIn: true, connected: false });

    if (action === "status") {
      return Response.json({ signedIn: true, connected: true, email: emailAddress });
    }

    const list = Array.isArray(body?.bookings) ? body.bookings.slice(0, MAX_REMINDERS) : [];
    if (!list.length) return Response.json({ connected: true, email: emailAddress, sent: 0 });

    let sent = 0;
    for (const entry of list) {
      const title = clip(entry?.title, 80);
      const when = clip(entry?.when, 80);
      if (!title || !when) continue;

      const raw = buildRaw({
        to: emailAddress,
        subject: `Reminder: ${title} · ${when}`,
        body: reminderBody({
          title,
          when,
          minutes: Math.min(600, Math.max(0, Math.round(Number(entry?.minutes) || 0))),
          where: clip(entry?.where, 80),
          who: clip(entry?.who, 60),
          notes: clip(entry?.notes, 240),
        }),
      });

      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (res.ok) sent += 1;
    }

    return Response.json({ connected: true, email: emailAddress, sent });
  } catch (error) {
    return Response.json({ error: error?.message || "The reminder could not be sent." }, { status: 500 });
  }
}