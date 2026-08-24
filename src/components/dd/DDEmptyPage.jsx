import React from "react";
import { Link } from "react-router-dom";

export default function DDEmptyPage({ title, subtitle, icon: Icon, ctaLabel, ctaTo }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
      <div className="mt-5 bg-white border border-neutral-200 rounded-2xl p-10 text-center">
        {Icon && <Icon className="w-10 h-10 text-neutral-300 mx-auto mb-3" />}
        <p className="text-sm text-neutral-400 mb-4">No data yet. Connect an app from the DD Store to populate this page.</p>
        {ctaLabel && ctaTo && (
          <Link to={ctaTo} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800">
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}