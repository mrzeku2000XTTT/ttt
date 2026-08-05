import { base44 } from "@/api/base44Client";

/**
 * The apps TTT A.I can actually call. Each tool maps to a real backend
 * function or integration in this app — nothing simulated.
 * `app` is the label shown to the user while the step runs.
 */
export const TOOLS = {
  brand_capture: {
    app: "MetaMimic · brand capture",
    desc: "Scrape a website for its real name, tagline, description, OG image and inner pages. args: { url }",
    run: async (args, ctx) => {
      const res = await base44.functions.invoke("brandSiteScraper", { url: args.url });
      const d = res?.data || res;
      if (!d || d.error) throw new Error(d?.error || "could not read that site");
      ctx.brand = {
        url: d.url,
        name: d.site_name || d.title,
        description: d.description,
        image: d.og_image,
        copy: (d.root_text || "").slice(0, 2500),
        pages: (d.sub_pages || []).map((p) => p.title).slice(0, 5),
      };
      return `Captured ${ctx.brand.name || args.url}: ${ctx.brand.description || "no meta description"}`;
    },
  },

  deep_research: {
    app: "Ying · grounded research",
    desc: "Search the live internet for current facts, positioning, competitors or news. args: { query }",
    run: async (args, ctx) => {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Research this and return 4-6 tight factual bullet points with concrete names, numbers and dates: ${args.query}`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
      });
      const txt = typeof r === "string" ? r : JSON.stringify(r);
      ctx.research = txt.slice(0, 2000);
      return txt.slice(0, 600);
    },
  },

  kas_price: {
    app: "Kaspa Oracle · live price",
    desc: "Get the live KAS price and 24h change from our own price oracle. args: {}",
    run: async (_args, ctx) => {
      const res = await base44.functions.invoke("getKaspaPrice", {});
      const d = res?.data || res;
      ctx.price = d;
      return `KAS $${d.price} (${d.change24h > 0 ? "+" : ""}${Number(d.change24h || 0).toFixed(2)}% 24h, ${d.source})`;
    },
  },

  prompt_lab: {
    app: "Prompto · prompt lab",
    desc: "Craft the production-grade visual/motion prompt for a shot, using everything gathered so far. args: { intent }",
    run: async (args, ctx) => {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Prompto, a prompt engineer for cinematic generative video and imagery.
Brand context: ${JSON.stringify(ctx.brand || {}).slice(0, 1500)}
Research: ${ctx.research || "none"}
Live data: ${ctx.price ? JSON.stringify(ctx.price) : "none"}
Storyboard: ${ctx.beats ? JSON.stringify(ctx.beats).slice(0, 1200) : "none"}

Write ONE dense prompt (max 90 words) for: ${args.intent}. Include subject, camera move, lighting, palette (use the brand's real colours if known), texture, mood and pacing. No preamble, prompt only.`,
        model: "gemini_3_flash",
      });
      ctx.prompt = (typeof r === "string" ? r : "").trim();
      return ctx.prompt;
    },
  },

  storyboard: {
    app: "QuickStoryboard · beat sheet",
    desc: "Break the piece into ordered shot beats with on-screen copy. args: { brief }",
    run: async (args, ctx) => {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Storyboard this as 4-6 beats. Brief: ${args.brief}
Brand: ${JSON.stringify(ctx.brand || {}).slice(0, 1200)}
Research: ${ctx.research || "none"}
Each beat: shot (what the camera sees) + copy (on-screen text, max 6 words).`,
        response_json_schema: {
          type: "object",
          properties: {
            beats: {
              type: "array",
              items: {
                type: "object",
                properties: { shot: { type: "string" }, copy: { type: "string" } },
                required: ["shot"],
              },
            },
          },
          required: ["beats"],
        },
        model: "gemini_3_flash",
      });
      const d = typeof r === "string" ? JSON.parse(r) : r;
      ctx.beats = d.beats || [];
      return ctx.beats.map((b, i) => `${i + 1}. ${b.shot}${b.copy ? ` — "${b.copy}"` : ""}`).join("\n");
    },
  },

  generate_image: {
    app: "Hikaru · image render",
    desc: "Render one or more stills — key frames, background plates, poster, thumbnail. args: { prompt } or { prompts: [..] }",
    run: async (args, ctx) => {
      const prompts = (args.prompts?.length ? args.prompts : [args.prompt || ctx.prompt]).filter(Boolean).slice(0, 5);
      ctx.images = ctx.images || [];
      const urls = [];
      for (const p of prompts) {
        const r = await base44.integrations.Core.GenerateImage({ prompt: p });
        if (r?.url) { urls.push(r.url); ctx.images.push({ url: r.url, prompt: p }); }
      }
      ctx.image = ctx.images[0]?.url;
      return urls.length ? `${urls.length} still${urls.length > 1 ? "s" : ""} rendered` : "render failed";
    },
  },

  motion_launcher: {
    app: "K6ix · motion launcher",
    desc: "Hand the finished motion brief to the K6ix motion launcher so the user generates the video there, in chat. Use this for every video / launch video / promo — never render video here. args: { prompt }",
    run: async (args, ctx) => {
      const spec = ctx.spec || {};
      const plates = (ctx.images || []).map((i) => i.prompt).slice(0, 3).join(" | ");
      const cuts = spec.cuts === "zoom cuts"
        ? "\nEditing: punchy zoom cuts — hard punch-in on each beat, escalating scale, no dissolves."
        : spec.cuts ? `\nEditing: ${spec.cuts}.` : "";
      const bg = spec.background === "image" ? "\nBackground: hold the static rendered plate, camera move only." : "";
      ctx.k6ix = {
        prompt: `${args.prompt || ctx.prompt || ""}${plates ? `\nBackground plates already rendered for this piece (match their look exactly): ${plates}` : ""}${bg}${cuts}`.trim(),
        aspect_ratio: spec.aspect_ratio || "9:16",
        duration: spec.duration || 6,
        background: spec.background || "video",
        cuts: spec.cuts || "zoom cuts",
      };
      return "brief handed to K6ix — motion launcher ready in chat";
    },
  },
};

export const TOOL_MENU = Object.entries(TOOLS)
  .map(([k, t]) => `- ${k} (${t.app}): ${t.desc}`)
  .join("\n");