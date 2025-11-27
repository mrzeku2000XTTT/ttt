import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

const MAINNET_CHAIN_ID = 202555;
const TESTNET_CHAIN_ID = 202555; // Same chain ID, different RPC

const NETWORKS = {
  mainnet: {
    name: "Kasplex L2 Mainnet",
    rpcUrl: "https://evmrpc.kasplex.org",
    chainId: MAINNET_CHAIN_ID,
    badge: "Production"
  },
  testnet: {
    name: "Kasplex L2 Testnet",
    rpcUrl: "https://evmrpc-testnet.kasplex.org",
    chainId: TESTNET_CHAIN_ID,
    badge: "Testing"
  }
};

export default function NetworkSwitcher({ currentNetwork, onNetworkChange }) {
  const [isMainnet, setIsMainnet] = useState(currentNetwork === 'mainnet');

  const switchNetwork = async (network) => {
    const config = NETWORKS[network];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + config.chainId.toString(16) }],
      });
      
      setIsMainnet(network === 'mainnet');
      if (onNetworkChange) onNetworkChange(network);
      
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge
        variant="outline"
        className={isMainnet 
          ? "bg-green-500/20 text-green-300 border-green-500/30" 
          : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
        }
      >
        {isMainnet ? "Mainnet" : "Testnet"}
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => switchNetwork(isMainnet ? 'testnet' : 'mainnet')}
        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
      >
        Switch to {isMainnet ? "Testnet" : "Mainnet"}
      </Button>
    </div>
  );
}