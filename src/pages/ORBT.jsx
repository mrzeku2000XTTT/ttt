import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Search, X, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ORBTAgent from "@/components/orbt/ORBTAgent";

const AGENTS = [
  {
    id: "brand_voice",
    name: "BRAND VOICE",
    emoji: "🎙️",
    tagline: "Rewrite in any brand's style",
    desc: "Transform your copy into Apple, Nike, Notion, OpenAI, or any custom brand voice.",
    accent: "#00ff88",
    category: "Writing",
    systemPrompt: "You are an elite brand voice copywriter. Rewrite the user's text to perfectly match the requested brand's tone, style, and voice. Be precise and capture the brand's essence.",
    inputLabel: "Your draft text",
    inputPlaceholder: "Paste your copy here...",
    outputLabel: "Brand rewrite",
    extraConfig: { type: "brand_voice" },
  },
  {
    id: "cold_email",
    name: "COLD EMAIL",
    emoji: "📧",
    tagline: "Emails that actually get replies",
    desc: "Write personalized cold emails with proven hooks, value props, and CTAs that convert.",
    accent: "#00e5ff",
    category: "Sales",
    systemPrompt: "You are a world-class cold email expert. Write concise, personalized cold emails that feel human, lead with value, avoid spam triggers, and have a clear single CTA. Max 150 words unless asked otherwise.",
    inputLabel: "Target + context",
    inputPlaceholder: "Who are you emailing? What do you offer? What's the goal?",
    outputLabel: "Cold email",
  },
  {
    id: "hook_writer",
    name: "HOOK WRITER",
    emoji: "🪝",
    tagline: "First lines that stop the scroll",
    desc: "Generate 10 scroll-stopping opening hooks for any piece of content.",
    accent: "#f59e0b",
    category: "Writing",
    systemPrompt: "You are a viral content strategist. Generate 10 powerful opening hooks for the given topic. Each hook should use a different technique: question, bold claim, story, stat, controversy, how-to, list, fear, curiosity gap, or contrarian. Number them 1-10. Be punchy and specific.",
    inputLabel: "Your topic or content",
    inputPlaceholder: "What is your content/post about?",
    outputLabel: "10 hooks",
  },
  {
    id: "pitch_deck",
    name: "PITCH DECK",
    emoji: "🚀",
    tagline: "Slide-ready startup narratives",
    desc: "Turn your idea into a structured pitch deck outline with slides, copy, and talking points.",
    accent: "#ff2d78",
    category: "Business",
    systemPrompt: "You are a startup pitch expert. Create a compelling 10-slide pitch deck outline with: slide title, 3-bullet talking points, and key message for each slide. Structure: Problem, Solution, Market Size, Product, Business Model, Traction, Team, Competition, Financials, Ask.",
    inputLabel: "Your startup idea",
    inputPlaceholder: "Describe your startup, what it does, and target market...",
    outputLabel: "Pitch deck outline",
  },
  {
    id: "seo_writer",
    name: "SEO WRITER",
    emoji: "🔍",
    tagline: "Content Google loves to rank",
    desc: "Write SEO-optimized articles with proper structure, keywords, and meta descriptions.",
    accent: "#00ff88",
    category: "Writing",
    systemPrompt: "You are an expert SEO content writer. Write a well-structured article with: compelling H1, meta description (155 chars), intro paragraph, H2 sections with keyword variations, FAQ section, and strong conclusion with CTA. Naturally weave in keywords. Focus on search intent and E-E-A-T signals.",
    inputLabel: "Topic + target keyword",
    inputPlaceholder: "Topic: AI tools for marketers | Keyword: best AI marketing tools 2024",
    outputLabel: "SEO article",
  },
  {
    id: "linkedin_ghostwriter",
    name: "LINKEDIN GHOST",
    emoji: "💼",
    tagline: "Posts that build authority",
    desc: "Write viral LinkedIn posts that grow your personal brand and generate leads.",
    accent: "#00e5ff",
    category: "Social",
    systemPrompt: "You are a LinkedIn ghostwriter who has created viral posts for top founders. Write in a personal, conversational tone. Use short paragraphs, pattern interrupts, storytelling, and end with a question or insight that drives comments. Use a hook-body-CTA structure.",
    inputLabel: "Story, insight, or topic",
    inputPlaceholder: "Share a lesson, achievement, story, or opinion you want to post about...",
    outputLabel: "LinkedIn post",
  },
  {
    id: "ad_copy",
    name: "AD COPY",
    emoji: "📢",
    tagline: "Ads that convert at scale",
    desc: "Generate high-converting ad copy for Facebook, Google, TikTok, and more.",
    accent: "#ff2d78",
    category: "Marketing",
    systemPrompt: "You are a performance marketing expert. Write ad copy variations: 3 Facebook/Meta ads (headline + body + CTA), 3 Google Search ads (headline 1/2/3 + description), and 2 TikTok UGC-style scripts (15 seconds). Focus on pain points, transformation, and urgency.",
    inputLabel: "Product + target audience",
    inputPlaceholder: "Product: AI writing tool | Audience: busy startup founders | Goal: free trial signup",
    outputLabel: "Ad copy variations",
  },
  {
    id: "tweet_storm",
    name: "TWEET STORM",
    emoji: "🌊",
    tagline: "Thread that builds a following",
    desc: "Turn any idea into a viral Twitter/X thread with hooks and engagement triggers.",
    accent: "#a78bfa",
    category: "Social",
    systemPrompt: "You are a viral Twitter thread writer. Create a 10-tweet thread on the given topic. Tweet 1 must be a scroll-stopping hook. Tweets 2-9 deliver value. Tweet 10 is the takeaway + CTA. Each tweet under 280 chars. Number them 1/ through 10/.",
    inputLabel: "Thread topic or insight",
    inputPlaceholder: "What do you want to teach or share in this thread?",
    outputLabel: "Twitter thread",
  },
  {
    id: "product_desc",
    name: "PRODUCT COPY",
    emoji: "🛍️",
    tagline: "Descriptions that sell",
    desc: "Write compelling product descriptions that convert browsers into buyers.",
    accent: "#f59e0b",
    category: "E-commerce",
    systemPrompt: "You are a top e-commerce copywriter. Write a product description that opens with the customer's desire, highlights 5 key features as benefits, includes sensory language, social proof hooks, and closes with urgency. Write a short version (50 words) and long version (200 words).",
    inputLabel: "Product details",
    inputPlaceholder: "Product name, what it does, key features, target customer...",
    outputLabel: "Product descriptions",
  },
  {
    id: "resume_rewriter",
    name: "RESUME AI",
    emoji: "📄",
    tagline: "Resume that gets interviews",
    desc: "Rewrite your resume bullet points to be ATS-friendly and impact-focused.",
    accent: "#00ff88",
    category: "Career",
    systemPrompt: "You are an elite career coach and resume writer. Rewrite the provided resume content using the STAR method. Start every bullet with a strong action verb. Quantify achievements wherever possible. Make it ATS-optimized. Provide: 3 power summary options and ATS keyword suggestions.",
    inputLabel: "Resume content + target role",
    inputPlaceholder: "Paste your current bullets or experience. Add the target job role.",
    outputLabel: "Rewritten resume",
  },
  {
    id: "script_writer",
    name: "SCRIPT WRITER",
    emoji: "🎬",
    tagline: "Video scripts that hold attention",
    desc: "Write YouTube, TikTok, or podcast scripts with proven retention structures.",
    accent: "#ff2d78",
    category: "Video",
    systemPrompt: "You are a YouTube script writer. Write a complete video script using the AIDA framework. Include: hook (first 15 seconds), story/problem setup, main content with pattern interrupts every 60 seconds, midroll hook, and strong outro CTA. Add [B-ROLL] and [CUT] stage directions.",
    inputLabel: "Video topic + platform + length",
    inputPlaceholder: "Topic: How I made $10k freelancing | Platform: YouTube | Length: 8 minutes",
    outputLabel: "Video script",
  },
  {
    id: "newsletter",
    name: "NEWSLETTER",
    emoji: "📰",
    tagline: "Newsletters readers love",
    desc: "Write engaging email newsletters that grow open rates and build loyal audiences.",
    accent: "#00e5ff",
    category: "Email",
    systemPrompt: "You are a newsletter writer. Write a newsletter issue with: subject line (A/B test two options), preview text, personal opening hook, main story with a clear takeaway, actionable tip section, interesting links, and personal sign-off. Keep it scannable. Aim for 600-800 words.",
    inputLabel: "Newsletter topic + niche",
    inputPlaceholder: "Topic: lessons from my startup failure | Niche: entrepreneurship | Audience: early-stage founders",
    outputLabel: "Newsletter draft",
  },
  {
    id: "landing_page",
    name: "LANDING PAGE",
    emoji: "🖥️",
    tagline: "Pages that convert visitors",
    desc: "Write full landing page copy with hero, features, testimonials, and CTA sections.",
    accent: "#00ff88",
    category: "Marketing",
    systemPrompt: "You are a conversion copywriter. Write complete landing page copy including: hero headline + subheadline + CTA, social proof bar, problem section, solution intro, 4 feature blocks, testimonial templates (3), FAQ (5 questions), pricing teaser, and closing CTA.",
    inputLabel: "Product/service details",
    inputPlaceholder: "What does it do? Who is it for? What problem does it solve? Price?",
    outputLabel: "Landing page copy",
  },
  {
    id: "press_release",
    name: "PRESS RELEASE",
    emoji: "📡",
    tagline: "News journalists want to cover",
    desc: "Write professional press releases that get picked up by media outlets.",
    accent: "#a78bfa",
    category: "PR",
    systemPrompt: "You are a PR expert. Write a press release with: dateline, attention-grabbing headline, subheading, opening paragraph (who/what/when/where/why), 3 body paragraphs with executive quotes, boilerplate, and media contact info. Make it newsworthy and journalist-friendly.",
    inputLabel: "Announcement details",
    inputPlaceholder: "What's the news? Company name, what happened, why it matters, key people...",
    outputLabel: "Press release",
  },
  {
    id: "caption_machine",
    name: "CAPTION MACHINE",
    emoji: "✍️",
    tagline: "Captions for every platform",
    desc: "Generate optimized captions for Instagram, TikTok, LinkedIn, and YouTube.",
    accent: "#f59e0b",
    category: "Social",
    systemPrompt: "You are a social media expert. Generate captions optimized for each platform: Instagram (storytelling + hashtags), TikTok (conversational, trend-aware), LinkedIn (professional insight), YouTube (SEO-friendly description). For each, provide short and long version. Include relevant emojis.",
    inputLabel: "Content description",
    inputPlaceholder: "Describe the photo/video and the message you want to convey...",
    outputLabel: "Platform captions",
  },
  {
    id: "negotiation_coach",
    name: "NEGOTIATION COACH",
    emoji: "🤝",
    tagline: "Win every negotiation",
    desc: "Get expert negotiation scripts and tactics for salary, deals, and contracts.",
    accent: "#f59e0b",
    category: "Business",
    systemPrompt: "You are a master negotiator trained in Harvard negotiation methods. Analyze the situation and provide: opening position script, 3 counteroffers to anticipate with responses, BATNA analysis, key leverage points, emotional anchoring techniques, and a closing script.",
    inputLabel: "Negotiation situation",
    inputPlaceholder: "Salary negotiation? Contract deal? What's the context, your goal, and their position?",
    outputLabel: "Negotiation strategy",
  },
  {
    id: "story_writer",
    name: "STORY WRITER",
    emoji: "📖",
    tagline: "Stories that move people",
    desc: "Write compelling brand stories, personal narratives, and case studies.",
    accent: "#a78bfa",
    category: "Writing",
    systemPrompt: "You are a master storyteller. Write a compelling narrative using the hero's journey structure. Include: vivid scene-setting, relatable protagonist, clear conflict, transformation moment, resolution, and emotional resonance. Use sensory details, dialogue snippets, and specific moments.",
    inputLabel: "Story details",
    inputPlaceholder: "Who is the hero? What was the challenge? What changed? What's the lesson?",
    outputLabel: "Brand story",
  },
  {
    id: "objection_handler",
    name: "OBJECTION HANDLER",
    emoji: "🛡️",
    tagline: "Turn no into yes",
    desc: "Generate perfect responses to every sales objection your prospects raise.",
    accent: "#00ff88",
    category: "Sales",
    systemPrompt: "You are a world-class sales trainer. For each objection, give: the underlying real concern, an empathy statement, a reframe technique, a proof point to use, and a closing question. Also provide 3 alternative ways to handle it. Be natural, non-pushy, and use psychological principles.",
    inputLabel: "Sales objections",
    inputPlaceholder: "List the objections you're getting: 'It's too expensive', 'I need to think about it'...",
    outputLabel: "Objection responses",
  },
  {
    id: "content_calendar",
    name: "CONTENT CALENDAR",
    emoji: "📅",
    tagline: "30 days of content in minutes",
    desc: "Generate a full month's content calendar with topics, formats, and posting schedule.",
    accent: "#00e5ff",
    category: "Planning",
    systemPrompt: "You are a content strategist. Create a 30-day content calendar with: date, platform, content type, topic, hook/angle, key message, and hashtag suggestions. Mix educational, entertainment, and promotional content in an 80/20 ratio. Structure it as a clear table.",
    inputLabel: "Brand + niche + platforms",
    inputPlaceholder: "Brand: SaaS productivity tool | Niche: remote work | Platforms: LinkedIn, Instagram, Twitter",
    outputLabel: "Content calendar",
  },
  {
    id: "bio_writer",
    name: "BIO WRITER",
    emoji: "🪪",
    tagline: "Bios that open doors",
    desc: "Write compelling professional bios for websites, Twitter, LinkedIn, and speaking events.",
    accent: "#ff2d78",
    category: "Personal Brand",
    systemPrompt: "You are a personal branding expert. Write professional bios in multiple lengths: Twitter bio (160 chars), LinkedIn summary (300 words), website About section (500 words), speaker intro (100 words), and press kit bio (200 words). Make them memorable and human.",
    inputLabel: "Your background",
    inputPlaceholder: "Who are you? What do you do? Key achievements? Who do you help?",
    outputLabel: "Professional bios",
  },
];

