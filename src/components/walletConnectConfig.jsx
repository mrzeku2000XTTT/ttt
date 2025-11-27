import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum } from '@reown/appkit/networks';

// Your Reown Project ID
export const projectId = '0dd7c5af-28c1-48e1-b493-ce959bd82d7a';

// Define Kasplex L2 networks
export const kasplexMainnet = {
  chainId: 324,
  name: 'Kasplex L2 Mainnet',
  currency: 'KAS',
  explorerUrl: 'https://explorer.kasplex.org',
  rpcUrl: 'https://evmrpc.kasplex.org'
};

export const kasplexTestnet = {
  chainId: 167012,
  name: 'Kasplex L2 Testnet',
  currency: 'KAS',
  explorerUrl: 'https://frontend.kasplextest.xyz',
  rpcUrl: 'https://rpc.kasplextest.xyz'
};

// Create wagmi adapter with all networks
export const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, polygon, arbitrum, kasplexMainnet, kasplexTestnet],
  projectId,
});

// App metadata
export const metadata = {
  name: 'TTT Bridge',
  description: 'Transfer KAS between L1 and L2',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://app.base44.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create AppKit modal - Mobile optimized
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, polygon, arbitrum, kasplexMainnet, kasplexTestnet],
  defaultNetwork: kasplexMainnet,
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false,
    swaps: false,
    onramp: false
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#667eea',
    '--w3m-border-radius-master': '12px',
    '--w3m-z-index': '999999'
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  ],
  enableWalletGuide: true,
  enableNetworkView: true,
  enableOnramp: false
});

export const config = wagmiAdapter.wagmiConfig;