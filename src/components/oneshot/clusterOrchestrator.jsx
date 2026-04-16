import { base44 } from "@/api/base44Client";

// ────────────────────────────────────────────────────────────────────────────
// Prompts
// ────────────────────────────────────────────────────────────────────────────

function designerPrompt({ url, title, description, html, css_sample, colors, fonts, screenshot_url }) {
  return `You are a senior product designer analyzing a live website.

URL: ${url}
Title: ${title}
Description: ${description}

Raw colors extracted: ${colors}
Raw fonts extracted: ${fonts}

HTML (body DOM, cleaned):
${html?.slice(0, 12000)}

CSS sample:
${css_sample?.slice(0, 3000)}

${screenshot_url ? `A screenshot reference is attached.` : ""}

Produce a compact DESIGN SPEC JSON with the site's essence. Be specific and accurate — this spec drives a pixel-perfect clone.
Focus on extracting what actually makes the site look like itself (spacing, color mood, typography hierarchy, layout rhythm).`;
}

const DESIGN_SPEC_SCHEMA = {
  type: "object",
  properties: {
    brand_mood: { type: "string", description: "One-line aesthetic, e.g. 'minimal high-contrast SaaS, dense type, electric accent'" },
    palette: {
      type: "object",
      properties: {
        bg: { type: "string" },
        surface: { type: "string" },
        text_primary: { type: "string" },
        text_muted: { type: "string" },
        accent: { type: "string" },
        accent_2: { type: "string" },
        border: { type: "string" },
      }
    },
    typography: {
      type: "object",
      properties: {
        heading_font: { type: "string" },
        body_font: { type: "string" },
        heading_weight: { type: "string" },
        heading_tracking: { type: "string", description: "e.g. 'tight', 'normal'" },
        scale: { type: "string", description: "'oversized display', 'medium', 'compact'" }
      }
    },
    layout: {
      type: "object",
      properties: {
        max_width: { type: "string", description: "'narrow (1024)' | 'medium (1200)' | 'wide (1400)'" },
        spacing: { type: "string", description: "'tight' | 'balanced' | 'airy'" },
        corners: { type: "string", description: "'sharp' | 'subtle' | 'rounded' | 'pill'" },
        style: { type: "string", description: "'flat' | 'glass' | 'gradient-heavy' | 'outline-led' | 'shadow-led'" }
      }
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "hero, features, pricing, logos, testimonials, cta, footer..." },
          headline: { type: "string" },
          subheadline: { type: "string" },
          cta_text: { type: "string" },
          items: { type: "array", items: { type: "string" }, description: "feature/card texts if relevant" },
          notes: { type: "string", description: "layout specifics: 'centered 3-col grid, large icons above copy'" }
        },
        required: ["name"]
      }
    }
  },
  required: ["brand_mood", "palette", "typography", "layout", "sections"]
};

function coderPrompt({ url, title, html, designSpec, screenshot_url, navLinks }) {
  const navHint = navLinks?.length
    ? `\nAVAILABLE ROUTES (use EXACT hrefs so in-preview navigation works):\n${navLinks.map(l => `- ${l.label} → ${l.href}`).join("\n")}`
    : "";

  return `You are an elite frontend engineer. Build a pixel-perfect React + Tailwind clone using the DESIGN SPEC below.

URL: ${url}
Title: ${title}

╔══ DESIGN SPEC (your source of truth) ══╗
${JSON.stringify(designSpec, null, 2)}
╚════════════════════════════════════════╝
${navHint}

Original HTML (for exact copy/text):
${html?.slice(0, 10000)}

${screenshot_url ? "Screenshot reference is attached — match it visually." : ""}

STRICT RULES:
1. Output ONLY JSX — one function component named ClonedUI. No imports. No markdown fences. No commentary.
2. Use ONLY Tailwind utility classes. Use arbitrary values for exact colors: bg-[#xxxxxx], text-[#xxxxxx].
3. Apply the palette & typography from the spec consistently. Respect spacing, corners, and style choices.
4. Render EVERY section in the spec's \`sections\` array, in order, with the exact headlines/copy from the spec or HTML.
5. Use lucide-react icons (globally available, PascalCase names). Pick icons that match each feature.
6. For nav links & buttons pointing to other site pages, use the EXACT hrefs from AVAILABLE ROUTES.
7. Must be fully responsive. Use flex/grid thoughtfully. Avoid cramped layouts.
8. Component signature: function ClonedUI() { return ( ... ); }

Produce the component now.`;
}

function reviewerPrompt({ code, designSpec }) {
  return `You are a senior UI reviewer. Below is a React+Tailwind component meant to clone a website, and the DESIGN SPEC it should follow.

Your job: POLISH the code for visual quality. Fix:
- Missing visual polish (shadows, borders, gradients where the spec's style calls for them)
- Typography mismatches (wrong weight, size hierarchy, tracking)
- Palette drift (hard-coded colors that don't match the spec)
- Spacing issues (cramped or inconsistent gaps)
- Responsiveness gaps
- Any syntax issues that would break rendering

DESIGN SPEC:
${JSON.stringify(designSpec, null, 2)}

CURRENT CODE:
${code}

Output ONLY the improved JSX — same signature: function ClonedUI() { ... }. No imports, no markdown, no commentary.`;
}

// ────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ────────────────────────────────────────────────────────────────────────────

