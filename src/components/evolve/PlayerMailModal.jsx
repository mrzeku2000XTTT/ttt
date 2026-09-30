import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerMailModal — compose a FluxKmail message to another human player.
 * The recipient's public kaspatest: address is the delivery target; FluxKmail
 * maps it to that player's inbox. Shows the recipient code + address and
 * reports success/failure inline.
 */
export default function PlayerMailModal({ recipient, onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const addr = recipient?.address || "";
  const canSend = !!recipient && addr.startsWith("kaspatest:") && subject.trim() && body.trim() && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("evolveSendPlayerMail", {
        to: addr,
        subject: subject.trim(),
        body: body.trim(),
        from_name: recipient?.senderName || "EVOLVE Player",
      });
      const data = res?.data || res;
      if (data?.ok) {
        setResult({ ok: true, message: `Mail sent to ${recipient.code} via FluxKmail.` });
        setSubject("");
        setBody("");
      } else {
        setResult({ ok: false, message: data?.error || "Could not send mail." });
      }
    } catch (e) {
      setResult({ ok: false, message: e?.message || "Could not send mail." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ev-sheet" style={{ top: 50, right: 12, width: 300, maxHeight: "80vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">SEND FLUXKMAIL</span>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll">
        <div className="ev-section">
          <div style={{ fontSize: 9, color: C.textFaint }}>TO</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.cyan }}>{recipient?.code || "—"}</div>
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 2, wordBreak: "break-all" }}>{addr || "no address"}</div>
          {addr && !addr.startsWith("kaspatest:") && (
            <div style={{ fontSize: 9, color: C.red, marginTop: 4 }}>
              This player has no real TN-10 address — they must connect a wallet before they can receive mail.
            </div>
          )}
        </div>
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: C.textFaint, marginBottom: 4 }}>SUBJECT</div>
          <input
            className="ev-input"
            style={{ width: "100%", fontSize: 11, padding: "5px 8px" }}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Message subject"
            maxLength={120}
          />
        </div>
        <div className="ev-section">
          <div style={{ fontSize: 8, letterSpacing: "0.12em", color: C.textFaint, marginBottom: 4 }}>MESSAGE</div>
          <textarea
            className="ev-input"
            style={{ width: "100%", fontSize: 11, padding: "6px 8px", minHeight: 90, resize: "vertical" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            maxLength={2000}
          />
        </div>
        {result && (
          <div className="ev-section" style={{ fontSize: 10, color: result.ok ? C.green : C.red }}>
            {result.message}
          </div>
        )}
        <div className="ev-section">
          <button
            className="ev-btn"
            style={{ width: "100%", padding: "7px", fontSize: 10, opacity: canSend ? 1 : 0.5 }}
            disabled={!canSend}
            onClick={send}
          >
            {sending ? "SENDING…" : "SEND VIA FLUXKMAIL"}
          </button>
        </div>
      </div>
    </div>
  );
}