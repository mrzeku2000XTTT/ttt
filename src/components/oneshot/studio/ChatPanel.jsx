import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, FileCode, Brain, FileSearch, Wand2, CheckCircle2, FilePlus, FileX, Edit3, AlertCircle, ListTree, Zap } from "lucide-react";

const EVENT_META = {
  iteration:    { icon: Zap,         color: "text-white/30",       label: "Step" },
  thought:      { icon: Brain,       color: "text-violet-400",     label: "Thinking" },
  tool_call:    { icon: Wand2,       color: "text-cyan-400",       label: "Tool" },
  tool_result:  { icon: CheckCircle2,color: "text-emerald-400/80", label: "Result" },
  file_change:  { icon: FileCode,    color: "text-emerald-400",    label: "File" },
  error:        { icon: AlertCircle, color: "text-red-400",        label: "Error" },
  done:         { icon: CheckCircle2,color: "text-emerald-400",    label: "Done" },
};

const TOOL_ICONS = {
  list_files: ListTree,
  read_file: FileSearch,
  write_file: FilePlus,
  find_replace: Edit3,
  delete_file: FileX,
  finish: CheckCircle2,
};

function AgentEventRow({ event }) {
  const meta = EVENT_META[event.type] || { icon: Zap, color: "text-white/40", label: event.type };
  let Icon = meta.icon;
  let text = "";

  switch (event.type) {
    case "iteration":
      text = `Step ${event.n}`;
      break;
    case "thought":
      text = event.text;
      break;
    case "tool_call":
      Icon = TOOL_ICONS[event.name] || Wand2;
      if (event.name === "list_files") text = "Listing files…";
      else if (event.name === "read_file") text = `Reading ${event.input?.path}`;
      else if (event.name === "write_file") text = `Writing ${event.input?.path} (${event.input?.size} chars)`;
      else if (event.name === "find_replace") text = `Editing ${event.input?.path} — "${event.input?.find_preview}…"`;
      else if (event.name === "delete_file") text = `Deleting ${event.input?.path}`;
      else if (event.name === "finish") text = `Finishing: ${event.input?.summary}`;
      else text = event.name;
      break;
    case "tool_result":
      text = event.summary;
      break;
    case "file_change":
      text = `${event.action === "create" ? "Created" : event.action === "delete" ? "Deleted" : "Updated"} ${event.path}`;
      break;
    case "error":
      text = event.message;
      break;
    case "done":
      text = `Completed in ${event.iterations} step${event.iterations === 1 ? "" : "s"}`;
      break;
    default:
      text = JSON.stringify(event);
  }

  if (event.type === "iteration") {
    return (
      <div className="flex items-center gap-2 py-1.5 text-[10px] uppercase tracking-widest text-white/25 font-bold">
        <div className="h-px flex-1 bg-white/5" />
        <span>{text}</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${meta.color}`} />
      <div className="flex-1 min-w-0">
        {event.type === "thought" ? (
          <p className="text-[11.5px] text-white/65 leading-relaxed whitespace-pre-wrap">{text}</p>
        ) : (
          <p className="text-[11px] font-mono text-white/60 leading-relaxed break-words">{text}</p>
        )}
      </div>
    </div>
  );
}

function AgentLiveView({ events, active }) {
  const bottomRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (bottomRef.current && active) bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length, active]);

  const done = events.find((e) => e.type === "done");
  const erred = events.find((e) => e.type === "error");

  return (
    <div className="flex justify-start w-full">
      <div className="bg-white/[0.03] border border-violet-500/20 rounded-xl px-3 py-2.5 w-full max-w-full">
        <button onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center gap-2 mb-2 pb-2 border-b border-white/5 text-left">
          {active ? (
            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
          ) : erred ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="text-white/80 text-[11.5px] font-bold uppercase tracking-widest">
            {active ? "Agent working" : erred ? "Agent failed" : "Agent trace"}
          </span>
          <span className="ml-auto text-[10px] text-white/30 font-mono">
            {events.length} events {collapsed ? "▸" : "▾"}
          </span>
        </button>
        {!collapsed && (
          <div className="max-h-60 overflow-y-auto pr-1 space-y-0.5">
            {events.length === 0 && (
              <p className="text-white/30 text-[11px] italic py-2">Waking up Claude…</p>
            )}
            {events.map((ev, i) => (
              <AgentEventRow key={i} event={ev} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({ history, onSend, sending, agentEvents = [] }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, sending, agentEvents.length]);

  const submit = () => {
    const msg = input.trim();
    if (!msg || sending) return;
    onSend(msg);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-t border-white/[0.05]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05]">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">AI Chat</span>
        <span className="text-[10px] text-white/30 ml-auto">Claude Sonnet 4.5 · Agentic</span>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && !sending && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-violet-400/50 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-1">Chat with Claude to edit your project</p>
            <p className="text-white/25 text-[11px]">Try: "make the hero taller" or "add a pricing page"</p>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
              msg.role === "user"
                ? "bg-violet-500/20 text-white border border-violet-500/30"
                : "bg-white/[0.04] text-white/80 border border-white/[0.07]"
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {msg.files_changed && msg.files_changed.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                  {msg.files_changed.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-300 rounded px-1.5 py-0.5 font-mono border border-emerald-500/20">
                      <FileCode className="w-2.5 h-2.5" />
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {agentEvents.length > 0 && <AgentLiveView events={agentEvents} active={sending} />}
      </div>

      <div className="p-3 border-t border-white/[0.05] flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask Claude to edit, add, or refactor…"
            rows={2}
            disabled={sending}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-violet-400/50 resize-none disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || sending}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}