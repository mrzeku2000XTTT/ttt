import React from 'react';
import { FileText, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlyphLandingHero from './GlyphLandingHero';
import { CtaBox, FeatureBar, LandingFooter, Produces, Workflow } from './GlyphLandingSections';
import GlyphMark from './GlyphMark';

export default function GlyphLanding({ hasWallet, wallet, loading, error, onConnect, onEnter, onSeed, onExit }) {
  return (
    <div className="glyph-page">
      <header className="sticky top-0 z-40 glyph-glass" style={{ borderBottom: '1px solid var(--g-line)' }}>
        <div className="max-w-[1500px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <GlyphMark size={32} />
            <div className="min-w-0">
              <p className="glyph-word text-[13px] leading-none">Glyph</p>
              <p className="glyph-muted text-[10px] mt-1 truncate">image → visual code</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <a href="#workflow" className="glyph-muted text-[12px] hover:text-[#E8F1F9]">How it works</a>
            <a href="#styles" className="glyph-muted text-[12px] hover:text-[#E8F1F9]">Styles</a>
            <Link to="/AppDocs/Glyph" className="glyph-muted text-[12px] hover:text-[#E8F1F9]">Docs</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={onExit} className="glyph-pill rounded-full px-3 h-9 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
              <Store className="w-3 h-3" />
              <span className="hidden sm:inline">store</span>
            </button>
            <Link to="/AppDocs/Glyph" className="glyph-pill rounded-full px-3 h-9 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] lg:hidden">
              <FileText className="w-3 h-3" />
              docs
            </Link>
            <button
              onClick={hasWallet ? onEnter : onConnect}
              disabled={loading}
              className="glyph-btn glyph-btn-primary h-9"
              title={wallet ? `Connected ${wallet}` : 'Connect your Scorpion wallet'}
            >
              {loading ? 'Connecting…' : hasWallet ? 'Enter studio' : 'Connect Scorpion'}
            </button>
          </div>
        </div>
        {error && (
          <p className="max-w-[1500px] mx-auto px-4 pb-2 text-[11px]" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        )}
      </header>

      <GlyphLandingHero hasWallet={hasWallet} onSeed={onSeed} onEnter={hasWallet ? onEnter : onConnect} />

      <div id="workflow">
        <FeatureBar />
        <Workflow />
      </div>
      <div id="styles">
        <Produces />
      </div>

      <CtaBox hasWallet={hasWallet} onEnter={hasWallet ? onEnter : onConnect} />
      <LandingFooter />
    </div>
  );
}