import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

const KASPLEX_L2_CHAIN_ID = '0x3173b'; // 202555
const KASPLEX_L2_CONFIG = {
  chainId: KASPLEX_L2_CHAIN_ID,
  chainName: 'Kasplex L2',
  nativeCurrency: {
    name: 'KAS',
    symbol: 'KAS',
    decimals: 18
  },
  rpcUrls: ['https://evmrpc.kasplex.org'],
  blockExplorerUrls: ['https://explorer.kasplex.org']
};

export default function WalletInfo({ wallets, onRefresh }) {
  const [isSwitching, setIsSwitching] = React.useState(false);

  const isCorrectNetwork = wallets.metamask.connected && 
    wallets.metamask.chainId === parseInt(KASPLEX_L2_CHAIN_ID, 16);

  const switchToKasplexL2 = async () => {
    setIsSwitching(true);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: KASPLEX_L2_CHAIN_ID }]
      });
      
      if (onRefresh) {
        setTimeout(onRefresh, 500);
      }
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [KASPLEX_L2_CONFIG]
          });
          
          if (onRefresh) {
            setTimeout(onRefresh, 500);
          }
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', switchError);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return 'Not connected';
    return `${addr.substring(0, 8)}......${addr.substring(addr.length - 6)}`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* L1 Wallet Info */}
      <Card className="bg-gray-900 border-orange-900/30">
        <CardHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">L1 Wallet Info</h3>
            <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              kasware
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Connected Wallet:</span>
            <span className="text-white font-semibold">
              {wallets.kasware.connected ? 'kasware' : 'Not connected'}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-400">Address:</span>
            <span className="text-white font-mono text-sm text-right">
              {truncateAddress(wallets.kasware.address)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Amount:</span>
            <span className="text-2xl font-bold text-orange-400">
              {wallets.kasware.connected ? wallets.kasware.balance.toFixed(8) : '0'} KAS
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Network:</span>
            <span className="text-white font-semibold">kaspa_mainnet</span>
          </div>
        </CardContent>
      </Card>

      {/* L2 Wallet Info */}
      <Card className="bg-gray-900 border-cyan-900/30">
        <CardHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">L2 Wallet Info</h3>
            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              MetaMask
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Connected Wallet:</span>
            <span className="text-white font-semibold">
              {wallets.metamask.connected ? 'MetaMask' : 'Not connected'}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-400">Address:</span>
            <span className="text-white font-mono text-sm text-right">
              {truncateAddress(wallets.metamask.address)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Amount:</span>
            <span className="text-2xl font-bold text-cyan-400">
              {wallets.metamask.connected ? wallets.metamask.balance.toFixed(2) : '0'} KAS
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">ChainId:</span>
            <span className="text-white font-mono">
              {wallets.metamask.connected ? `0x${wallets.metamask.chainId.toString(16)}` : '-'}
            </span>
          </div>

          {/* Network Status */}
          {wallets.metamask.connected && (
            <div className="pt-4 border-t border-gray-800">
              {isCorrectNetwork ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Connected to Kasplex L2</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Wrong Network</span>
                  </div>
                  <Button
                    onClick={switchToKasplexL2}
                    disabled={isSwitching}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    size="sm"
                  >
                    {isSwitching ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Switching...
                      </>
                    ) : (
                      'Switch to Kasplex L2'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}