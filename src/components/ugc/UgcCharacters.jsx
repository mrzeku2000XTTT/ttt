import React from 'react';

// The three UGC Factory Girls — photoreal AI influencer characters.
// Each represents a stage of the HTML → prompt factory line.
export const UGC_GIRLS = [
  {
    name: 'Pippa',
    role: 'Prompt Director',
    blurb: 'Strips the noise, finds the story inside your HTML.',
    img: 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/90f4c3ddf_generated_image.png',
    accent: 'rose',
  },
  {
    name: 'Moxie',
    role: 'Media Editor',
    blurb: 'Structures the content tree and design system.',
    img: 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4c8ea5b57_generated_image.png',
    accent: 'violet',
  },
  {
    name: 'Sage',
    role: 'Conversion Lead',
    blurb: 'Writes the final self-contained prompt you can use anywhere.',
    img: 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bc9056cec_generated_image.png',
    accent: 'emerald',
  },
];

const ACCENT = {
  rose: 'bg-rose-100 text-rose-700 ring-rose-200',
  violet: 'bg-violet-100 text-violet-700 ring-violet-200',
  emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

export default function UgcCharacters({ active = null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {UGC_GIRLS.map((g) => {
        const isActive = active === g.name;
        return (
          <div
            key={g.name}
            className={`rounded-3xl bg-white ring-1 p-5 flex flex-col items-center text-center transition-shadow ${
              isActive ? 'ring-2 shadow-xl ring-neutral-900' : 'ring-neutral-200 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md bg-neutral-100">
              <img src={g.img} alt={g.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-neutral-900 tracking-tight">{g.name}</h3>
            <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ACCENT[g.accent]}`}>
              {g.role}
            </span>
            <p className="mt-2 text-sm text-neutral-500 leading-snug">{g.blurb}</p>
          </div>
        );
      })}
    </div>
  );
}