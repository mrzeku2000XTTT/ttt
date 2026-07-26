import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function KasComputePage() {
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header with Back Button and Direct Link */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <Link 
          to={createPageUrl("AppStore")} 
          className="opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full border border-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>

        <a
          href="https://kascompute.org"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full border border-white/10">
            <ExternalLink className="w-6 h-6" />
          </Button>
        </a>
      </div>

      {/* Iframe */}
      <iframe
        src="https://kascompute.org"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="KasCompute"
      />
    </div>
  );
}