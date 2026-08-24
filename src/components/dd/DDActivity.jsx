import React, { useState, useEffect } from "react";
import { Loader2, Activity as ActIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DDActivity() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!u?.email) { setLoading(false); return; }
        const list = await base44.entities.DDActivity.filter({ user_email: u.email }, "-created_date", 50);
        setItems(list);
      } catch { }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Activity</h1>
      <p className="text-sm text-neutral-500 mt-1">What DD has been doing.</p>
      <div className="mt-5 bg-white border border-neutral-200 rounded-2xl p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <ActIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-400">No activity yet. Create tasks, projects, or automations to see them here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-sm">{a.icon || "📋"}</div>
                <p className="flex-1 text-sm text-neutral-700">{a.text}</p>
                <span className="text-xs text-neutral-400">{new Date(a.created_date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}