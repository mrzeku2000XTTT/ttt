import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, ThumbsUp, Lightbulb, CalendarClock, Target, RotateCcw } from 'lucide-react';

const SEVERITY = {
  high: 'border-destructive/50 text-destructive bg-destructive/10',
  medium: 'border-amber-400/40 text-amber-300 bg-amber-400/10',
  low: 'border-border text-muted-foreground bg-card',
};

function Chip({ children, tone = 'low' }) {
  return (
    <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-semibold uppercase tracking-wide ${SEVERITY[tone] || SEVERITY.low}`}>
      {children}
    </span>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="mt-3 rounded-2xl border border-border bg-card/50 p-4">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <h2 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
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
    <div className="mt-3">
      {/* Channel card */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-[9px] font-semibold tracking-[0.15em] uppercase">
                {result.platform || 'Channel'}
              </span>
              {result.found === false && <Chip tone="medium">Not fully visible</Chip>}
            </div>
            <h2 className="mt-2 text-lg sm:text-xl font-semibold break-words">
              {result.channel_name || 'Your channel'}
            </h2>
            {result.handle && <p className="mt-0.5 text-xs text-muted-foreground">{result.handle}</p>}
            {result.snapshot && <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{result.snapshot}</p>}
            {result.note && <p className="mt-2 text-[11px] text-amber-300/90 leading-relaxed">{result.note}</p>}

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { l: 'Niche', v: result.niche },
                { l: 'Followers', v: result.followers },
                { l: 'Typical views', v: result.typical_views },
              ].filter((s) => s.v).map((s) => (
                <div key={s.l} className="rounded-xl border border-border bg-background/50 px-2.5 py-2">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">{s.l}</div>
                  <div className="mt-0.5 text-xs font-medium break-words">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sm:w-36 flex-shrink-0 rounded-2xl border border-border bg-background/50 p-3 text-center">
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Health</div>
            <div className="mt-1 text-3xl font-semibold text-primary tabular-nums">{score}</div>
            <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
            </div>
            {result.score_reason && <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">{result.score_reason}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            onClick={copyPlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Plan copied' : 'Copy full plan'}
          </button>
          <button
            onClick={onAgain}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Audit another link
          </button>
        </div>
      </div>

      {!!result.problems?.length && (
        <Section icon={AlertTriangle} title="What is holding you back">
          <div className="space-y-2">
            {result.problems.map((p, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-xs">{p.title}</h3>
                  <Chip tone={String(p.severity || '').toLowerCase()}>{p.severity || 'note'}</Chip>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!!result.actions?.length && (
        <Section icon={Target} title="Do this week">
          <ol className="space-y-2">
            {result.actions.map((a, i) => (
              <li key={i} className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 flex-shrink-0 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-xs">{a.title}</h3>
                      {a.impact && <Chip tone={String(a.impact).toLowerCase() === 'high' ? 'medium' : 'low'}>{a.impact} impact</Chip>}
                      {a.effort && <Chip>{a.effort}</Chip>}
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed"><span className="text-foreground font-medium">Why: </span>{a.why}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed"><span className="text-foreground font-medium">How: </span>{a.how}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {!!result.content_ideas?.length && (
        <Section icon={Lightbulb} title="Content ideas with hooks">
          <div className="grid sm:grid-cols-2 gap-2">
            {result.content_ideas.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/40 p-3">
                <h3 className="font-semibold text-xs">{c.title}</h3>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">{c.format}</p>
                {c.hook && <p className="mt-1.5 text-[11px] text-primary/90 leading-relaxed">“{c.hook}”</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.posting_plan && (
        <Section icon={CalendarClock} title="Posting plan">
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { l: 'Cadence', v: result.posting_plan.cadence },
              { l: 'Best times', v: result.posting_plan.best_times },
              { l: 'Formats', v: result.posting_plan.formats },
            ].filter((x) => x.v).map((x) => (
              <div key={x.l} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">{x.l}</div>
                <p className="mt-1 text-[11px] leading-relaxed">{x.v}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!!result.strengths?.length && (
        <Section icon={ThumbsUp} title="What is already working">
          <div className="grid sm:grid-cols-2 gap-2">
            {result.strengths.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/40 p-3">
                <h3 className="font-semibold text-xs">{s.title}</h3>
                <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!!result.metrics_to_track?.length && (
        <Section icon={Target} title="Track these">
          <div className="flex flex-wrap gap-1.5">
            {result.metrics_to_track.map((m, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full border border-border text-[10px] text-muted-foreground">{m}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}