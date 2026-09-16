import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Store } from 'lucide-react';

/**
 * Shared in-app header nav used by every new app page:
 * a link to the app's white docs page (/AppDocs/<appPath>) and Exit to Store.
 * Rendered in the header flow — never as a floating overlay.
 */
export default function AppHeaderNav({ appPath }) {
  const navigate = useNavigate();

  const exit = () => {
    try {
      localStorage.removeItem('came_from_categories');
    } catch {}
    navigate('/AppStoreV2');
  };

  const pill =
    'inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 h-8 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white hover:border-white/40 transition-colors';

  return (
    <div className="flex items-center gap-1.5">
      <Link to={`/AppDocs/${appPath}`} className={pill} title="How-to docs">
        <FileText className="w-3 h-3" />
        <span className="hidden sm:inline">docs</span>
      </Link>
      <button onClick={exit} className={pill} title="Exit to Store">
        <Store className="w-3 h-3" />
        <span className="hidden sm:inline">exit to store</span>
      </button>
    </div>
  );
}