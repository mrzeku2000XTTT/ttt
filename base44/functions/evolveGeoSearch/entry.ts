import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// EVOLVE geo search — proxies OpenStreetMap Nominatim so the app never exposes
// a browser-side geocoder and keeps a polite, stable User-Agent.
// Returns hierarchical place results: country / state / city / local + bbox.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to search places' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const q = String(body?.query || '').trim();
    if (!q) return Response.json({ results: [] });

    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&q=' +
      encodeURIComponent(q);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TTT-EVOLVE/1.0 (tttxyz.base44.app)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return Response.json({ results: [], error: `geocoder ${res.status}` });

    const data = await res.json();
    const rows = Array.isArray(data) ? data : [];

    const results = rows.map((r) => {
      const a = r.address || {};
      const city = a.city || a.town || a.village || a.hamlet || a.municipality || null;
      const state = a.state || a.region || a.state_district || null;
      const country = a.country || null;
      const local = a.suburb || a.neighbourhood || a.city_district || a.county || null;
      const hierarchy = [local, city, state, country].filter(Boolean);
      const bb = Array.isArray(r.boundingbox) ? r.boundingbox.map(Number) : null;
      return {
        id: r.place_id,
        name: (r.display_name || '').split(',')[0] || hierarchy[0] || '',
        label: hierarchy.join(', '),
        displayName: r.display_name || '',
        lat: Number(r.lat),
        lng: Number(r.lon),
        bbox: bb ? { lat0: bb[0], lat1: bb[1], lng0: bb[2], lng1: bb[3] } : null,
        country,
        state,
        city,
        local,
        type: r.type,
        category: r.category,
      };
    });

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message, results: [] }, { status: 500 });
  }
}