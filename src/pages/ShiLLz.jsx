import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import BlockWorld from '@/components/shillz/BlockWorld';

export default function ShiLLzPage() {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <Link 
        to={createPageUrl("AppStore")} 
        className="absolute top-4 left-4 z-[200] opacity-50 hover:opacity-100 transition-opacity duration-300"
      >
        <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full border border-white/10">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      
      <div className="flex-1 w-full h-full">
        <BlockWorld />
      </div>
    </div>
  );
}