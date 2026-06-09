import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d7223a3d9_generated_image.png";

export default function MetaMimicNav() {
  return (
    <header className="mx-auto max-w-[1100px] px-6">
      <nav className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <Link
            to={createPageUrl("AppStoreV2")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            title="Back to App Store"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
            <img src={LOGO} alt="MetaMimic" className="h-8 w-8 rounded-lg object-cover" />
            <span>MetaMimic</span>
          </div>
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