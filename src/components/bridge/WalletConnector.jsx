
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Check, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WalletConnector({ onWalletsConnected }) {
  const [wallets, setWallets] = useState({
    kasware: { connected: false, address: null, balance: 0, tokens: [] },
    metamask: { connected: false, address: null, balance: 0, tokens: [], chainId: null, networkName: null }
  });
  
  const [loading, setLoading] = useState({ kasware: false, metamask: false });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchERC20Tokens = useCallback(async (address) => {
    try {
      // Example ERC-20 tokens
      const tokenContracts = [
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'USDT',
          decimals: 6
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          decimals: 6
        }
      ];

      const tokens = [];
      
      for (const token of tokenContracts) {
        try {
          const balanceHex = await window.ethereum.request({
            method: 'eth_call',
            params: [{
              to: token.address,
              data: '0x70a08231000000000000000000000000' + address.slice(2)
            }, 'latest']
          });
          
          const balance = parseInt(balanceHex, 16) / Math.pow(10, token.decimals);
          
          if (balance > 0) {
            tokens.push({
              ...token,
              balance
            });
          }
        } catch (err) {
          console.error(`Error fetching ${token.symbol}:`, err);
        }
      }

      return tokens;
    } catch (err) {
      console.error('Error fetching ERC-20 tokens:', err);
      return [];
    }
  }, []);

  const connectMetaMask = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not installed. Please install MetaMask extension from metamask.io');
      return;
    }

    setLoading(prev => ({ ...prev, metamask: true }));
    setError(null);

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get current network info
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      const chainIdDecimal = parseInt(chainId, 16);
      
      // Map known networks
      let networkName = 'Unknown Network';
      const networks = {
        '202555': 'Kasplex L2',
        '167012': 'Kasplex Testnet'
      };
      
      networkName = networks[chainIdDecimal] || `Chain ${chainIdDecimal}`;

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });

      const balanceInEth = parseInt(balance, 16) / 1e18;

      // Fetch ERC-20 tokens
      const tokens = await fetchERC20Tokens(accounts[0]);

      setWallets(prev => ({
        ...prev,
        metamask: {
          connected: true,
          address: accounts[0],
          balance: balanceInEth,
          tokens: tokens,
          chainId: chainIdDecimal,
          networkName: networkName
        }
      }));

      console.log('✅ MetaMask connected:', networkName, `(Chain ${chainIdDecimal})`);

    } catch (err) {
      console.error('MetaMask connection error:', err);
      if (err.code === 4001) {
        setError('Connection cancelled. Please try again.');
      } else {
        setError(err.message || 'Failed to connect MetaMask. Please ensure you have MetaMask installed and try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, metamask: false }));
    }
  }, [fetchERC20Tokens]);

  const connectKasware = useCallback(async () => {
    if (typeof window.kasware === 'undefined') {
      setError('Kasware not installed. Please install Kasware extension from kasware.xyz');
      return;
    }

    setLoading(prev => ({ ...prev, kasware: true }));
    setError(null);

    try {
      const accounts = await window.kasware.requestAccounts();
      
      const balanceResult = await window.kasware.getBalance();
      const balance = balanceResult.total || 0;

      setWallets(prev => ({
        ...prev,
        kasware: {
          connected: true,
          address: accounts[0],
          balance: balance / 1e8,
          tokens: []
        }
      }));

      console.log('✅ Kasware connected successfully');

    } catch (err) {
      console.error('Kasware connection error:', err);
      if (err.code === 4001) {
        setError('Connection cancelled. Please try again.');
      } else {
        setError(err.message || 'Failed to connect Kasware. Please ensure you have Kasware installed and try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, kasware: false }));
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    setRefreshing(true);
    try {
      if (wallets.metamask.connected) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [wallets.metamask.address, 'latest']
        });
        const balanceInEth = parseInt(balance, 16) / 1e18;
        const tokens = await fetchERC20Tokens(wallets.metamask.address);
        
        setWallets(prev => ({
          ...prev,
          metamask: {
            ...prev.metamask,
            balance: balanceInEth,
            tokens: tokens
          }
        }));
      }

      if (wallets.kasware.connected) {
        const balanceResult = await window.kasware.getBalance();
        const balance = balanceResult.total || 0;
        
        setWallets(prev => ({
          ...prev,
          kasware: {
            ...prev.kasware,
            balance: balance / 1e8
          }
        }));
      }
    } catch (err) {
      console.error('Error refreshing balances:', err);
    } finally {
      setRefreshing(false);
    }
  }, [wallets.metamask.connected, wallets.metamask.address, wallets.kasware.connected, fetchERC20Tokens]);

  const autoConnect = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectMetaMask();
        }
      } catch (err) {
        console.error('Auto-connect MetaMask failed:', err);
      }
    }

    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          await connectKasware();
        }
      } catch (err) {
        console.error('Auto-connect Kasware failed:', err);
      }
    }
  }, [connectMetaMask, connectKasware]);

  useEffect(() => {
    autoConnect();
  }, [autoConnect]);

  useEffect(() => {
    if (onWalletsConnected) {
      onWalletsConnected(wallets);
    }
  }, [wallets, onWalletsConnected]);

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          connectMetaMask();
        } else {
          setWallets(prev => ({
            ...prev,
            metamask: { connected: false, address: null, balance: 0, tokens: [], chainId: null, networkName: null }
          }));
        }
      };

      const handleChainChanged = () => {
        console.log('Chain changed, reconnecting...');
        connectMetaMask();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectMetaMask]);

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end mb-2">
        {(wallets.kasware.connected || wallets.metamask.connected) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBalances}
            disabled={refreshing}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Kasware Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-cyan-500/20 flex items-center justify-center">
                    <span className="text-lg text-cyan-400">K</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Kasware</h3>
                    <p className="text-xs text-gray-400">Kaspa L1</p>
                  </div>
                </div>
                {wallets.kasware.connected && (
                  <div className="flex items-center gap-2 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-cyan-400">Connected</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {wallets.kasware.connected ? (
                <div className="space-y-3">
                  <div className="backdrop-blur-xl bg-black/20 border border-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Address</div>
                    <div className="font-mono text-xs text-gray-300">
                      {truncateAddress(wallets.kasware.address)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Balance</div>
                    <div className="text-2xl font-bold text-white">
                      {wallets.kasware.balance.toFixed(4)}
                      <span className="text-sm text-gray-400 ml-2">KAS</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={connectKasware}
                  disabled={loading.kasware}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-11 font-semibold shadow-lg shadow-cyan-500/50"
                >
                  {loading.kasware ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Kasware
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* MetaMask Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-cyan-500/20 flex items-center justify-center">
                    <span className="text-lg text-cyan-400">M</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">MetaMask</h3>
                    <p className="text-xs text-gray-400">
                      {wallets.metamask.connected ? wallets.metamask.networkName : 'Kasplex L2'}
                    </p>
                  </div>
                </div>
                {wallets.metamask.connected && (
                  <div className="flex items-center gap-2 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-cyan-400">Connected</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {wallets.metamask.connected ? (
                <div className="space-y-3">
                  <div className="backdrop-blur-xl bg-black/20 border border-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Address</div>
                    <div className="font-mono text-xs text-gray-300">
                      {truncateAddress(wallets.metamask.address)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Balance</div>
                    <div className="text-2xl font-bold text-white">
                      {wallets.metamask.balance.toFixed(4)}
                      <span className="text-sm text-gray-400 ml-2">KAS</span>
                    </div>
                  </div>
                  {wallets.metamask.tokens.length > 0 && (
                    <div className="backdrop-blur-xl bg-black/20 border border-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Tokens</div>
                      <div className="space-y-2">
                        {wallets.metamask.tokens.map((token, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">{token.symbol}</span>
                            <span className="font-semibold text-white text-xs">
                              {token.balance.toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={connectMetaMask}
                  disabled={loading.metamask}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-11 font-semibold shadow-lg shadow-cyan-500/50"
                >
                  {loading.metamask ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
