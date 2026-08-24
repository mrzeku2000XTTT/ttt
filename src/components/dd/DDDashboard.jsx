import React, { useState } from "react";
import { Search, Bell, HelpCircle, Plus, Mic, Check, Calendar as CalIcon, FileText, Mail as MailIcon } from "lucide-react";
import DDLogo from "@/components/dd/DDLogo";
import { DD_USER, DD_EVENTS, DD_PRIORITIES, DD_FILES, DD_EMAILS, DD_INSIGHTS, DD_CONNECTED, DD_ACTIVITY, DD_QUICK_ACTIONS } from "@/components/dd/ddData";

function Card({ children, className = "" }) {
  return <div className={`bg-white border border-neutral-200 rounded-2xl p-4 ${className}`}>{children}</div>;
}
function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-neutral-900 mb-3">{children}</h3>;
}

export default function DDDashboard({ onAskDD }) {
  const [priorities, setPriorities] = useState(DD_PRIORITIES);
  const [ask, setAsk] = useState("");

  const toggle = (id) => setPriorities((p) => p.map((x) => x.id === id ? { ...x, done: !x.done } : x));

  const submitAsk = (text) => {
    if (!text.trim()) return;
    onAskDD?.(text);
    setAsk("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Good morning, Alex 👋</h1>
        <p className="text-neutral-500 mt-1">What are we getting done?</p>
      </div>

      {/* AI input */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-2 shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <button className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"><Plus className="w-4 h-4" /></button>
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAsk(ask)}
            placeholder="Ask DD anything…"
            className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400 h-10"
          />
          <button onClick={() => submitAsk(ask)} className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white"><Mic className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-2 pb-2 pt-1">
          {DD_QUICK_ACTIONS.map((q) => (
            <button key={q} onClick={() => submitAsk(q === "More" ? "" : q)} className="h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap bg-neutral-50 text-neutral-600 border border-neutral-200 hover:border-violet-300 hover:text-violet-700">{q}</button>
          ))}
        </div>
      </div>

      {/* Row 1 */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <SectionTitle>Today's Overview</SectionTitle>
          <div className="space-y-3">
            {DD_EVENTS.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-sm">{e.icon}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-neutral-900 truncate">{e.title}</p><p className="text-xs text-neutral-400">{e.time}</p></div>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-violet-600 font-medium hover:underline">+2 more events</button>
        </Card>

        <Card>
          <SectionTitle>Top Priorities</SectionTitle>
          <div className="space-y-2.5">
            {priorities.map((p) => (
              <button key={p.id} onClick={() => toggle(p.id)} className="w-full flex items-center gap-3 text-left">
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${p.done ? "bg-violet-600 border-violet-600" : "border-neutral-300"}`}>
                  {p.done && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className={`text-sm ${p.done ? "line-through text-neutral-400" : "text-neutral-700"}`}>{p.title}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
          <SectionTitle>AI Insight</SectionTitle>
          <p className="text-sm text-violet-900 font-medium mb-3">You have 3 things that need your attention today.</p>
          <div className="space-y-2">
            {DD_INSIGHTS.map((i, idx) => (
              <div key={i.id} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center">{idx + 1}</span>
                <span className="text-sm text-violet-900">{i.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <SectionTitle>Recent Files</SectionTitle>
          <div className="space-y-2.5">
            {DD_FILES.map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-sm">{f.icon}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-neutral-900 truncate">{f.name}</p><p className="text-xs text-neutral-400">{f.app}</p></div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Important Emails</SectionTitle>
          <div className="space-y-2.5">
            {DD_EMAILS.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${m.color}`}>{m.initials}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-neutral-900 truncate">{m.sender}</p></div>
                <span className="text-xs text-neutral-400">{m.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Connected Apps</SectionTitle>
          <div className="space-y-2.5">
            {DD_CONNECTED.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${c.color}`}>{c.letter}</div>
                <span className="flex-1 text-sm text-neutral-700">{c.name}</span>
                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected</span>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-violet-600 font-medium hover:underline">View all connections</button>
        </Card>
      </div>

      {/* Organize your day */}
      <div className="mt-4 bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-24 h-24 shrink-0 overflow-hidden">
          <div className="absolute inset-0 rounded-full bg-white border border-violet-200 flex items-center justify-center"><DDLogo size={40} animate={false} /></div>
          {DD_CONNECTED.slice(0, 6).map((c, i) => {
            const angle = (i / 6) * Math.PI * 2;
            return <div key={c.id} className={`absolute w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${c.color}`} style={{ left: `${50 + 42 * Math.cos(angle)}%`, top: `${50 + 42 * Math.sin(angle)}%`, transform: "translate(-50%,-50%)" }}>{c.letter}</div>;
          })}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-base font-semibold text-neutral-900">Let DD organize your day</h3>
          <p className="text-sm text-neutral-500 mt-1">Ask DD to prepare your day, summarize your work, and surface what matters most.</p>
        </div>
        <button onClick={() => onAskDD?.("Prepare my day")} className="h-10 px-5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 whitespace-nowrap">Prepare my day</button>
      </div>

      {/* Activity */}
      <Card className="mt-4">
        <SectionTitle>Activity Feed</SectionTitle>
        <div className="space-y-3">
          {DD_ACTIVITY.map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-sm">{a.icon}</div>
              <p className="flex-1 text-sm text-neutral-700">{a.text}</p>
              <span className="text-xs text-neutral-400">{a.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}