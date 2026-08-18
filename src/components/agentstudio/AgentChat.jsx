import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, User, FlaskConical } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * AgentChat — built-in chat that understands the user's training. Calls
 * InvokeLLM with the agent's system prompt + accumulated few-shot examples.
 * Also has a "Run training test" mode that replays each saved training input
 * against the live model and shows the agent's answer next to the expected one.
 */
export default function AgentChat({ agent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const scrollRef = useRef(null);

  // Scroll only the chat container — scrollIntoView was dragging the whole page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const examples = agent?.training_examples || [];

  const callLLM = async (userText) => {
    let liveData = "";
    // If the user pasted a Kaspa txid, fetch the REAL on-chain data so the
    // agent summarizes actual transaction details — not hallucinated ones.
    const txMatch = userText.match(/\b([a-f0-9]{64})\b/i);
    if (txMatch) {
      try {
        const txRes = await base44.functions.invoke("getKaspaTransactionDetails", { txId: txMatch[1] });
        const tx = txRes?.data || txRes;
        if (tx && !tx.error) {
          const totalOut = (tx.outputs || []).reduce((s, o) => s + (o.amount || 0), 0);
          const from = (tx.inputs || []).map((i) => i.previous_outpoint_address).filter(Boolean)[0] || "unknown";
          const to = (tx.outputs || []).map((o) => o.script_public_key_address).filter(Boolean)[0] || "unknown";
          liveData = `\n\n--- LIVE TRANSACTION DATA (fetched on-chain) ---\nTransaction ID: ${tx.transaction_id}\nStatus: ${tx.is_accepted === false ? "not accepted" : "accepted"}\nBlock time: ${tx.block_time ? new Date(Number(tx.block_time) * 1000).toISOString() : "unknown"}\nFrom: ${from}\nTo: ${to}\nTotal output: ${totalOut} KAS\nInputs: ${tx.inputs?.length || 0}\nOutputs: ${tx.outputs?.length || 0}\n${(tx.outputs || []).slice(0, 8).map((o, i) => `  [${i}] ${o.script_public_key_address} — ${o.amount} KAS`).join("\n")}\n--- END LIVE DATA ---`;
        }
      } catch { /* ignore — fall back to text-only */ }
    }

    const exampleBlock = examples.slice(-8).map((e, i) => `--- EXAMPLE ${i + 1} ---\nUSER: ${e.input}\nAGENT: ${e.output}`).join("\n\n");
    const prompt = `You are ${agent.name}, an AI agent that was trained on the examples below.\n\nTASK: ${agent.task || "Respond to the user the way you were trained to."}\n\nPERSONA:\n${agent.system_prompt}\n\n${examples.length ? `TRAINING EXAMPLES — match the tone, format, and substance of these exactly:\n${exampleBlock}\n\n` : ""}INSTRUCTIONS:\n- Respond ONLY with your answer to the user. No preamble, no "Agent:" prefix, no meta commentary.\n- Use the same style, voice, and depth shown in the training examples.\n- If live transaction data is provided below, summarize its REAL details — never invent amounts, addresses, or statuses.\n\nUSER MESSAGE:\n${userText}${liveData}\n\nYOUR ANSWER:`;
    const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    return typeof res === "string" ? res : res?.response || res?.text || JSON.stringify(res);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const reply = await callLLM(text);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Error: ${e?.message || "LLM call failed"}` }]);
    }
    setBusy(false);
  };

  const runTrainingTest = async () => {
    if (!examples.length || testing) return;
    setTesting(true);
    setMessages([]);
    for (let i = 0; i < examples.length; i++) {
      const ex = examples[i];
      setMessages((m) => [...m, { role: "user", content: ex.input, epoch: i + 1 }]);
      try {
        const reply = await callLLM(ex.input);
        setMessages((m) => [...m, { role: "assistant", content: reply, expected: ex.output, epoch: i + 1 }]);
      } catch (e) {
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${e?.message || "failed"}`, epoch: i + 1 }]);
      }
    }
    setTesting(false);
  };

  return (
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-4 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-zinc-400" />
          <h3 className="font-bold text-zinc-900">Test your agent</h3>
        </div>
        <button
          onClick={runTrainingTest}
          disabled={!examples.length || testing}
          className="h-8 px-3 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-bold hover:bg-zinc-200 disabled:opacity-40 flex items-center gap-1.5"
        >
          {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
          {testing ? "Testing…" : "Run training test"}
        </button>
      </div>
      {examples.length === 0 && (
        <p className="text-[11px] text-zinc-400 mb-3">Add training examples first, then chat with your agent or replay its training to see how well it learned.</p>
      )}

      <div ref={scrollRef} className="flex-1 min-h-[200px] max-h-[340px] overflow-y-auto overscroll-contain space-y-3 mb-3">
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">Chat with your trained agent, or hit “Run training test” to replay every example.</p>
        ) : messages.map((m, i) => (
          <div key={i}>
            {m.epoch && <div className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider mb-0.5 text-center">Epoch {m.epoch}</div>}
            <div className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5" /></div>}
              <div className="max-w-[75%]">
                <div className={`rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                  {m.content}
                </div>
                {m.expected && (
                  <div className="mt-1 rounded-xl bg-green-50 border border-green-200 px-2.5 py-1.5 text-[11px] text-green-800">
                    <span className="font-bold uppercase tracking-wide text-[9px] text-green-600">Expected</span>
                    <p className="mt-0.5">{m.expected}</p>
                  </div>
                )}
              </div>
              {m.role === "user" && <div className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-600 flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5" /></div>}
            </div>
          </div>
        ))}
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