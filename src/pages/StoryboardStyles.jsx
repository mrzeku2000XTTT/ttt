import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid, Sparkles } from "lucide-react";

const STYLE_IDEAS = {
  "Kaspa Explainer": "Create a clear Kaspa storyboard explaining how fast KAS payments move through the DAG with blocks confirming in parallel, simple wallet actions, and readable labels for users new to Kaspa.",
  "DAG Flow": "Show a cinematic Kaspa DAG flow storyboard where many blue blocks connect at once, transactions confirm quickly, and the visual panels explain parallel block creation without confusing text.",
  "KAS Wallet": "Create a storyboard for a KAS wallet experience: a user opens their wallet, scans a QR code, sends KAS instantly, receives confirmation, and celebrates a smooth secure payment.",
  "KRC20 Launch": "Design a Kaspa KRC20 launch storyboard showing token setup, community announcement, wallet interaction, trading energy, and clear launch-day panels with clean readable labels.",
  "Miner Story": "Tell a Kaspa miner story with mining rigs, glowing DAG blocks, network contribution, fast block rewards, and a human builder proudly supporting the Kaspa ecosystem.",
  "TTT Agent": "Create a TTT Agent storyboard where an AI agent helps a user navigate Kaspa apps, understand KAS payments, verify actions, and complete a task inside the TTT ecosystem.",
};

const STYLE_THUMBS = {
  "Kaspa Explainer": "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e7091459a_generated_image.png",
  "DAG Flow": "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bc53763d7_generated_image.png",
  "KAS Wallet": "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/20c9f3b50_generated_image.png",
  "KRC20 Launch": "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d4f7624be_generated_image.png",
  "Miner Story": "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5e7fdbf23_generated_image.png",
  "TTT Agent": "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5a44fd73f_generated_image.png",
};

export default function StoryboardStylesPage() {
  const navigate = useNavigate();

  const pick = (style) => {
    sessionStorage.setItem("storyboard_seed", JSON.stringify({ idea: STYLE_IDEAS[style], style }));
    navigate("/QuickStoryboard");
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <button onClick={() => navigate("/QuickStoryboard")} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </button>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500"><LayoutGrid className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Storyboard Styles</h1>
            <p className="text-sm text-white/50">Pick a style to start a new storyboard instantly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(STYLE_IDEAS).map((style) => (
            <button key={style} onClick={() => pick(style)} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 text-left">
              <img src={STYLE_THUMBS[style]} alt={style} className="absolute inset-0 h-full w-full object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-4">
                <Sparkles className="h-5 w-5 text-violet-300" />
                <div>
                  <h3 className="text-xl font-black leading-tight drop-shadow">{style}</h3>
                  <span className="text-xs font-bold text-white/80">Use this style →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}