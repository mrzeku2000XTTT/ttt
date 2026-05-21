import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MoodBoardStudio from "@/components/storyboard/MoodBoardStudio";

export default function MoodBoardPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/QuickStoryboard" className="inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Quick Storyboard
        </Link>
        <MoodBoardStudio />
      </div>
    </div>
  );
}