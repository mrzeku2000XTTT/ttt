import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, ChevronRight, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ORBTAgent from "@/components/orbt/ORBTAgent";

const AGENTS = [
  {
    id: "brand_voice",
    name: "Brand Voice",
    emoji: "🎙️",
    tagline: "Rewrite in any brand's style",
    desc: "Transform your copy into Apple, Nike, Notion, OpenAI, or any custom brand voice.",
    accent: "#a855f7",
    bg: "from-purple-950 to-black",
    category: "Writing",
    systemPrompt: "You are an elite brand voice copywriter. Rewrite the user's text to perfectly match the requested brand's tone, style, and voice. Be precise and capture the brand's essence.",
    inputLabel: "Your draft text",
    inputPlaceholder: "Paste your copy here...",
    outputLabel: "Brand rewrite",
    extraConfig: { type: "brand_voice" },
  },
  {
    id: "cold_email",
    name: "Cold Email",
    emoji: "📧",
    tagline: "Emails that actually get replies",
    desc: "Write personalized cold emails with proven hooks, value props, and CTAs that convert.",
    accent: "#3b82f6",
    bg: "from-blue-950 to-black",
    category: "Sales",
    systemPrompt: "You are a world-class cold email expert. Write concise, personalized cold emails that feel human, lead with value, avoid spam triggers, and have a clear single CTA. Max 150 words unless asked otherwise.",
    inputLabel: "Target + context",
    inputPlaceholder: "Who are you emailing? What do you offer? What's the goal?",
    outputLabel: "Cold email",
  },
  {
    id: "hook_writer",
    name: "Hook Writer",
    emoji: "🪝",
    tagline: "First lines that stop the scroll",
    desc: "Generate 10 scroll-stopping opening hooks for any piece of content.",
    accent: "#f59e0b",
    bg: "from-amber-950 to-black",
    category: "Writing",
    systemPrompt: "You are a viral content strategist. Generate 10 powerful opening hooks for the given topic. Each hook should use a different technique: question, bold claim, story, stat, controversy, how-to, list, fear, curiosity gap, or contrarian. Number them 1-10. Be punchy and specific.",
    inputLabel: "Your topic or content",
    inputPlaceholder: "What is your content/post about?",
    outputLabel: "10 hooks",
  },
  {
    id: "pitch_deck",
    name: "Pitch Deck",
    emoji: "🚀",
    tagline: "Slide-ready startup narratives",
    desc: "Turn your idea into a structured pitch deck outline with slides, copy, and talking points.",
    accent: "#ec4899",
    bg: "from-pink-950 to-black",
    category: "Business",
    systemPrompt: "You are a startup pitch expert who has helped raise $500M+. Create a compelling 10-slide pitch deck outline with: slide title, 3-bullet talking points, and key message for each slide. Structure: Problem, Solution, Market Size, Product, Business Model, Traction, Team, Competition, Financials, Ask. Be specific and investor-ready.",
    inputLabel: "Your startup idea",
    inputPlaceholder: "Describe your startup, what it does, and target market...",
    outputLabel: "Pitch deck outline",
  },
  {
    id: "seo_writer",
    name: "SEO Writer",
    emoji: "🔍",
    tagline: "Content Google loves to rank",
    desc: "Write SEO-optimized articles with proper structure, keywords, and meta descriptions.",
    accent: "#10b981",
    bg: "from-emerald-950 to-black",
    category: "Writing",
    systemPrompt: "You are an expert SEO content writer. Write a well-structured article with: compelling H1, meta description (155 chars), intro paragraph, H2 sections with keyword variations, FAQ section, and strong conclusion with CTA. Naturally weave in keywords. Focus on search intent and E-E-A-T signals.",
    inputLabel: "Topic + target keyword",
    inputPlaceholder: "Topic: AI tools for marketers | Keyword: best AI marketing tools 2024",
    outputLabel: "SEO article",
  },
  {
    id: "linkedin_ghostwriter",
    name: "LinkedIn Ghost",
    emoji: "💼",
    tagline: "Posts that build authority",
    desc: "Write viral LinkedIn posts that grow your personal brand and generate leads.",
    accent: "#0ea5e9",
    bg: "from-sky-950 to-black",
    category: "Social",
    systemPrompt: "You are a LinkedIn ghostwriter who has created viral posts for top founders. Write in a personal, conversational tone. Use short paragraphs (1-2 lines max), pattern interrupts, storytelling, and end with a question or insight that drives comments. Avoid corporate speak. Use a hook-body-CTA structure.",
    inputLabel: "Story, insight, or topic",
    inputPlaceholder: "Share a lesson, achievement, story, or opinion you want to post about...",
    outputLabel: "LinkedIn post",
  },
  {
    id: "ad_copy",
    name: "Ad Copy",
    emoji: "📢",
    tagline: "Ads that convert at scale",
    desc: "Generate high-converting ad copy for Facebook, Google, TikTok, and more.",
    accent: "#ef4444",
    bg: "from-red-950 to-black",
    category: "Marketing",
    systemPrompt: "You are a performance marketing expert with $100M+ in ad spend managed. Write ad copy variations for the given product/service. Provide: 3 Facebook/Meta ads (headline + body + CTA), 3 Google Search ads (headline 1/2/3 + description), and 2 TikTok UGC-style scripts (15 seconds). Focus on pain points, transformation, and urgency.",
    inputLabel: "Product + target audience",
    inputPlaceholder: "Product: AI writing tool | Audience: busy startup founders | Goal: free trial signup",
    outputLabel: "Ad copy variations",
  },
  {
    id: "tweet_storm",
    name: "Tweet Storm",
    emoji: "🌊",
    tagline: "Thread that builds a following",
    desc: "Turn any idea into a viral Twitter/X thread with hooks and engagement triggers.",
    accent: "#6366f1",
    bg: "from-indigo-950 to-black",
    category: "Social",
    systemPrompt: "You are a viral Twitter thread writer. Create a 10-tweet thread on the given topic. Tweet 1 must be a scroll-stopping hook. Tweets 2-9 deliver value, insights, or story beats. Tweet 10 is the takeaway + CTA to follow. Each tweet under 280 chars. Number them 1/ through 10/. Make it shareable and insightful.",
    inputLabel: "Thread topic or insight",
    inputPlaceholder: "What do you want to teach or share in this thread?",
    outputLabel: "Twitter thread",
  },
  {
    id: "product_desc",
    name: "Product Copy",
    emoji: "🛍️",
    tagline: "Descriptions that sell",
    desc: "Write compelling product descriptions that convert browsers into buyers.",
    accent: "#f97316",
    bg: "from-orange-950 to-black",
    category: "E-commerce",
    systemPrompt: "You are a top e-commerce copywriter. Write a product description that: opens with the customer's desire/problem, introduces the product as the solution, highlights 5 key features as benefits (not just specs), includes sensory language, social proof hooks, and closes with urgency. Write a short version (50 words) and long version (200 words).",
    inputLabel: "Product details",
    inputPlaceholder: "Product name, what it does, key features, target customer...",
    outputLabel: "Product descriptions",
  },
  {
    id: "resume_rewriter",
    name: "Resume AI",
    emoji: "📄",
    tagline: "Resume that gets interviews",
    desc: "Rewrite your resume bullet points to be ATS-friendly and impact-focused.",
    accent: "#14b8a6",
    bg: "from-teal-950 to-black",
    category: "Career",
    systemPrompt: "You are an elite career coach and resume writer. Rewrite the provided resume content using the STAR method (Situation, Task, Action, Result). Start every bullet with a strong action verb. Quantify achievements wherever possible. Make it ATS-optimized. Also provide: 3 power summary options, and ATS keyword suggestions for the target role.",
    inputLabel: "Resume content + target role",
    inputPlaceholder: "Paste your current bullets or experience. Add the target job role.",
    outputLabel: "Rewritten resume",
  },
  {
    id: "script_writer",
    name: "Script Writer",
    emoji: "🎬",
    tagline: "Video scripts that hold attention",
    desc: "Write YouTube, TikTok, or podcast scripts with proven retention structures.",
    accent: "#dc2626",
    bg: "from-red-950 to-black",
    category: "Video",
    systemPrompt: "You are a YouTube script writer who has scripted videos with 100M+ combined views. Write a complete video script using the AIDA framework. Include: hook (first 15 seconds), story/problem setup, main content with pattern interrupts every 60 seconds, midroll hook, and strong outro CTA. Add [B-ROLL] and [CUT] stage directions.",
    inputLabel: "Video topic + platform + length",
    inputPlaceholder: "Topic: How I made $10k freelancing | Platform: YouTube | Length: 8 minutes",
    outputLabel: "Video script",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    emoji: "📰",
    tagline: "Newsletters readers love",
    desc: "Write engaging email newsletters that grow open rates and build loyal audiences.",
    accent: "#7c3aed",
    bg: "from-violet-950 to-black",
    category: "Email",
    systemPrompt: "You are a newsletter writer for top creators. Write a newsletter issue with: subject line (A/B test two options), preview text, personal opening hook, main story or insight with a clear takeaway, actionable tip section, interesting links/recommendations, and personal sign-off. Keep it scannable with headers and short paragraphs. Aim for 600-800 words.",
    inputLabel: "Newsletter topic + niche",
    inputPlaceholder: "Topic: lessons from my startup failure | Niche: entrepreneurship | Audience: early-stage founders",
    outputLabel: "Newsletter draft",
  },
  {
    id: "landing_page",
    name: "Landing Page",
    emoji: "🖥️",
    tagline: "Pages that convert visitors",
    desc: "Write full landing page copy with hero, features, testimonials, and CTA sections.",
    accent: "#059669",
    bg: "from-emerald-950 to-black",
    category: "Marketing",
    systemPrompt: "You are a conversion copywriter. Write complete landing page copy including: hero headline + subheadline + CTA, social proof bar, problem section, solution/product intro, 4 feature blocks (with benefit-focused descriptions), testimonial templates (3), FAQ (5 questions), pricing teaser, and closing CTA. Use power words and address objections throughout.",
    inputLabel: "Product/service details",
    inputPlaceholder: "What does it do? Who is it for? What problem does it solve? Price?",
    outputLabel: "Landing page copy",
  },
  {
    id: "press_release",
    name: "Press Release",
    emoji: "📡",
    tagline: "News journalists want to cover",
    desc: "Write professional press releases that get picked up by media outlets.",
    accent: "#0284c7",
    bg: "from-blue-950 to-black",
    category: "PR",
    systemPrompt: "You are a PR expert who has gotten clients covered in TechCrunch, Forbes, and WSJ. Write a press release with: dateline, attention-grabbing headline, subheading, opening paragraph (who/what/when/where/why), 3 body paragraphs with quotes from executives, boilerplate, and media contact info. Make it newsworthy and journalist-friendly.",
    inputLabel: "Announcement details",
    inputPlaceholder: "What's the news? Company name, what happened, why it matters, key people...",
    outputLabel: "Press release",
  },
  {
    id: "caption_machine",
    name: "Caption Machine",
    emoji: "✍️",
    tagline: "Captions for every platform",
    desc: "Generate optimized captions for Instagram, TikTok, LinkedIn, and YouTube.",
    accent: "#db2777",
    bg: "from-pink-950 to-black",
    category: "Social",
    systemPrompt: "You are a social media expert. Generate captions optimized for each platform: Instagram (storytelling + hashtags), TikTok (conversational, trend-aware), LinkedIn (professional insight), YouTube (SEO-friendly description with timestamps). For each, provide a short and long version. Include relevant emojis and platform-specific hooks.",
    inputLabel: "Content description",
    inputPlaceholder: "Describe the photo/video and the message you want to convey...",
    outputLabel: "Platform captions",
  },
  {
    id: "negotiation_coach",
    name: "Negotiation Coach",
    emoji: "🤝",
    tagline: "Win every negotiation",
    desc: "Get expert negotiation scripts and tactics for salary, deals, and contracts.",
    accent: "#d97706",
    bg: "from-amber-950 to-black",
    category: "Business",
    systemPrompt: "You are a master negotiator trained in Harvard negotiation methods and FBI tactical empathy. Analyze the negotiation situation and provide: opening position script, 3 counteroffers to anticipate with responses, BATNA analysis, key leverage points, emotional anchoring techniques, and a closing script. Be strategic and ethical.",
    inputLabel: "Negotiation situation",
    inputPlaceholder: "Salary negotiation? Contract deal? What's the context, your goal, and their position?",
    outputLabel: "Negotiation strategy",
  },
  {
    id: "story_writer",
    name: "Story Writer",
    emoji: "📖",
    tagline: "Stories that move people",
    desc: "Write compelling brand stories, personal narratives, and case studies.",
    accent: "#7c3aed",
    bg: "from-purple-950 to-black",
    category: "Writing",
    systemPrompt: "You are a master storyteller. Write a compelling narrative using the hero's journey structure. Include: vivid scene-setting, relatable protagonist, clear conflict/challenge, transformation moment, resolution, and emotional resonance. Use sensory details, dialogue snippets, and specific moments. The story should make the reader feel something.",
    inputLabel: "Story details",
    inputPlaceholder: "Who is the hero? What was the challenge? What changed? What's the lesson?",
    outputLabel: "Brand story",
  },
  {
    id: "objection_handler",
    name: "Objection Handler",
    emoji: "🛡️",
    tagline: "Turn no into yes",
    desc: "Generate perfect responses to every sales objection your prospects raise.",
    accent: "#16a34a",
    bg: "from-green-950 to-black",
    category: "Sales",
    systemPrompt: "You are a world-class sales trainer. For each objection provided, give: the underlying real concern, an empathy statement, a reframe technique, a proof point to use, and a closing question. Also provide 3 alternative ways to handle it. Your responses should be natural, non-pushy, and use psychological principles of persuasion.",
    inputLabel: "Sales objections",
    inputPlaceholder: "List the objections you're getting: 'It's too expensive', 'I need to think about it'...",
    outputLabel: "Objection responses",
  },
  {
    id: "content_calendar",
    name: "Content Calendar",
    emoji: "📅",
    tagline: "30 days of content in minutes",
    desc: "Generate a full month's content calendar with topics, formats, and posting schedule.",
    accent: "#0891b2",
    bg: "from-cyan-950 to-black",
    category: "Planning",
    systemPrompt: "You are a content strategist. Create a 30-day content calendar with: date, platform, content type (video/post/story/reel), topic, hook/angle, key message, and hashtag suggestions. Mix educational, entertainment, and promotional content in an 80/20 ratio. Include trending formats and engagement strategies. Structure it as a clear table.",
    inputLabel: "Brand + niche + platforms",
    inputPlaceholder: "Brand: SaaS productivity tool | Niche: remote work | Platforms: LinkedIn, Instagram, Twitter",
    outputLabel: "Content calendar",
  },
  {
    id: "bio_writer",
    name: "Bio Writer",
    emoji: "🪪",
    tagline: "Bios that open doors",
    desc: "Write compelling professional bios for websites, Twitter, LinkedIn, and speaking events.",
    accent: "#be185d",
    bg: "from-rose-950 to-black",
    category: "Personal Brand",
    systemPrompt: "You are a personal branding expert. Write professional bios in multiple lengths: Twitter bio (160 chars), LinkedIn summary (300 words), website About section (500 words), speaker intro (100 words), and press kit bio (200 words). Each should highlight credibility, personality, and a unique positioning angle. Make them memorable and human.",
    inputLabel: "Your background",
    inputPlaceholder: "Who are you? What do you do? Key achievements? Who do you help?",
    outputLabel: "Professional bios",
  },
];

