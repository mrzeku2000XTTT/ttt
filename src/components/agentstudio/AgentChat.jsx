import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, User } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * AgentChat — test the trained agent. Calls InvokeLLM with the agent's system
 * prompt + accumulated few-shot examples, so the agent responds in the style
 * it was trained toward.
 */
export default function AgentChat({ agent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const examples = agent?.training_examples || [];
  const fewShot = examples.slice(-6).map((e) => `User: ${e.input}\nAgent: ${e.output}`).join("\n\n");

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const prompt = `${agent.system_prompt}\n\nYou are ${agent.name}. ${agent.task || ""}\n\nExamples of how you respond:\n${fewShot}\n\nNow respond to the user:\nUser: ${text}\nAgent:`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const reply = typeof res === "string" ? res : res?.response || res?.text || JSON.stringify(res);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Error: ${e?.message || "LLM call failed"}` }]);
    }
    setBusy(false);
  };

  return (
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-zinc-400" />
        <h3 className="font-bold text-zinc-900">Test your agent</h3>
      </div>

      <div className="flex-1 min-h-[200px] max-h-[320px] overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">Chat with your trained agent to see it in action.</p>
        ) : messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5" /></div>}
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"}`}>
              {m.content}
            </div>
            {m.role === "user" && <div className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-600 flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5" /></div>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask your agent…"
          className="flex-1 h-10 px-3 rounded-full border border-zinc-200 text-sm outline-none focus:border-zinc-400"
        />
        <button onClick={send} disabled={busy || !input.trim()} className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}