import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Eye, Wand2, Gavel, Sparkles, CheckCircle2, Loader2,
  Film, ExternalLink, AlertCircle, Bot, ChevronDown, ChevronRight, Layers
} from "lucide-react";

/**
 * KatagamiAgentChat
 * Renders the live agent transcript: every step (research → analyze → plan
 * → critique → refine → done) becomes a chat bubble with its own UI card.
 */

const STEP_META = {
  research:      { icon: Search,    label: "Researching motion ad trends",      color: "from-cyan-500 to-blue-500" },
  analyze_media: { icon: Eye,       label: "Analyzing your media",              color: "from-violet-500 to-fuchsia-500" },
  plan:          { icon: Wand2,     label: "Designing v1 motion plan",          color: "from-fuchsia-500 to-pink-500" },
  choreograph:   { icon: Layers,    label: "Sub-agents choreographing beats",   color: "from-indigo-500 to-purple-500" },
  critique:      { icon: Gavel,     label: "Self-critique pass",                color: "from-orange-500 to-red-500" },
  refine:        { icon: Sparkles,  label: "Refining into final plan",          color: "from-amber-400 to-orange-500" },
  done:          { icon: CheckCircle2, label: "Final cut ready",                color: "from-emerald-500 to-cyan-500" },
};

export default function KatagamiAgentChat({ messages, working, error, renderUrl, onOpenRender }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, working]);

  return (
    <div className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-fuchsia-950/40 to-orange-950/40">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-black text-white tracking-wide">KATAGAMI · MOTION AD AGENT</div>
          <div className="text-[10px] text-white/50">Researches · plans · critiques · refines</div>
        </div>
        {working && <Loader2 className="w-4 h-4 text-fuchsia-300 animate-spin" />}
      </div>

      {/* Transcript */}
      <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
        {messages.length === 0 && !working && (
          <div className="text-center py-8 text-white/30 text-xs">
            Drop media, set a vibe, hit <span className="text-fuchsia-300 font-bold">Auto-Edit</span>. The agent's thoughts will stream here.
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <StepBubble key={i} msg={m} />
          ))}
        </AnimatePresence>

        {working && <ThinkingBubble step={working} />}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-200">{error}</div>
          </div>
        )}

        {renderUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/40 to-cyan-900/30 border border-emerald-500/40"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <div className="text-xs font-black text-white">READY TO RENDER</div>
            </div>
            <button
              onClick={onOpenRender}
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white text-black font-black text-sm hover:bg-white/90"
            >
              <Film className="w-4 h-4" /> Render & Download MP4
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}

function ThinkingBubble({ step }) {
  const meta = STEP_META[step] || { icon: Loader2, label: step, color: "from-white/40 to-white/20" };
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2"
    >
      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 text-fuchsia-300 animate-spin" />
          <span className="text-xs text-white/80 font-semibold">{meta.label}…</span>
        </div>
      </div>
    </motion.div>
  );
}

