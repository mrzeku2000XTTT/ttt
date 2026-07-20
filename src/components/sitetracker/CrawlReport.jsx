import React from "react";
import { Globe, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function CrawlReport({ crawl }) {
  if (!crawl?.pages?.length) return null;
  return (
    <div className="bg-[#FDFBF7] rounded-3xl p-5 shadow-[0_10px_30px_rgba(124,92,252,0.12)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#7C5CFC] flex items-center justify-center">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-extrabold text-sm text-[#4A2FA8] uppercase tracking-wide">
          Pages Crawled ({crawl.pagesCrawled})
        </span>
        <span className="ml-auto text-[10px] font-bold text-[#8B84A3]">
          {crawl.totalIssues} issues · avg {(crawl.avgLoadTime / 1000).toFixed(1)}s
        </span>
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {crawl.pages.map((p, i) => {
          const broken = p.status === 0 || p.status >= 400;
          const Icon = broken ? XCircle : p.issues.length ? AlertTriangle : CheckCircle2;
          const color = broken ? "text-[#FF7A7A]" : p.issues.length ? "text-[#FFC24B]" : "text-[#5CE1A4]";
          return (
            <div key={i} className="bg-[#EDE8F9] rounded-2xl px-3 py-2 flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-[#1F1B2E] truncate">{p.path || "/"}</div>
                <div className="text-[10px] text-[#5A4B8A]">
                  HTTP {p.status || "—"} · {(p.loadTime / 1000).toFixed(1)}s · {p.wordCount} words
                  {p.issues.length > 0 && <span className="text-[#B0741A]"> · {p.issues.join(", ")}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}