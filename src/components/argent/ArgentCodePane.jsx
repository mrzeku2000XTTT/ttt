import React from "react";
import { Copy, Play, CheckCircle2, AlertTriangle, XCircle, Loader2, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    ok: { icon: CheckCircle2, cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "Compiled OK" },
    warnings: { icon: AlertTriangle, cls: "bg-amber-500/20 text-amber-300 border-amber-500/40", label: "Warnings" },
    errors: { icon: XCircle, cls: "bg-red-500/20 text-red-300 border-red-500/40", label: "Errors" },
    unparseable: { icon: AlertTriangle, cls: "bg-amber-500/20 text-amber-300 border-amber-500/40", label: "No response" },
  };
  const cfg = map[status] || map.unparseable;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export default function ArgentCodePane({ code, compileResult, compiling, onCompile }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const r = compileResult?.report;

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white/90">Live code preview</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!code}
            onClick={copy}
            className="text-white/70 hover:text-white h-8"
          >
            <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            disabled={!code || compiling}
            onClick={onCompile}
            className="bg-cyan-500 hover:bg-cyan-400 text-black h-8"
          >
            {compiling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Compile
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-white/10 bg-black/50 overflow-hidden">
        {code ? (
          <pre className="p-4 text-[12px] leading-relaxed font-mono text-cyan-100 overflow-auto whitespace-pre-wrap h-full">
{code}
          </pre>
        ) : (
          <div className="h-full flex items-center justify-center text-center px-6">
            <p className="text-sm text-white/40 max-w-xs">
              Code generated in chat will load here. Hit "Load in preview" on any code block.
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/40 mt-1.5">
        Compile runs a static pass via Anthropic (no hosted <code>argentc</code> exists yet). Errors and fixes are LLM-analyzed.
      </p>

      {compileResult && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white/90">Compile report</span>
            <StatusBadge status={r?.status} />
          </div>

          {compileResult.error ? (
            <p className="text-sm text-red-300">{compileResult.error}</p>
          ) : (
            <>
              {r?.summary && <p className="text-xs text-white/80">{r.summary}</p>}

              {r?.errors?.length > 0 && (
                <div className="space-y-1.5">
                  {r.errors.map((e, i) => (
                    <div key={i} className="text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                      <div className="text-red-300 font-medium">
                        {e.line != null ? `L${e.line}: ` : ""}{e.message}
                      </div>
                      {e.fix && <div className="text-white/60 mt-0.5">→ {e.fix}</div>}
                    </div>
                  ))}
                </div>
              )}

              {r?.warnings?.length > 0 && (
                <div className="space-y-1.5">
                  {r.warnings.map((w, i) => (
                    <div key={i} className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-amber-200">
                      {w.line != null ? `L${w.line}: ` : ""}{w.message}
                    </div>
                  ))}
                </div>
              )}

              {r?.suggestedFixes?.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/50 mb-1">Suggested fixes</p>
                  <ul className="space-y-1">
                    {r.suggestedFixes.map((f, i) => (
                      <li key={i} className="text-xs text-cyan-200">• {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {r?.status === "ok" && (
                <p className="text-xs text-emerald-300">No errors or warnings. Structure looks valid.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}