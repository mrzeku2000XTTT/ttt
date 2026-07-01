import React, { useState } from "react";
import { Rocket, Lock, Shield, Droplet, Users, Hash, Terminal, ExternalLink } from "lucide-react";
import { ZK_AGENT_URL } from "@/components/tttz/ZKChatWidget";

const TEMPLATES = [
  {
    id: "zkvault",
    name: "ZKVault",
    icon: Lock,
    description: "Owner-controlled vault with time-lock reclaim. Funds are locked until a specified block height, after which the owner can reclaim them.",
    params: [
      { key: "owner", label: "Owner Address", type: "text", placeholder: "kaspa:qp..." },
      { key: "unlock_height", label: "Unlock Block Height", type: "number", placeholder: "4000000" },
    ],
    code: `// ZKVault — Owner-controlled vault with time-lock reclaim
covenant ZKVault {
    owner: PublicKey,
    unlock_height: u64,

    fn reclaim(self, ctx: Context) {
        require(
            ctx.block_height >= self.unlock_height,
            "Time-lock not yet expired"
        );
        require(
            ctx.verifies(self.owner),
            "Only owner can reclaim"
        );
        ctx.pay_to(self.owner, ctx.input_amount);
    }

    fn deposit(self, ctx: Context) {
        require(
            ctx.output(0).script == self.address,
            "Output must return to vault"
        );
    }
}`,
  },
  {
    id: "zkescrow",
    name: "ZKEscrow",
    icon: Shield,
    description: "Three-party arbiter escrow. Buyer, seller, and arbiter manage funds. Release requires seller+arbiter; refund requires buyer+arbiter.",
    params: [
      { key: "buyer", label: "Buyer Address", type: "text", placeholder: "kaspa:qp..." },
      { key: "seller", label: "Seller Address", type: "text", placeholder: "kaspa:qp..." },
      { key: "arbiter", label: "Arbiter Address", type: "text", placeholder: "kaspa:qp..." },
    ],
    code: `// ZKEscrow — 3-party arbiter escrow
covenant ZKEscrow {
    buyer: PublicKey,
    seller: PublicKey,
    arbiter: PublicKey,

    fn release(self, ctx: Context) {
        require(
            ctx.signers.contains(self.seller) &&
            ctx.signers.contains(self.arbiter),
            "Requires seller + arbiter"
        );
        ctx.pay_to(self.seller, ctx.input_amount);
    }

    fn refund(self, ctx: Context) {
        require(
            ctx.signers.contains(self.buyer) &&
            ctx.signers.contains(self.arbiter),
            "Requires buyer + arbiter"
        );
        ctx.pay_to(self.buyer, ctx.input_amount);
    }
}`,
  },
  {
    id: "zkstream",
    name: "ZKStream",
    icon: Droplet,
    description: "Payment streaming covenant. Drips KAS to a recipient at a configurable rate per block. Recipient claims accumulated funds periodically.",
    params: [
      { key: "recipient", label: "Recipient Address", type: "text", placeholder: "kaspa:qp..." },
      { key: "rate_per_block", label: "Drip Rate (soms/block)", type: "number", placeholder: "10000" },
      { key: "start_height", label: "Start Block Height", type: "number", placeholder: "4000000" },
    ],
    code: `// ZKStream — Payment streaming covenant
covenant ZKStream {
    recipient: PublicKey,
    rate_per_block: u64,
    start_height: u64,
    last_claim: u64,

    fn claim(self, ctx: Context) {
        let elapsed = ctx.block_height - self.last_claim;
        let owed = elapsed * self.rate_per_block;
        require(owed > 0, "Nothing to claim yet");

        ctx.pay_to(self.recipient, owed);

        // Return remainder to self, update last_claim
        self.last_claim = ctx.block_height;
        if ctx.input_amount > owed {
            ctx.pay_to(self.address, ctx.input_amount - owed);
        }
    }
}`,
  },
  {
    id: "zkmultisig",
    name: "ZKMultisig",
    icon: Users,
    description: "2-of-3 multisig treasury. Three designated signers; any two must sign to spend funds. Classic on-chain treasury primitive.",
    params: [
      { key: "signer_1", label: "Signer 1", type: "text", placeholder: "kaspa:qp..." },
      { key: "signer_2", label: "Signer 2", type: "text", placeholder: "kaspa:qp..." },
      { key: "signer_3", label: "Signer 3", type: "text", placeholder: "kaspa:qp..." },
      { key: "threshold", label: "Threshold", type: "number", placeholder: "2" },
    ],
    code: `// ZKMultisig — 2-of-3 multisig treasury
covenant ZKMultisig {
    signers: [PublicKey; 3],
    threshold: u8,

    fn spend(self, ctx: Context) {
        let sig_count = self.signers.iter()
            .filter(|s| ctx.signers.contains(*s))
            .count();

        require(
            sig_count >= self.threshold,
            "Insufficient signatures"
        );

        ctx.pay_to(
            ctx.output(0).script_pubkey,
            ctx.input_amount
        );
    }
}`,
  },
  {
    id: "zkcounter",
    name: "ZKCounter",
    icon: Hash,
    description: "Minimal state machine counter — the covenant hello world. Increments an on-chain counter with each transaction. Perfect for testing.",
    params: [
      { key: "owner", label: "Owner Address", type: "text", placeholder: "kaspa:qp..." },
      { key: "initial_count", label: "Initial Count", type: "number", placeholder: "0" },
    ],
    code: `// ZKCounter — Minimal state machine counter (hello world)
covenant ZKCounter {
    count: u64,
    owner: PublicKey,

    fn increment(self, ctx: Context) {
        require(
            ctx.verifies(self.owner),
            "Only owner can increment"
        );

        self.count += 1;

        // Return funds to self (preserves covenant state)
        ctx.pay_to(self.address, ctx.input_amount);
    }

    fn reset(self, ctx: Context) {
        require(ctx.verifies(self.owner), "Only owner can reset");
        self.count = 0;
        ctx.pay_to(self.address, ctx.input_amount);
    }
}`,
  },
];

