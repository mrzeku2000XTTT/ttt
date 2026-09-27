import React from "react";
import { Github } from "lucide-react";
import { appSource } from "@/components/appstore2/appSource";

/**
 * The way into an app's own code. TTT is open source, so every docs page offers
 * the source behind that app — its own repo when it has one, otherwise where it
 * lives inside TTT — so anyone can read it and build on top.
 */
export default function DocsSourceLink({ app, fullWidth = false }) {
  const source = appSource(app);
  if (!source) return null;

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      title={source.path ? `Source: ${source.path}` : "Open the source repository"}
      className={`inline-flex items-center justify-center gap-1.5 h-10 rounded-full border border-zinc-300 bg-white text-zinc-900 text-[13px] font-semibold hover:bg-zinc-100 transition-colors flex-shrink-0 ${
        fullWidth ? "w-full" : "px-4"
      }`}
    >
      <Github className="w-4 h-4" />
      {source.own ? "View Repo" : "View Source"}
    </a>
  );
}