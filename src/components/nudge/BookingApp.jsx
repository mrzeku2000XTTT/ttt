import React, { useState } from "react";
import { Sparkles, Image as ImageIcon, X } from "lucide-react";
import AppleNotification from "./AppleNotification";
import { planBookings } from "@/lib/nudge/bookingAgent";
import { makeBookingId, makeRef, bookingToNotification } from "@/lib/nudge/bookingStore";
import { shrinkForLocal } from "@/lib/nudge/sourcePreview";
import { signedImageUrl } from "@/lib/nudge/privateImageUrl";

const PLACEHOLDER = "Book something, or paste the appointments you already have.\n\nHaircut with Dana next Tuesday at 3, about 45 min\nDentist Fri Oct 2, 9am, 30 min";

/**
 * The booking app. The agent turns what you say or drop into real appointments,
 * which are kept in this browser and come back as the same notifications.
 */
export default function BookingApp({ onBook }) {
  const [text, setText] = useState("");
  const [shot, setShot] = useState(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [made, setMade] = useState([]);

  const addShot = async (file) => {
    if (!file?.type?.startsWith("image/")) return;
    setError("");
    setShot({ source: file, preview: await shrinkForLocal(file, 620) });
  };

  const book = async () => {
    if (!text.trim() && !shot) {
      setError("Say what you want to book, or drop a screenshot of the appointments.");
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    setMade([]);
    try {
      // The screenshot leaves the device here and nowhere else — and only because
      // the agent has to see it to read the appointments out of it.
      const imageUrl = shot?.source ? await signedImageUrl(shot.source) : "";
      const result = await planBookings({ text, imageUrl });
      setNote(result.note);
      if (!result.appointments.length) return;

      const created = result.appointments.map((a) => ({
        id: makeBookingId(),
        ref: makeRef(),
        title: a.title,
        start: `${a.date}T${a.time}`,
        minutes: a.minutes,
        where: a.where,
        who: a.who,
        notes: a.notes,
        createdAt: Date.now(),
      }));
      onBook(created);
      setMade(created);
      setText("");
      setShot(null);
    } catch (e) {
      setError(e?.message || "The booking agent could not read that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nudge-book">
      <textarea
        className="nudge-book-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        spellCheck={false}
      />

      {shot ? (
        <div className="nudge-book-shot">
          <img src={shot.preview} alt="The appointments you dropped" />
          <button type="button" onClick={() => setShot(null)} aria-label="Remove that screenshot">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label
          className={`nudge-book-drop ${over ? "is-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); addShot(e.dataTransfer.files?.[0]); }}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Drop a screenshot of your appointments
          <input type="file" accept="image/*" hidden onChange={(e) => addShot(e.target.files?.[0])} />
        </label>
      )}

      <button type="button" className="nudge-book-go" onClick={book} disabled={busy}>
        {busy ? <span className="nudge-book-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {busy ? "Booking…" : "Book it"}
      </button>

      {error ? <p className="nudge-book-err">{error}</p> : null}
      {note ? <p className="nudge-book-note">{note}</p> : null}

      {made.length ? (
        <>
          <p className="nudge-book-label">Booked — this is the notification you get</p>
          <div className="nudge-book-cards">
            {made.map((b) => (
              <AppleNotification key={b.id} note={bookingToNotification(b)} animate={false} showDate />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}