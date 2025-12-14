import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function KFlowPage() {
  return (
    <div className="flex flex-col h-[85vh] w-full bg-black rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("AppStore")}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">KaspaFlow</h1>
        </div>
        <a 
          href="https://kaspaflow.com" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="gap-2">
            Open Original <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>
      <iframe 
        src="https://kaspaflow.com" 
        className="flex-1 w-full border-0 bg-white"
        title="KFlow"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}