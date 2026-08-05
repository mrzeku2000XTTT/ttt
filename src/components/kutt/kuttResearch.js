import { base44 } from "@/api/base44Client";

/**
 * KUTT Researcher — grounds the script in the ACTUAL website.
 * Scrapes the real HTML (root + subpages), then runs a live web pass,
 * then a fact-check pass that separates VERIFIED claims from unverified ones.
 * Only verified claims are allowed into the script.
 */

const FACTS_SCHEMA = {
  type: "object",
  properties: {
    what_it_is: { type: "string", description: "one plain sentence, only from the scraped copy" },
    who_its_for: { type: "string" },
    verified_facts: {
      type: "array",
      description: "Claims that appear in the scraped site text or were confirmed by the live web pass",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          evidence: { type: "string", description: "the exact phrase from the site/web that supports it" },
          source: { type: "string", enum: ["site", "web"] },
        },
        required: ["claim", "evidence", "source"],
      },
    },
    unverified: {
      type: "array",
      description: "Things that would be assumptions — these must NEVER be stated as fact",
      items: { type: "string" },
    },
    real_features: { type: "array", items: { type: "string" }, description: "actual product surfaces/pages/features named on the site" },
    visual_identity: { type: "string", description: "real colours, type feel, imagery style observed on the site" },
    best_angle: { type: "string", description: "the most gripping TRUE angle" },
    hooks: { type: "array", items: { type: "string" }, description: "3 hook lines that only use verified facts" },
  },
  required: ["what_it_is", "verified_facts", "unverified", "best_angle", "hooks"],
};

export async function scrapeSite(url) {
  try {
    const res = await base44.functions.invoke("brandSiteScraper", { url });
    const d = res?.data || res;
    if (!d || d.error) return null;
    return {
      url: d.url,
      title: d.title,
      name: d.site_name || d.title,
      description: d.description,
      og_image: d.og_image,
      root_text: (d.root_text || "").slice(0, 6000),
      pages: (d.sub_pages || []).map((p) => ({
        url: p.url,
        label: p.label || p.title,
        text: (p.text || "").slice(0, 1500),
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Returns { scraped, facts, groundingBlock } — groundingBlock is the
 * anti-hallucination context block handed to the scriptwriter.
 */
export async function researchGrounded({ url, topic, onStep }) {
  let scraped = null;

  if (url) {
    onStep?.({ label: `🌐 Researcher scraping ${url.replace(/^https?:\/\//, "").slice(0, 40)}…`, status: "running", agent: "researcher" });
    scraped = await scrapeSite(url);
    onStep?.({
      label: scraped
        ? `🌐 Scraped ${scraped.pages.length + 1} page${scraped.pages.length ? "s" : ""} of real copy`
        : "🌐 Site wouldn't load — falling back to live web",
      status: scraped ? "done" : "error",
      agent: "researcher",
    });
  }

  onStep?.({ label: "🔎 Researcher cross-checking live web…", status: "running", agent: "researcher" });
  let webPass = "";
  try {
    const r = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      prompt: `Search the live web for ${url || `"${topic}"`}. Report ONLY what you can actually confirm from sources: what it is, who runs it, what it does, any real numbers or dates, and its visual/brand style. If something can't be confirmed, say "unconfirmed" — never guess or fill gaps.`,
    });
    webPass = (typeof r === "string" ? r : JSON.stringify(r)).slice(0, 2500);
  } catch {}
  onStep?.({ label: "🔎 Researcher cross-checking live web…", status: "done", agent: "researcher" });

  onStep?.({ label: "🛡️ Fact-checker separating fact from assumption…", status: "running", agent: "researcher" });
  const facts = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a strict fact-checker. You must NOT invent anything.

SCRAPED SITE COPY (this is the ground truth — real HTML text from the site):
${scraped ? `URL: ${scraped.url}
TITLE: ${scraped.title}
META: ${scraped.description}
HOME COPY: ${scraped.root_text}
PAGES:
${scraped.pages.map((p) => `- ${p.label} (${p.url}): ${p.text}`).join("\n")}` : "(no site scraped)"}

LIVE WEB CROSS-CHECK:
${webPass || "(none)"}

TOPIC: ${topic}

Rules:
- A claim is VERIFIED only if you can quote the supporting phrase from the scraped copy or the web cross-check. Put that quote in "evidence".
- Anything you'd have to assume, infer, or embellish goes in "unverified" — never in verified_facts.
- Use the product's real name and real page/feature names exactly as they appear.
- visual_identity must describe colours/typography/imagery actually observable in the copy or web data, not a guess.`,
    response_json_schema: FACTS_SCHEMA,
  });
  onStep?.({
    label: `🛡️ ${(facts.verified_facts || []).length} facts verified, ${(facts.unverified || []).length} flagged as assumption`,
    status: "done",
    agent: "researcher",
  });

  const groundingBlock = `GROUND TRUTH — VERIFIED ONLY (you may state these as fact):
${(facts.verified_facts || []).map((f) => `• ${f.claim}  [${f.source}: "${(f.evidence || "").slice(0, 120)}"]`).join("\n") || "• (none verified)"}

WHAT IT IS: ${facts.what_it_is}
WHO IT'S FOR: ${facts.who_its_for || "unconfirmed"}
REAL FEATURES/PAGES: ${(facts.real_features || []).join(", ") || "unconfirmed"}
REAL VISUAL IDENTITY: ${facts.visual_identity || "unconfirmed"}
BEST TRUE ANGLE: ${facts.best_angle}

🚫 FORBIDDEN — these are UNVERIFIED assumptions. Never state, imply, or write copy around them:
${(facts.unverified || []).map((u) => `• ${u}`).join("\n") || "• (none)"}

HARD RULES FOR EVERY LINE OF SCRIPT AND CAPTION:
1. Every factual statement must trace to a VERIFIED fact above.
2. No invented statistics, prices, user counts, funding, awards, dates or partnerships.
3. Where the truth is thin, be emotive and visual instead of factual — never fabricate.
4. Use the exact real product name and real feature names.`;

  return { scraped, facts, groundingBlock };
}