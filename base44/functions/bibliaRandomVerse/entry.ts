// BIBLIA — random KJV verse proxy (bible-api.com, public domain).
// Read-only proxy of a public-domain text; no user data involved, guests welcome.

const normalize = (t) => String(t || '').replace(/\s*\n\s*/g, ' ').trim();

export default async function(req) {
  try {
    const r = await fetch('https://bible-api.com/data/kjv/random');
    if (!r.ok) return Response.json({ error: 'verse service unavailable' }, { status: 502 });
    const data = await r.json();
    const v = data?.random_verse;
    if (!v?.book || !v?.text) return Response.json({ error: 'malformed verse' }, { status: 502 });

    // ~1 in 3 draws: widen into a short passage so some swipes carry context
    if (Math.random() < 0.35) {
      try {
        const pr = await fetch(
          `https://bible-api.com/${encodeURIComponent(v.book)}+${v.chapter}:${v.verse}-${v.verse + 3}?translation=kjv`
        );
        if (pr.ok) {
          const pd = await pr.json();
          if (pd?.verses?.length && pd.text) {
            const ref = String(pd.reference || `${v.book} ${v.chapter}:${v.verse}`).replace(/[[\]]/g, '');
            return Response.json({ reference: ref.toUpperCase(), text: normalize(pd.text) });
          }
        }
      } catch {}
    }

    return Response.json({
      reference: `${v.book} ${v.chapter}:${v.verse}`.toUpperCase(),
      text: normalize(v.text),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}