const CATEGORIES = ["All", "Writing", "Sales", "Marketing", "Social", "Business", "Video", "Email", "Career", "E-commerce", "PR", "Planning", "Personal Brand"];

const CATEGORY_COLORS = {
  Writing: "#00ff88",
  Sales: "#00e5ff",
  Marketing: "#ff2d78",
  Social: "#a78bfa",
  Business: "#f59e0b",
  Video: "#ff2d78",
  Email: "#00e5ff",
  Career: "#00ff88",
  "E-commerce": "#f59e0b",
  PR: "#a78bfa",
  Planning: "#00e5ff",
  "Personal Brand": "#ff2d78",
};

export default function ORBTPage() {
  const [activeAgent, setActiveAgent] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const topRef = useRef(null);

  const filtered = AGENTS.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()) || a.tagline.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    return matchSearch && matchCat;
  });

  const handleBack = () => {
    setActiveAgent(null);
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  if (activeAgent) {
    return <ORBTAgent agent={activeAgent} onBack={handleBack} />;
  }

  return (
    <div ref={topRef} style={{ background: "#050a0a", color: "#e5e5e5", fontFamily: "'Courier New', Courier, monospace", minHeight: "100vh", backgroundImage: "radial-gradient(circle, rgba(0,255,136,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(5,10,10,0.97)", borderBottom: "1px solid rgba(0,255,136,0.25)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
          <Link to={createPageUrl("AppStoreV2")} className="flex items-center justify-center w-8 h-8 transition-all" style={{ border: "1px solid rgba(0,255,136,0.3)", color: "rgba(0,255,136,0.6)" }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Logo box */}
          <div className="flex items-center gap-2 px-3 py-2" style={{ border: "1px solid #00ff88", background: "rgba(0,255,136,0.05)" }}>
            <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ecf033abc_generated_image.png" alt="ORBT" className="w-6 h-6 object-cover" />
            <div>
              <div className="text-[14px] font-black tracking-widest" style={{ color: "#00ff88" }}>ORBT</div>
              <div className="text-[8px] tracking-widest" style={{ color: "rgba(0,255,136,0.5)" }}>20 AI WRITING AGENTS</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(0,229,255,0.5)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="search_agents..."
              className="w-full pl-8 pr-8 py-2.5 text-[12px] outline-none"
              style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.25)", color: "#00e5ff", fontFamily: "'Courier New', Courier, monospace", letterSpacing: "0.05em" }}
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3" style={{ color: "rgba(0,229,255,0.4)" }} /></button>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          {/* Terminal badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-[11px] tracking-widest" style={{ border: "1px solid #00ff88", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}>
            <span style={{ color: "#00ff88" }}>[_]</span>
            <span>20 Specialized AI Agents</span>
          </div>

          <h1 className="font-black uppercase leading-none mb-2" style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", letterSpacing: "0.05em", color: "#ffffff" }}>
            YOUR AI WRITING
          </h1>
          <h1 className="font-black uppercase leading-none mb-6" style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", letterSpacing: "0.05em", background: "linear-gradient(90deg, #00ff88, #00e5ff, #a78bfa, #ff2d78)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AGENCY
          </h1>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>
            Each agent is a specialist. Pick the one you need — brand voice, cold emails, hooks, pitch decks, SEO, and 14 more.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            const color = cat === "All" ? "#00ff88" : (CATEGORY_COLORS[cat] || "#00ff88");
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all"
                style={{
                  background: active ? `${color}18` : "transparent",
                  border: `1px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
                  color: active ? color : "rgba(255,255,255,0.35)",
                  fontFamily: "'Courier New', Courier, monospace",
                }}>
                {cat === "All" ? "ALL checked_out" : cat}
              </button>
            );
          })}
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((agent, i) => {
            const catColor = CATEGORY_COLORS[agent.category] || "#00ff88";
            return (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                whileHover={{ borderColor: agent.accent, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveAgent(agent)}
                className="text-left p-4 transition-all group"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  border: `1px solid ${agent.accent}55`,
                  fontFamily: "'Courier New', Courier, monospace",
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 flex items-center justify-center text-xl flex-shrink-0" style={{ border: `1px solid ${agent.accent}40`, background: `${agent.accent}0d` }}>
                    {agent.emoji}
                  </div>
                  <div>
                    <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: "#ffffff" }}>{agent.name}</div>
                    <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: catColor }}>{agent.category}</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mb-3" style={{ height: "1px", background: `${agent.accent}25` }} />

                <p className="text-[12px] font-bold mb-1.5 leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{agent.tagline}</p>
                <p className="text-[11px] leading-snug mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>{agent.desc}</p>

                {/* Launch */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider" style={{ color: agent.accent }}>
                  <span>Launch agent →</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-[12px] tracking-widest" style={{ color: "rgba(0,255,136,0.3)", fontFamily: "'Courier New', Courier, monospace" }}>
            // NO AGENTS MATCH QUERY
          </div>
        )}

        {/* Video Studio Feature Card */}
        <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(0,255,136,0.15)" }}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] tracking-widest mb-3" style={{ border: "1px solid rgba(255,45,120,0.4)", color: "rgba(255,45,120,0.7)", background: "rgba(255,45,120,0.05)" }}>
              [STUDIO] FEATURED TOOL
            </div>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', Courier, monospace" }}>Generate videos with AI + auto-edit + music</p>
          </div>
          <Link to="/VideoStudio">
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 cursor-pointer transition-all"
              style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(255,45,120,0.1))", border: "1px solid rgba(168,85,247,0.4)" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 text-2xl" style={{ border: "1px solid rgba(168,85,247,0.5)", background: "rgba(168,85,247,0.1)" }}>
                  🎬
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-black tracking-widest uppercase mb-1" style={{ color: "#fff" }}>VIDEO STUDIO</div>
                  <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: "#a78bfa" }}>Video</div>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Describe your idea → AI generates video → Auto-edit with agent → Add AI music</p>
                </div>
                <div className="text-[11px] font-bold tracking-wider flex-shrink-0" style={{ color: "#a78bfa" }}>
                  Launch →
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none;}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}