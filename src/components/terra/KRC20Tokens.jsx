import React, { useState, useEffect } from "react";
import { RefreshCw, Coins, ArrowUpRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";

// Kasplex token icon CDN
const getTokenLogo = (tick) => {
  if (!tick) return null;
  return `https://kasplex-indexer.s3.us-east-1.amazonaws.com/icon/${tick.toUpperCase()}`;
};

const KNOWN_LOGOS = {
  PACMAN: 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8b3362e0b_image.png',
};

export default function KRC20Tokens({ walletAddress, onSendToken }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    if (walletAddress) loadTokens();
  }, [walletAddress]);

  const loadTokens = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('krc20Transfer', {
        action: 'balance',
        address: walletAddress,
      });
      const result = res.data?.result || [];
      const parsed = Array.isArray(result) ? result : [];
      setTokens(parsed);
    } catch (err) {
      console.error('KRC-20 balance error:', err);
      setError('Failed to load tokens');
      setTokens([]);
    }
    setLoading(false);
  };

  const formatBalance = (balance, dec = 8) => {
    if (!balance) return '0';
    const num = parseInt(balance) / Math.pow(10, parseInt(dec) || 8);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  const handleImgError = (tick) => {
    setImgErrors(prev => ({ ...prev, [tick]: true }));
  };

  const getEffectiveLogo = (tick) => {
    if (imgErrors[tick] && KNOWN_LOGOS[tick?.toUpperCase()]) return KNOWN_LOGOS[tick.toUpperCase()];
    if (imgErrors[tick]) return null;
    return getTokenLogo(tick);
  };

  return (
    <div style={{ margin: '0 16px 20px', fontFamily: SF }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coins size={16} color="rgba(255,255,255,0.5)" />
          <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>KRC-20 Tokens</span>
        </div>
        <button onClick={loadTokens} disabled={loading}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && tokens.length === 0 ? (
        <div style={{ background: '#0d0d0d', borderRadius: 14, padding: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading tokens...</div>
        </div>
      ) : error ? (
        <div style={{ background: '#0d0d0d', borderRadius: 14, padding: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{error}</div>
        </div>
      ) : tokens.length === 0 ? (
        <div style={{ background: '#0d0d0d', borderRadius: 14, padding: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No KRC-20 tokens found</div>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 4 }}>Tokens will appear here when received</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tokens.map((token, idx) => {
            const tick = token.tick || '??';
            const logoUrl = getTokenLogo(tick);
            const hasImgError = imgErrors[tick];

            return (
              <div key={idx} style={{
                background: '#0d0d0d', borderRadius: 14, padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12
              }}>
                {/* Token logo */}
                {(() => {
                  const effectiveLogo = getEffectiveLogo(tick);
                  return (
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, flexShrink: 0, overflow: 'hidden',
                      background: !effectiveLogo ? 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))' : '#1c1c1e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {effectiveLogo ? (
                        <img
                          src={effectiveLogo}
                          alt={tick}
                          style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 18 }}
                          onError={() => handleImgError(tick)}
                        />
                      ) : (
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>{tick.slice(0, 4)}</span>
                      )}
                    </div>
                  );
                })()}

                {/* Token info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{tick}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>KRC-20</div>
                </div>

                {/* Balance */}
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                    {formatBalance(token.balance, token.dec)}
                  </div>
                </div>

                {/* Send button */}
                {onSendToken && (
                  <button
                    onClick={() => onSendToken({
                      tick,
                      balance: token.balance,
                      dec: token.dec || 8,
                      logo: hasImgError ? null : logoUrl,
                    })}
                    style={{
                      background: '#1a73e8', border: 'none', borderRadius: 10,
                      padding: '6px 10px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: 4, flexShrink: 0
                    }}
                  >
                    <ArrowUpRight size={14} color="white" />
                    <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>Send</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}