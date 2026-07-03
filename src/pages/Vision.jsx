import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, X, Github, ExternalLink } from "lucide-react";

const SECTIONS = [
  { id: "intro", label: "Introduction" },
  { id: "problem", label: "The Problem" },
  { id: "ai-discovery", label: "The AI Discovery" },
  { id: "birth", label: "The Birth of TTT" },
  { id: "marketing-engine", label: "AI as a Local Marketing Engine" },
  { id: "utility", label: "Marketing Through Utility" },
  { id: "local", label: "Why Local Matters" },
  { id: "vision", label: "The Vision" },
];

export default function VisionPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offsets = SECTIONS.map(s => {
        const el = document.getElementById(s.id);
        return el ? { id: s.id, top: el.getBoundingClientRect().top } : null;
      }).filter(Boolean);
      const current = offsets.find(o => o.top >= 0 && o.top < 200) || offsets[offsets.length - 1];
      if (current) setActiveSection(current.id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1f2328]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }}>
      {/* GitHub-style top header bar */}
      <header className="sticky top-0 z-40 bg-[#24292f] text-white border-b border-black/20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(v => !v)} className="lg:hidden p-1.5 hover:bg-white/10 rounded">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <Github className="w-6 h-6" />
              <span className="font-semibold text-sm hidden sm:inline">TTT</span>
              <span className="text-sm text-white/60">/ Vision</span>
            </Link>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition px-3 py-1.5 border border-white/15 rounded-md hover:border-white/30">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to TTT</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-8">
        {/* LEFT SIDEBAR — Table of Contents */}
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:sticky top-14 left-0 z-30 lg:z-auto w-72 lg:w-64 h-[calc(100vh-3.5rem)] overflow-y-auto bg-white lg:bg-transparent border-r lg:border-r-0 border-[#d0d7de] flex-shrink-0`}>
          <nav className="p-6 lg:py-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#636c76] mb-3 px-2">Contents</div>
            <ul className="space-y-0.5">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button onClick={() => scrollTo(s.id)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${activeSection === s.id ? "font-semibold text-[#0969da] bg-[#ddf4ff]" : "text-[#1f2328] hover:bg-[#f6f8fa]"}`}>
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-[#d0d7de] px-2">
              <a href="https://tttz.xyz" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-[#0969da] hover:underline">
                TTTz.xyz <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </nav>
        </aside>

        {/* Mobile overlay backdrop */}
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 top-14 z-20 bg-black/30" />}

        {/* MAIN CONTENT — GitHub docs style */}
        <main className="flex-1 min-w-0 py-10 lg:py-12 max-w-3xl">
          {/* Article header */}
          <div className="mb-8 pb-6 border-b border-[#d0d7de]">
            <div className="flex items-center gap-2 text-xs text-[#656d76] mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ddf4ff] text-[#0969da] border border-[#0969da20]">Article</span>
              <span>·</span>
              <span>July 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1f2328] leading-tight mb-3">
              How We Marketed Kaspa Locally Using AI: The Story Behind TTT
            </h1>
            <p className="text-base text-[#656d76]">
              🍻 Thank you for this — the story of how TapToTip is being built in real time alongside Kaspa.
            </p>
          </div>

          {/* ARTICLE BODY */}
          <article className="vision-docs prose prose-slate max-w-none">
            <div className="text-2xl font-bold text-[#1f2328] mb-2 tracking-tight">TAPTOTIP</div>

            <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
              Most crypto projects focus on global reach.
            </p>
            <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
              We focused on local reach.
            </p>
            <p className="text-[15px] leading-7 text-[#1f2328] mb-6">
              Instead of asking, "How do we get Kaspa in front of millions online?" we asked a different question:
            </p>
            <blockquote className="border-l-4 border-[#d0d7de] pl-4 py-1 my-6 text-[15px] italic text-[#656d76]">
              How do we embed Kaspa into everyday human interaction?
            </blockquote>
            <p className="text-[15px] leading-7 text-[#1f2328] mb-10">
              That question led to the creation of <strong>TTT</strong>.
            </p>

            {/* The Problem */}
            <section id="problem" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-[#1f2328] pb-2 mb-4 border-b border-[#d0d7de]">The Problem</h2>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">Kaspa has world-class technology.</p>
              <ul className="space-y-1.5 mb-4 text-[15px] leading-7 text-[#1f2328] list-disc pl-6">
                <li>Fast confirmations.</li>
                <li>BlockDAG architecture.</li>
                <li>Fair launch principles.</li>
                <li>Scalability designed for real-world throughput.</li>
              </ul>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">But outside crypto circles, awareness remains limited.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">The challenge was never technology.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-8">The challenge is <strong>translation</strong>.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-8">
                How do you connect advanced distributed systems to everyday life without requiring users to understand them first?
              </p>
            </section>

            {/* The AI Discovery */}
            <section id="ai-discovery" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-[#1f2328] pb-2 mb-4 border-b border-[#d0d7de]">The AI Discovery</h2>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                We began using AI not just as a content engine, but as a <strong>behavioral mapping system</strong>.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                Instead of generating posts, we used AI to identify where value already moves in daily life:
              </p>
              <ul className="space-y-1.5 mb-4 text-[15px] leading-7 text-[#1f2328] list-disc pl-6">
                <li>Tips in service work</li>
                <li>Small business transactions</li>
                <li>Micro rewards in customer interactions</li>
                <li>Social gratitude moments</li>
              </ul>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-8">AI helped us see something simple:</p>
              <blockquote className="border-l-4 border-[#d0d7de] pl-4 py-1 my-6 text-[15px] italic text-[#656d76]">
                Value exchange already exists everywhere — it just isn't digital-native in most cases.
              </blockquote>
            </section>

            {/* The Birth of TTT */}
            <section id="birth" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-[#1f2328] pb-2 mb-4 border-b border-[#d0d7de]">The Birth of TTT</h2>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">TTT stands for:</p>
              <div className="my-6 p-4 bg-[#f6f8fa] border border-[#d0d7de] rounded-lg">
                <p className="text-lg font-bold text-[#1f2328] text-center">Tap To Tip</p>
              </div>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">A direct action model for value transfer.</p>
              <ul className="space-y-1.5 mb-4 text-[15px] leading-7 text-[#1f2328] list-disc pl-6">
                <li>Someone receives service.</li>
                <li>Someone recognizes it.</li>
                <li>A QR code is scanned.</li>
                <li>A tip is sent instantly.</li>
              </ul>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">No onboarding friction.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">No prior crypto knowledge required.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">Just a single interaction:</p>
              <div className="my-6 p-6 bg-[#f6f8fa] border border-[#d0d7de] rounded-lg text-center">
                <span className="text-2xl font-bold text-[#0969da]">Tap → Tip</span>
              </div>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">Behind the interface, Kaspa provides the settlement layer.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-8">The user experience stays human-first.</p>
            </section>

            {/* AI as a Local Marketing Engine */}
            <section id="marketing-engine" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-[#1f2328] pb-2 mb-4 border-b border-[#d0d7de]">AI as a Local Marketing Engine</h2>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">Traditional crypto marketing tends to be:</p>
              <ul className="space-y-1.5 mb-4 text-[15px] leading-7 text-[#1f2328] list-disc pl-6">
                <li>Global campaigns</li>
                <li>Influencer pushes</li>
                <li>Conference visibility</li>
                <li>Social amplification loops</li>
              </ul>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">We approached it differently.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">We used AI to generate localized adoption pathways:</p>
              <ul className="space-y-1.5 mb-4 text-[15px] leading-7 text-[#1f2328] list-disc pl-6">
                <li>Salon-specific onboarding flows</li>
                <li>Barber shop tipping scripts</li>
                <li>Restaurant customer reward prompts</li>
                <li>Custom flyers per business type</li>
                <li>Real-time feedback iteration loops</li>
              </ul>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                Instead of one campaign, AI enabled <strong>thousands of micro-campaigns</strong> tailored to context.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-8">
                Each environment becomes its own entry point into Kaspa.
              </p>
            </section>

            {/* Marketing Through Utility */}
            <section id="utility" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-[#1f2328] pb-2 mb-4 border-b border-[#d0d7de]">Marketing Through Utility</h2>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                People do not adopt technology because it is explained well.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">They adopt it when it solves something immediately.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                The strongest Kaspa adoption moment is not awareness.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">It is <strong>experience</strong>:</p>
              <ul className="space-y-1.5 mb-4 text-[15px] leading-7 text-[#1f2328] list-disc pl-6">
                <li>First instant tip</li>
                <li>First frictionless value transfer</li>
                <li>First time money moves without delay or complexity</li>
              </ul>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-8">That moment replaces explanation.</p>
            </section>

            {/* Why Local Matters */}
            <section id="local" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-[#1f2328] pb-2 mb-4 border-b border-[#d0d7de]">Why Local Matters</h2>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                Global adoption is an outcome of <strong>local repetition</strong>.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                Communities form through repeated human interactions, not broadcasts.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                AI enables scaling that repetition without losing contextual relevance.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">This shifts marketing from:</p>
              <div className="my-6 p-4 bg-[#f6f8fa] border border-[#d0d7de] rounded-lg">
                <p className="text-[15px] text-[#656d76] italic mb-2">"One message to many"</p>
                <p className="text-[15px] text-center font-semibold text-[#1f2328]">to</p>
                <p className="text-[15px] text-[#656d76] italic mt-2">"Many meaningful interactions with individuals"</p>
              </div>
            </section>

            {/* The Vision */}
            <section id="vision" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-[#1f2328] pb-2 mb-4 border-b border-[#d0d7de]">The Vision</h2>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">TTT is not just a tipping interface.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">It is an experiment in <strong>distribution</strong>:</p>
              <ul className="space-y-2 mb-4 text-[15px] leading-7 text-[#1f2328] list-disc pl-6">
                <li>Can AI bridge blockchain infrastructure and real-world human behavior?</li>
                <li>Can Kaspa move from being a system discussed in technical circles to a system experienced in daily life?</li>
                <li>Can gratitude become a natural onboarding path into decentralized value transfer?</li>
              </ul>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">We believe yes.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                The future of adoption will not be driven only by performance metrics or protocol design.
              </p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-4">
                It will be driven by how <strong>invisible</strong> the technology can become at the moment of use.
              </p>
              <div className="my-6 p-6 bg-[#f6f8fa] border border-[#d0d7de] rounded-lg space-y-2">
                <p className="text-[15px] leading-7 text-[#1f2328]"><strong>Kaspa</strong> provides the infrastructure.</p>
                <p className="text-[15px] leading-7 text-[#1f2328]"><strong>AI</strong> provides the adaptation layer.</p>
                <p className="text-[15px] leading-7 text-[#1f2328]"><strong>TapToTip</strong> connects them through action.</p>
              </div>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-6">One tap.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-6">One tip.</p>
              <p className="text-[15px] leading-7 text-[#1f2328] mb-6">One interaction at a time.</p>
              <p className="text-[15px] leading-7 text-[#656d76] italic mb-8">
                This is being built in real time along with Kaspa.
              </p>
              <div className="my-6 p-4 border border-[#d0d7de] rounded-lg bg-gradient-to-br from-[#ddf4ff] to-[#f6f8fa]">
                <a href="https://tttz.xyz" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[15px] font-semibold text-[#0969da] hover:underline">
                  TTTz.xyz <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-[#d0d7de] flex items-center justify-between text-xs text-[#656d76]">
              <Link to="/" className="flex items-center gap-1.5 hover:text-[#0969da] transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to TTT
              </Link>
              <span>© TTT Platform · Built alongside Kaspa</span>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}