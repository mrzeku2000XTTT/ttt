import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { NATIONS } from "@/components/kaspanations/nations";
import NationViewer from "@/components/kaspanations/NationViewer";

// Subpage for one Kaspa nation — /KaspaNations/:slug
export default function KaspaNation() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const nation = NATIONS.find((n) => n.slug === slug?.toLowerCase());

  if (nation && nation.live) {
    return <NationViewer nation={nation} onClose={() => navigate("/KaspaNations")} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-5 px-6">
      {nation ? (
        <>
          <span className="text-5xl">{nation.flag}</span>
          <div className="text-lg font-black tracking-[0.3em]" style={{ color: "#7dffce", fontFamily: "monospace" }}>
            {nation.name}
          </div>
          <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: "rgba(125,255,206,0.5)", fontFamily: "monospace" }}>
            THIS NATION IS COMING SOON
          </div>
        </>
      ) : (
        <div className="text-[11px] tracking-[0.4em] uppercase" style={{ color: "rgba(125,255,206,0.6)", fontFamily: "monospace" }}>
          NATION NOT FOUND
        </div>
      )}
      <Link to="/KaspaNations"
        className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.3em] uppercase"
        style={{ border: "1px solid rgba(80,255,180,0.3)", color: "rgba(125,255,206,0.8)", fontFamily: "monospace" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> KASPA NATIONS
      </Link>
    </div>
  );
}