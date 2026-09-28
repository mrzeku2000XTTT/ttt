import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { askScheduleAssistant } from "@/lib/nudge/scheduleAssistant";
import { momentLabel } from "@/lib/nudge/localTime";

const GREETING = "Hello. Ask me anything about this schedule — I can also set a reminder on this phone for you.";

const OPENERS = [
  "What is next for me?",
  "What does my whole day look like?",
  "Remind me 15 minutes before the first thing",
];

/**
 * The assistant, docked under the Schedule screen. It answers about the day in
 * plain words, and anything it offers as a reminder can be set with one tap.
 */
export default function ScheduleChat({ brief, events, reminders, onAddReminders }) {
  const [log, setLog] = useState([{ id: "hello", from: "nudge", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setIds, setSetIds] = useState([]);
  const [showOpeners, setShowOpeners] = useState(true);

  const logRef = useRef(null);

  // The newest words are always the ones in view.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log, busy]);

  const ask = async (question) => {
    const asked = String(question || "").trim();
    if (!asked || busy) return;

    setShowOpeners(false);
    setBusy(true);
    setError("");
    setDraft("");
    setLog((cur) => [...cur, { id: `you-${Date.now()}`, from: "you", text: asked }]);

    try {
      const history = log
        .filter((m) => m.id !== "hello")
        .slice(-6)
        .map((m) => `${m.from === "you" ? "They" : "You"}: ${m.text}`);

      const result = await askScheduleAssistant({ brief, events, reminders, history, question: asked });
      setLog((cur) => [
        ...cur,
        { id: `nudge-${Date.now()}`, from: "nudge", text: result.reply, reminders: result.reminders },
      ]);
    } catch (e) {
      setError(e?.message || "I could not answer that just now. Try asking me again.");
    } finally {
      setBusy(false);
    }
  };

  const setReminder = (reminder) => {
    onAddReminders([reminder]);
    setSetIds((cur) => [...cur, reminder.id]);
  };

  return (
    <div className="nudge-chat">
      <p className="nudge-chat-head">
        <Sparkles className="w-3 h-3" /> Nudge assistant
      </p>

      <div className="nudge-chat-log" ref={logRef}>
        {log.map((message) => (
          <div key={message.id} className={`nudge-chat-msg from-${message.from}`}>
            {message.text}

            {message.reminders?.length ? (
              <div className="nudge-chat-proposals">
                {message.reminders.map((reminder) => {
                  const done = setIds.includes(reminder.id);
                  return (
                    <div key={reminder.id} className="nudge-chat-proposal">
                      <span className="nudge-chat-proposal-title">{reminder.title}</span>
                      <span className="nudge-chat-proposal-when">{momentLabel(reminder.at)}</span>
                      <button
                        type="button"
                        className={`nudge-chat-add ${done ? "is-done" : ""}`}
                        onClick={() => setReminder(reminder)}
                        disabled={done}
                      >
                        {done ? "Reminder set" : "Set this reminder"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}

        {busy ? <div className="nudge-chat-msg from-nudge">Let me look at your schedule…</div> : null}
      </div>

      {showOpeners && !busy ? (
        <div className="nudge-chat-chips">
          {OPENERS.map((opener) => (
            <button key={opener} type="button" className="nudge-chat-chip" onClick={() => ask(opener)}>
              {opener}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="nudge-chat-err">{error}</p> : null}

      <form
        className="nudge-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <textarea
          className="nudge-chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(draft);
            }
          }}
          placeholder="Ask me about your day…"
          spellCheck={false}
        />
        <button type="submit" className="nudge-chat-send" disabled={busy || !draft.trim()} aria-label="Send">
          {busy ? <span className="nudge-spin-dark" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}