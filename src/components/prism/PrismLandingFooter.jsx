import React from 'react';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1fe645919_generated_image.png';

export default function PrismLandingFooter() {
  return (
    <footer className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="PRISM" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-[11px] font-bold tracking-[0.28em] text-black">PRISM</span>
          </div>
          <p className="text-[11px] text-[#666666] text-center">
            Built for designers, motion artists, editors and creative developers.
          </p>
        </div>
        <div className="mt-6 pt-5 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#a3a3a3]">
            © {new Date().getFullYear()} PRISM · A TTT super app · Video forensics for designers
          </p>
          <p className="text-[10px] text-[#a3a3a3]">Decoded locally. Nothing leaves your machine until you ask.</p>
        </div>
      </div>
    </footer>
  );
}