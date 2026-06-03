import React from "react";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d7223a3d9_generated_image.png";

export default function MetaMimicNav() {
  return (
    <header className="mx-auto max-w-[1100px] px-6">
      <nav className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <img src={LOGO} alt="MetaMimic" className="h-8 w-8 rounded-lg object-cover" />
          <span>MetaMimic</span>
        </div>
        <a
          href="#cta"
          className="rounded-full bg-white px-[18px] py-2.5 text-[13px] font-bold text-black transition hover:opacity-90"
        >
          Get started
        </a>
      </nav>
    </header>
  );
}