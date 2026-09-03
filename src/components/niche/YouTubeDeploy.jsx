import React from 'react';

// YouTube play-button mark (inline so it renders at any size, crisp)
export const YouTubeMark = ({ size = 20 }) => (
  <svg width={size} height={(size * 28) / 40} viewBox="0 0 40 28" fill="none" className="shrink-0">
    <rect width="40" height="28" rx="7" fill="#FF0000" />
    <path d="M16.5 8.2 L26.5 14 L16.5 19.8 Z" fill="white" />
  </svg>
);

export default function YouTubeDeploy({ title, description, tags, disabled }) {
  const [deployed, setDeployed] = React.useState(false);

  const deploy = async () => {
    const meta = [title, '', description, '', (tags || []).join(', ')].join('\n');
    try { await navigator.clipboard.writeText(meta); } catch { /* clipboard blocked — still open upload */ }
    window.open('https://www.youtube.com/upload', '_blank');
    setDeployed(true);
    setTimeout(() => setDeployed(false), 4000);
  };

  return (
    <div>
      <button
        onClick={deploy}
        disabled={disabled}
        className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all disabled:opacity-40"
        style={{ background: '#FF0000' }}
      >
        <YouTubeMark size={26} />
        {deployed ? 'Opened YouTube upload — metadata copied' : 'Deploy to YouTube'}
      </button>
      <p className="text-white/35 text-xs mt-2 text-center">
        Copies your title, description & tags, then opens the upload page on your own YouTube channel — paste once, publish.
      </p>
    </div>
  );
}