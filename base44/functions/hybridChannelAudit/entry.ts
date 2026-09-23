import { creditOperation, text, invalid } from '../../shared/creditOperation.ts';

/**
 * HYBRID — social channel engagement audit.
 * Paste a channel / video / post link; HYBRID researches the live web and
 * returns a blunt, specific plan for lifting engagement.
 */

const SCHEMA = {
  type: 'object',
  properties: {
    channel_name: { type: 'string' },
    handle: { type: 'string' },
    platform: { type: 'string' },
    found: { type: 'boolean' },
    note: { type: 'string' },
    snapshot: { type: 'string' },
    niche: { type: 'string' },
    followers: { type: 'string' },
    typical_views: { type: 'string' },
    health_score: { type: 'number' },
    score_reason: { type: 'string' },
    strengths: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' } },
        required: ['title', 'detail'],
      },
    },
    problems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          severity: { type: 'string' },
        },
        required: ['title', 'detail', 'severity'],
      },
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          why: { type: 'string' },
          how: { type: 'string' },
          impact: { type: 'string' },
          effort: { type: 'string' },
        },
        required: ['title', 'why', 'how', 'impact', 'effort'],
      },
    },
    content_ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          format: { type: 'string' },
          hook: { type: 'string' },
        },
        required: ['title', 'format', 'hook'],
      },
    },
    posting_plan: {
      type: 'object',
      properties: {
        cadence: { type: 'string' },
        best_times: { type: 'string' },
        formats: { type: 'string' },
      },
      required: ['cadence', 'best_times', 'formats'],
    },
    metrics_to_track: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'channel_name', 'found', 'snapshot', 'health_score', 'strengths',
    'problems', 'actions', 'content_ideas', 'posting_plan', 'metrics_to_track',
  ],
};

function detectPlatform(host) {
  const h = host.toLowerCase();
  if (h.includes('youtube') || h === 'youtu.be') return 'YouTube';
  if (h.includes('tiktok')) return 'TikTok';
  if (h.includes('instagram')) return 'Instagram';
  if (h === 'x.com' || h.includes('twitter')) return 'X';
  if (h.includes('twitch')) return 'Twitch';
  if (h.includes('facebook')) return 'Facebook';
  if (h.includes('linkedin')) return 'LinkedIn';
  return 'Web';
}

function buildPrompt(url, platform) {
  return `You are HYBRID, a social growth auditor. Research this link on the live public web and audit the creator's channel.

LINK: ${url}
DETECTED PLATFORM: ${platform}

Rules:
- Use the live web. Open the link itself and the creator's channel/profile page; look at recent posts, view counts, titles, captions, thumbnails, posting frequency, comments, and any publicly listed subscriber/follower counts.
- NEVER invent numbers. If a metric is not publicly visible, write "not public". Clearly label anything you estimate as an estimate.
- Judge engagement quality, not raw popularity: a small channel with active comments is healthier than a large one with dead engagement.
- Be specific and blunt but constructive. Never give generic advice like "post consistently" or "engage with your audience" — name the exact change, why it moves engagement, and how to do it.
- Actions must be doable this week and ranked by impact.

Return JSON only:
- channel_name, handle, platform
- found: true only if you actually located the channel
- note: if found is false, explain exactly what you could and could not see
- snapshot: 2-3 sentences on what this channel is and where it currently stands
- niche, followers, typical_views: strings ("not public" when unknown)
- health_score: 0-100 engagement health
- score_reason: one sentence
- strengths: 3-5 {title, detail}
- problems: 3-5 {title, detail, severity: "high" | "medium" | "low"}
- actions: 5-6 {title, why, how, impact: "high" | "medium" | "low", effort: "5 min" | "1 hour" | "this week"}
- content_ideas: 4-6 {title, format, hook}
- posting_plan: {cadence, best_times, formats}
- metrics_to_track: 4-6 short metric names`;
}

export default async function (req) {
  return creditOperation(req, async (base44, input) => {
    const raw = text(input.link, 'Channel link', 400);
    let url = raw;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw invalid('That does not look like a valid link.');
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw invalid('Only web links are supported.');
    }
    if (parsed.username || parsed.password) throw invalid('That link is not supported.');

    const host = parsed.hostname.replace(/^www\./, '');
    const platform = detectPlatform(host);

    const report = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPrompt(parsed.toString(), platform),
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: SCHEMA,
    });

    return { url: parsed.toString(), host, platform, report };
  });
}