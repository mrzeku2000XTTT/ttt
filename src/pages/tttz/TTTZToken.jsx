import React from "react";
import { Coins, ExternalLink, CheckCircle, Clock, Cog } from "lucide-react";

const V1_TX = "c32dc4b304580cea542a2eb919ffe99e8cc7ab68425e1350118fe5450e68cbbd";
const V2_TX = "e6cf5a6d40d2977d3b2f7a79b2819841da77a1b3905615c1b907bc378db7f963";

const ROADMAP = [
  {
    version: "v1",
    title: "Genesis Deployment",
    status: "deployed",
    description: "Original TTT token deployed to Toccata mainnet. Locked as genesis reference.",
    tx: V1_TX,
  },
  {
    version: "v2",
    title: "Reclaimed Covenant",
    status: "deployed",
    description: "v2 deployment with improved covenant structure. Successfully reclaimed.",
    tx: V2_TX,
  },
  {
    version: "v3",
    title: "Full KCC20 Standard",
    status: "in-development",
    description: "Proper KCC20 implementation with mint, burn, and transfer functions. Full token standard compliance.",
    tx: null,
  },
];

export default function TTTZToken() {
  return (
    <div className="space-y-5 pt-6">
      <div className="flex items-center gap-2">
        <Coins className="w-5 h-5" style={{ color: "#00ffcc" }} />
        <h2 className="text-xl font-bold" style={{ color: "#e0e0e0" }}>TTT Token</h2>
      </div>

      {/* Token Info Card */}
      <div className="rounded-xl p-5 space-y-3" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black" style={{ color: "#00ffcc" }}>TTT</span>
              <span className="text-xs" style={{ color: "#555" }}>Toccata Test Token</span>
            </div>
          </div>
          <span className="px-2 py-1 rounded-md text-[10px] font-mono" style={{ background: "rgba(0,255,204,0.08)", color: "#00ffcc", border: "1px solid rgba(0,255,204,0.2)" }}>
            v2 DEPLOYED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <InfoRow label="Standard" value="KCC20" />
          <InfoRow label="Network" value="Kaspa Toccata" />
          <InfoRow label="Status" value="v2 Deployed" />
          <InfoRow label="Type" value="Covenant Token" />
        </div>
      </div>

      {/* Deployment TXs */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium" style={{ color: "#555" }}>Deployment Transactions</h3>

        <TxLink label="v0 Genesis (Locked)" txid={V1_TX} />
        <TxLink label="v2 Deployment" txid={V2_TX} />
      </div>

      {/* v3 Badge */}
      <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#0d0d0d", border: "1px dashed #333" }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#111" }}>
          <Clock className="w-5 h-5" style={{ color: "#00ffcc" }} />
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: "#00ffcc" }}>TTT v3 Coming Soon</div>
          <div className="text-xs" style={{ color: "#555" }}>Proper KCC20 with mint / burn / transfer</div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium" style={{ color: "#555" }}>Roadmap</h3>
        <div className="space-y-3">
          {ROADMAP.map((step, i) => (
            <div key={step.version} className="relative rounded-xl p-4" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              {i < ROADMAP.length - 1 && (
                <div className="absolute left-6 -bottom-3 w-px h-3" style={{ background: "#1a1a1a" }} />
              )}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: step.status === "deployed" ? "rgba(0,255,204,0.1)" : "#111",
                    border: step.status === "deployed" ? "1px solid rgba(0,255,204,0.3)" : "1px solid #333",
                  }}>
                  {step.status === "deployed" ? (
                    <CheckCircle className="w-4 h-4" style={{ color: "#00ffcc" }} />
                  ) : (
                    <Cog className="w-4 h-4 animate-spin" style={{ color: "#666", animationDuration: "3s" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold" style={{ color: step.status === "deployed" ? "#00ffcc" : "#888" }}>
                      {step.version}
                    </span>
                    <span className="text-xs" style={{ color: "#999" }}>{step.title}</span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#555" }}>{step.description}</p>
                  {step.tx && (
                    <a href={`https://kaspa.stream/txs/${step.tx}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 font-mono text-[10px] hover:underline" style={{ color: "#00ffcc" }}>
                      {step.tx.slice(0, 24)}... <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase" style={{ color: "#444" }}>{label}</div>
      <div className="text-sm font-mono mt-0.5" style={{ color: "#e0e0e0" }}>{value}</div>
    </div>
  );
}

function TxLink({ label, txid }) {
  return (
    <a href={`https://kaspa.stream/txs/${txid}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl p-3 group transition-colors hover:bg-[#0f0f0f]"
      style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
      <div className="min-w-0">
        <div className="text-xs font-medium" style={{ color: "#888" }}>{label}</div>
        <div className="font-mono text-xs truncate mt-0.5" style={{ color: "#00ffcc" }}>{txid}</div>
      </div>
      <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 opacity-30 group-hover:opacity-100" style={{ color: "#666" }} />
    </a>
  );
}