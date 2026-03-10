import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Code, BookOpen, Terminal, Zap, Shield, Layers, Copy, Check, ChevronDown, ChevronUp, FlaskConical, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimelockTester from "@/components/silverscript/TimelockTester";
import SilverScriptSandbox from "@/components/silverscript/SilverScriptSandbox";

const EXAMPLES = [
  {
    title: "P2PKH — Pay to Public Key Hash",
    description: "Standard spend: verify the public key matches the stored hash, then check signature",
    code: `pragma silverscript ^0.1.0;\n\ncontract P2PKH(byte[32] pkh) {\n    entrypoint function spend(pubkey pk, sig s) {\n        require(blake2b(pk) == pkh);\n        require(checkSig(s, pk));\n    }\n}`,
  },
  {
    title: "Transfer with Timeout",
    description: "Recipient can spend anytime; sender can reclaim after tx.time >= timeout (timelock)",
    code: `pragma silverscript ^0.1.0;\n\ncontract TransferWithTimeout(\n    pubkey sender,\n    pubkey recipient,\n    int timeout\n) {\n    entrypoint function transfer(sig recipientSig) {\n        require(checkSig(recipientSig, recipient));\n    }\n\n    entrypoint function timeout(sig senderSig) {\n        require(checkSig(senderSig, sender));\n        require(tx.time >= timeout);\n    }\n}`,
    highlight: true,
  },
  {
    title: "2-of-3 MultiSig",
    description: "Require any 2 signatures out of 3 registered public keys",
    code: `pragma silverscript ^0.1.0;\n\ncontract MultiSig(pubkey pk1, pubkey pk2, pubkey pk3) {\n    entrypoint function spend(sig s1, sig s2) {\n        require(checkMultiSig([s1, s2], [pk1, pk2, pk3]));\n    }\n}`,
  },
  {
    title: "Token Split",
    description: "Split one input into N outputs using bounded loops and yield",
    code: `pragma silverscript ^0.1.0;\n\ncontract Token(int max_outs) {\n    entrypoint function split(\n        pubkey owner_pk, sig s,\n        int in_amount, int num_outs,\n        pubkey recipient_pk\n    ) {\n        require(checkSig(s, owner_pk));\n        for(i, 0, max_outs) {\n            if (i < num_outs) {\n                int out_amount = in_amount / num_outs;\n                byte[] out_amount_bytes = OpNum2Bin(out_amount, 8);\n                yield(out_amount_bytes + recipient_pk);\n            }\n        }\n    }\n}`,
  },
  {
    title: "Covenant — Introspect tx.version",
    description: "Enforce a specific transaction version on spending",
    code: `pragma silverscript ^0.1.0;\n\ncontract Covenant(int requiredVersion) {\n    entrypoint function spend() {\n        require(tx.version == requiredVersion);\n        require(this.activeScriptPubKey == 0x00);\n    }\n}`,
  },
  {
    title: "On-Chain Announcement",
    description: "Write arbitrary data to chain via OP_RETURN output with change back",
    code: `pragma silverscript ^0.1.0;\n\ncontract Announcement() {\n    entrypoint function announce() {\n        byte[] msg = new LockingBytecodeNullData([\n            27906,\n            byte[]('A contract may not injure a human being...')\n        ]);\n        require(tx.outputs[0].value == 0);\n        require(tx.outputs[0].scriptPubKey == msg);\n        int minerFee = 1000;\n        int change = tx.inputs[this.activeInputIndex].value - minerFee;\n        if (change >= minerFee) {\n            require(tx.outputs[1].scriptPubKey ==\n                tx.inputs[this.activeInputIndex].scriptPubKey);\n            require(tx.outputs[1].value == change);\n        }\n    }\n}`,
  },
];

const FEATURES = [
  { icon: Layers, title: "Compiles to Native Kaspa Script", desc: "No VM overhead — contracts run directly on L1" },
  { icon: Zap, title: "CashScript-Inspired Syntax", desc: "Loops, arrays, and function calls beyond raw script" },
  { icon: Shield, title: "UTXO Local State", desc: "Complements vProgs for shared state execution" },
  { icon: Code, title: "Source-Level Debugger", desc: "Step through contracts with the built-in sil-debug CLI" },
];

