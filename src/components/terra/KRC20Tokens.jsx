import React, { useState, useEffect } from "react";
import { RefreshCw, Coins } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";

export default function KRC20Tokens({ walletAddress }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Kasplex API returns array of token objects
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
          {tokens.map((token, idx) => (
            <div key={idx} style={{
              background: '#0d0d0d', borderRadius: 14, padding: '12px 14px',
              border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12, fontWeight: 800
              }}>
                {(token.tick || '??').slice(0, 3)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{token.tick || 'Unknown'}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>KRC-20</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                  {formatBalance(token.balance, token.dec)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}