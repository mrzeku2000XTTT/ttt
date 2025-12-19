import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function KasmiPage() {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="absolute top-4 left-4 z-[200] flex gap-2">
        <Link 
          to={createPageUrl("OliviaApps")} 
          className="opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full border border-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>
      
      <div className="flex-1 w-full h-full">
        <iframe 
          src="https://www.kasmi.online" 
          className="w-full h-full border-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}