export default function SilverScriptPage() {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedExample, setExpandedExample] = useState(1); // default to TransferWithTimeout
  const [activeTab, setActiveTab] = useState("examples"); // "examples" | "tester"

  const copyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-cyan-950 opacity-80" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(148,163,184,0.06) 0%, transparent 50%)`
        }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e8d0baae0_IMG_0166.png" alt="SilverScript Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            EXPERIMENTAL — Testnet-12 Only
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            <span className="text-white">Silver</span><span className="text-cyan-400">Script</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Kaspa's first high-level smart contract language and compiler. Write DeFi vaults, native asset management, and covenants directly on <span className="text-cyan-400">Kaspa L1</span>.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://github.com/kaspanet/silverscript" target="_blank" rel="noopener noreferrer">
              <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white gap-2">
                <ExternalLink className="w-4 h-4" /> View on GitHub
              </Button>
            </a>
            <a href="https://github.com/kaspanet/silverscript/blob/master/TUTORIAL.md" target="_blank" rel="noopener noreferrer">
              <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 gap-2">
                <BookOpen className="w-4 h-4" /> Read Tutorial
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Features */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 flex gap-4 items-start">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-1">{f.title}</div>
                  <div className="text-white/50 text-xs leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tab switcher */}
        <section>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("examples")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                activeTab === "examples"
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              <Code className="w-4 h-4" /> Contract Examples
            </button>
            <button
              onClick={() => setActiveTab("tester")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                activeTab === "tester"
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              <FlaskConical className="w-4 h-4" /> Timelock Tester
              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">LIVE</span>
            </button>
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                activeTab === "sandbox"
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              <Code2 className="w-4 h-4" /> Sandbox
            </button>
          </div>

          {activeTab === "examples" && (
            <div className="space-y-3">
              {EXAMPLES.map((example, i) => (
                <div key={i} className={`border rounded-xl overflow-hidden ${example.highlight ? "bg-cyan-500/5 border-cyan-500/20" : "bg-white/5 border-white/10"}`}>
                  <button
                    onClick={() => setExpandedExample(expandedExample === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="text-white font-semibold text-sm flex items-center gap-2">
                        {example.title}
                        {example.highlight && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">TIMELOCK</span>
                        )}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">{example.description}</div>
                    </div>
                    {expandedExample === i ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />}
                  </button>
                  {expandedExample === i && (
                    <div className="border-t border-white/10 relative">
                      <button
                        onClick={() => copyCode(example.code, i)}
                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                      >
                        {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                      </button>
                      <pre className="p-4 overflow-x-auto text-sm">
                        <code className="text-cyan-300 font-mono leading-relaxed">{example.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "tester" && (
            <div>
              <div className="mb-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-cyan-300/70 text-xs">
                Interactive simulation of the <span className="text-cyan-300 font-semibold">TransferWithTimeout</span> contract from <code className="bg-black/40 px-1 rounded">transfer_with_timeout.sil</code>. 
                Set constructor args, simulate tx.time, choose an entrypoint, and run the script execution trace.
              </div>
              <TimelockTester />
            </div>
          )}

          {activeTab === "sandbox" && (
            <div>
              <div className="mb-4 p-3 bg-white/3 border border-white/10 rounded-lg text-white/40 text-xs">
                Write or edit SilverScript contracts. Choose a template, edit in the browser, and run a local syntax analysis to catch common issues before compiling with <code className="text-white/60">silverc</code>.
              </div>
              <SilverScriptSandbox />
            </div>
          )}
        </section>

        {/* Get Started */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Get Started</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">Build & Test</span>
              </div>
              <pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">{`git clone https://github.com/kaspanet/silverscript\ncargo test -p silverscript-lang`}</pre>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">Debug a Contract</span>
              </div>
              <pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">{`cargo run -p cli-debugger -- \\\n  tests/examples/if_statement.sil \\\n  --function hello --ctor-arg 3 --arg 1`}</pre>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Kaspa Covenant Roadmap</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            {[
              { layer: "Tooling", name: "SilverScript", desc: "High-level covenant authoring → compiles to Kaspa Script", color: "cyan", active: true },
              { layer: "Consensus", name: "KIP-20 Covenant IDs", desc: "Stable UTXO lineage without recursive proofs", color: "purple" },
              { layer: "Execution", name: "vProgs", desc: "Shared state / L2 node framework", color: "blue" },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-lg border ${item.active ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-white/3 border-white/10'}`}>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${item.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : item.color === 'purple' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{item.layer}</div>
                <div>
                  <div className="text-white font-semibold text-sm flex items-center gap-2">
                    {item.name}
                    {item.active && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">LIVE on Testnet-12</span>}
                  </div>
                  <div className="text-white/50 text-xs mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
            <div className="text-center text-white/40 text-xs pt-2">Target: <span className="text-white/60 font-semibold">May 5, 2026 Covenant Hardfork</span></div>
          </div>
        </section>

        {/* Links */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "GitHub Repo", url: "https://github.com/kaspanet/silverscript" },
              { label: "Tutorial", url: "https://github.com/kaspanet/silverscript/blob/master/TUTORIAL.md" },
              { label: "KasMedia Article", url: "https://kasmedia.com/article/hail-the-silverscript" },
            ].map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group">
                <ExternalLink className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-white/80 group-hover:text-white text-sm font-medium transition-colors">{link.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 ml-auto transition-colors" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}