import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, ExternalLink, Loader2, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProposalsPanel({ onChange }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [actingId, setActingId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.AppProposal.list("-created_date", 100);
      setProposals(all);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const act = async (id, status) => {
    setActingId(id);
    try {
      await base44.entities.AppProposal.update(id, { status });
      await load();
      onChange?.();
    } catch (e) {
      alert("Failed: " + e.message);
    }
    setActingId(null);
  };

  const pending = proposals.filter(p => p.status === "pending");
  const reviewed = proposals.filter(p => p.status !== "pending");

  return (
    <div className="mb-6 bg-white rounded-2xl ring-1 ring-zinc-200/60 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-zinc-900">App Proposals</span>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
              {pending.length} pending
            </span>
          )}
          <span className="text-[11px] text-zinc-400">({proposals.length} total)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-200/60"
          >
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </div>
              ) : proposals.length === 0 ? (
                <p className="text-xs text-zinc-400">No proposals yet.</p>
              ) : (
                <>
                  {pending.map(p => <ProposalRow key={p.id} p={p} act={act} acting={actingId === p.id} />)}
                  {reviewed.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Reviewed</p>
                      {reviewed.map(p => <ProposalRow key={p.id} p={p} act={act} acting={actingId === p.id} />)}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProposalRow({ p, act, acting }) {
  const isPending = p.status === "pending";
  const badgeColor = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  }[p.status];

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 ring-1 ring-zinc-200/40">
      {p.icon_url ? (
        <img src={p.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-zinc-200 flex-shrink-0 flex items-center justify-center text-zinc-500 font-bold text-xs">
          {p.app_name?.[0] || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-zinc-900 truncate">{p.app_name}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${badgeColor}`}>{p.status}</span>
        </div>
        <p className="text-[11px] text-zinc-500 line-clamp-2">{p.description}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-400">
          <a href={p.app_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-cyan-600 truncate max-w-[200px]">
            <ExternalLink className="w-2.5 h-2.5" /> {p.app_link}
          </a>
          <span>·</span>
          <span>{p.category}</span>
          <span>·</span>
          <span>{p.submitter_name || p.submitter_email}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        {isPending && (
          <>
            <a
              href={p.app_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-cyan-500 text-white text-[10px] font-bold hover:bg-cyan-600"
            >
              <Eye className="w-3 h-3" /> View
            </a>
            <button
              onClick={() => act(p.id, "approved")}
              disabled={acting}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3 h-3" /> Approve
            </button>
            <button
              onClick={() => act(p.id, "rejected")}
              disabled={acting}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 disabled:opacity-50"
            >
              <XCircle className="w-3 h-3" /> Reject
            </button>
          </>
        )}
        {!isPending && (
          <a
            href={p.app_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-zinc-200 text-zinc-600 text-[10px] font-bold hover:bg-zinc-300"
          >
            <Eye className="w-3 h-3" /> View
          </a>
        )}
      </div>
    </div>
  );
}