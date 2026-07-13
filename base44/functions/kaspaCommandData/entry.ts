Deno.serve(async (req) => {
  try {
    const [aggsRes, priceRes, hashRes, blockdagRes, expRes] = await Promise.all([
      fetch("https://nodes.kaspa.ws/data/aggs.json"),
      fetch("https://api.kaspa.org/info/price"),
      fetch("https://api.kaspa.org/info/hashrate?stringOnly=false"),
      fetch("https://api.kaspa.org/info/blockdag"),
      fetch("https://nodes.kaspa.ws/data/exp_map.html"),
    ]);

    const aggs = aggsRes.ok ? await aggsRes.json() : null;
    const price = priceRes.ok ? await priceRes.json() : null;
    const hashrate = hashRes.ok ? await hashRes.json() : null;
    const blockdag = blockdagRes.ok ? await blockdagRes.json() : null;

    // Parse exact per-node coordinates + labels from the open node-map data
    const nodes = [];
    if (expRes.ok) {
      const html = await expRes.text();

      const decodeF8All = (name) => {
        const re = new RegExp('"' + name + '":\\{"dtype":"f8","bdata":"((?:[^"\\\\]|\\\\.)*)"', "g");
        const out = [];
        let m;
        while ((m = re.exec(html)) !== null) {
          const b64 = JSON.parse('"' + m[1] + '"');
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          out.push(new Float64Array(bytes.buffer));
        }
        return out;
      };

      const extractArrayAt = (key, fromIdx) => {
        const kIdx = html.indexOf('"' + key + '":[', fromIdx);
        if (kIdx < 0) return { arr: [], next: -1 };
        const start = kIdx + key.length + 3;
        let depth = 0, inStr = false, esc = false, end = -1;
        for (let j = start; j < html.length; j++) {
          const c = html[j];
          if (inStr) {
            if (esc) esc = false;
            else if (c === "\\") esc = true;
            else if (c === '"') inStr = false;
          } else if (c === '"') inStr = true;
          else if (c === "[") depth++;
          else if (c === "]") { depth--; if (depth === 0) { end = j + 1; break; } }
        }
        if (end < 0) return { arr: [], next: -1 };
        try { return { arr: JSON.parse(html.slice(start, end)), next: end }; } catch { return { arr: [], next: end }; }
      };

      // Concatenate ALL map traces (toccata + legacy nodes) so every node is plotted
      const lats = decodeF8All("lat");
      const lons = decodeF8All("lon");
      const hovers = [];
      let cursor = 0;
      while (cursor >= 0 && hovers.length < lats.length) {
        const { arr, next } = extractArrayAt("hovertext", cursor);
        if (next < 0) break;
        hovers.push(arr);
        cursor = next;
      }

      for (let t = 0; t < lats.length; t++) {
        const lat = lats[t], lon = lons[t] || [], hover = hovers[t] || [];
        for (let i = 0; i < lat.length; i++) {
          const label = String(hover[i] || "");
          const sep = label.indexOf(": ");
          const loc = sep >= 0 ? label.slice(0, sep) : label;
          const version = sep >= 0 ? label.slice(sep + 2) : "";
          const slash = loc.indexOf("/");
          nodes.push({
            lat: lat[i],
            lon: lon[i],
            country: slash >= 0 ? loc.slice(0, slash) : loc,
            city: slash >= 0 ? loc.slice(slash + 1) : "",
            version,
          });
        }
      }
    }

    return Response.json({ aggs, price, hashrate, blockdag, nodes, fetched_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});