export async function runCluster({ url, onUpdate, onActivity, onAgentStatus }) {
  let finalUrl = url.trim();
  if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;

  const pushActivity = (agent, text) => onActivity(agent, text);
  const setAgent = (agent, status, message = "") => onAgentStatus(agent, status, message);

  // ─── 1. SCRAPER ────────────────────────────────────────────
  setAgent("scraper", "working", "Fetching HTML…");
  pushActivity("scraper", `GET ${finalUrl}`);
  const scrape = await base44.functions.invoke("uiClonerScrape", { url: finalUrl });
  if (scrape.data?.error) throw new Error(scrape.data.error);
  const d = scrape.data;
  pushActivity("scraper", `Got ${d.html?.length || 0} chars HTML, ${d.design_tokens?.stylesheets_found || 0} stylesheets`);
  pushActivity("scraper", `Found ${d.nav_links?.length || 0} internal routes`);
  if (d.screenshot_url) pushActivity("scraper", "Screenshot captured ✓");
  setAgent("scraper", "done", `${d.nav_links?.length || 0} routes discovered`);

  const subPages = (d.nav_links || []).slice(0, 3);

  // ─── 2. DESIGNER ────────────────────────────────────────────
  setAgent("designer", "working", "Extracting design system…");
  pushActivity("designer", "Analyzing palette & typography…");
  const designSpec = await base44.integrations.Core.InvokeLLM({
    model: "claude_sonnet_4_6",
    prompt: designerPrompt({
      url: finalUrl,
      title: d.title,
      description: d.description,
      html: d.html,
      css_sample: d.css_sample,
      colors: d.design_tokens?.colors?.hex?.join(", ") || "",
      fonts: d.design_tokens?.fonts?.join(", ") || "",
      screenshot_url: d.screenshot_url,
    }),
    file_urls: d.screenshot_url ? [d.screenshot_url] : undefined,
    response_json_schema: DESIGN_SPEC_SCHEMA,
  });
  pushActivity("designer", `Brand mood: ${designSpec.brand_mood}`);
  pushActivity("designer", `Palette: bg=${designSpec.palette?.bg} accent=${designSpec.palette?.accent}`);
  pushActivity("designer", `${designSpec.sections?.length || 0} sections mapped`);
  setAgent("designer", "done", `${designSpec.sections?.length || 0} sections · ${designSpec.layout?.style || "custom"} style`);

  // ─── 3. CODER (home) ───────────────────────────────────────
  setAgent("coder", "working", "Writing home page…");
  pushActivity("coder", "Composing JSX from spec…");
  let homeCode = await base44.integrations.Core.InvokeLLM({
    model: "claude_sonnet_4_6",
    prompt: coderPrompt({
      url: finalUrl,
      title: d.title,
      html: d.html,
      designSpec,
      screenshot_url: d.screenshot_url,
      navLinks: subPages,
    }),
    file_urls: d.screenshot_url ? [d.screenshot_url] : undefined,
  });
  pushActivity("coder", `Home page draft: ${homeCode.length} chars`);
  setAgent("coder", "working", "Draft complete, handing to reviewer…");

  // ─── 4. REVIEWER ────────────────────────────────────────────
  setAgent("reviewer", "working", "Polishing visual fidelity…");
  pushActivity("reviewer", "Checking palette consistency…");
  pushActivity("reviewer", "Tightening typography & spacing…");
  const polished = await base44.integrations.Core.InvokeLLM({
    model: "claude_sonnet_4_6",
    prompt: reviewerPrompt({ code: homeCode, designSpec }),
  });
  homeCode = polished || homeCode;
  pushActivity("reviewer", `Polish pass applied (${homeCode.length} chars)`);
  setAgent("reviewer", "done", "Visual polish applied");
  setAgent("coder", "done", "Home page ready");

  const pages = [{ path: "/", label: "Home", url: finalUrl, code: homeCode, screenshot_url: d.screenshot_url }];
  onUpdate({ pages: [...pages] });

  // ─── 5. PAGES (sub-pages in parallel) ──────────────────────
  if (subPages.length > 0) {
    setAgent("pages", "working", `Cloning ${subPages.length} sub-pages in parallel…`);
    subPages.forEach(l => pushActivity("pages", `Dispatch → ${l.label} (${l.href})`));

    const results = await Promise.allSettled(
      subPages.map(async (link) => {
        const sub = await base44.functions.invoke("uiClonerScrape", { url: link.href });
        if (sub.data?.error) throw new Error(sub.data.error);
        const sd = sub.data;
        pushActivity("pages", `✓ Scraped ${link.label}`);
        const code = await base44.integrations.Core.InvokeLLM({
          model: "claude_sonnet_4_6",
          prompt: coderPrompt({
            url: sd.url,
            title: sd.title,
            html: sd.html,
            designSpec, // reuse parent design system for consistency
            screenshot_url: sd.screenshot_url,
            navLinks: subPages,
          }),
          file_urls: sd.screenshot_url ? [sd.screenshot_url] : undefined,
        });
        pushActivity("pages", `✓ Coded ${link.label} (${code.length} chars)`);
        return {
          path: new URL(sd.url).pathname,
          label: link.label,
          url: sd.url,
          code,
          screenshot_url: sd.screenshot_url,
        };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        pages.push(r.value);
        onUpdate({ pages: [...pages] });
      } else {
        pushActivity("pages", `✗ Failed: ${r.reason?.message || "unknown"}`);
      }
    }
    setAgent("pages", "done", `${pages.length - 1} sub-pages built`);
  } else {
    setAgent("pages", "done", "No sub-pages to clone");
  }

  return { pages, url: finalUrl, screenshot_url: d.screenshot_url };
}