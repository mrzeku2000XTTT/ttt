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

  const pushStep = (label) =>
    setSteps((s) => [...s.map((x) => ({ ...x, done: true })), { label, done: false }]);
  const finishSteps = () => setSteps((s) => s.map((x) => ({ ...x, done: true })));

  // Core campaign runner. Accepts an optional precomputed brand context so the
  // one-click token launcher can skip URL auto-detection and feed real token lore.
  const runCampaign = async ({ product, goal, audience, tone, templates, brandName, brandContext, ogImage }) => {
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
      const brief = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Tree, an elite ad campaign agent. Build a full ad campaign.${ctx ? `\n\nREAL BRAND CONTEXT (scraped — ground every claim in these facts; never invent features): \n${ctx}` : ""}

PRODUCT: ${product}
BRAND NAME: ${bName}
GOAL: ${goal || "brand awareness"}
AUDIENCE: ${audience || "general consumers"}
TONE: ${tone || "bold"}

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
    let brandContext = `KCC20 TOKEN: ${token.tick} (${token.name}) — launched on KRON (Kaspa L1 covenant).`;
    if (token.hasMarket) {
      brandContext += `\nLIVE STATS: price ${token.price} KAS, 24h change ${token.change24h}%, volume ${token.volume24h} KAS, TVL ${token.tvl} KAS, holders ${token.holderTotal}.`;
      if (token.covenantId) brandContext += `\nTrade it at https://kron.technology/token/${token.covenantId}`;
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
              <TreeCampaignHistory campaigns={history} onSelect={setCampaign} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}