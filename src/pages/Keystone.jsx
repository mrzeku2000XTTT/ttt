import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KeystonePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl("Categories")}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-white font-semibold">Keystone</span>
          </div>

          <a
            href="https://keystone.kasperolabs.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-400 hover:text-cyan-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Tab
            </Button>
          </a>
        </div>
      </div>

      {/* Embedded Content */}
      <div className="flex-1 pt-16">
        <iframe
          src="https://keystone.kasperolabs.com"
          className="w-full h-full border-0"
          title="Keystone"
        />
      </div>
    </div>
  );
}