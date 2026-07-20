import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, Radar } from "lucide-react";
import SlobzNav from "@/components/slobz/SlobzNav";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import SiteScoreCard from "@/components/sitetracker/SiteScoreCard";
import SiteIntelPanel from "@/components/sitetracker/SiteIntelPanel";
import TrackedSiteList from "@/components/sitetracker/TrackedSiteList";

const extractDomain = (url) => {
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); }
  catch { return url; }
};

export default function SlobzSiteTracker() {
  const [url, setUrl] = useState("");
  const [sites, setSites] = useState([]);
  const [active, setActive] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanningId, setScanningId] = useState(null);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { setNeedsLogin(true); return; }
        const list = await base44.entities.TrackedWebsite.list("-updated_date", 50);
        setSites(list);
        if (list.length > 0) setActive(list[0]);
      } catch { setNeedsLogin(true); }
    })();
  }, []);

  const runScan = async (targetUrl, existingRecord = null) => {
    const domain = extractDomain(targetUrl);
    setError("");
    if (existingRecord) setScanningId(existingRecord.id); else setScanning(true);
    try {
      setPhase("Scanning the page…");
      const res = await base44.functions.invoke("scrapeWebsiteStats", { url: targetUrl });
      const { stats, analysis } = res.data;

      setPhase("Gathering competitive intel…");
      let intel = null;
      try {
        intel = await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          add_context_from_internet: true,
          prompt: `You are a competitive web intelligence analyst (like SEMrush). Research the website ${domain} (${targetUrl}), page title: "${stats.title}". Using live web knowledge, provide:
1. traffic_estimate: a realistic estimated monthly visits range (e.g. "10K–50K visits/month") with a one-word confidence label
2. top_keywords: 6-10 keywords/topics this site likely ranks for or targets
3. competitors: top 4-5 competitor sites, each with name, domain, and a one-line reason why they compete
4. audience: one sentence describing the target audience
5. opportunities: 3 concrete ways this site could outrank its competitors`,
          response_json_schema: {
            type: "object",
            properties: {
              traffic_estimate: { type: "string" },
              top_keywords: { type: "array", items: { type: "string" } },
              competitors: {
                type: "array",
                items: { type: "object", properties: { name: { type: "string" }, domain: { type: "string" }, reason: { type: "string" } } },
              },
              audience: { type: "string" },
              opportunities: { type: "array", items: { type: "string" } },
            },
          },
        });
      } catch { /* intel is optional — keep the scan result */ }

      const payload = {
        url: targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
        domain,
        title: stats.title || domain,
        seo_score: stats.seoScore,
        stats,
        analysis,
        intel,
        last_scanned: new Date().toISOString(),
      };

      let record;
      if (existingRecord) {
        record = { ...existingRecord, ...payload };
        await base44.entities.TrackedWebsite.update(existingRecord.id, payload);
        setSites((prev) => prev.map((s) => (s.id === existingRecord.id ? record : s)));
      } else {
        record = await base44.entities.TrackedWebsite.create(payload);
        setSites((prev) => [record, ...prev]);
      }
      setActive(record);
      setUrl("");
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Couldn't scan that site. Check the URL and try again.");
    } finally {
      setScanning(false);
      setScanningId(null);
      setPhase("");
    }
  };

  const handleTrack = () => {
    const clean = url.trim();
    if (!clean || scanning) return;
    const existing = sites.find((s) => s.domain === extractDomain(clean));
    runScan(clean, existing || null);
  };

  const handleDelete = async (site) => {
    await base44.entities.TrackedWebsite.delete(site.id);
    setSites((prev) => prev.filter((s) => s.id !== site.id));
    if (active?.id === site.id) setActive(null);
  };

  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        <SlobzNav backTo="/Slobz" />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDFBF7] shadow-[0_6px_16px_rgba(124,92,252,0.2)] text-[10px] font-display font-extrabold text-[#7C5CFC] uppercase tracking-widest mb-4">
            <Radar className="w-3 h-3" /> Site Radar
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-[#4A2FA8]">TRACK ANY WEBSITE</h1>
          <p className="text-sm text-[#5A4B8A] mt-2 max-w-lg mx-auto">
            Paste any URL — get its SEO score, page health, estimated traffic, keywords and competitors. Our own analytics engine, no SEMrush needed.
          </p>
        </motion.div>

        {needsLogin ? (
          <div className="bg-[#FDFBF7] rounded-3xl p-8 text-center shadow-[0_10px_30px_rgba(124,92,252,0.15)] max-w-md mx-auto">
            <p className="text-sm text-[#5A4B8A]">Log in to track websites and save your analytics.</p>
            <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#7C5CFC] text-white font-display font-extrabold text-sm">
              LOG IN
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#FDFBF7] rounded-3xl p-4 shadow-[0_10px_30px_rgba(124,92,252,0.15)] mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                  placeholder="example.com or https://competitor.com/page"
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#EDE8F9] text-sm outline-none focus:ring-2 focus:ring-[#7C5CFC]/50 text-[#1F1B2E] placeholder:text-[#8B84A3]" />
                <button onClick={handleTrack} disabled={scanning || !url.trim()}
                  className="px-6 py-3 rounded-2xl bg-[#7C5CFC] text-white font-display font-extrabold text-sm disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                  {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> {phase || "Scanning…"}</> : "TRACK SITE"}
                </button>
              </div>
              {error && <p className="text-xs text-[#FF5A5A] font-bold mt-2 px-2">{error}</p>}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {active ? (
                  <>
                    <SiteScoreCard site={active} />
                    <SiteIntelPanel intel={active.intel} analysis={active.analysis} />
                  </>
                ) : (
                  <div className="bg-[#FDFBF7]/60 rounded-3xl p-10 text-center text-sm text-[#8B84A3]">
                    Track a website above to see its analytics here.
                  </div>
                )}
              </div>
              <div>
                <TrackedSiteList sites={sites} activeId={active?.id} onSelect={setActive}
                  onRescan={(s) => runScan(s.url, s)} onDelete={handleDelete} scanningId={scanningId} />
              </div>
            </div>
          </>
        )}

        <p className="text-[10px] text-[#8B84A3] text-center mt-8 max-w-md mx-auto">
          Traffic estimates and competitor intel are AI-researched approximations for guidance — not exact measurements.
        </p>
      </div>
    </div>
  );
}