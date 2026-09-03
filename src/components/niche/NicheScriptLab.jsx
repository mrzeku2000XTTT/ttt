import React, { useState } from 'react';
import { Clapperboard, Loader2, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import YouTubeDeploy from './YouTubeDeploy';

// Generates a full ready-to-shoot video script based on the user's saved niche
export default function NicheScriptLab({ niche }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState(null);

  const r = niche.result || {};

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a top YouTube scriptwriter. Write a complete, ready-to-shoot video script.

Creator's niche: "${niche.niche_name}" — ${niche.tagline}
Audience: ${r.audience?.who || 'their target audience'} — ${r.audience?.why_they_care || ''}
Content pillars: ${(r.pillars || []).map((p) => p.name).join(', ')}
Video topic: "${topic.trim() || niche.niche_name}"

Write:
1. A click-worthy title (under 60 characters)
2. A 5-second opening hook spoken on camera
3. A scene-by-scene script: timestamp ranges, what's on screen (scene), the exact voiceover lines, and b-roll notes — 6 to 8 scenes, total runtime 6–10 minutes
4. A YouTube description (2 short paragraphs + a "watch next" line)
5. 8–12 SEO tags
6. One retention tip specific to this script

Be direct, energetic, zero fluff. Voiceover lines must be written the way a person actually talks.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            hook: { type: 'string' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            retention_tip: { type: 'string' },
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', description: 'e.g. 0:00–0:15' },
                  scene: { type: 'string' },
                  voiceover: { type: 'string' },
                  broll: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setScript(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clapperboard className="w-4 h-4 text-white/50" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Video Script Lab</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={`Video topic — leave blank to use "${niche.niche_name}"`}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-white text-black font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
          {loading ? 'Writing…' : 'Generate script'}
        </button>
      </div>

      {script && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-1">Title</p>
            <p className="text-white font-bold text-lg">{script.title}</p>
            <p className="text-white/70 text-sm mt-3 italic">"{script.hook}"</p>
          </div>

          <ol className="space-y-2">
            {script.scenes?.map((s, i) => (
              <li key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-bold">{s.timestamp}</span>
                  <span className="text-white/50 text-xs">{s.scene}</span>
                </div>
                <p className="text-white text-sm leading-relaxed">{s.voiceover}</p>
                <p className="text-white/35 text-xs mt-1.5">B-roll: {s.broll}</p>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-1">Description</p>
            <p className="text-white/70 text-sm whitespace-pre-line">{script.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {script.tags?.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-white/60">#{t}</span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] p-4">
            <Target className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
            <p className="text-white/50 text-xs">{script.retention_tip}</p>
          </div>

          <YouTubeDeploy title={script.title} description={script.description} tags={script.tags} />
        </div>
      )}
    </div>
  );
}