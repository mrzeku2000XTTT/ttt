import React, { useState } from "react";
import { Sparkles, Bot, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ArgentChat from "@/components/argent/ArgentChat";
import ArgentCodePane from "@/components/argent/ArgentCodePane";
import { buildChatPrompt, extractCodeBlocks } from "@/lib/argentSystemPrompt";

const STARTER = [
  {
    role: "assistant",
    content:
      "Hey — I'm Argent Studio. I write Kaspa covenant code in the Argent language (Michael Sutton, 2026) and explain what it does. Try: \"mint a transferable .kas name\" or \"a ticket with refund on cancel\".",
  },
];

export default function ArgentStudio() {
  const [messages, setMessages] = useState(STARTER);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState(null);

  const handleSend = async (text) => {
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: buildChatPrompt(next, text),
      });
      const reply = typeof res === "string" ? res : res?.response || res?.text || JSON.stringify(res);
      const blocks = extractCodeBlocks(reply);
      setMessages([...next, { role: "assistant", content: reply, codeBlocks: blocks }]);
      if (blocks.length) setCode(blocks[blocks.length - 1].code);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: `Sorry, generation failed: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCode = (c) => setCode(c);

  const handleCompile = async () => {
    if (!code) return;
    setCompiling(true);
    setCompileResult(null);
    try {
      const res = await base44.functions.invoke("argentCompile", { code });
      setCompileResult(res.data);
    } catch (e) {
      setCompileResult({ error: e.message });
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                Argent Studio
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </h1>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                ChatGPT-style assistant for the Argent covenant language on Kaspa. Generate, preview, and compile.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] text-amber-200 font-medium">Admin only · PoC</span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
            <ArgentChat
              messages={messages}
              onSend={handleSend}
              loading={loading}
              onUseCode={handleUseCode}
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] overflow-y-auto">
            <ArgentCodePane
              code={code}
              compileResult={compileResult}
              compiling={compiling}
              onCompile={handleCompile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}