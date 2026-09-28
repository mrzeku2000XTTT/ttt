import React from "react";
import { Mail, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * The row that decides where a reminder lands: the person's own inbox, via
 * FluxKmail's own mail service. No Google account is involved — clicking
 * Connect opens a FluxKmail popup to confirm the address.
 */
export default function FluxkmailReminderRow({ mail }) {
  const sub = !mail.ready
    ? "Checking your inbox…"
    : !mail.signedIn
      ? "Sign in to have reminders emailed to you"
      : mail.connected
        ? mail.email
        : "Reminders sent via FluxKmail";

  return (
    <>
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

      {mail.showPopup ? (
        <FluxkmailConnectPopup email={mail.email} onAllow={mail.confirmConnect} onCancel={mail.cancelConnect} />
      ) : null}
    </>
  );
}

function FluxkmailConnectPopup({ email, onAllow, onCancel }) {
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "340px",
    background: "#ffffff",
    color: "#0a0a0a",
    borderRadius: "18px",
    padding: "22px 20px 18px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
    textAlign: "center",
  };

  const markStyle = {
    display: "inline-block",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    fontSize: "15px",
    padding: "4px 10px",
    border: "1.5px solid #0a0a0a",
    borderRadius: "999px",
    marginBottom: "14px",
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <span style={markStyle}>FluxKmail</span>
        <p style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>Connect FluxKmail</p>
        <p style={{ fontSize: "13.5px", color: "#444", margin: "0 0 6px", lineHeight: 1.45 }}>
          FluxKmail will send your NUDGE appointment reminders to:
        </p>
        <p style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px", wordBreak: "break-all" }}>
          {email || "your email"}
        </p>
        <p style={{ fontSize: "11.5px", color: "#888", margin: "0 0 16px", lineHeight: 1.4 }}>
          No Google account needed. Reminders come from FluxKmail's own mail service — the one copy that leaves your phone.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              background: "#fff",
              color: "#333",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAllow}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "12px",
              border: "none",
              background: "#0a0a0a",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}