import React from "react";

export default function MetaMimicFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10 text-center text-[13px] text-white/40">
      <div className="mb-4 flex justify-center gap-[18px]">
        <a href="#" className="text-white/60 transition hover:text-white">Twitter</a>
        <a href="#" className="text-white/60 transition hover:text-white">Instagram</a>
        <a href="#" className="text-white/60 transition hover:text-white">LinkedIn</a>
      </div>
      <div>© 2026 MetaMimic. All rights reserved.</div>
    </footer>
  );
}