import React, { useState } from "react";
import { Sparkles, Cpu } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { DEFAULT_CONFIG } from "@/lib/evolve/evolveEngine";

const SIZES = ["small", "medium", "large"];
const SCARCITY = ["low", "medium", "high"];

/**
 * GenesisModal — shown until an experiment exists.
 * Everything configured here is written to the experiment record.
 */
export default function GenesisModal() {
  const { createGenesis, genesisStage } = useEvolve();
  const [cfg, setCfg] = useState({ ...DEFAULT_CONFIG });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const start = async () => {
    setBusy(true);
    await createGenesis(cfg);
    setBusy(false);
  };

  const Field = ({ label, children, hint }) => (
    <div style={{ marginBottom: 10 }}>
      <div className="ev-label" style={{ marginBottom: 4 }}>{label}</div>
      {children}
      {hint ? <div style={{ fontSize: 9, color: "#54657c", marginTop: 3 }}>{hint}</div> : null}
    </div>
  );

  const input = {
    width: "100%", background: "#0b1220", border: "1px solid rgba(120,160,200,0.2)",
    borderRadius: 4, color: "#eef3f9", fontSize: 11, padding: "7px 8px", outline: "none",
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 60, background: "rgba(3,6,11,0.86)" }}>
      <div className="ev-panel ev-scroll" style={{ width: 420, maxWidth: "100%", maxHeight: "94%", overflowY: "auto", borderRadius: 8, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <Sparkles className="h-4 w-4" style={{ color: "#22d3ee" }} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.18em" }}>CREATE GENESIS</span>
        </div>
        <div style={{ fontSize: 10, color: "#7d90a8", lineHeight: 1.5, marginBottom: 14 }}>
          Nothing is scripted from here. You set the rules, the agents make the decisions, and selection
          decides what persists.
        </div>

        {genesisStage ? (
          <div style={{ padding: "26px 0", textAlign: "center" }}>
            <Cpu className="h-5 w-5" style={{ color: "#22d3ee", margin: "0 auto 10px" }} />
            <div style={{ fontSize: 12, letterSpacing: "0.14em", color: "#22d3ee", textTransform: "uppercase" }}>{genesisStage}</div>
          </div>
        ) : (
          <>
            <Field label="Experiment label">
              <input style={input} value={cfg.label} onChange={(e) => set("label", e.target.value)} />
            </Field>

            <div className="ev-grid2">
              <Field label="Network">
                <input style={{ ...input, color: "#7d90a8" }} value="KASPA TN-10" readOnly />
              </Field>
              <Field label="Genesis agents">
                <input style={input} type="number" min="2" max="60" value={cfg.genesis_agents} onChange={(e) => set("genesis_agents", Number(e.target.value))} />
              </Field>
              <Field label="Initial test KAS" hint="per genesis agent">
                <input style={input} type="number" min="0" max="5000" value={cfg.initial_test_kas} onChange={(e) => set("initial_test_kas", Number(e.target.value))} />
              </Field>
              <Field label="Mutation rate">
                <input style={input} type="number" min="0" max="0.5" step="0.01" value={cfg.mutation_rate} onChange={(e) => set("mutation_rate", Number(e.target.value))} />
              </Field>
              <Field label="World seed">
                <input style={input} type="number" value={cfg.seed} onChange={(e) => set("seed", Number(e.target.value))} />
              </Field>
              <Field label="Selection">
                <input style={{ ...input, color: "#7d90a8" }} value="ECONOMIC" readOnly />
              </Field>
            </div>

            <Field label="World size">
              <div style={{ display: "flex", gap: 5 }}>
                {SIZES.map((s) => (
                  <button key={s} className={`ev-chip ${cfg.world_size === s ? "is-on" : ""}`} onClick={() => set("world_size", s)}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Resource scarcity">
              <div style={{ display: "flex", gap: 5 }}>
                {SCARCITY.map((s) => (
                  <button key={s} className={`ev-chip ${cfg.scarcity === s ? "is-on" : ""}`} onClick={() => set("scarcity", s)}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Objective">
              <input style={input} value={cfg.objective} onChange={(e) => set("objective", e.target.value)} />
            </Field>

            <button className="ev-btn" style={{ width: "100%", padding: "11px", marginTop: 4 }} onClick={start} disabled={busy}>
              {busy ? "GENERATING WORLD…" : "CREATE GENESIS"}
            </button>

            <div style={{ fontSize: 9, color: "#54657c", marginTop: 9, lineHeight: 1.5 }}>
              Wallet creation, balances and settlement start on the DEVELOPMENT LEDGER. Kaspa TN-10 can be
              swapped in afterwards without changing anything else.
            </div>
          </>
        )}
      </div>
    </div>
  );
}