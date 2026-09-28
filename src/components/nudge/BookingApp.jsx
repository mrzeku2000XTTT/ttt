import React, { useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import AppleNotification from "./AppleNotification";
import FluxkmailReminderRow from "./FluxkmailReminderRow";
import BookingRemindBar from "./BookingRemindBar";
import { BookItGlyph } from "./NudgeGlyphs";
import { planBookings } from "@/lib/nudge/bookingAgent";
import { makeBookingId, makeRef, bookingToNotification } from "@/lib/nudge/bookingStore";
import { shrinkForLocal } from "@/lib/nudge/sourcePreview";
import { signedImageUrls } from "@/lib/nudge/privateImageUrl";
import { useFluxkmailReminder } from "@/lib/nudge/useFluxkmailReminder";

const PLACEHOLDER = "Book something, or paste the appointments you already have.\n\nHaircut with Dana next Tuesday at 3, about 45 min\nDentist Fri Oct 2, 9am, 30 min";

/** How many references the agent will read at once. */
const MAX_SHOTS = 20;

let seq = 0;
const nextShotId = () => {
  seq += 1;
  return `shot-${Date.now()}-${seq}`;
};

/**
 * The booking app. The agent turns what you say, paste or drop into real
 * appointments, which are kept in this browser and come back as the same
 * notifications.
 */
export default function BookingApp({ onBook }) {
  const [text, setText] = useState("");
  const [shots, setShots] = useState([]);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [made, setMade] = useState([]);
  const mail = useFluxkmailReminder();

  // Paste, drop and pick all land here, so the cap and the ordering hold
  // whichever way a reference arrives.
  const addFiles = async (list) => {
    const all = Array.from(list || []);
    if (!all.length) return;

    const images = all.filter((f) => f?.type?.startsWith("image/"));
    if (!images.length) {
      setError("Only images and screenshots can be read.");
      return;
    }

    const room = MAX_SHOTS - shots.length;
    if (room <= 0) {
      setError(`That is all ${MAX_SHOTS} references — remove one to add another.`);
      return;
    }

    setError("");
    const taken = images.slice(0, room);
    const added = await Promise.all(
      taken.map(async (file) => ({ id: nextShotId(), file, preview: await shrinkForLocal(file, 340) })),
    );

    setShots((cur) => [...cur, ...added]);
    if (images.length > room) setError(`The first ${room} went in — ${MAX_SHOTS} references at a time.`);
  };

  // An image on the clipboard attaches the moment it is pasted; text pastes as usual.
  const onPaste = (e) => {
    const images = Array.from(e.clipboardData?.items || [])
      .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
      .map((i) => i.getAsFile())
      .filter(Boolean);

    if (!images.length) return;
    e.preventDefault();
    addFiles(images);
  };

  const book = async () => {
    if (!text.trim() && !shots.length) {
      setError("Say what you want to book, or paste a screenshot of the appointments.");
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    setMade([]);
    try {
      // Every reference leaves the device here and nowhere else — and only because
      // the agent has to see them to read the appointments out of them.
      const files = shots.map((s) => s.file);
      const imageUrls = files.length ? await signedImageUrls(files) : [];
      if (files.length && !imageUrls.length) throw new Error("Those references could not be read — try again.");

      const result = await planBookings({ text, imageUrls });
      setNote(result.note);
      // Nothing booked: keep what they gave us so they can fix it and press again.
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
      setShots([]);
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
        onPaste={onPaste}
        placeholder={PLACEHOLDER}
        spellCheck={false}
      />

      {shots.length ? (
        <div className="nudge-book-tray">
          <div className="nudge-book-tray-head">
            <span>Attached</span>
            <span>
              {shots.length} / {MAX_SHOTS}
            </span>
          </div>
          <div className="nudge-book-tray-grid">
            {shots.map((s) => (
              <div key={s.id} className="nudge-book-thumb">
                <img src={s.preview} alt="" />
                <button
                  type="button"
                  onClick={() => setShots((cur) => cur.filter((x) => x.id !== s.id))}
                  aria-label="Remove that reference"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <label
        className={`nudge-book-drop ${over ? "is-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <ImageIcon className="w-3.5 h-3.5" /> Paste, drop or pick a screenshot — up to {MAX_SHOTS}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      <button type="button" className="nudge-book-go" onClick={book} disabled={busy}>
        {busy ? <span className="nudge-book-spin" /> : <BookItGlyph className="nudge-book-glyph" />}
        {busy ? "Booking…" : "Book it"}
      </button>

      <FluxkmailReminderRow mail={mail} />

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
          <BookingRemindBar bookings={made} mail={mail} />
        </>
      ) : null}
    </div>
  );
}