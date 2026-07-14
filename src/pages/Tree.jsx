import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TREE_TEMPLATES } from "@/components/tree/treeTemplates";
import TreeCampaignForm from "@/components/tree/TreeCampaignForm";
import TreeAgentLog from "@/components/tree/TreeAgentLog";
import TreeAdCard from "@/components/tree/TreeAdCard";
import TreeCampaignHistory from "@/components/tree/TreeCampaignHistory";
import { Link } from "react-router-dom";
import { TreePine, ArrowLeft } from "lucide-react";

export default function Tree() {
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    base44.entities.TreeCampaign.list("-created_date", 10).then(setHistory).catch(() => {});
  }, []);

  const pushStep = (label) =>
    setSteps((s) => [...s.map((x) => ({ ...x, done: true })), { label, done: false }]);
  const finishSteps = () => setSteps((s) => s.map((x) => ({ ...x, done: true })));

  const launch = async ({ product, goal, audience, tone, templates }) => {
    setRunning(true);
    setCampaign(null);
    setSteps([]);

    const record = await base44.entities.TreeCampaign.create({
      product, goal, audience, tone, status: "generating", ads: [],
    });

    try {
      // 1. Strategy + all ad copy in one LLM pass
      pushStep("🌳 Tree is analyzing your product & building strategy…");
      const chosen = TREE_TEMPLATES.filter((t) => templates.includes(t.id));
      const brief = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Tree, an elite ad campaign agent. Build a full ad campaign.

PRODUCT: ${product}
GOAL: ${goal || "brand awareness"}
AUDIENCE: ${audience || "general consumers"}
TONE: ${tone || "bold"}

For EACH of these ad templates, write a distinct ad:
${chosen.map((t) => `- ${t.id}: ${t.name} — ${t.desc}`).join("\n")}

For each ad provide:
- hook: a 1-line scroll-stopping hook
- script: a 15-30 second spoken video ad script (natural, punchy)
- caption: a social media caption with 2-3 hashtags
- cta: a short call to action
- narration_text: a tight 2-sentence voiceover version of the script (max 240 chars)
- visual_prompt: a detailed image prompt for the ad visual matching this style: "${chosen.map((t) => t.styleHint).join('" / "')}" — use the style hint matching the template.

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

      // 2. Per-ad assets: UGC visual + narration
      const ads = [];
      for (const ad of brief.ads) {
        const tpl = TREE_TEMPLATES.find((t) => t.id === ad.template);
        pushStep(`🎨 Styling ${tpl?.name || ad.template} visual…`);
        const [img, voice] = await Promise.all([
          base44.integrations.Core.GenerateImage({
            prompt: `Advertisement visual: ${ad.visual_prompt}. ${tpl?.styleHint || ""}. No text in image.`,
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
      await base44.entities.TreeCampaign.update(record.id, {
        strategy: brief.strategy, ads, status: "complete",
      });
      finishSteps();
      const done = { ...record, strategy: brief.strategy, ads, status: "complete" };
      setCampaign(done);
      setHistory((h) => [done, ...h]);
    } catch (err) {
      await base44.entities.TreeCampaign.update(record.id, { status: "failed" });
      pushStep(`❌ Campaign failed: ${err.message}`);
      finishSteps();
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-white/40 hover:text-white text-sm">
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
            One brief in — a full ad campaign out. Tree executes strategy, scripts, ad texts,
            AI narration and UGC-styled visuals across every template you pick.
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(campaign.ads || []).map((ad, i) => (
                    <TreeAdCard key={i} ad={ad} />
                  ))}
                </div>
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