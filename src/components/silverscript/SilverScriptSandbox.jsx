import React, { useState, useEffect } from "react";
import { Copy, Check, Play, AlertTriangle, CheckCircle, Code2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
  {
    name: "TransferWithTimeout",
    code: `pragma silverscript ^0.1.0;\n\ncontract TransferWithTimeout(\n    pubkey sender,\n    pubkey recipient,\n    int timeout\n) {\n    entrypoint function transfer(sig recipientSig) {\n        require(checkSig(recipientSig, recipient));\n    }\n\n    entrypoint function timeout(sig senderSig) {\n        require(checkSig(senderSig, sender));\n        require(tx.time >= timeout);\n    }\n}`,
  },
  {
    name: "P2PKH",
    code: `pragma silverscript ^0.1.0;\n\ncontract P2PKH(byte[32] pkh) {\n    entrypoint function spend(pubkey pk, sig s) {\n        require(blake2b(pk) == pkh);\n        require(checkSig(s, pk));\n    }\n}`,
  },
  {
    name: "MultiSig",
    code: `pragma silverscript ^0.1.0;\n\ncontract MultiSig(pubkey pk1, pubkey pk2, pubkey pk3) {\n    entrypoint function spend(sig s1, sig s2) {\n        require(checkMultiSig([s1, s2], [pk1, pk2, pk3]));\n    }\n}`,
  },
  {
    name: "Blank",
    code: `pragma silverscript ^0.1.0;\n\ncontract MyContract() {\n    entrypoint function spend() {\n        // your logic here\n    }\n}`,
  },
];

