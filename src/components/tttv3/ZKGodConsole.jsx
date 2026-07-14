import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Check, X as XIcon, ChevronDown, ChevronRight } from "lucide-react";

/** ZKGodConsole — shows GOD ZK's real system-call executions in chat. */
export default function ZKGodConsole({ tools = [] }) {
  const [openIdx, setOpenIdx] = useState(null);
  if (!tools.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-[85%] rounded-2xl overflow-hidden"
      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(250,204,21,0.35)", boxShadow: "0 0 18px rgba(250,204,21,0.12)" }}>
      <div className="flex items-center gap-2 px-3.5 py-2" style={{ borderBottom: "1px solid rgba(250,204,21,0.2)", background: "rgba(250,204,21,0.06)" }}>
        <Zap className="w-3.5 h-3.5" style={{ color: "#facc15" }} />
        <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#facc15" }}>
          GOD ZK · SYSTEM CALLS EXECUTED
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(250,204,21,0.1)" }}>
        {tools.map((t, i) => (
          <div key={i}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-left">
              {openIdx === i ? <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(250,204,21,0.5)" }} /> : <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(250,204,21,0.5)" }} />}
              <code className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.name}</code>
              <span className="text-[9px] ml-auto flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{t.ms}ms</span>
              {t.ok
                ? <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#4ade80" }} />
                : <XIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f87171" }} />}
            </button>
            {openIdx === i && (
              <div className="px-3.5 pb-2.5 space-y-1.5">
                {t.args && Object.keys(t.args).length > 0 && (
                  <pre className="text-[10px] p-2 rounded-lg overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(250,204,21,0.7)" }}>{JSON.stringify(t.args)}</pre>
                )}
                <pre className="text-[10px] p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-40 overflow-y-auto"
                  style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.6)" }}>{t.result}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}