import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function ThumbnailGallery({ refreshKey = 0 }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    base44.entities.ThumbnailProject.list("-created_date", 12).then(setProjects);
  }, [refreshKey]);

  if (!projects.length) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white">Recent thumbnails</h2>
        <p className="text-sm text-zinc-400">Saved generations from the TTT Thumbnail Creator.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <a key={project.id} href={project.image_url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <img src={project.image_url} alt={project.title} className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105" />
            <div className="p-3">
              <p className="truncate text-sm font-black text-white">{project.title}</p>
              <p className="truncate text-xs text-zinc-500">{project.style}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}