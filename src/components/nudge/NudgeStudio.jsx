import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home, Store, SlidersHorizontal, Bell, Rows3, Sun, Moon, Copy, Check } from "lucide-react";
import { useKcc20Wallet, shortKaspaAddress } from "@/lib/useKcc20Wallet";
import NudgePhone from "./NudgePhone";
import NudgeComposer from "./NudgeComposer";
import NudgeDisplayOptions from "./NudgeDisplayOptions";
import NudgeBriefList from "./NudgeBriefList";
import { loadStore, saveStore, makeId, briefToText } from "@/lib/nudge/nudgeStore";
import { parseIcs, icsToLines } from "@/lib/nudge/parseIcs";
import { analyzeSchedule } from "@/lib/nudge/nudgeAgent";
import { shrinkForLocal } from "@/lib/nudge/sourcePreview";
import { signedImageUrl } from "@/lib/nudge/privateImageUrl";
import { loadBookings, saveBookings } from "@/lib/nudge/bookingStore";
import { loadReminders, saveReminders } from "@/lib/nudge/reminderStore";
import "./nudge.css";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/17f6a9185_generated_image.png";

export default function NudgeStudio({ seed, onHome }) {
  const { address } = useKcc20Wallet();

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  // A dropped screenshot is held here as the raw file, on the device, and only
  // leaves it inside analyze() — the moment the button is pressed.
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [briefs, setBriefs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [mode, setMode] = useState("lock");
  const [light, setLight] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDate, setShowDate] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [reminders, setReminders] = useState([]);

  // Everything comes back from this browser's own storage.
  useEffect(() => {
    const stored = loadStore();
    setBriefs(stored.briefs);
    setActiveId(stored.activeId);
    setBookings(loadBookings());
    setReminders(loadReminders());
  }, []);

  const persist = (nextBriefs, nextActive) => saveStore({ briefs: nextBriefs, activeId: nextActive });

  /** Appointments booked, or brought in, from the phone's own Booking app. */
  const addBookings = useCallback((created) => {
    setBookings((cur) => {
      const next = [...cur, ...created].slice(-60);
      saveBookings(next);
      return next;
    });
  }, []);

  const cancelBooking = useCallback((id) => {
    setBookings((cur) => {
      const next = cur.filter((b) => b.id !== id);
      saveBookings(next);
      return next;
    });
  }, []);

  /** Reminders set from the Schedule screen, or offered by the assistant. */
  const addReminders = useCallback((created) => {
    setReminders((cur) => {
      const next = [...cur, ...created].slice(-80);
      saveReminders(next);
      return next;
    });
  }, []);

  const removeReminder = useCallback((id) => {
    setReminders((cur) => {
      const next = cur.filter((r) => r.id !== id);
      saveReminders(next);
      return next;
    });
  }, []);

  const clearImage = useCallback(() => setImage(null), []);

  const clearFile = useCallback(() => {
    setFileName("");
    clearImage();
  }, [clearImage]);

  /**
   * Whatever lands here, NUDGE tries to read it. A screenshot is kept as a file for
   * the agent to look at; a calendar file is parsed right here in the browser; and
   * everything else is taken as text, which is what a pasted roster, a copied
   * spreadsheet or plain notes arrive as.
   */
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError("");
    const name = String(file.name || "");
    const lower = name.toLowerCase();

    // Judged by type, and by name for the odd file that arrives without one.
    if (file.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)$/i.test(lower)) {
      // Kept small enough to live in this browser beside the brief it becomes, so
      // the phone can still be unlocked to it days later.
      setFileName(name);
      setImage({ source: file, preview: await shrinkForLocal(file) });
      return;
    }

    let raw = "";
    try {
      raw = await file.text();
    } catch {
      setError("Could not read that file — try pasting the schedule instead.");
      return;
    }

    // A calendar file, however it happens to be named.
    if (lower.endsWith(".ics") || file.type === "text/calendar" || /BEGIN:VEVENT/i.test(raw)) {
      const events = parseIcs(raw);
      if (!events.length) {
        setError("That calendar file had no events in it — try pasting the schedule or dropping a screenshot instead.");
        return;
      }
      setFileName(name);
      clearImage();
      setText(icsToLines(events));
      return;
    }

    if (!raw.trim()) {
      setError("That file was empty — try pasting the schedule or dropping a screenshot instead.");
      return;
    }

    setFileName(name);
    clearImage();
    setText(raw);
  }, [clearImage]);

  // Whatever the landing collected is handed straight to the studio's own input.
  useEffect(() => {
    if (!seed) return;
    if (seed.text) setText(seed.text);
    if (seed.file) handleFile(seed.file);
  }, [seed, handleFile]);

  const analyze = async () => {
    const schedule = text.trim();
    if (!schedule && !image) {
      setError("Paste a schedule, drop a screenshot, or drop a calendar file first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // The screenshot leaves the device here and nowhere else — and only because
      // the agent has to see it to read the schedule out of it.
      // Private storage and a link that expires: the agent needs one look at the
      // picture to read the schedule out of it, and nothing after that stays
      // reachable.
      const imageUrl = image?.source ? await signedImageUrl(image.source) : "";
      const result = await analyzeSchedule({ scheduleText: schedule, imageUrl, sourceLabel: fileName });
      if (!result.notifications.length) {
        setError(`The agent could not find anything scheduled in that ${imageUrl ? "screenshot" : "text"}.`);
        return;
      }
      const brief = {
        id: makeId(),
        headline: result.headline,
        notifications: result.notifications,
        source: fileName || "Pasted schedule",
        // The original itself, kept so the phone can be unlocked to it later.
        sourceText: schedule,
        sourcePreview: image?.preview || "",
        dateLabel: new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
        createdAt: Date.now(),
      };
      const next = [brief, ...briefs].slice(0, 12);
      setBriefs(next);
      setActiveId(brief.id);
      setExpandedId(null);
      setSheetOpen(false);
      persist(next, brief.id);
    } catch (e) {
      setError(e?.message || "The agent could not read that schedule. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const selectBrief = (id) => {
    setActiveId(id);
    setExpandedId(null);
    persist(briefs, id);
  };

  const removeBrief = (id) => {
    const next = briefs.filter((b) => b.id !== id);
    const nextActive = activeId === id ? (next[0]?.id ?? null) : activeId;
    setBriefs(next);
    setActiveId(nextActive);
    setExpandedId(null);
    persist(next, nextActive);
  };

  const copyBrief = async () => {
    const active = briefs.find((b) => b.id === activeId);
    if (!active) return;
    try {
      await navigator.clipboard.writeText(briefToText(active));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Your browser blocked the clipboard — select the text on the phone instead.");
    }
  };

  const active = briefs.find((b) => b.id === activeId) || null;

  const panel = (
    <>
      <NudgeComposer
        text={text}
        onText={setText}
        fileName={fileName}
        image={image}
        onFile={handleFile}
        onClearFile={clearFile}
        onAnalyze={analyze}
        busy={busy}
        canAnalyze={Boolean(text.trim() || image)}
        error={error}
      />
      <NudgeDisplayOptions
        brief={active}
        mode={mode}
        onMode={setMode}
        light={light}
        onLight={setLight}
        showDate={showDate}
        onShowDate={setShowDate}
        onCopy={copyBrief}
        copied={copied}
      />
      <NudgeBriefList
        briefs={briefs}
        activeId={activeId}
        onSelect={selectBrief}
        onDelete={removeBrief}
      />
    </>
  );

  return (
    <div className={`nudge-studio h-[100dvh] overflow-hidden flex flex-col ${light ? "is-light" : ""}`}>
      <header className="nudge-head">
        <button type="button" className="nudge-mark bg-transparent border-0 cursor-pointer" onClick={onHome} title="Back to the landing page">
          <img src={LOGO} alt="NUDGE" />
          <span className="text-white">NUDGE</span>
        </button>
        <span className="nudge-badge">Calendar → Notifications</span>

        <div className="ml-auto flex items-center gap-1.5">
          {address && (
            <span className="hidden sm:inline text-[10.5px] text-white/45 font-medium">{shortKaspaAddress(address)}</span>
          )}
          <button type="button" className="nudge-ghost" onClick={onHome} title="Landing page">
            <Home className="w-3.5 h-3.5" />
          </button>
          <Link to="/AppStoreV2" className="nudge-ghost" title="Exit to store">
            <Store className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* desktop rail */}
        <aside className="hidden lg:flex flex-col w-[392px] xl:w-[420px] shrink-0 nudge-panel overflow-y-auto border-r border-white/[.08]">
          {panel}
        </aside>

        {/* the phone */}
        <main className="nudge-stage">
          <NudgePhone
            brief={active}
            mode={mode}
            showDate={showDate}
            bookings={bookings}
            reminders={reminders}
            onBook={addBookings}
            onCancelBooking={cancelBooking}
            onRemind={addReminders}
            onRemoveReminder={removeReminder}
            expandedId={expandedId}
            onToggle={(i) => setExpandedId((cur) => (cur === i ? null : i))}
          />
        </main>
      </div>

      {/* phone controls */}
      <div className="nudge-bottom lg:hidden">
        <button type="button" className="nudge-ghost" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal className="w-3.5 h-3.5" /> Schedule
        </button>
        <button
          type="button"
          className="nudge-ghost ml-auto"
          onClick={() => setMode(mode === "lock" ? "banner" : "lock")}
        >
          {mode === "lock" ? <Rows3 className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {mode === "lock" ? "Lock" : "Banner"}
        </button>
        <button type="button" className="nudge-ghost" onClick={() => setLight(!light)} aria-label="Toggle light mode">
          {light ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <button type="button" className="nudge-ghost" onClick={copyBrief} disabled={!active} aria-label="Copy brief">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* mobile sheet */}
      {sheetOpen && (
        <>
          <div className="nudge-scrim lg:hidden" onClick={() => setSheetOpen(false)} />
          <div className="nudge-sheet is-open lg:hidden">
            <div className="nudge-sheet-head">
              <span className="nudge-sheet-grab" />
              <button type="button" className="nudge-ghost" onClick={() => setSheetOpen(false)}>Done</button>
            </div>
            <div className="nudge-sheet-body">{panel}</div>
          </div>
        </>
      )}
    </div>
  );
}