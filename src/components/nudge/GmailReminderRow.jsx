import React from "react";
import { Mail, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * The one row that decides where a reminder lands: the person's own inbox.
 * Everyone connects their own Gmail, so the reminder is sent from their mailbox
 * to their own address — and nowhere else.
 */
export default function GmailReminderRow({ mail }) {
  const sub = !mail.ready
    ? "Checking your inbox…"
    : !mail.signedIn
      ? "Sign in to have reminders emailed to you"
      : mail.connected
        ? mail.email
        : "Reminders go to your own Gmail";

  return (
    <div className="nudge-book-mail">
      <Mail className="nudge-book-mail-icon" />
      <div className="nudge-book-mail-body">
        <span className="nudge-book-mail-title">{mail.connected ? "Reminders on" : "Email reminders"}</span>
        <span className="nudge-book-mail-sub">{sub}</span>
      </div>

      {!mail.ready ? null : !mail.signedIn ? (
        <button type="button" className="nudge-book-mail-go" onClick={() => base44.auth.redirectToLogin()}>
          Sign in
        </button>
      ) : mail.connected ? (
        <button
          type="button"
          className="nudge-book-mail-x"
          onClick={mail.disconnect}
          aria-label="Stop emailing reminders"
        >
          <X className="w-3 h-3" />
        </button>
      ) : (
        <button type="button" className="nudge-book-mail-go" onClick={mail.connect}>
          Connect
        </button>
      )}
    </div>
  );
}