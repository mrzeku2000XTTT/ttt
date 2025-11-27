import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, CheckCircle2, X, Wallet, Copy, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function WalletConnectMobileButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [showQRInstructions, setShowQRInstructions] = useState(false);

  const PROJECT_ID = '0dd7c5af-28c1-48e1-b493-ce959bd82d7a';

  useEffect(() => {
    checkMobile();
    loadConnectedAddress();
    loadWalletConnectScript();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;
    setIsMobile(mobile);
  };

  const loadConnectedAddress = async () => {
    try {
      const user = await base44.auth.me();
      if (user.walletconnect_address) {
        setConnectedAddress(user.walletconnect_address);
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Failed to load WalletConnect address:', err);
    }
  };

  const loadWalletConnectScript = () => {
    if (window.WalletConnectProvider) {
      console.log('✅ WalletConnect already loaded');
      setIsLoading(false);
      return;
    }

    console.log('📦 Loading WalletConnect script...');

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ WalletConnect script loaded successfully');
      setIsLoading(false);
      setError(null);
    };

    script.onerror = (err) => {
      console.error('❌ Failed to load WalletConnect script:', err);
      setError('Failed to load WalletConnect library. Please refresh the page.');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  };

  const handleConnect = async () => {
    if (!window.WalletConnectProvider) {
      setError('WalletConnect is still loading. Please wait a moment and try again.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSuccess(null);
    setShowQRInstructions(true);

    try {
      console.log('🔗 Initializing WalletConnect provider...');

      const WalletConnectProvider = window.WalletConnectProvider.default || window.WalletConnectProvider;

      const wcProvider = new WalletConnectProvider({
        infuraId: PROJECT_ID,
        rpc: {
          1: 'https://eth.llamarpc.com',
          137: 'https://polygon-rpc.com',
          56: 'https://bsc-dataseed.binance.org',
          42161: 'https://arb1.arbitrum.io/rpc',
          8453: 'https://mainnet.base.org',
          324: 'https://evmrpc.kasplex.org',
          167012: 'https://rpc.kasplextest.xyz'
        },
        chainId: 1,
        qrcodeModalOptions: {
          mobileLinks: [
            'metamask',
            'trust',
            'rainbow',
            'coinbase',
            'phantom',
            'argent',
            'imtoken',
            'pillar',
            'tokenpocket',
            'safepal'
          ],
          desktopLinks: [
            'metamask',
            'trust',
            'rainbow',
            'coinbase'
          ]
        }
      });

      console.log('✅ Provider initialized, calling enable()...');
      console.log('📱 QR Modal should appear now - scan with MetaMask or another wallet app');

      // Add connection event listeners BEFORE enabling
      wcProvider.on('connect', (error, payload) => {
        console.log('🎉 WalletConnect connect event:', { error, payload });
        if (payload) {
          console.log('📝 Payload accounts:', payload.params[0].accounts);
          console.log('📝 Payload chainId:', payload.params[0].chainId);
        }
      });

      wcProvider.on('session_update', (error, payload) => {
        console.log('🔄 WalletConnect session_update:', { error, payload });
      });

      wcProvider.on('disconnect', (error, payload) => {
        console.log('❌ WalletConnect disconnect event:', { error, payload });
      });

      // Enable connection
      await wcProvider.enable();

      console.log('✅ Enable completed!');
      console.log('📱 Connected accounts:', wcProvider.accounts);
      console.log('⛓️ Connected chainId:', wcProvider.chainId);

      const accounts = wcProvider.accounts;
      const chain = wcProvider.chainId;

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        console.log('✅ Successfully connected!', { address, chainId: chain });

        setConnectedAddress(address);
        setChainId(chain);
        setIsConnected(true);
        setProvider(wcProvider);
        setShowQRInstructions(false);

        // Save to profile
        await base44.auth.updateMe({
          walletconnect_address: address
        });

        setSuccess(`✅ Connected to ${getNetworkName(chain)}`);

        // Listen for future events
        wcProvider.on('accountsChanged', async (accounts) => {
          console.log('🔄 Accounts changed:', accounts);
          if (accounts.length > 0) {
            setConnectedAddress(accounts[0]);
            await base44.auth.updateMe({ walletconnect_address: accounts[0] });
          } else {
            handleDisconnectInternal();
          }
        });

        wcProvider.on('chainChanged', (chainId) => {
          console.log('🔄 Chain changed:', chainId);
          setChainId(chainId);
        });

        wcProvider.on('disconnect', () => {
          console.log('❌ Disconnected');
          handleDisconnectInternal();
        });

      } else {
        throw new Error('No accounts returned from wallet after scanning');
      }

    } catch (err) {
      console.error('❌ Connection error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      let errorMessage = err.message || 'Failed to connect';
      
      // Don't show error for user cancellation
      if (errorMessage.includes('User closed modal') || 
          errorMessage.includes('User rejected') ||
          errorMessage.includes('User cancelled') ||
          errorMessage.includes('Modal closed by user')) {
        console.log('ℹ️ User cancelled connection');
        setError(null);
        setShowQRInstructions(false);
      } else {
        setError(errorMessage);
        setShowQRInstructions(false);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectInternal = () => {
    setIsConnected(false);
    setConnectedAddress(null);
    setChainId(null);
    setProvider(null);
    setShowQRInstructions(false);
  };

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Disconnecting...');

      if (provider && provider.disconnect) {
        await provider.disconnect();
      }

      await base44.auth.updateMe({
        walletconnect_address: null
      });

      handleDisconnectInternal();
      setSuccess('Disconnected successfully');
      
    } catch (err) {
      console.error('❌ Disconnect error:', err);
      setError('Failed to disconnect properly');
      handleDisconnectInternal();
    }
  };

  const handleCopyAddress = () => {
    if (connectedAddress) {
      navigator.clipboard.writeText(connectedAddress);
      setSuccess('Address copied!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (id) => {
    const networks = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      8453: 'Base',
      324: 'Kasplex L2 Mainnet',
      167012: 'Kasplex L2 Testnet'
    };
    return networks[id] || `Chain ${id}`;
  };

  // Desktop/Any device can use WalletConnect
  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <svg width="24" height="24" viewBox="0 0 512 512" fill="none">
                <path d="M169.209 184.531C241.041 112.699 355.542 112.699 427.374 184.531L437.053 194.209C440.842 197.999 440.842 204.268 437.053 208.057L404.448 240.662C402.554 242.557 399.474 242.557 397.579 240.662L384.241 227.324C334.678 177.761 255.905 177.761 206.342 227.324L192.099 241.567C190.204 243.462 187.124 243.462 185.23 241.567L152.625 208.962C148.835 205.173 148.835 198.904 152.625 195.114L169.209 184.531ZM467.543 249.952L497.099 279.508C500.889 283.297 500.889 289.567 497.099 293.356L369.738 420.717C365.949 424.506 359.679 424.506 355.90 420.717L256.919 321.746C255.972 320.799 254.41 320.799 253.463 321.746L154.492 420.717C150.703 424.506 144.433 424.506 140.644 420.717L13.283 293.356C9.49364 289.567 9.49364 283.297 13.283 279.508L42.839 249.952C46.6284 246.163 52.898 246.163 56.6873 249.952L155.658 348.923C156.605 349.87 158.167 349.87 159.114 348.923L258.085 249.952C261.874 246.163 268.144 246.163 271.933 249.952L370.904 348.923C371.851 349.87 373.413 349.87 374.36 348.923L473.331 249.952C477.121 246.163 483.39 246.163 487.18 249.952H467.543Z" fill="white"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">WalletConnect</h3>
              <p className="text-xs text-gray-400">
                {isConnected ? 'Wallet Connected' : 'Scan QR Code'}
              </p>
            </div>
          </div>
          {isConnected && (
            <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-400">Connected</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
              <p className="text-white font-semibold">Loading WalletConnect...</p>
              <p className="text-xs text-gray-400 mt-2">Please wait</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isLoading && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-300 font-semibold">Error</p>
              <p className="text-xs text-red-200 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        {!isLoading && (
          <>
            {isConnecting || showQRInstructions ? (
              <div className="space-y-4 py-6">
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-white font-semibold mb-2">QR Code Modal Should Appear</p>
                  <p className="text-sm text-gray-400 mb-4">
                    A popup window should have appeared with a QR code
                  </p>
                </div>

                <div className="backdrop-blur-xl bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-cyan-300 mb-3">📱 How to scan:</h4>
                  <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Open MetaMask on your other phone</li>
                    <li>Tap the scanner icon (top left usually)</li>
                    <li>Point your camera at the QR code on this screen</li>
                    <li>Approve the connection in MetaMask</li>
                    <li>Wait for confirmation here</li>
                  </ol>
                </div>

                <div className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-yellow-300 mb-2">⚠️ Don't see the QR code popup?</h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Check if a popup blocker is preventing it. Look for:
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>A blocked popup indicator in your browser's address bar</li>
                    <li>Browser popup settings that need to allow this site</li>
                    <li>An ad blocker that might be blocking it</li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    setIsConnecting(false);
                    setShowQRInstructions(false);
                  }}
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            ) : isConnected ? (
              <div className="space-y-4">
                {/* Connected Address */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500 font-semibold">Connected Address</div>
                    <Button
                      onClick={handleCopyAddress}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="text-white font-mono text-sm block bg-black/30 px-3 py-2 rounded border border-white/10">
                    {shortenAddress(connectedAddress)}
                  </code>
                  {chainId && (
                    <div className="mt-2 text-xs text-gray-500">
                      Network: <span className="text-cyan-400">{getNetworkName(chainId)}</span>
                    </div>
                  )}
                </div>

                {/* Disconnect Button */}
                <Button
                  onClick={handleDisconnect}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white h-12 rounded-xl font-semibold shadow-lg shadow-red-500/30"
                >
                  <X className="w-4 h-4 mr-2" />
                  Disconnect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Connect Button */}
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white h-14 rounded-xl font-bold shadow-lg shadow-purple-500/50 text-base disabled:opacity-50"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Show QR Code to Connect
                </Button>

                {/* Supported Wallets */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    Compatible Wallets
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'MetaMask', 'Trust Wallet', 'Rainbow', 'Coinbase', 
                      'Phantom', 'SafePal', 'TokenPocket', 'imToken'
                    ].map((wallet) => (
                      <span 
                        key={wallet} 
                        className="text-xs px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-gray-300 font-medium"
                      >
                        {wallet}
                      </span>
                    ))}
                  </div>
                </div>

                {/* How It Works */}
                <div className="backdrop-blur-xl bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-purple-300 mb-3">ℹ️ How it works</h4>
                  <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Click "Show QR Code to Connect" above</li>
                    <li>A popup with QR code will appear</li>
                    <li>Open MetaMask on another device</li>
                    <li>Scan the QR code with MetaMask's scanner</li>
                    <li>Approve the connection</li>
                    <li>You're connected! 🎉</li>
                  </ol>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}