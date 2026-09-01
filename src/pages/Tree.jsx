import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TREE_TEMPLATES } from "@/components/tree/treeTemplates";
import TreeCampaignForm from "@/components/tree/TreeCampaignForm";
import TreeAgentLog from "@/components/tree/TreeAgentLog";
import TreeAdCard from "@/components/tree/TreeAdCard";
import TreeCampaignHistory from "@/components/tree/TreeCampaignHistory";
import TreePaywall from "@/components/tree/TreePaywall";
import TreeTokenBrowser from "@/components/tree/TreeTokenBrowser";
import { Link } from "react-router-dom";
import { TreePine, ArrowLeft, Hammer, Coins } from "lucide-react";

const UNLOCK_PRICE = 0.5;

// Fact-check pass: after the LLM writes the ads, rewrite every data detail in
// the copy so it matches the verified live token stats EXACTLY. Removes any
// invented/rounded/altered numbers so the marketing words stay truthful.
async function factCheckAds(ads, v) {
  if (!v || !ads || !ads.length) return ads;
  const verified = [
    `Tick / symbol: ${v.tick}`,
    v.name ? `Token name: ${v.name}` : "",
    v.hasMarket ? `Price: ${v.price} KAS` : "Price: NOT available — do not state a price",
    v.hasMarket ? `24h change: ${v.change24h}%` : "",
    v.hasMarket ? `24h volume: ${v.volume24h} KAS` : "",
    v.hasMarket ? `TVL: ${v.tvl} KAS` : "",
    v.hasMarket ? `Holders: ${v.holderTotal}` : "Holders: NOT available — do not state a holder count",
    v.kronUrl ? `KRON URL: ${v.kronUrl}` : "",
  ].filter(Boolean).join("\n");
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a strict fact-checker for KCC20 token marketing copy. The ONLY verified data is:

${verified}

For EACH ad below, rewrite hook, script, caption, narration_text so that EVERY number and every factual data claim (price, TVL, holders, volume, change, "new entry", "listed on KRON", etc.) matches the verified data EXACTLY — no rounding, no approximations, no invented figures. If a claim is not supported by the verified data, REMOVE it (do not replace with a different number). Keep the tone, hashtags and style. Do not touch template or visual_prompt. Return the same JSON shape with the same number of ads in the same order.

${JSON.stringify(ads, null, 2)}`,
      response_json_schema: {
        type: "object",
        properties: {
          ads: { type: "array", items: { type: "object", properties: {
            template: { type: "string" }, hook: { type: "string" }, script: { type: "string" },
            caption: { type: "string" }, cta: { type: "string" }, narration_text: { type: "string" },
            visual_prompt: { type: "string" },
          } } },
        },
      },
    });
    const fixed = res?.ads;
    if (Array.isArray(fixed) && fixed.length === ads.length) {
      // preserve visual_prompt/cta/template from the original (fact-checker only owns words)
      return ads.map((a, i) => ({
        ...a,
        hook: fixed[i].hook ?? a.hook,
        script: fixed[i].script ?? a.script,
        caption: fixed[i].caption ?? a.caption,
        narration_text: fixed[i].narration_text ?? a.narration_text,
      }));
    }
    return ads;
  } catch {
    return ads;
  }
}

const looksLikeUrl = (s) => {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t) && !/\s/.test(t);
};
const normalizeUrl = (s) => {
  let t = s.trim();
  if (!/^https?:\/\//i.test(t)) t = "https://" + t;
  return t;
};

export default function Tree() {
  const [mode, setMode] = useState("build"); // build | tokens
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [history, setHistory] = useState([]);
  const [locked, setLocked] = useState(false);
  const [marketingTick, setMarketingTick] = useState(null);

  useEffect(() => {
    base44.entities.TreeCampaign.list("-created_date", 10).then(setHistory).catch(() => {});
  }, []);

  const deleteCampaign = async (c) => {
    // Local-only campaigns (guests) have a synthetic id; just drop from history.
    if (c.id && !String(c.id).startsWith("local_")) {
      try { await base44.entities.TreeCampaign.delete(c.id); } catch { /* already gone */ }
    }
    setHistory((h) => h.filter((x) => x.id !== c.id));
    setCampaign((cur) => (cur?.id === c.id ? null : cur));
  };

  const pushStep = (label) =>
    setSteps((s) => [...s.map((x) => ({ ...x, done: true })), { label, done: false }]);
  const finishSteps = () => setSteps((s) => s.map((x) => ({ ...x, done: true })));

  // Core campaign runner. Accepts an optional precomputed brand context so the
  // one-click token launcher can skip URL auto-detection and feed real token lore.
  const runCampaign = async ({ product, goal, audience, tone, templates, brandName, brandContext, ogImage, verifiedData }) => {
    setRunning(true);
    setCampaign(null);
    setLocked(false);
    setSteps([]);

    const bName = brandName || product.trim();
    let ctx = brandContext || "";
    let og = ogImage || null;

    if (!brandContext && looksLikeUrl(product)) {
      pushStep("🔗 Scraping your brand site for real context…");
      try {
        const sc = await base44.functions.invoke("brandSiteScraper", { url: normalizeUrl(product) });
        const d = sc?.data || sc;
        if (d && !d.error) {
          ctx = `BRAND WEBSITE: ${d.url}\nBRAND NAME: ${d.site_name || d.title || bName}\nTAGLINE: ${d.description || ""}\nSITE CONTENT EXCERPT:\n${(d.root_text || "").slice(0, 2500)}`;
          og = d.og_image || null;
        }
      } catch { /* guests may lack scraper access — proceed */ }
    }

    let record = { id: `local_${Date.now()}`, product, status: "generating", ads: [] };
    try {
      record = await base44.entities.TreeCampaign.create({ product, goal, audience, tone, status: "generating", ads: [] });
    } catch { /* guest — in-memory */ }

    try {
      pushStep("🌳 Tree is analyzing your product & building strategy…");
      const chosen = TREE_TEMPLATES.filter((t) => templates.includes(t.id));
      let brief = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Tree, an elite ad campaign agent. Build a full ad campaign.${ctx ? `\n\nREAL BRAND CONTEXT (ground every claim ONLY in these facts; never invent features): \n${ctx}` : ""}

PRODUCT: ${product}
BRAND NAME: ${bName}
GOAL: ${goal || "brand awareness"}
AUDIENCE: ${audience || "general consumers"}
TONE: ${tone || "bold"}

TRUTH RULES — FOLLOW EXACTLY:
- Never invent or embellish facts: no fake "core asset", "flagship", "official", "leading", "native" or similar status/designations.
- Never fabricate technical claims (e.g. "L1 covenant", "built on L1", "settlement layer", protocol roles) unless it is literally stated in the brand context above.
- Never invent holder counts, market caps, volume, prices, partnerships, roadmaps, team members, or exchange listings. Only repeat numbers that appear verbatim in the context.
- If a fact is missing, OMIT it. Do not guess, infer, or "fill in" — vague-but-honest beats specific-but-false.
- The strategy and every ad must be truthful about what ${bName} actually is. Marketing hype (hooks, FOMO, tone) is fine; factual claims about the product/token must be real or absent.

For EACH of these ad templates, write a distinct ad:
${chosen.map((t) => `- ${t.id}: ${t.name} — ${t.desc}`).join("\n")}

For each ad provide:
- hook: a 1-line scroll-stopping hook that references the real product "${bName}"
- script: a 15-30 second spoken video ad script describing what "${bName}" actually does
- caption: a social media caption with 2-3 hashtags including #${bName.replace(/[^a-z0-9]/gi, "")}
- cta: a short call to action
- narration_text: a tight 2-sentence voiceover (max 240 chars)
- visual_prompt: a detailed image prompt. CRITICAL: the image MUST depict the actual product/brand "${bName}"${ctx ? " based on the scraped context" : ""}. No generic stock imagery. Style: "${chosen.map((t) => t.styleHint).join('" / "')}".

Also provide a 2-3 sentence overall campaign strategy.`,
        response_json_schema: {
          type: "object",
          properties: {
            strategy: { type: "string" },
            ads: { type: "array", items: { type: "object", properties: {
              template: { type: "string" }, hook: { type: "string" }, script: { type: "string" },
              caption: { type: "string" }, cta: { type: "string" }, narration_text: { type: "string" },
              visual_prompt: { type: "string" },
            } } },
          },
        },
      });

      // Fact-check: force every data detail in the copy to match the live token stats.
      if (verifiedData) {
        pushStep("✅ Fact-checking data details against live KCC20 stats…");
        brief = { ...brief, ads: await factCheckAds(brief.ads, verifiedData) };
      }

      const ads = [];
      for (const ad of brief.ads) {
        const tpl = TREE_TEMPLATES.find((t) => t.id === ad.template);
        pushStep(`🎨 Styling ${tpl?.name || ad.template} visual for ${bName}…`);
        const anchor = `This is an advertisement for the real brand "${bName}". The visual must be directly about ${bName} and its actual product — no generic stock imagery, no unrelated objects or people. ${tpl?.styleHint || ""}. No text in image.`;
        const [img, voice] = await Promise.all([
          base44.integrations.Core.GenerateImage({
            prompt: `Advertisement visual: ${ad.visual_prompt}. ${anchor}`,
            existing_image_urls: og ? [og] : undefined,
          }).catch(() => null),
          base44.integrations.Core.GenerateSpeech({ text: ad.narration_text || ad.hook, voice: "spark" }).catch(() => null),
        ]);
        ads.push({
          template: ad.template, hook: ad.hook, script: ad.script, caption: ad.caption,
          cta: ad.cta, image_url: img?.url || "", narration_url: voice?.url || "",
        });
      }

      pushStep("💾 Saving campaign…");
      try { await base44.entities.TreeCampaign.update(record.id, { strategy: brief.strategy, ads, status: "complete" }); } catch {}
      finishSteps();
      const done = { ...record, strategy: brief.strategy, ads, status: "complete", brandName: bName };
      setCampaign(done);
      setLocked(true);
      setHistory((h) => [done, ...h]);
    } catch (err) {
      try { await base44.entities.TreeCampaign.update(record.id, { status: "failed" }); } catch {}
      pushStep(`❌ Campaign failed: ${err.message}`);
      finishSteps();
    }
    setRunning(false);
    setMarketingTick(null);
  };

  const launch = (form) => runCampaign(form);

  // One-click: market a KCC20 token — scrape its website + live stats, then run.
  const marketToken = async (token) => {
    setMode("build");
    setMarketingTick(token.tick);
    const website = token.website;
    let brandContext = `KCC20 TOKEN: ${token.tick} (${token.name}).`;
    if (token.hasMarket) {
      brandContext += `\nLIVE STATS (only state these if you repeat numbers): price ${token.price} KAS, 24h change ${token.change24h}%, volume ${token.volume24h} KAS, TVL ${token.tvl} KAS, holders ${token.holderTotal}.`;
      if (token.covenantId) brandContext += `\nIt is tradable on KRON: https://kron.technology/token/${token.covenantId}`;
    } else {
      brandContext += `\nMarket data not yet available — do NOT claim it is trading, listed, or has any price/holders.`;
    }
    let og = token.logo || null;
    if (website) {
      setSteps([]);
      pushStep(`🔗 Scraping ${token.tick} project site…`);
      try {
        const sc = await base44.functions.invoke("brandSiteScraper", { url: website });
        const d = sc?.data || sc;
        if (d && !d.error) {
          brandContext += `\nWEBSITE: ${d.url}\nTAGLINE: ${d.description || ""}\nSITE CONTENT:\n${(d.root_text || "").slice(0, 2000)}`;
          og = d.og_image || og;
        }
      } catch { /* guest or no scraper — proceed with token stats */ }
    }
    await runCampaign({
      product: `${token.tick} — ${token.name}${website ? ` (${website})` : ""}`,
      goal: `Drive buyers and attention to ${token.tick} on KRON`,
      audience: "crypto / Kaspa degens",
      tone: "hype",
      templates: TREE_TEMPLATES.map((t) => t.id),
      brandName: token.name || token.tick,
      brandContext,
      ogImage: og,
      verifiedData: {
        tick: token.tick,
        name: token.name || token.tick,
        hasMarket: !!token.hasMarket,
        price: token.price,
        change24h: token.change24h,
        volume24h: token.volume24h,
        tvl: token.tvl,
        holderTotal: token.holderTotal,
        kronUrl: token.covenantId ? `https://kron.technology/token/${token.covenantId}` : "",
      },
    });
  };

  const ModeTab = ({ id, label, Icon }) => (
    <button
      onClick={() => setMode(id)}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-bold transition-all ${
        mode === id
          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          : "bg-white/[0.04] border border-white/10 text-white/50 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-2 text-white/40 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> TTT
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TreePine className="w-5 h-5 text-black" />
            </div>
            <span className="font-black tracking-tight">TREE</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Tree <span className="text-emerald-400">Campaign Agent</span>
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-lg mx-auto">
            One brief in — a full ad campaign out. Or one-click market any KCC20 token on KRON: Tree scrapes the
            project site, then writes strategy, scripts, captions, AI narration & on-brand visuals.
          </p>
        </div>

        {/* Mode switch */}
        <div className="flex items-center gap-2 max-w-md mx-auto mb-6">
          <ModeTab id="build" label="Build Campaign" Icon={Hammer} />
          <ModeTab id="tokens" label="Market KCC20" Icon={Coins} />
        </div>

        {mode === "tokens" ? (
          <TreeTokenBrowser onMarket={marketToken} marketingTick={marketingTick} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TreeCampaignForm onLaunch={launch} running={running} />
              <TreeAgentLog steps={steps} />
              {campaign && (
                <div className="space-y-4">
                  {campaign.strategy && (
                    <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4">
                      <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">Strategy</p>
                      <p className="text-white/80 text-sm">{campaign.strategy}</p>
                    </div>
                  )}
                  {locked ? (
                    <TreePaywall
                      serviceInput={`Tree campaign for ${campaign.brandName || "product"}`}
                      amount={UNLOCK_PRICE}
                      onUnlocked={() => setLocked(false)}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(campaign.ads || []).map((ad, i) => (
                        <TreeAdCard key={i} ad={ad} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <TreeCampaignHistory campaigns={history} onSelect={setCampaign} onDelete={deleteCampaign} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}