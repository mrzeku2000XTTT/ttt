Deno.serve(async (req) => {
  try {
    const { ia_id, offset = 0, chunk = 200000 } = await req.json().catch(() => ({}));
    if (!ia_id) return Response.json({ error: 'ia_id required' }, { status: 400 });

    const ua = { 'User-Agent': 'Narrate/1.0 (+https://tttxyz.base44.app)' };

    // 1) Read the item's file list to find a readable text file.
    let textUrl = null;
    try {
      const meta = await fetch(`https://archive.org/metadata/${ia_id}`, { headers: ua }).then((r) => r.json());
      const files = (meta?.files || []).filter((f) => f.name);
      // Prefer djvu OCR text, then any plain .txt, then _text files
      const pick =
        files.find((f) => /_djvu\.txt$/i.test(f.name)) ||
        files.find((f) => /\.txt$/i.test(f.name) && !/_meta\.txt$|_djvu\.xml$|_images\.txt$/i.test(f.name)) ||
        files.find((f) => /_text\.(txt|pdf)$/i.test(f.name));
      if (pick) textUrl = `https://archive.org/download/${ia_id}/${pick.name}`;
    } catch {}

    // 2) Fall back to the standard djvu.txt naming if metadata lookup failed.
    if (!textUrl) textUrl = `https://archive.org/download/${ia_id}/${ia_id}_djvu.txt`;

    let text = '';
    try {
      const r = await fetch(textUrl, { headers: ua, redirect: 'follow' });
      if (r.ok) text = await r.text();
    } catch {}

    if (!text || text.length < 200) {
      return Response.json({
        error: 'Full text is not available for this title. Try scanning your own copy with the Scan button.',
        ia_id,
      });
    }

    // Light cleanup of common OCR/djvu artifacts
    text = text.replace(/\r/g, '').replace(/\u0000/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');

    const total = text.length;
    const slice = text.slice(offset, offset + chunk);
    return Response.json({ text: slice, total, offset, hasMore: offset + chunk < total });
  } catch (e) {
    return Response.json({ error: e?.message || 'Fetch failed' }, { status: 500 });
  }
});