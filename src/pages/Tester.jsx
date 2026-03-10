import React from "react";
import { FlaskConical } from "lucide-react";
import TimelockTester from "@/components/silverscript/TimelockTester";

export default function TesterPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SilverScript Contract Tester</h1>
            <p className="text-white/40 text-sm mt-0.5">
              Simulate <span className="text-cyan-400 font-mono">TransferWithTimeout</span> — step-by-step script execution trace
            </p>
          </div>
          <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 border border-green-500/20 px-2 py-1 rounded-full font-semibold">
            Testnet-12 Syntax
          </span>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-white/3 border border-white/10 rounded-xl text-sm text-white/50 leading-relaxed">
          Enter a <span className="text-white/70">sender pubkey</span>, <span className="text-white/70">recipient pubkey</span>, and a{" "}
          <span className="text-white/70">timeout (unix timestamp)</span>. Then choose which contract entrypoint to call —{" "}
          <code className="text-cyan-400 bg-black/40 px-1 rounded">transfer()</code> or{" "}
          <code className="text-cyan-400 bg-black/40 px-1 rounded">timeout()</code> — and see each{" "}
          <code className="text-yellow-400 bg-black/40 px-1 rounded">require()</code> evaluated live with pass/fail feedback.
        </div>

        {/* Tester */}
        <TimelockTester />
      </div>
    </div>
  );
}