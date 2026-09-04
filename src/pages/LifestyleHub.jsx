import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";
import { APPS, LIFESTYLE_APP_PATHS } from "@/components/appstore2/appCatalog";

/**
 * "Everyday AI" — a mini app store inside the App Store. All 10 lifestyle
 * AI-tool apps live here instead of cluttering the main grid.
 */
export default function LifestyleHub() {
  const apps = LIFESTYLE_APP_PATHS.map((p) => APPS.find((a) => a.path === p)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      {/* Nav — matches AppDocs / AppStoreV2 */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between pl-3 sm:pl-5 pr-[calc(0.75rem+env(safe-area-inset-right,0px))] sm:pr-[calc(1.25rem+env(safe-area-inset-right,0px))] bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/50"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between w-full h-14 gap-2">
          <Link
            to="/AppStoreV2"
            className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 transition-colors h-14 px-3 -ml-3 rounded-lg active:bg-zinc-200/60"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Store</span>
          </Link>
          <span className="text-[15px] font-[800] tracking-tight min-w-0 truncate text-center">Everyday AI</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/AIAgentHub"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 hover:opacity-90 h-10 px-3.5 rounded-full transition-opacity shadow-lg shadow-fuchsia-500/30"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agents</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e68fc7d6f_generated_image.png"
            alt="Everyday AI"
            className="w-16 h-16 rounded-2xl object-cover border border-zinc-200"
          />
          <div>
            <h1 className="text-2xl font-[800] tracking-tight">Everyday AI</h1>
            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
              20 AI tools for real life — snap a photo or answer a few questions and get an instant, practical answer.
            </p>
          </div>
        </div>

        {/* App grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {apps.map((app) => (
            <Link
              key={app.path}
              to={`/${app.path}`}
              className="flex flex-col items-center text-center gap-2 bg-white rounded-3xl p-5 border border-zinc-200/60 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              <img
                src={app.logo}
                alt={app.name}
                className="w-14 h-14 rounded-2xl object-cover"
                loading="lazy"
              />
              <p className="text-[13px] font-semibold text-zinc-800">{app.name}</p>
              <p className="text-[11px] text-zinc-400 leading-snug">{app.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}