import React, { useState } from "react";
import { Bell, Loader2, ExternalLink, Wallet } from "lucide-react";
import { useKcc20Wallet } from "@/lib/useKcc20Wallet";
import { kcc20Provider } from "@/lib/kcc20Pwa";
import { bookingToNotification } from "@/lib/nudge/bookingStore";

/**
 * The paid step. Booking is free — this only runs when the person chooses to
 * send the schedule to FluxKmail. It asks Scorpion to sign a self-send (the
 * only cost is the Kaspa network fee), and the moment that comes back with a
 * txId, the full notification UI is pushed to FluxKmail.
 */
const SELF_SEND_KAS = "0.001"; // returns to the sender; the network fee is the real cost

export default function BookingRemindBar({ bookings, mail, onSent }) {
  const scorpion = useKcc20Wallet();
  const [busy, setBusy] = useState(false);
  const [txId, setTxId] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(0);

  const remind = async () => {
    if (busy) return;
    if (!mail.connected) {
      setError("Connect FluxKmail first — tap the row above.");
      return;
    }

    setBusy(true);
    setError("");
    setTxId("");
    setSent(0);
    try {
      // Need a Scorpion account to sign the self-send. connect() returns the
      // address; the hook state updates on the next render, so read the result.
      let addr = scorpion.address;
      if (!addr) {
        const res = await scorpion.connect().catch(() => null);
        addr = res?.address || scorpion.address;
        if (!addr) throw new Error("Connect Scorpion to pay the network fee.");
      }

      const wallet = kcc20Provider();
      if (!wallet?.sendKas) {
        throw new Error("Refresh and reconnect Scorpion to use its latest KAS support.");
      }

      // Self-send: the amount comes back to you, so the only thing you pay is
      // the network fee. Scorpion shows the fee in its sign sheet.
      const result = await wallet.sendKas({ dest: `kaspa:${addr}`, amount: SELF_SEND_KAS });
      const id = result?.txId || result?.txid;
      if (!/^[a-f0-9]{64}$/i.test(id || "")) {
        throw new Error("No transaction receipt returned — check Scorpion history before trying again.");
      }
      setTxId(id);

      // Signed — push the full notification UI to FluxKmail right away.
      const payload = bookings.map((b) => {
        const n = bookingToNotification(b);
        return {
          title: b.title,
          when: [n.date, n.time].filter(Boolean).join(" · "),
          minutes: b.minutes,
          where: b.where,
          who: b.who,
          notes: b.notes,
        };
      });
      const n = await mail.remind(payload);
      setSent(n);
      if (n > 0) onSent?.(n);
      else setError("Signed, but FluxKmail could not deliver — try Remind again (you will not be charged twice).");
    } catch (e) {
      setError(e?.message || "The remind could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  if (!mail.ready || !mail.signedIn) return null;

  return (
    <div className="nudge-book-remind">
      <button type="button" className="nudge-book-remind-go" onClick={remind} disabled={busy || !mail.connected}>
        {busy ? <Loader2 className="nudge-book-spin" /> : <Bell className="nudge-book-glyph" />}
        {busy ? "Sign in Scorpion…" : sent ? "Resend" : "Remind via FluxKmail"}
      </button>
      <p className="nudge-book-remind-fee">
        {sent
          ? `Reminder sent to your Kaspa address`
          : mail.connected
            ? `Sign a ${SELF_SEND_KAS} KAS self-send in Scorpion — you pay only the network fee.`
            : `Connect FluxKmail above to enable reminders.`}
      </p>

      {txId ? (
        <a
          className="nudge-book-receipt"
          href={`https://kaspastream.com/tx/${txId}`}
          target="_blank"
          rel="noreferrer"
        >
          <Wallet className="w-3 h-3" /> Self-send signed
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : null}

      {error ? <p className="nudge-book-err">{error}</p> : null}
    </div>
  );
}