function StepBubble({ msg }) {
  const meta = STEP_META[msg.step] || { icon: Bot, label: msg.step, color: "from-white/40 to-white/20" };
  const Icon = meta.icon;
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2"
    >
      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold text-white truncate">{meta.label}</span>
          </div>
          {open ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronRight className="w-3 h-3 text-white/40" />}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 border-t border-white/5">
                <StepBody step={msg.step} output={msg.output} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StepBody({ step, output }) {
  if (!output) return <div className="text-[11px] text-white/40">No output</div>;

  if (step === "research") {
    return (
      <div className="space-y-2">
        {output.recommended_mood && (
          <Tag label="Mood" value={output.recommended_mood} />
        )}
        {output.recommended_pace && (
          <Tag label="Pace" value={output.recommended_pace} />
        )}
        {output.trends?.length > 0 && (
          <Section title="📈 Trends">
            {output.trends.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
          </Section>
        )}
        {output.key_principles?.length > 0 && (
          <Section title="🎯 Principles">
            {output.key_principles.map((p, i) => <Bullet key={i}>{p}</Bullet>)}
          </Section>
        )}
        {output.references?.length > 0 && (
          <Section title="🎬 References">
            {output.references.map((r, i) => (
              <div key={i} className="text-[11px] text-white/70">
                <span className="text-fuchsia-300 font-semibold">{r.title}</span>
                <span className="text-white/50"> — {r.why}</span>
              </div>
            ))}
          </Section>
        )}
      </div>
    );
  }

  if (step === "analyze_media") {
    return (
      <div className="space-y-1.5">
        {output.subject && <Tag label="Subject" value={output.subject} />}
        {output.mood && <Tag label="Mood" value={output.mood} />}
        {output.composition && <Tag label="Composition" value={output.composition} />}
        {output.palette?.length > 0 && (
          <Tag label="Palette" value={output.palette.join(" · ")} />
        )}
        {output.best_motion_angle && (
          <div className="mt-2 p-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-[11px] text-fuchsia-200">
            💡 {output.best_motion_angle}
          </div>
        )}
      </div>
    );
  }

  if (step === "plan" || step === "refine") {
    return (
      <div className="space-y-1.5">
        {output.tagline && (
          <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-fuchsia-900/30 to-orange-900/30 border border-fuchsia-500/30 text-white font-bold text-sm">
            "{output.tagline}"
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <Tag label="Preset" value={output.preset_id} />
          <Tag label="Device" value={output.device} />
          <Tag label="BG" value={output.background} />
          <Tag label="Duration" value={`${output.duration}s`} />
          {output.camera_preset && <Tag label="Camera" value={output.camera_preset} />}
        </div>
        {output.reasoning && (
          <div className="text-[11px] text-white/60 italic mt-1">"{output.reasoning}"</div>
        )}
      </div>
    );
  }

  if (step === "critique") {
    const score = output.score || 0;
    const scoreColor = score >= 80 ? "text-emerald-300" : score >= 60 ? "text-amber-300" : "text-red-300";
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Score</span>
          <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
          <span className="text-white/30 text-xs">/ 100</span>
        </div>
        {output.strengths?.length > 0 && (
          <Section title="✓ Strengths" tone="emerald">
            {output.strengths.map((s, i) => <Bullet key={i}>{s}</Bullet>)}
          </Section>
        )}
        {output.issues?.length > 0 && (
          <Section title="⚠ Issues" tone="red">
            {output.issues.map((s, i) => <Bullet key={i}>{s}</Bullet>)}
          </Section>
        )}
        {output.improvements?.length > 0 && (
          <Section title="→ Improvements" tone="cyan">
            {output.improvements.map((s, i) => <Bullet key={i}>{s}</Bullet>)}
          </Section>
        )}
        {output.verdict && (
          <div className="text-[11px] text-white/60 italic">"{output.verdict}"</div>
        )}
      </div>
    );
  }

  if (step === "choreograph") {
    return (
      <div className="space-y-1.5">
        <div className="text-[10px] text-white/50">
          {output.segment_count} sub-agents · {output.total_duration}s total · ~{(output.total_duration / output.segment_count).toFixed(1)}s per beat
        </div>
        <div className="space-y-1">
          {(output.segments || []).map((seg, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                {seg.beat}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white font-bold truncate">{seg.preset_id}{seg.camera_preset ? ` + ${seg.camera_preset}` : ""}</div>
                <div className="text-[10px] text-white/50 truncate">{seg.intent}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === "done") {
    return <div className="text-[11px] text-emerald-300">Final plan locked. Hit render below to bake the MP4.</div>;
  }

  return <pre className="text-[10px] text-white/50 whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
}

function Tag({ label, value }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-white/40 uppercase tracking-wider text-[9px] font-bold w-16 flex-shrink-0">{label}</span>
      <span className="text-white font-mono truncate">{value}</span>
    </div>
  );
}

function Section({ title, tone = "white", children }) {
  const tones = {
    white: "text-white/80",
    emerald: "text-emerald-300",
    red: "text-red-300",
    cyan: "text-cyan-300",
  };
  return (
    <div>
      <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${tones[tone]}`}>{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Bullet({ children }) {
  return <div className="text-[11px] text-white/70 leading-relaxed">• {children}</div>;
}