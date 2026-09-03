import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, Compass } from 'lucide-react';
import NicheLogo from '@/components/niche/NicheLogo';
import NicheQuiz from '@/components/niche/NicheQuiz';
import NicheResults from '@/components/niche/NicheResults';
import NicheScanning from '@/components/niche/NicheScanning';

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    niche: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short punchy niche name, 2-5 words' },
        tagline: { type: 'string', description: 'One-line positioning statement' }
      }
    },
    strengths: {
      type: 'array',
      description: '3 things this person is genuinely good at, inferred from their answers',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' } }
      }
    },
    audience: {
      type: 'object',
      properties: {
        who: { type: 'string' },
        why_they_care: { type: 'string' }
      }
    },
    pillars: {
      type: 'array',
      description: '4 recurring content pillars for the niche',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, desc: { type: 'string' } }
      }
    },
    ideas: {
      type: 'array',
      description: '8 concrete post ideas tailored to their chosen platforms',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          hook: { type: 'string', description: 'The opening line / first sentence of the post' },
          format: { type: 'string', description: 'e.g. Thread, Short video, Carousel, Photo, Poll' },
          why: { type: 'string', description: 'Why this works for their niche, one short line' }
        }
      }
    },
    cadence: { type: 'string', description: 'A realistic weekly posting plan that fits their daily time budget' }
  }
};

export default function NichePage() {
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findNiche = async (answers) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are NICHE — a world-class creator strategist. A person answered these questions:

PASSIONS (what lights them up): ${answers.passions.join(', ')}
WHAT PEOPLE ASK THEM FOR HELP WITH: ${answers.asked_for || 'not specified'}
PLATFORMS THEY'LL POST ON: ${answers.platforms.join(', ')}
TIME BUDGET: ${answers.time}

Their passions + what people actually ask them for = their unfair advantage. Find the intersection.

Give them:
1. A sharp, specific niche name (2-5 words, memorable, not generic like "fitness content" — go one level deeper and more specific than their raw passions)
2. A one-line tagline positioning them in that niche
3. THREE genuine strengths they have based on their answers — be concrete and personal
4. Their exact audience: who it is and why they care
5. FOUR recurring content pillars
6. EIGHT ready-to-post ideas tailored to their chosen platforms, each with a killer opening hook
7. A weekly posting cadence that realistically fits "${answers.time}"

Be decisive. No hedging. Be specific to THEM, not generic advice. Their first post should be obvious after reading this.`,
        response_json_schema: RESULT_SCHEMA
      });
      setResult(res);
      // Save to the user's Studio history (logged-in users only)
      try {
        const me = await base44.auth.me();
        if (me?.email) {
          await base44.entities.NicheResult.create({
            user_email: me.email,
            niche_name: res.niche?.name || 'My niche',
            tagline: res.niche?.tagline || '',
            result: res,
            passions: answers.passions,
            platforms: answers.platforms
          });
          setSaved(true);
        }
      } catch (err) {
        // not logged in — the result still shows, it just isn't saved
      }
    } catch (e) {
      setError(e?.message || 'Could not read your signal. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0) 60%)'
        }}
      />

      {/* top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <NicheLogo size={32} />
          <span className="font-black tracking-tight text-xl">NICHE</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/NicheStudio"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Studio</span>
          </Link>
          <a
            href="/AppStoreV2"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Exit to App Store</span>
            <span className="sm:hidden">Exit</span>
          </a>
        </div>
      </div>

      <div className="relative z-10 py-8 sm:py-12 pb-24">
        {loading ? (
          <NicheScanning />
        ) : result ? (
          <NicheResults result={result} saved={saved} onRestart={() => setResult(null)} />
        ) : (
          <>
            {error && (
              <p className="max-w-3xl mx-auto px-4 sm:px-6 mb-6 text-center text-sm text-white/70 border border-white/15 rounded-xl py-3 bg-white/[0.03]">
                {error}
              </p>
            )}
            <NicheQuiz onFind={findNiche} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
}