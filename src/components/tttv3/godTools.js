/**
 * godTools — GOD ZK's real system-call layer.
 * These are ACTUAL backend executions (not simulations): live Kaspa data,
 * explorer access, news, deep web search, TTT stats, and image forging.
 */
import { base44 } from "@/api/base44Client";

export const GOD_TOOL_CATALOG = `
- kaspa_price {} — live Kaspa price USD + market data
- kaspa_balance { address } — KAS balance of any address
- kaspa_history { address } — recent transactions of an address
- explorer_search { query } — search Kaspa explorer (address / tx / block)
- live_transactions {} — live Kaspa network transactions right now
- kaspa_news {} — latest Kaspa news headlines
- web_search { query } — deep web search for anything
- ttt_stats {} — live TTT platform stats
- generate_image { prompt } — forge an AI image, returns URL
- post_to_feed { content, image_url? } — ACTUALLY publish a post to the TTT Feed (/Feed) right now. If a generate_image call runs earlier in the same batch, its image is AUTO-ATTACHED to the post (or set image_url to "LAST_IMAGE"). Write the full post text in "content" — hashtags included.
`;

const clip = (v, n = 1400) => {
  try { const s = typeof v === "string" ? v : JSON.stringify(v); return s.length > n ? s.slice(0, n) + "…" : s; }
  catch { return String(v); }
};

export async function executeGodTool({ name, args = {} }, ctx = {}) {
  const t0 = Date.now();
  try {
    let data;
    switch (name) {
      case "post_to_feed": {
        const content = (args.content || "").trim();
        if (!content) return { name, args, ok: false, result: "post_to_feed requires content", ms: Date.now() - t0 };
        let imageUrl = args.image_url && args.image_url !== "LAST_IMAGE" ? args.image_url : (ctx.lastImageUrl || "");
        let authorName = "GOD ZK";
        let wallet = "";
        try {
          const me = await base44.auth.me();
          authorName = me?.username || me?.full_name || "GOD ZK";
          wallet = me?.created_wallet_address || "";
        } catch {}
        const post = await base44.entities.Post.create({
          content,
          author_name: authorName,
          author_wallet_address: wallet,
          author_role: "user",
          ...(imageUrl ? { image_url: imageUrl, media_files: [{ url: imageUrl, type: "image", name: "god-zk-image" }] } : {}),
        });
        data = { success: true, post_id: post.id, posted_content: content, image_attached: !!imageUrl, view_at: "/Feed" };
        break;
      }
      case "kaspa_price": data = (await base44.functions.invoke("getKaspaPrice", {})).data; break;
      case "kaspa_balance": data = (await base44.functions.invoke("getKaspaBalance", { address: args.address })).data; break;
      case "kaspa_history": data = (await base44.functions.invoke("getKaspaTransactionHistory", { address: args.address, limit: 10 })).data; break;
      case "explorer_search": data = (await base44.functions.invoke("searchKaspaExplorer", { query: args.query })).data; break;
      case "live_transactions": data = (await base44.functions.invoke("getLiveKaspaTransactions", {})).data; break;
      case "kaspa_news": data = (await base44.functions.invoke("scrapeKaspaNews", {})).data; break;
      case "web_search": data = (await base44.functions.invoke("exaSearch", { query: args.query })).data; break;
      case "ttt_stats": data = (await base44.functions.invoke("getTTTStats", {})).data; break;
      case "generate_image": {
        data = await base44.integrations.Core.GenerateImage({ prompt: args.prompt });
        if (data?.url && ctx) ctx.lastImageUrl = data.url;
        break;
      }
      default: return { name, args, ok: false, result: `Unknown tool: ${name}`, ms: 0 };
    }
    return { name, args, ok: true, result: clip(data), ms: Date.now() - t0 };
  } catch (e) {
    return { name, args, ok: false, result: clip(e?.message || "failed"), ms: Date.now() - t0 };
  }
}

export async function executeGodTools(calls, onToolDone) {
  const results = [];
  const ctx = {}; // carries lastImageUrl so generate_image → post_to_feed chains for real
  // Ensure image forging always runs BEFORE posting, so the image can attach
  const ordered = [...(calls || [])].slice(0, 4).sort((a, b) =>
    (a.name === "post_to_feed" ? 1 : 0) - (b.name === "post_to_feed" ? 1 : 0));
  for (const call of ordered) {
    const r = await executeGodTool(call, ctx);
    results.push(r);
    onToolDone?.(r);
  }
  return results;
}