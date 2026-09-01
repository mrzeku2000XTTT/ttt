// Admin-only: scans already-stored KaspaHotTopic records that link to X
// (Twitter) and deletes the ones whose handle no longer resolves (user renamed
// / suspended / deleted). Use this to clean up dead X links that were stored
// before the live-check was added to fetchKaspaHotTopics.
//
// Best-effort: X blocks scraping, so an inconclusive page is kept (we never
// delete a real profile on a false negative). Only clear suspended/not-found
// signals cause deletion.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isXLink, verifyXProfile } from '../../shared/xProfileVerify.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(body?.limit || 200, 1), 1000);

    // Pull the most recent hot topics that link to X.
    const recent = await base44.asServiceRole.entities.KaspaHotTopic.list('-scraped_at', limit);
    const xItems = recent.filter((t) => isXLink(t.tweet_url));

    if (xItems.length === 0) {
      return Response.json({ scanned: 0, deleted: 0, kept: 0 });
    }

    const verdicts = await Promise.all(
      xItems.map((t) => verifyXProfile(t.tweet_url).catch(() => ({ live: true, reason: 'verify error', handle: null })))
    );

    const dead = [];
    const kept = [];
    xItems.forEach((t, i) => {
      const v = verdicts[i];
      if (v && !v.live) dead.push({ id: t.id, url: t.tweet_url, reason: v.reason });
      else kept.push({ id: t.id, url: t.tweet_url, reason: v?.reason || 'unknown' });
    });

    // Delete dead ones one-by-one (small batch expected).
    let deletedCount = 0;
    for (const d of dead) {
      try {
        await base44.asServiceRole.entities.KaspaHotTopic.delete(d.id);
        deletedCount++;
      } catch { /* best effort */ }
    }

    return Response.json({
      scanned: xItems.length,
      deleted: deletedCount,
      kept: kept.length,
      dead: dead,
      sampleKept: kept.slice(0, 10),
    });
  } catch (error) {
    console.error('[purgeDeadXHotTopics] error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}