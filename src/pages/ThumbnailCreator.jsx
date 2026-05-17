import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ThumbnailHero from "@/components/thumbnailcreator/ThumbnailHero";
import ThumbnailGenerator from "@/components/thumbnailcreator/ThumbnailGenerator";
import ThumbnailGallery from "@/components/thumbnailcreator/ThumbnailGallery";

export default function ThumbnailCreatorPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/AppStoreV2" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to App Store
        </Link>
        <ThumbnailHero />
        <ThumbnailGenerator onCreated={() => setRefreshKey((key) => key + 1)} />
        <ThumbnailGallery refreshKey={refreshKey} />
      </div>
    </div>
  );
}