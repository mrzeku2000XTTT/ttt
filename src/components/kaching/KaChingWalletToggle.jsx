import React, { useState, useEffect } from "react";
import { Zap, Crown } from "lucide-react";

const KACHING_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2c211776c_generated_image.png";

/**
 * KaChing toggle for any wallet page.
 * Shows ON/OFF based on whether `kaching_linked_wallet` matches the given address.
 * Toggling ON sets this address as the active KaChing wallet + enables autosign.
 * Toggling OFF clears kaching settings.
 *
 * Props:
 *  - walletAddress: string (full kaspa:xxx address)
 *  - hasMnemonic: boolean (whether this wallet has signing capability)
 *  - compact: boolean (smaller layout for sidebars)
 */
export default function KaChingWalletToggle({ walletAddress, hasMnemonic = false, compact = false }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    sync();
    // Listen for storage changes from other tabs/pages
    const handler = () => sync();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [walletAddress]);

  const sync = () => {
    if (!walletAddress) { setIsActive(false); return; }
    const linked = localStorage.getItem('kaching_linked_wallet');
    const autosign = localStorage.getItem('kaching_autosign') === 'true';
    // Normalize both to compare
    const norm = (a) => a?.replace('kaspa:', '') || '';
    setIsActive(autosign && norm(linked) === norm(walletAddress));
  };

  const toggle = () => {
    if (!walletAddress) return;
    if (!hasMnemonic) return; // Can't enable without signing key

    if (isActive) {
      // Turn OFF
      localStorage.setItem('kaching_autosign', 'false');
      localStorage.removeItem('kaching_linked_wallet');
      localStorage.removeItem('kaching_verified');
      localStorage.removeItem('stakedag_wallet');
      setIsActive(false);
    } else {
      // Turn ON — link this wallet
      localStorage.setItem('kaching_linked_wallet', walletAddress);
      localStorage.setItem('kaching_autosign', 'true');
      localStorage.setItem('kaching_verified', 'true');
      const clean = walletAddress.replace('kaspa:', '');
      localStorage.setItem('stakedag_wallet', clean);
      setIsActive(true);
    }
    // Dispatch storage event so other open tabs pick up the change
    window.dispatchEvent(new Event('storage'));
  };

  if (!walletAddress) return null;

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={!hasMnemonic}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all w-full ${
          isActive
            ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
            : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/15'
        } ${!hasMnemonic ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <img src={KACHING_LOGO} alt="" className="w-5 h-5 rounded-lg" />
        <span className="text-xs font-bold flex-1 text-left">KaChing</span>
        <div className={`w-9 h-5 rounded-full flex items-center transition-all ${isActive ? 'bg-violet-500 justify-end' : 'bg-white/10 justify-start'}`}>
          <div className={`w-4 h-4 rounded-full mx-0.5 transition-all ${isActive ? 'bg-white' : 'bg-white/40'}`} />
        </div>
      </button>
    );
  }

  return (
    <div className={`rounded-xl border transition-all ${
      isActive ? 'bg-violet-500/8 border-violet-500/20' : 'bg-white/[0.02] border-white/[0.06]'
    }`}>
      <button
        onClick={toggle}
        disabled={!hasMnemonic}
        className={`w-full flex items-center gap-3 p-3.5 text-left ${!hasMnemonic ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <img src={KACHING_LOGO} alt="KaChing" className="w-10 h-10 rounded-xl ring-2 ring-violet-500/20" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-sm font-bold">KaChing Betting</span>
            <Zap className="w-3 h-3 text-violet-400" />
          </div>
          <p className="text-white/30 text-[10px] mt-0.5">
            {isActive
              ? 'Active — bets send real KAS from this wallet'
              : hasMnemonic
                ? 'Enable to use this wallet for KaChing predictions'
                : 'Import seed phrase to enable KaChing'
            }
          </p>
        </div>
        <div className={`w-11 h-6 rounded-full flex items-center transition-all flex-shrink-0 ${isActive ? 'bg-violet-500 justify-end' : 'bg-white/10 justify-start'}`}>
          <div className={`w-5 h-5 rounded-full mx-0.5 transition-all ${isActive ? 'bg-white' : 'bg-white/40'}`} />
        </div>
      </button>
      {!hasMnemonic && (
        <p className="px-3.5 pb-3 text-amber-400/60 text-[10px]">
          ⚠ This wallet needs a seed phrase to sign KaChing transactions
        </p>
      )}
    </div>
  );
}