export default function TTTZLaunch() {
  const [selected, setSelected] = useState(null);
  const [params, setParams] = useState({});

  const updateParam = (key, value) => setParams(p => ({ ...p, [key]: value }));

  return (
    <div className="space-y-5 pt-6">
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5" style={{ color: "#00ffcc" }} />
        <h2 className="text-xl font-bold" style={{ color: "#e0e0e0" }}>Launch Covenant</h2>
      </div>

      {/* Template Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const active = selected?.id === t.id;
          return (
            <button key={t.id} onClick={() => { setSelected(t); setParams({}); }}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                background: active ? "#0f1512" : "#0d0d0d",
                border: active ? "1px solid rgba(0,255,204,0.3)" : "1px solid #1a1a1a",
              }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: active ? "rgba(0,255,204,0.1)" : "#111", border: active ? "1px solid rgba(0,255,204,0.2)" : "1px solid #1a1a1a" }}>
                  <Icon className="w-4 h-4" style={{ color: active ? "#00ffcc" : "#666" }} />
                </div>
                <span className="font-mono text-sm font-bold" style={{ color: active ? "#00ffcc" : "#999" }}>{t.name}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{t.description}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Template Detail */}
      {selected && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: "#0d0d0d", border: "1px solid rgba(0,255,204,0.15)" }}>
          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <selected.icon className="w-4 h-4" style={{ color: "#00ffcc" }} />
              <span className="font-mono text-sm font-bold" style={{ color: "#00ffcc" }}>{selected.name}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#777" }}>{selected.description}</p>
          </div>

          {/* Params */}
          <div className="space-y-3">
            <span className="text-xs font-medium" style={{ color: "#555" }}>Parameters</span>
            {selected.params.map(p => (
              <div key={p.key}>
                <label className="block text-[10px] font-mono mb-1" style={{ color: "#666" }}>{p.label}</label>
                <input type={p.type} placeholder={p.placeholder} value={params[p.key] || ""}
                  onChange={e => updateParam(p.key, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
                  style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", color: "#e0e0e0" }} />
              </div>
            ))}
          </div>

          {/* Deploy Button */}
          <a href={ZK_AGENT_URL} target="_blank" rel="noopener noreferrer"
            className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#00ffcc", color: "#0a0a0a" }}
            title="Open ZK Superagent to deploy this covenant">
            <Rocket className="w-4 h-4" /> Deploy Covenant via ZK Agent
          </a>
          <p className="text-center text-[10px] font-mono" style={{ color: "#444" }}>
            Opens the ZK Superagent — it compiles & deploys your covenant on-chain
          </p>

          {/* Code Block */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-3.5 h-3.5" style={{ color: "#555" }} />
              <span className="text-[10px] font-mono" style={{ color: "#555" }}>silverscript source</span>
            </div>
            <div className="rounded-lg p-4 overflow-x-auto" style={{ background: "#050505", border: "1px solid #1a1a1a" }}>
              <pre className="text-xs font-mono leading-relaxed" style={{ color: "#888" }}>
                <code>{highlightCode(selected.code)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple syntax highlighting via spans
function highlightCode(code) {
  const keywords = ["covenant", "fn", "require", "let", "if", "else", "return", "self", "ctx", "pub", "u64", "u8", "bool", "PublicKey"];
  const lines = code.split("\n");
  return lines.map((line, i) => (
    <div key={i}>
      {line.split(/(\s+|[(),;:{}[\]])/).map((token, j) => {
        if (keywords.includes(token.trim())) {
          return <span key={j} style={{ color: "#00ffcc" }}>{token}</span>;
        }
        if (token.startsWith("//")) {
          return <span key={j} style={{ color: "#444" }}>{token}</span>;
        }
        if (/^".*"$/.test(token.trim())) {
          return <span key={j} style={{ color: "#ff9900" }}>{token}</span>;
        }
        return <span key={j}>{token}</span>;
      })}
    </div>
  ));
}