import { Factory, RefreshCw } from "lucide-react";
import { C } from "@/lib/evolve/constants";
import { useEvolve } from "@/lib/evolve/useEvolve";
import useAiFactory from "@/lib/evolve/useAiFactory";

const INCLUDES = ["AI identity", "Unique genome", "TN-10 wallet", "Initial memory", "Basic tool access", "Spawn cell"];
const label = { fontSize: 8, letterSpacing: "0.13em", color: C.textFaint, marginBottom: 6 };
const row = { display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textDim, padding: "2px 0" };

/** AI FACTORY — after Genesis, every new agent must be paid for on TN-10.
 *  One wallet approval covers everything: the Factory funds the new agent. */
export default function AIFactoryPanel() {
  const { wallet } = useEvolve();
  const { info, step, error, busy, createAgent, resume } = useAiFactory();
  const p = info?.params;
  const walletReady = wallet?.isTN10 && wallet?.address;

  if (!p) return <div className="ev-section"><div style={label}>AI FACTORY</div><div style={{ fontSize: 10, color: C.textDim }}>Loading Factory…</div></div>;

  const full = info.birthsToday >= p.daily_capacity;
  const limit = info.activeCount >= p.max_active_per_human;
  const blocked = !walletReady || full || limit || busy;

  return (
    <div className="ev-section">
      <div style={{ ...label, display: "flex", alignItems: "center", gap: 5 }}><Factory className="h-3 w-3" /> AI FACTORY</div>
      <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8, lineHeight: 1.4 }}>
        One approval. Includes: {INCLUDES.join(" · ")}.
      </div>
      <div style={row}><span>Generation cost</span><span style={{ color: C.text }}>{p.generation_cost_kas} tKAS</span></div>
      <div style={row}><span>Starting capital (goes to the agent)</span><span style={{ color: C.text }}>{p.starting_capital_min_kas} tKAS</span></div>
      <div style={{ ...row, borderTop: "1px solid rgba(120,160,200,0.15)", marginTop: 4, paddingTop: 5, fontWeight: 800 }}>
        <span style={{ color: C.text }}>TOTAL — 1 signature</span><span style={{ color: C.green }}>{info.totalKas} tKAS</span>
      </div>
      <div style={{ ...row, fontSize: 9 }}><span>Capacity today</span><span>{info.birthsToday}/{p.daily_capacity}</span></div>
      <div style={{ ...row, fontSize: 9 }}><span>Your active agents</span><span>{info.activeCount}/{p.max_active_per_human}</span></div>

      {info.pending?.map((b) => (
        <button key={b.agentId} className="ev-btn ev-btn-ghost" style={{ width: "100%", marginTop: 6, justifyContent: "center", fontSize: 9 }} disabled={busy} onClick={() => resume(b)}>
          {b.agentCode} PAID — FUND & SPAWN
        </button>
      ))}

      <button className="ev-btn" style={{ width: "100%", marginTop: 8, padding: "9px 12px", justifyContent: "center" }} disabled={blocked} onClick={createAgent}>
        {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Factory className="h-3.5 w-3.5" />}
        <span>{busy ? "WORKING…" : `CREATE AGENT — ${info.totalKas} tKAS`}</span>
      </button>
      {step && <div style={{ fontSize: 9, color: C.cyan, marginTop: 5 }}>{step}</div>}
      {error && <div style={{ fontSize: 8.5, color: C.red, marginTop: 5, wordBreak: "break-word" }}>{error}</div>}
      {!walletReady && <div style={{ fontSize: 8.5, color: C.red, marginTop: 5 }}>Connect Scorpion on TN-10 to use the Factory.</div>}
      {full && <div style={{ fontSize: 8.5, color: C.red, marginTop: 5 }}>Factory is at full capacity today.</div>}
      {limit && <div style={{ fontSize: 8.5, color: C.red, marginTop: 5 }}>Active agent limit reached.</div>}
    </div>
  );
}