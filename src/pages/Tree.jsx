import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TREE_TEMPLATES } from "@/components/tree/treeTemplates";
import TreeCampaignForm from "@/components/tree/TreeCampaignForm";
import TreeAgentLog from "@/components/tree/TreeAgentLog";
import TreeAdCard from "@/components/tree/TreeAdCard";
import TreeCampaignHistory from "@/components/tree/TreeCampaignHistory";
import TreePaywall from "@/components/tree/TreePaywall";
import { Link } from "react-router-dom";
import { TreePine, ArrowLeft } from "lucide-react";

const UNLOCK_PRICE = 0.5;

const looksLikeUrl = (s) => {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) return true;
  // bare domain like tttz.xyz or app.example.com/path
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t) && !/\s/.test(t);
};
const normalizeUrl = (s) => {
  let t = s.trim();
  if (!/^https?:\/\//i.test(t)) t = "https://" + t;
  return t;
};

export default function Tree() {
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [history, setHistory] = useState([]);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    base44.entities.TreeCampaign.list("-created_date", 10).then(setHistory).catch(() => {});
  }, []);

  const pushStep = (label) =>
    setSteps((s) => [...s.map((x) => ({ ...x, done: true })), { label, done: false }]);
  const finishSteps = () => setSteps((s) => s.map((x) => ({ ...x, done: true })));

  const launch = async ({ product, goal, audience, tone, templates }) => {
    setRunning(true);
    setCampaign(null);
    setLocked(false);
    setSteps([]);

    let brandName = product.trim();
    let brandContext = "";
    let ogImage = null;

    // 1. Scrape the brand site if the user typed a URL/domain
    if (looksLikeUrl(product)) {
      pushStep("🔗 Scraping your brand site for real context…");
      try {
        const sc = await base44.functions.invoke("brandSiteScraper", { url: normalizeUrl(product) });
        const d = sc?.data || sc;
        if (d && !d.error) {
          brandName = d.site_name || d.title || brandName;
          const subText = (d.sub_pages || [])
            .slice(0, 4)
            .map((p) => `- ${p.title || ""}: ${(p.text || "").slice(0, 350)}`)
            .join("\n");
          brandContext = `BRAND WEBSITE: ${d.url}
BRAND NAME: ${brandName}
TAGLINE / META DESCRIPTION: ${d.description || ""}
SITE CONTENT EXCERPT (use these real facts — do not invent features):
${(d.root_text || "").slice(0, 2500)}
${subText}`.trim();
          ogImage = d.og_image || null;
        }
      } catch {
        // Guests may not have scraper access — fall back to plain text
      }
    }

    // Entity persistence is optional — guests get an in-memory record
    let record = { id: `local_${Date.now()}`, product, goal, audience, tone, status: "generating", ads: [] };
    try {
      record = await base44.entities.TreeCampaign.create({
        product, goal, audience, tone, status: "generating", ads: [],
      });
    } catch {
      // Guest or offline — proceed with in-memory record
    }

    try {
      // 2. Strategy + all ad copy in one LLM pass — grounded in scraped brand context
      pushStep("🌳 Tree is analyzing your product & building strategy…");
      const chosen = TREE_TEMPLATES.filter((t) => templates.includes(t.id));
      const brief = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Tree, an elite ad campaign agent. Build a full ad campaign.${brandContext ? `\n\nREAL BRAND CONTEXT (scraped from the brand's own website — ground every claim in these facts; never invent product features): \n${brandContext}` : ""}

PRODUCT: ${product}
BRAND NAME: ${brandName}
GOAL: ${goal || "brand awareness"}
AUDIENCE: ${audience || "general consumers"}
TONE: ${tone || "bold"}

For EACH of these ad templates, write a distinct ad:
${chosen.map((t) => `- ${t.id}: ${t.name} — ${t.desc}`).join("\n")}

For each ad provide:
- hook: a 1-line scroll-stopping hook that references the real product "${brandName}"
- script: a 15-30 second spoken video ad script (natural, punchy) that describes what "${brandName}" actually does
- caption: a social media caption with 2-3 hashtags including #${brandName.replace(/[^a-z0-9]/gi, "")}
- cta: a short call to action
- narration_text: a tight 2-sentence voiceover version of the script (max 240 chars)
- visual_prompt: a detailed image prompt for the ad visual. CRITICAL RULE: the image MUST depict the actual product/brand "${brandName}" and its real domain/industry${brandContext ? " based on the scraped context above" : ""}. Do NOT produce generic stock imagery (random people drinking coffee, jogging, watches, etc). The scene must be clearly about what "${brandName}" is. Style: "${chosen.map((t) => t.styleHint).join('" / "}')}".

Also provide a 2-3 sentence overall campaign strategy.`,
        response_json_schema: {
          type: "object",
          properties: {
            strategy: { type: "string" },
            ads: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  template: { type: "string" },
                  hook: { type: "string" },
                  script: { type: "string" },
                  caption: { type: "string" },
                  cta: { type: "string" },
                  narration_text: { type: "string" },
                  visual_prompt: { type: "string" },
                },
              },
            },
          },
        },
      });

      // 3. Per-ad assets: brand-anchored visual + narration
      const ads = [];
      for (const ad of brief.ads) {
        const tpl = TREE_TEMPLATES.find((t) => t.id === ad.template);
        pushStep(`🎨 Styling ${tpl?.name || ad.template} visual for ${brandName}…`);
        const brandAnchor = `This is an advertisement for the real brand "${brandName}". The visual must be directly about ${brandName} and its actual product — no generic stock imagery, no unrelated objects or people. ${brandContext ? "Depict the brand's real domain/industry." : ""} ${tpl?.styleHint || ""}. No text in image.`;
        const [img, voice] = await Promise.all([
          base44.integrations.Core.GenerateImage({
            prompt: `Advertisement visual: ${ad.visual_prompt}. ${brandAnchor}`,
            existing_image_urls: ogImage ? [ogImage] : undefined,
          }).catch(() => null),
          base44.integrations.Core.GenerateSpeech({
            text: ad.narration_text || ad.hook,
            voice: "spark",
          }).catch(() => null),
        ]);
        ads.push({
          template: ad.template,
          hook: ad.hook,
          script: ad.script,
          caption: ad.caption,
          cta: ad.cta,
          image_url: img?.url || "",
          narration_url: voice?.url || "",
        });
      }

      pushStep("💾 Saving campaign…");
      try {
        await base44.entities.TreeCampaign.update(record.id, {
          strategy: brief.strategy, ads, status: "complete",
        });
      } catch {
        // Guest — skip persistence
      }
      finishSteps();
      const done = { ...record, strategy: brief.strategy, ads, status: "complete", brandName, hasUrl: looksLikeUrl(product) };
      setCampaign(done);
      setLocked(true); // gate the full result behind AWA payment
      setHistory((h) => [done, ...h]);
    } catch (err) {
      try { await base44.entities.TreeCampaign.update(record.id, { status: "failed" }); } catch {}
      pushStep(`❌ Campaign failed: ${err.message}`);
      finishSteps();
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/AppStoreV2" className="flex items-center gap-2 text-white/40 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> TTT
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
            <TreePine className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            TREE <span className="text-emerald-400">Campaign Agent</span>
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-lg mx-auto">
            One brief in — a full ad campaign out. Paste any brand or project URL and Tree scrapes the real
            content, then writes strategy, scripts, ad texts, AI narration and on-brand visuals across every
            template you pick.
          </p>
        </div>

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
      </div>
    </div>
  );
}