import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function ShiLLzPage() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center p-4 bg-black border-b border-white/10 z-10">
        <Link to={createPageUrl("AppStore")}>
          <Button variant="ghost" size="icon" className="mr-4 text-white hover:bg-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
            <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/c28359c35_image.png"
                alt="ShiLLz" 
                className="w-8 h-8 rounded-lg"
            />
            <h1 className="text-xl font-bold text-white">ShiLLz</h1>
        </div>
      </div>
      <iframe
        src="https://shillzzz.base44.app"
        className="flex-1 w-full border-none bg-black"
        title="ShiLLz"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}