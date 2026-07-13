Deno.serve(async (req) => {
  try {
    const [ctKaspa, ctAll, quakeRes] = await Promise.all([
      fetch("https://cointelegraph.com/rss/tag/kaspa").catch(() => null),
      fetch("https://cointelegraph.com/rss").catch(() => null),
      fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson").catch(() => null),
    ]);

    const parseRss = (xml, source) => {
      const items = [];
      const itemRe = /<item>([\s\S]*?)<\/item>/g;
      let m;
      while ((m = itemRe.exec(xml)) !== null && items.length < 25) {
        const block = m[1];
        const pick = (tag) => {
          const r = block.match(new RegExp("<" + tag + ">(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/" + tag + ">"));
          return r ? r[1].trim() : "";
        };
        items.push({
          title: pick("title").replace(/&amp;/g, "&").replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"'),
          link: pick("link"),
          pub_date: pick("pubDate"),
          source,
        });
      }
      return items;
    };

    let news = [];
    if (ctKaspa?.ok) news = news.concat(parseRss(await ctKaspa.text(), "KASPA INTEL"));
    if (ctAll?.ok) news = news.concat(parseRss(await ctAll.text(), "CRYPTO WIRE"));
    news.sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime());
    news = news.slice(0, 40);

    let earthquakes = [];
    if (quakeRes?.ok) {
      const geo = await quakeRes.json();
      earthquakes = (geo.features || []).slice(0, 100).map((f) => ({
        mag: f.properties?.mag,
        place: f.properties?.place,
        time: f.properties?.time,
        url: f.properties?.url,
        lon: f.geometry?.coordinates?.[0],
        lat: f.geometry?.coordinates?.[1],
        depth: f.geometry?.coordinates?.[2],
      }));
    }

    return Response.json({ news, earthquakes, fetched_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});