const CATEGORIES = ["All", "Writing", "Sales", "Marketing", "Social", "Business", "Video", "Email", "Career", "E-commerce", "PR", "Planning", "Personal Brand"];

export default function ORBTPage() {
  const [activeAgent, setActiveAgent] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = AGENTS.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()) || a.tagline.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    return matchSearch && matchCat;
  });

  if (activeAgent) {
    return <ORBTAgent agent={activeAgent} onBack={() => setActiveAgent(null)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#08080d", color: "#e5e5e5", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-white/5" style={{ background: "rgba(8,8,13,0.95)", backdropFilter: "blur(20px)" }}>
        <Link to={createPageUrl("AppStoreV2")} className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </Link>
        <div className="flex items-center gap-2.5">
          <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ecf033abc_generated_image.png" alt="ORBT" className="w-8 h-8 rounded-xl object-cover" />
          <div>
            <h1 className="text-[15px] font-[800] tracking-tight text-white leading-none">ORBT</h1>
            <p className="text-[10px] text-purple-400 leading-none mt-0.5">20 AI Writing Agents</p>
          </div>
        </div>
        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full pl-8 pr-4 py-2 rounded-xl text-[12px] text-white bg-white/5 border border-white/08 outline-none"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-white/30" /></button>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-4" style={{ background: "rgba(147,51,234,0.15)", border: "1px solid rgba(147,51,234,0.3)", color: "#c084fc" }}>
            <Sparkles className="w-3 h-3" />
            20 Specialized AI Agents
          </div>
          <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight text-white leading-tight">
            Your AI writing<br />
            <span style={{ background: "linear-gradient(135deg, #a855f7, #06b6d4, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              agency
            </span>
          </h2>
          <p className="text-white/35 text-sm mt-3 max-w-lg mx-auto">
            Each agent is a specialist. Pick the one you need — brand voice, cold emails, hooks, pitch decks, SEO, ads, and 14 more.
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
              style={{
                background: activeCategory === cat ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeCategory === cat ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.06)"}`,
                color: activeCategory === cat ? "#c084fc" : "rgba(255,255,255,0.4)",
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Agents Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {filtered.map((agent, i) => (
            <motion.button
              key={agent.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveAgent(agent)}
              className="text-left p-4 rounded-2xl transition-all group relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" style={{ background: `radial-gradient(circle at 30% 50%, ${agent.accent}18 0%, transparent 70%)` }} />

              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${agent.accent}18`, border: `1px solid ${agent.accent}30` }}>
                      {agent.emoji}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-[800] text-white leading-none">{agent.name}</h3>
                      <span className="text-[9px] font-semibold mt-0.5 block" style={{ color: agent.accent }}>{agent.category}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors mt-1 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <p className="text-[12px] font-[600] text-white/70 leading-snug mb-1">{agent.tagline}</p>
                <p className="text-[11px] text-white/30 leading-snug">{agent.desc}</p>

                <div className="mt-3 flex items-center gap-1.5">
                  <div className="h-0.5 flex-1 rounded-full" style={{ background: `${agent.accent}40` }} />
                  <span className="text-[9px] font-semibold" style={{ color: agent.accent }}>Launch agent →</span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/20 text-sm">No agents match your search.</div>
        )}
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none;}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}