import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Generates a ready-to-use 16:9 YouTube thumbnail from the niche
export default function NicheThumbnailLab({ niche }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const generate = async () => {
    if (loading) return;
    const subject = topic.trim() || niche.niche_name;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Professional cinematography framing — a striking cinematic 16:9 YouTube thumbnail for a video about "${subject}", made for the creator niche "${niche.niche_name}" (${niche.tagline}). One bold focal subject, dramatic high-contrast lighting, dark premium aesthetic, shallow depth of field, crisp and legible even at small sizes, clean composition with room for a title overlay. Photorealistic, moody, high production value.`
      });
      setImage(res.url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-4 h-4 text-white/50" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Thumbnail Lab</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={`Video topic — leave blank to use "${niche.niche_name}"`}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-white text-black font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
          {loading ? 'Shooting…' : 'Generate thumbnail'}
        </button>
      </div>
      {image && (
        <div className="mt-4">
          <img src={image} alt="Generated thumbnail" className="w-full rounded-xl border border-white/10" />
          <div className="flex gap-2 mt-3">
            <a
              href={image}
              download={`niche-thumbnail-${niche.niche_name.replace(/\s+/g, '-').toLowerCase()}.png`}
              className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download
            </a>
            <button
              onClick={generate}
              className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}