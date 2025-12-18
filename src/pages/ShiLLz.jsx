import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function ShiLLzPage() {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <Link 
        to={createPageUrl("AppStore")} 
        className="absolute top-4 left-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300"
      >
        <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      
      <iframe
        src="https://shillzzz.base44.app"
        className="flex-1 w-full h-full border-none bg-black"
        title="ShiLLz"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera"
      />
    </div>
  );
}