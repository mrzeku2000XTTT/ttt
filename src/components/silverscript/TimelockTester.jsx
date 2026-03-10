import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, X, Clock, Key, User, ChevronDown, ChevronUp, Loader2, Copy } from "lucide-react";

const STEP_COLORS = {
  PASS: "text-green-400 border-green-500/30 bg-green-500/5",
  FAIL: "text-red-400 border-red-500/30 bg-red-500/5",
};

export default function TimelockTester() {
  const now = Math.floor(Date.now() / 1000);

  const [senderPk, setSenderPk] = useState("03a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890");
  const [recipientPk, setRecipientPk] = useState("04b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890ab");
  const [timeoutUnix, setTimeoutUnix] = useState(now + 3600); // 1 hour from now
  const [currentTime, setCurrentTime] = useState(now);
  const [functionName, setFunctionName] = useState("transfer");
  const [sigProvided, setSigProvided] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const timeoutDate = new Date(timeoutUnix * 1000);
  const currentDate = new Date(currentTime * 1000);
  const timelockExpired = currentTime >= timeoutUnix;

  const run = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke("silverScriptTimelockTest", {
      sender_pk: senderPk,
      recipient_pk: recipientPk,
      timeout_unix: timeoutUnix,
      current_time_unix: currentTime,
      function_name: functionName,
      sig_provided: sigProvided,
    });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Contract code */}
      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/3">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="ml-2 text-white/40 text-xs font-mono">transfer_with_timeout.sil</span>
        </div>
        <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
          <code>
            <span className="text-purple-400">pragma</span>{" "}
            <span className="text-white">silverscript</span>{" "}
            <span className="text-green-400">^0.1.0</span>
            {";\n\n"}
            <span className="text-purple-400">contract</span>{" "}
            <span className="text-cyan-300 font-bold">TransferWithTimeout</span>
            {"(\n    "}
            <span className="text-blue-300">pubkey</span>{" sender,\n    "}
            <span className="text-blue-300">pubkey</span>{" recipient,\n    "}
            <span className="text-blue-300">int</span>{" timeout\n) {\n    "}
            <span className="text-white/40">// Recipient can spend anytime with valid sig</span>
            {"\n    "}
            <span className={`text-yellow-300 font-semibold ${functionName === "transfer" ? "underline" : ""}`}>
              entrypoint function transfer
            </span>
            {"("}
            <span className="text-blue-300">sig</span>{" recipientSig) {\n        "}
            <span className="text-orange-400">require</span>
            {"(checkSig(recipientSig, recipient));\n    }\n\n    "}
            <span className="text-white/40">// Sender can reclaim after timeout</span>
            {"\n    "}
            <span className={`text-yellow-300 font-semibold ${functionName === "timeout" ? "underline" : ""}`}>
              entrypoint function timeout
            </span>
            {"("}
            <span className="text-blue-300">sig</span>{" senderSig) {\n        "}
            <span className="text-orange-400">require</span>
            {"(checkSig(senderSig, sender));\n        "}
            <span className="text-orange-400">require</span>
            {"(tx.time >= timeout);\n    }\n}"}
          </code>
        </pre>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Constructor args */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider">Constructor Args</div>

          <div className="space-y-1">
            <label className="text-white/50 text-xs">sender pubkey</label>
            <input
              value={senderPk}
              onChange={e => setSenderPk(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-white/50 text-xs">recipient pubkey</label>
            <input
              value={recipientPk}
              onChange={e => setRecipientPk(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-white/50 text-xs flex items-center gap-2">
              timeout (unix timestamp)
              <span className="text-white/30">{timeoutDate.toLocaleString()}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={timeoutUnix}
                onChange={e => setTimeoutUnix(parseInt(e.target.value))}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={() => setTimeoutUnix(now + 3600)}
                className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white/70 text-xs whitespace-nowrap"
              >+1h</button>
              <button
                onClick={() => setTimeoutUnix(now - 60)}
                className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white/70 text-xs whitespace-nowrap"
              >-1m (expired)</button>
            </div>
          </div>
        </div>

        {/* Tx context + function call */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider">Spending Attempt</div>

          <div className="space-y-1">
            <label className="text-white/50 text-xs flex items-center gap-2">
              tx.time (unix timestamp)
              <span className="text-white/30">{currentDate.toLocaleString()}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={currentTime}
                onChange={e => setCurrentTime(parseInt(e.target.value))}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={() => setCurrentTime(Math.floor(Date.now() / 1000))}
                className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white/70 text-xs"
              >Now</button>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${timelockExpired ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
              Timelock: {timelockExpired ? "EXPIRED — reclaim possible" : `NOT expired (${timeoutUnix - currentTime}s remaining)`}
            </div>
          </div>

          {/* Entrypoint selector */}
          <div className="space-y-1">
            <label className="text-white/50 text-xs">Call entrypoint</label>
            <div className="flex gap-2">
              {["transfer", "timeout"].map(fn => (
                <button
                  key={fn}
                  onClick={() => setFunctionName(fn)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    functionName === fn
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  {fn}()
                </button>
              ))}
            </div>
          </div>

          {/* Sig toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSigProvided(!sigProvided)}
              className={`w-10 h-5 rounded-full relative transition-all ${sigProvided ? "bg-cyan-500" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${sigProvided ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-white/60 text-xs">
              {sigProvided ? "Valid signature provided" : "No / invalid signature"}
            </span>
          </div>

          <Button
            onClick={run}
            disabled={loading}
            className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Contract Simulation
          </Button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl overflow-hidden ${result.result === "PASS" ? "border-green-500/30" : "border-red-500/30"}`}
          >
            {/* Result header */}
            <div className={`px-5 py-3 flex items-center gap-3 ${result.result === "PASS" ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {result.result === "PASS"
                ? <Check className="w-5 h-5 text-green-400" />
                : <X className="w-5 h-5 text-red-400" />
              }
              <div>
                <div className={`font-bold text-sm ${result.result === "PASS" ? "text-green-400" : "text-red-400"}`}>
                  {result.result === "PASS" ? "Contract PASSED" : "Contract FAILED"} — {result.function_called}()
                </div>
                <div className="text-white/40 text-xs">{result.active_entrypoint}</div>
              </div>
            </div>

            {/* Execution steps */}
            <div className="p-4 space-y-2 bg-black/30">
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Script Execution Steps</div>
              {result.steps.map((step, i) => (
                <div key={i} className={`border rounded-lg p-3 ${STEP_COLORS[step.result]}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.result === "PASS" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                      {step.result === "PASS" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs font-semibold">{step.op}</div>
                      <div className="text-xs opacity-70 mt-0.5">{step.detail}</div>
                      {step.values && (
                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs opacity-60">
                          <span>tx.time: {step.values.tx_time}</span>
                          <span>timeout: {step.values.timeout}</span>
                          {step.values.time_remaining > 0 && (
                            <span className="col-span-2 text-red-300">⏳ {step.values.time_remaining}s until unlock</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* TX context */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/40 bg-white/3 rounded-lg p-3">
                <div>tx.time: <span className="text-white/60 font-mono">{result.tx_context.time}</span></div>
                <div>timeout: <span className="text-white/60 font-mono">{result.tx_context.timeout}</span></div>
                <div className="col-span-2">tx time ISO: <span className="text-white/60">{result.tx_context.time_iso}</span></div>
                <div className="col-span-2">timeout ISO: <span className="text-white/60">{result.tx_context.timeout_iso}</span></div>
              </div>

              {/* Raw toggle */}
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="w-full flex items-center justify-center gap-2 text-white/30 hover:text-white/50 text-xs py-1 transition-colors"
              >
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showRaw ? "Hide" : "Show"} raw response
              </button>
              {showRaw && (
                <pre className="bg-black/60 rounded-lg p-3 text-xs text-white/50 font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>

            <div className="px-4 py-2 bg-yellow-500/5 border-t border-yellow-500/20 text-yellow-400/60 text-xs">
              {result.note}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}