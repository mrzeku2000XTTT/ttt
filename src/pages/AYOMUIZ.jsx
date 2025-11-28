import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AYOMUIZPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black" style={{ paddingTop: 'calc(var(--sat, 0px) + 8rem)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <style jsx>{`
        iframe {
          background-color: black;
        }
        @media (max-width: 640px) {
          .header-container {
            padding-top: calc(var(--sat, 0px) + 0.5rem);
          }
        }
      `}</style>
      
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-xl border-b border-white/10 header-container">
        <Link to={createPageUrl('AppStore')}>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-white font-bold text-lg">AYOMUIZ</h1>
      </div>

      <iframe
        src="https://kaspa-horizon-bets-8c25068e.base44.app"
        className="flex-1 w-full border-0"
        title="AYOMUIZ App"
        allow="clipboard-read; clipboard-write; payment"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}