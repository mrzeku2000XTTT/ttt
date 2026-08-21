import React, { useState, useEffect, useRef } from "react";
import { Check, Play, Pause, RotateCcw, Flame, ListChecks, Timer, Quote } from "lucide-react";
import { loadToolState, saveToolState } from "@/lib/productivityTools";

export default function ProductivityToolWidget({ tool, storageId }) {
  const [state, setState] = useState(() => loadToolState(storageId) || tool);

  useEffect(() => {
    saveToolState(storageId, state);
  }, [storageId, state]);

  if (!tool || !tool.kind) return null;

  if (tool.kind === "todo") return <TodoWidget tool={tool} state={state} setState={setState} />;
  if (tool.kind === "habit") return <HabitWidget tool={tool} state={state} setState={setState} />;
  if (tool.kind === "pomodoro") return <PomodoroWidget tool={tool} />;
  if (tool.kind === "mindset") return <MindsetWidget tool={tool} />;
  return null;
}

function TodoWidget({ tool, state, setState }) {
  const items = Array.isArray(state.items) ? state.items : tool.items || [];
  const toggle = (i) =>
    setState({ ...state, items: items.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)) });
  const doneCount = items.filter((i) => i.done).length;
  return (
    <div className="mt-2 rounded-xl border border-cyan-200 bg-cyan-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-100 border-b border-cyan-200">
        <span className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wide flex items-center gap-1.5">
          <ListChecks className="w-3 h-3" /> {tool.title || "To-do"}
        </span>
        <span className="text-[10px] text-cyan-600 font-mono">{doneCount}/{items.length}</span>
      </div>
      <ul className="p-2 space-y-0.5">
        {items.map((it, i) => (
          <li key={i}>
            <button onClick={() => toggle(i)} className="w-full flex items-center gap-2 text-left text-xs text-slate-800 py-1">
              <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${it.done ? "bg-cyan-500 border-cyan-500" : "border-slate-300"}`}>
                {it.done && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className={it.done ? "line-through text-slate-400" : ""}>{it.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HabitWidget({ tool, state, setState }) {
  const habits = Array.isArray(state.habits) ? state.habits : tool.habits || [];
  const toggle = (i) =>
    setState({ ...state, habits: habits.map((h, idx) => (idx === i ? { ...h, done: !h.done } : h)) });
  const doneCount = habits.filter((h) => h.done).length;
  return (
    <div className="mt-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-fuchsia-100 border-b border-fuchsia-200">
        <span className="text-[10px] font-semibold text-fuchsia-700 uppercase tracking-wide flex items-center gap-1.5">
          <Flame className="w-3 h-3" /> {tool.title || "Today's habits"}
        </span>
        <span className="text-[10px] text-fuchsia-600 font-mono">{doneCount}/{habits.length}</span>
      </div>
      <ul className="p-2 space-y-0.5">
        {habits.map((h, i) => (
          <li key={i}>
            <button onClick={() => toggle(i)} className="w-full flex items-center gap-2 text-left text-xs text-slate-800 py-1">
              <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${h.done ? "bg-fuchsia-500 border-fuchsia-500" : "border-slate-300"}`}>
                {h.done && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className={h.done ? "line-through text-slate-400" : ""}>{h.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PomodoroWidget({ tool }) {
  const focusMin = tool.focusMin || 25;
  const breakMin = tool.breakMin || 5;
  const totalFocus = focusMin * 60;
  const totalBreak = breakMin * 60;
  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(totalFocus);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (mode === "focus") {
            setMode("break");
            return totalBreak;
          }
          setMode("focus");
          return totalFocus;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, mode, totalFocus, totalBreak]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const styles = mode === "focus"
    ? {
        box: "mt-2 rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden",
        head: "flex items-center justify-between px-3 py-1.5 bg-emerald-100 border-b border-emerald-200",
        label: "text-[10px] font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5",
        btn: "ml-auto w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600",
      }
    : {
        box: "mt-2 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden",
        head: "flex items-center justify-between px-3 py-1.5 bg-amber-100 border-b border-amber-200",
        label: "text-[10px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5",
        btn: "ml-auto w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600",
      };
  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <span className={styles.label}>
          <Timer className="w-3 h-3" /> {mode === "focus" ? "Focus" : "Break"} · {tool.task || "Deep work"}
        </span>
      </div>
      <div className="p-3 flex items-center gap-3">
        <div className="text-2xl font-mono font-black text-slate-900 tabular-nums">{mm}:{ss}</div>
        <button onClick={() => setRunning((r) => !r)} className={styles.btn}>
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button onClick={() => { setRunning(false); setMode("focus"); setRemaining(totalFocus); }} className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MindsetWidget({ tool }) {
  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Quote className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-slate-800 italic">"{tool.quote}"</p>
          {tool.source && <p className="text-[10px] text-amber-600 mt-1">— {tool.source}</p>}
        </div>
      </div>
    </div>
  );
}