// Basic local syntax analysis
function analyzeCode(code) {
  const issues = [];
  const info = [];

  if (!code.trim()) return { issues: [], info: [], valid: false };

  // Pragma check
  if (!code.includes("pragma silverscript")) {
    issues.push("Missing pragma declaration (e.g. pragma silverscript ^0.1.0;)");
  } else {
    info.push("pragma silverscript ✓");
  }

  // Contract keyword
  const contractMatch = code.match(/contract\s+(\w+)\s*\(/);
  if (!contractMatch) {
    issues.push("No contract declaration found");
  } else {
    info.push(`contract ${contractMatch[1]} ✓`);
  }

  // Entrypoints
  const entrypoints = [...code.matchAll(/entrypoint\s+function\s+(\w+)/g)];
  if (entrypoints.length === 0) {
    issues.push("No entrypoint function defined");
  } else {
    entrypoints.forEach(m => info.push(`entrypoint function ${m[1]}() ✓`));
  }

  // require() calls
  const requires = [...code.matchAll(/require\s*\(/g)];
  if (requires.length > 0) {
    info.push(`${requires.length} require() check${requires.length > 1 ? "s" : ""} ✓`);
  }

  // Brace balance
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens !== closes) {
    issues.push(`Unbalanced braces: ${opens} '{' vs ${closes} '}'`);
  }

  // Paren balance
  const parO = (code.match(/\(/g) || []).length;
  const parC = (code.match(/\)/g) || []).length;
  if (parO !== parC) {
    issues.push(`Unbalanced parentheses: ${parO} '(' vs ${parC} ')'`);
  }

  // tx.time usage
  if (code.includes("tx.time")) {
    info.push("tx.time introspection used ✓");
  }

  // checkSig
  if (code.includes("checkSig(")) {
    info.push("checkSig() ✓");
  }

  // checkMultiSig
  if (code.includes("checkMultiSig(")) {
    info.push("checkMultiSig() ✓");
  }

  return {
    issues,
    info,
    valid: issues.length === 0,
  };
}

// Simple syntax-colored render (line by line)
function ColoredCode({ code }) {
  const keywords = ["pragma", "contract", "entrypoint", "function", "require", "if", "else", "for", "int", "pubkey", "sig", "byte", "bool", "return", "yield", "new"];
  const lines = code.split("\n");

  return (
    <div className="font-mono text-sm leading-6 whitespace-pre">
      {lines.map((line, li) => {
        // Simple token colorizer
        let parts = [];
        let remaining = line;

        // Comments
        const commentIdx = remaining.indexOf("//");
        if (commentIdx !== -1) {
          const pre = remaining.slice(0, commentIdx);
          const comment = remaining.slice(commentIdx);
          remaining = pre;
          parts.push({ text: comment, color: "text-white/30", key: "comment" });
        }

        // Tokenize the pre-comment part
        const tokens = remaining.split(/(\s+|[{}()[\],;=<>!+\-*/])/);
        const colored = tokens.map((tok, ti) => {
          if (keywords.includes(tok)) return <span key={ti} className="text-purple-400">{tok}</span>;
          if (/^".*"$/.test(tok) || /^'.*'$/.test(tok)) return <span key={ti} className="text-green-400">{tok}</span>;
          if (/^\d+$/.test(tok)) return <span key={ti} className="text-yellow-400">{tok}</span>;
          if (/^[A-Z]/.test(tok) && tok.length > 1) return <span key={ti} className="text-cyan-300">{tok}</span>;
          if (tok === "{" || tok === "}") return <span key={ti} className="text-white/70">{tok}</span>;
          if (tok === "(" || tok === ")") return <span key={ti} className="text-white/50">{tok}</span>;
          if (tok === "require" || tok === "checkSig" || tok === "checkMultiSig" || tok === "blake2b") return <span key={ti} className="text-orange-400">{tok}</span>;
          return <span key={ti} className="text-white/80">{tok}</span>;
        });

        return (
          <div key={li} className="flex">
            <span className="select-none text-white/20 w-8 text-right mr-4 flex-shrink-0 text-xs leading-6">{li + 1}</span>
            <span>{colored}{parts.map((p, pi) => <span key={pi} className={p.color}>{p.text}</span>)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function SilverScriptSandbox() {
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [view, setView] = useState("editor"); // "editor" | "preview"
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  const analyze = () => {
    setAnalysis(analyzeCode(code));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Template picker */}
        <select
          onChange={e => {
            const t = TEMPLATES.find(t => t.name === e.target.value);
            if (t) { setCode(t.code); setAnalysis(null); }
          }}
          defaultValue="TransferWithTimeout"
          className="bg-black/60 border border-white/10 text-white/70 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/40"
        >
          {TEMPLATES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => setView("editor")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${view === "editor" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            Editor
          </button>
          <button
            onClick={() => setView("preview")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${view === "preview" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            Preview
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            Copy
          </button>
          <Button
            onClick={analyze}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs gap-1.5 h-8 px-3"
          >
            <Play className="w-3.5 h-3.5" /> Analyze
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-white/30 text-xs font-mono">sandbox.sil</span>
          <Code2 className="w-3.5 h-3.5 text-white/20 ml-auto" />
        </div>

        {view === "editor" ? (
          <textarea
            value={code}
            onChange={e => { setCode(e.target.value); setAnalysis(null); }}
            spellCheck={false}
            className="w-full bg-transparent text-cyan-300 font-mono text-sm leading-6 p-4 focus:outline-none resize-none min-h-[280px]"
            style={{ tabSize: 4 }}
          />
        ) : (
          <div className="p-4 min-h-[280px] overflow-x-auto">
            <ColoredCode code={code} />
          </div>
        )}
      </div>

      {/* Analysis output */}
      {analysis && (
        <div className={`border rounded-xl overflow-hidden ${analysis.valid ? "border-green-500/30" : "border-red-500/30"}`}>
          <div className={`flex items-center gap-3 px-4 py-3 ${analysis.valid ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {analysis.valid
              ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              : <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            }
            <span className={`font-bold text-sm ${analysis.valid ? "text-green-400" : "text-red-400"}`}>
              {analysis.valid ? "Syntax looks valid" : `${analysis.issues.length} issue${analysis.issues.length > 1 ? "s" : ""} found`}
            </span>
          </div>

          <div className="p-4 bg-black/30 space-y-4">
            {analysis.issues.length > 0 && (
              <div>
                <div className="text-red-400/70 text-xs font-semibold uppercase tracking-wider mb-2">Issues</div>
                <div className="space-y-1">
                  {analysis.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-red-300 text-xs bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                      <span className="text-red-500 mt-0.5">✗</span> {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.info.length > 0 && (
              <div>
                <div className="text-green-400/70 text-xs font-semibold uppercase tracking-wider mb-2">Detected</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.info.map((item, i) => (
                    <span key={i} className="text-xs bg-green-500/10 border border-green-500/20 text-green-400/80 px-2 py-1 rounded-lg font-mono">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-white/20 text-xs pt-1 border-t border-white/5">
              Note: This is a local syntax check only. Full compilation requires the <code className="text-white/40">silverc</code> Rust compiler on Testnet-12.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}