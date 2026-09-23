import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, ThumbsUp, Lightbulb, CalendarClock, Target, RotateCcw } from 'lucide-react';

const SEVERITY = {
  high: 'border-destructive/50 text-destructive bg-destructive/10',
  medium: 'border-amber-400/40 text-amber-300 bg-amber-400/10',
  low: 'border-border text-muted-foreground bg-card',
};

function Chip({ children, tone = 'low' }) {
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${SEVERITY[tone] || SEVERITY.low}`}>
      {children}
    </span>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="mt-5 rounded-3xl border border-border bg-card/60 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-black tracking-widest uppercase text-muted-foreground">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function buildPlanText(r) {
  const lines = [`HYBRID AUDIT — ${r.channel_name || 'Channel'}${r.handle ? ` (${r.handle})` : ''}`, `Engagement health: ${r.health_score}/100`];
  if (r.snapshot) lines.push('', r.snapshot);
  if (r.problems?.length) {
    lines.push('', 'WHAT IS HOLDING YOU BACK');
    r.problems.forEach((p) => lines.push(`- [${p.severity || 'note'}] ${p.title}: ${p.detail}`));
  }
  if (r.actions?.length) {
    lines.push('', 'DO THIS WEEK');
    r.actions.forEach((a, i) => lines.push(`${i + 1}. ${a.title} (impact ${a.impact}, effort ${a.effort})`, `   Why: ${a.why}`, `   How: ${a.how}`));
  }
  if (r.content_ideas?.length) {
    lines.push('', 'CONTENT IDEAS');
    r.content_ideas.forEach((c) => lines.push(`- ${c.title} · ${c.format} · hook: "${c.hook}"`));
  }
  if (r.posting_plan) {
    lines.push('', 'POSTING PLAN', `Cadence: ${r.posting_plan.cadence}`, `Best times: ${r.posting_plan.best_times}`, `Formats: ${r.posting_plan.formats}`);
  }
  if (r.metrics_to_track?.length) lines.push('', `TRACK: ${r.metrics_to_track.join(' · ')}`);
  return lines.join('\n');
}

export default function HybridReport({ result, onAgain }) {
  const [copied, setCopied] = useState(false);
  const score = Math.max(0, Math.min(100, Number(result.health_score) || 0));

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(buildPlanText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="mt-5">
      {/* Channel card */}
      <div className="rounded-3xl border border-border bg-card/70 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-[10px] font-black tracking-widest uppercase">
                {result.platform || 'Channel'}
              </span>
              {result.found === false && <Chip tone="medium">Not fully visible</Chip>}
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight break-words">
              {result.channel_name || 'Your channel'}
            </h2>
            {result.handle && <p className="mt-1 text-sm text-muted-foreground">{result.handle}</p>}
            {result.snapshot && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{result.snapshot}</p>}
            {result.note && (
              <p className="mt-3 text-xs text-amber-300/90 leading-relaxed">{result.note}</p>
            )}

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { l: 'Niche', v: result.niche },
                { l: 'Followers', v: result.followers },
                { l: 'Typical views', v: result.typical_views },
              ].filter((s) => s.v).map((s) => (
                <div key={s.l} className="rounded-2xl border border-border bg-background/60 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{s.l}</div>
                  <div className="mt-1 text-sm font-semibold break-words">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sm:w-48 flex-shrink-0 rounded-3xl border border-border bg-background/60 p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Engagement health</div>
            <div className="mt-2 text-4xl font-black text-primary tabular-nums">{score}</div>
            <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
            </div>
            {result.score_reason && <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">{result.score_reason}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={copyPlan}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Plan copied' : 'Copy the full plan'}
          </button>
          <button
            onClick={onAgain}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Audit another link
          </button>
        </div>
      </div>

      {!!result.problems?.length && (
        <Section icon={AlertTriangle} title="What is holding you back">
          <div className="space-y-3">
            {result.problems.map((p, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background/50 p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm">{p.title}</h3>
                  <Chip tone={String(p.severity || '').toLowerCase()}>{p.severity || 'note'}</Chip>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!!result.actions?.length && (
        <Section icon={Target} title="Do this week">
          <ol className="space-y-3">
            {result.actions.map((a, i) => (
              <li key={i} className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 flex-shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm">{a.title}</h3>
                      {a.impact && <Chip tone={String(a.impact).toLowerCase() === 'high' ? 'medium' : 'low'}>{a.impact} impact</Chip>}
                      {a.effort && <Chip>{a.effort}</Chip>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed"><span className="text-foreground font-semibold">Why: </span>{a.why}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed"><span className="text-foreground font-semibold">How: </span>{a.how}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {!!result.content_ideas?.length && (
        <Section icon={Lightbulb} title="Content ideas with hooks">
          <div className="grid sm:grid-cols-2 gap-3">
            {result.content_ideas.map((c, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background/50 p-4">
                <h3 className="font-bold text-sm">{c.title}</h3>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground font-bold">{c.format}</p>
                {c.hook && <p className="mt-2 text-sm text-primary/90 leading-relaxed">“{c.hook}”</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.posting_plan && (
        <Section icon={CalendarClock} title="Posting plan">
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { l: 'Cadence', v: result.posting_plan.cadence },
              { l: 'Best times', v: result.posting_plan.best_times },
              { l: 'Formats', v: result.posting_plan.formats },
            ].filter((x) => x.v).map((x) => (
              <div key={x.l} className="rounded-2xl border border-border bg-background/50 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{x.l}</div>
                <p className="mt-1.5 text-sm leading-relaxed">{x.v}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!!result.strengths?.length && (
        <Section icon={ThumbsUp} title="What is already working">
          <div className="grid sm:grid-cols-2 gap-3">
            {result.strengths.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background/50 p-4">
                <h3 className="font-bold text-sm">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!!result.metrics_to_track?.length && (
        <Section icon={Target} title="Track these">
          <div className="flex flex-wrap gap-2">
            {result.metrics_to_track.map((m, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground">{m}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}