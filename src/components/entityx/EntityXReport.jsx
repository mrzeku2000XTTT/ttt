import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Loader2, FileBarChart, ShieldCheck } from "lucide-react";

export default function EntityXReport() {
  const [report, setReport] = useState(null);
  const [loadingDays, setLoadingDays] = useState(null);
  const [error, setError] = useState("");

  const generate = async (days) => {
    setLoadingDays(days);
    setError("");
    try {
      const res = await base44.functions.invoke("entityXTracker", { action: "report", days });
      if (!res.data?.success) throw new Error(res.data?.error || "Report failed");
      setReport(res.data);
    } catch (err) {
      setError(err?.message || "Could not generate report.");
    } finally {
      setLoadingDays(null);
    }
  };

  const stat = (label, value, color = "text-[#3D2E7C]") => (
    <div className="bg-[#F3F0FA] rounded-[16px] px-4 py-3">
      <div className="text-[9px] font-display font-extrabold uppercase tracking-widest text-[#8B84A3] mb-1">{label}</div>
      <div className={`font-display text-lg font-black ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EBE6F8] flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-[#7C5CFC]" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black text-[#3D2E7C]">Motivator Reports</h2>
            <p className="text-[11px] text-[#8B84A3]">Instant inflow/outflow summary — fact-checked across multiple sources</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => generate(d)}
              disabled={loadingDays !== null}
              className={`px-5 py-2.5 rounded-full text-[11px] font-display font-extrabold transition-colors flex items-center gap-2 disabled:opacity-60 ${
                report?.stats?.periodDays === d
                  ? "bg-[#7C5CFC] text-white shadow-[0_6px_16px_rgba(124,92,252,0.35)]"
                  : "bg-[#F3F0FA] text-[#5A4B8A] hover:bg-[#EBE6F8]"
              }`}
            >
              {loadingDays === d && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {d}-DAY MOTIVATOR
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-[#FFF1E9] rounded-[16px] px-4 py-3 text-[11px] text-[#F96B4C] mb-4">{error}</div>}

      {loadingDays && !report && (
        <div className="text-center py-10 text-[#8B84A3] text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#7C5CFC] mx-auto mb-3" />
          Scanning the blockDAG and fact-checking against public explorers…
        </div>
      )}

      {report && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stat("Inflow", `+${report.stats.inflowKas.toLocaleString(undefined, { maximumFractionDigits: 0 })} KAS`, "text-[#1E9E5A]")}
            {stat("Outflow", `−${report.stats.outflowKas.toLocaleString(undefined, { maximumFractionDigits: 0 })} KAS`, "text-[#F96B4C]")}
            {stat("Net Flow", `${report.stats.netKas >= 0 ? "+" : ""}${report.stats.netKas.toLocaleString(undefined, { maximumFractionDigits: 0 })} KAS`, report.stats.netKas >= 0 ? "text-[#1E9E5A]" : "text-[#F96B4C]")}
            {stat("Transactions", `${report.stats.txCount} (${report.stats.inCount} in / ${report.stats.outCount} out)`)}
          </div>

          <div className="bg-[#F3F0FA] rounded-[20px] p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-display font-extrabold uppercase tracking-widest text-[#7C5CFC]">
              <ShieldCheck className="w-4 h-4" /> Fact-Checked Report
            </div>
            <div className="prose prose-sm max-w-none text-[#3D2E7C] prose-headings:font-display prose-headings:text-[#3D2E7C] prose-strong:text-[#3D2E7C] prose-li:text-[#5A4B8A] prose-p:text-[#5A4B8A]">
              <ReactMarkdown>{report.summary}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      )}

      {!report && !loadingDays && (
        <div className="text-center py-8 text-xs text-[#8B84A3]">
          Pick a 7-day or 30-day motivator to see how the biggest holder moves — and stay inspired to stack.
        </div>
      )}
    </div>
  );
}