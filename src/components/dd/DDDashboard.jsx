import React, { useState, useEffect } from "react";
import { Plus, Mic, Check, Loader2 } from "lucide-react";
import DDLogo from "@/components/dd/DDLogo";
import { GOOGLE_LOGOS } from "@/components/dd/DDGoogleLogos";
import { base44 } from "@/api/base44Client";

function Card({ children, className = "" }) {
  return <div className={`bg-white border border-neutral-200 rounded-2xl p-4 ${className}`}>{children}</div>;
}
function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-neutral-900 mb-3">{children}</h3>;
}
function EmptyHint({ children }) {
  return <div className="py-6 text-center text-xs text-neutral-400">{children}</div>;
}

function greetingHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = ["Summarize my emails", "What's on my calendar?", "Create a meeting", "Plan my week"];

export default function DDDashboard({ onAskDD }) {
  const [name, setName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [connected, setConnected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ask, setAsk] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (u?.full_name) setName(u.full_name);else
        try {setName(localStorage.getItem("dd_profile_name") || "");} catch {}
        if (u?.email) {
          const [t, a, c] = await Promise.all([
          base44.entities.DDTask.filter({ user_email: u.email, done: false }, "-created_date", 5).catch(() => []),
          base44.entities.DDActivity.filter({ user_email: u.email }, "-created_date", 5).catch(() => []),
          base44.entities.DDConnectedApp.filter({ user_email: u.email }, "-created_date", 6).catch(() => [])]
          );
          setTasks(t);setActivity(a);setConnected(c);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (t) => {
    try {const u = await base44.entities.DDTask.update(t.id, { done: !t.done });setTasks((p) => p.map((x) => x.id === t.id ? u : x).filter((x) => !x.done));} catch {}
  };

  const submitAsk = (text) => {if (text.trim()) {onAskDD?.(text);setAsk("");}};

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight capitalize">{greetingHour()}{name ? `, ${name}` : ""}</h1>
      <p className="text-neutral-500 mt-2 mb-5 text-base">What are we getting done?</p>

      {/* AI input */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-2 shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <button className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"><Plus className="w-4 h-4" /></button>
          <input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAsk(ask)} placeholder="Ask DD anything…" className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400 h-10" />
          <button onClick={() => submitAsk(ask)} className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-white"><Mic className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-2 pb-2 pt-1">
          {QUICK_ACTIONS.map((q) =>
          <button key={q} onClick={() => submitAsk(q)} className="h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap bg-neutral-50 text-neutral-600 border border-neutral-200 hover:border-neutral-300">{q}</button>
          )}
        </div>
      </div>

      {loading ?
      <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div> :

      <>
          {/* Row 1 */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <SectionTitle>Top Priorities</SectionTitle>
              {tasks.length === 0 ? <EmptyHint>No tasks yet. Go to Tasks to add one.</EmptyHint> :
            <div className="space-y-2.5">
                  {tasks.map((p) =>
              <button key={p.id} onClick={() => toggle(p)} className="w-full flex items-center gap-3 text-left">
                      <span className="w-5 h-5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0" />
                      <span className="text-sm text-neutral-700">{p.title}</span>
                    </button>
              )}
                </div>
            }
            </Card>

            <Card>
              <SectionTitle>Connected Apps</SectionTitle>
              {connected.length === 0 ? <EmptyHint>No apps connected. Go to Apps to add some.</EmptyHint> :
            <div className="space-y-2.5">
                  {connected.map((c) =>
              <div key={c.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center overflow-hidden">
                        {(() => { const Logo = GOOGLE_LOGOS[c.app_name?.toLowerCase().replace(/\s/g, "")]; return Logo ? <Logo className="w-5 h-5" /> : <span className="text-xs font-bold text-neutral-500">{(c.app_name || "?")[0]}</span>; })()}
                      </div>
                      <span className="flex-1 text-sm text-neutral-700">{c.app_name}</span>
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {c.status}</span>
                    </div>
              )}
                </div>
            }
            </Card>
          </div>

          {/* Activity */}
          <Card className="mt-4">
            <SectionTitle>Activity Feed</SectionTitle>
            {activity.length === 0 ? <EmptyHint>No activity yet. Create tasks, projects, or automations to see them here.</EmptyHint> :
          <div className="space-y-3">
                {activity.map((a) =>
            <div key={a.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                      <Check className="w-4 h-4 text-neutral-400" />
                    </div>
                    <p className="flex-1 text-sm text-neutral-700">{a.text}</p>
                    <span className="text-xs text-neutral-400">{new Date(a.created_date).toLocaleString()}</span>
                  </div>
            )}
              </div>
          }
          </Card>

          {/* Organize your day */}
          <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0">
              <DDLogo size={64} showWord={false} animate={false} dark />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-semibold text-neutral-900">Let DD organize your day</h3>
              <p className="text-sm text-neutral-500 mt-1">Ask DD to prepare your day, summarize your work, and surface what matters most.</p>
            </div>
            <button onClick={() => onAskDD?.("Prepare my day")} className="h-10 px-5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 whitespace-nowrap">Prepare my day</button>
          </div>
        </>
      }
    </div>);

}