import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import DDLogo from "@/components/dd/DDLogo";
import { ArrowRight, Check } from "lucide-react";

const STORAGE_KEY = "dd_onboarding_v1";

export function getOnboarding() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}

export function setOnboarding(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function isOnboarded() {
  return !!getOnboarding();
}

const QUESTIONS = [
  {
    key: "name",
    label: "What should I call you?",
    placeholder: "Your first name or nickname",
    type: "text",
  },
  {
    key: "role",
    label: "What do you do?",
    placeholder: "e.g. Founder, Designer, Developer, Marketer",
    type: "text",
  },
  {
    key: "priorities",
    label: "What are your top 3 priorities right now?",
    placeholder: "e.g. Launch product, Hire team, Close Q2 deals",
    type: "text",
  },
  {
    key: "workHours",
    label: "When do you start and end your day?",
    placeholder: "e.g. 9am – 6pm",
    type: "text",
  },
  {
    key: "focus",
    label: "What's the one thing that must get done today?",
    placeholder: "Your main focus for today",
    type: "text",
  },
  {
    key: "style",
    label: "How do you like me to communicate?",
    type: "choice",
    options: ["Brief & direct", "Warm & encouraging", "Detailed & structured"],
  },
];

export default function DDOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setEmail(u?.email || "guest");
        const saved = getOnboarding();
        if (saved?.email === (u?.email || "guest") && saved.completed) {
          onComplete?.(saved);
        }
      } catch {
        setEmail("guest");
      }
    })();
  }, []);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const next = () => {
    if (isLast) {
      const data = { ...answers, email, completed: true, at: new Date().toISOString() };
      setOnboarding(data);
      onComplete?.(data);
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    if (isLast) {
      const data = { ...answers, email, completed: true, at: new Date().toISOString(), skipped: true };
      setOnboarding(data);
      onComplete?.(data);
    } else {
      setStep((s) => s + 1);
    }
  };

  const canNext = q?.type === "choice" || (answers[q?.key] || "").trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <DDLogo size={44} showWord={false} animate={true} />
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Hi, I'm DD</h2>
            <p className="text-xs text-neutral-500">Let's set up your day.</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-6">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-neutral-900" : "bg-neutral-200"}`} />
          ))}
        </div>

        <label className="block text-sm font-semibold text-neutral-900 mb-2">{q.label}</label>

        {q.type === "choice" ? (
          <div className="space-y-2 mb-6">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${answers[q.key] === opt ? "border-neutral-900 bg-neutral-50 font-semibold" : "border-neutral-200 hover:border-neutral-300"}`}
              >
                {opt}
                {answers[q.key] === opt && <Check className="w-4 h-4 inline ml-2 text-neutral-900" />}
              </button>
            ))}
          </div>
        ) : (
          <input
            autoFocus
            value={answers[q.key] || ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && canNext && next()}
            placeholder={q.placeholder}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 h-12 text-sm outline-none focus:border-neutral-400 mb-6"
          />
        )}

        <div className="flex items-center justify-between">
          <button onClick={skip} className="text-sm text-neutral-400 hover:text-neutral-600">Skip</button>
          <button
            onClick={next}
            disabled={!canNext}
            className="flex items-center gap-2 px-5 h-10 rounded-xl bg-neutral-900 text-white text-sm font-semibold disabled:opacity-40"
          >
            {isLast ? "Start" : "Next"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}