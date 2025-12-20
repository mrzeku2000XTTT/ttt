import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function JustDancePage() {
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Back Button Overlay */}
      <div className="absolute top-4 left-4 z-50">
        <Link 
          to={createPageUrl("OliviaApps")} 
          className="opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full border border-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {/* Iframe */}
      <iframe
        src="https://www.seeles.ai/play/96ad3429-57c8-4f47-b31f-ca6c7dfa2273?fromShare=true"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="JustDance"
      />
    </div>
  );
}