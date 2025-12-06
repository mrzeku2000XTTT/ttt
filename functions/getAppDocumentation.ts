import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    // Get comprehensive app documentation
    const documentation = {
      pages: {
        "Send KAS (Bridge)": {
          description: "Send and transfer KAS between Layer-1 (Kasware) and Layer-2 (MetaMask). Connect wallets, view balances, and track transactions in real-time.",
          features: [
            "Connect Kasware wallet for L1 transactions",
            "Connect MetaMask for L2 operations",
            "Real-time balance checking",
            "Transaction history and tracking",
            "Global transaction counter",
            "Proof of Life feature - prove you're alive & building",
            "AI Assistant for help"
          ],
          wallets: ["Kasware (L1)", "MetaMask (L2)"],
          networks: ["Kasplex Layer-2 Mainnet (202555)", "Kasplex Testnet (166260)"]
        },
        "Zeku AI": {
          description: "Premium AI assistant with image recognition, market analysis, real-time intelligence, and proof of life features. Features alien voice text-to-speech and matrix typing mode.",
          features: [
            "Chat with advanced AI",
            "Upload and analyze images/charts",
            "Real-time web intelligence",
            "Matrix typing mode with keyboard sounds",
            "Alien voice text-to-speech for responses",
            "Proof of Life integration",
            "File upload support"
          ],
          premium: true
        },
        "Agent ZK": {
          description: "Create your decentralized identity, connect with other agents, manage your ZK wallet, and access premium tools.",
          features: [
            "Create Agent ZK profile",
            "Connect with other agents",
            "ZK Wallet management",
            "Agent directory",
            "Encrypted messaging",
            "Workspace tools"
          ],
          premium: true
        },
        "TTT Feed": {
          description: "Social feed for the TTT community. Post updates, share thoughts, tip users, and engage with encrypted content.",
          features: [
            "Create posts with images/videos",
            "Like, comment, and reply",
            "Tip users with KAS",
            "Follow other users",
            "Proof of Bullish posts",
            "Badge system",
            "Encrypted notepad"
          ]
        },
        "TTTV (Browser)": {
          description: "Browse and watch YouTube videos by category. Mini-player support for background playback.",
          features: [
            "Browse video categories",
            "Search videos",
            "Embedded player",
            "Mini-player mode",
            "Recently watched history"
          ]
        },
        "Earth": {
          description: "Interactive globe visualization showing countries and their currencies. Click countries to view detailed information.",
          features: [
            "3D particle globe",
            "Country currency information",
            "Capital city details",
            "Interactive country cards"
          ]
        },
        "CountryDetail": {
          description: "View detailed country information including currency, capital (AI-generated image), timezone, population, language, and real-time exchange rates.",
          features: [
            "AI-generated capital city images",
            "Real-time currency exchange rates",
            "Currency converter with 240+ currencies",
            "24h rate changes",
            "Regional currency grouping",
            "Search any currency"
          ]
        },
        "Marketplace": {
          description: "P2P marketplace for buying and selling items with KAS. Create listings, browse products, and make purchases.",
          features: [
            "Create product listings",
            "Browse marketplace",
            "Category filtering",
            "Search functionality",
            "User ratings",
            "KAS payments"
          ]
        },
        "Wallet": {
          description: "Manage your KAS wallet, view balance, and track transactions.",
          features: [
            "View wallet balance",
            "Transaction history",
            "Send/receive KAS",
            "QR code generation"
          ]
        },
        "Subscription": {
          description: "Premium subscription system for TTT. Unlock premium features, Agent ZK, Zeku AI, and more.",
          features: [
            "Premium access",
            "Ad-free experience",
            "Exclusive features",
            "Priority support"
          ]
        },
        "Profile": {
          description: "User profile management. View your wallets, stamped news, TTT ID seals, and DAGKnight verifications.",
          features: [
            "Edit profile",
            "View wallet balances",
            "Stamped news",
            "TTT ID seals",
            "DAGKnight verification",
            "Transaction history"
          ]
        },
        "Area 51": {
          description: "Secret chat room with AI agent integration. Requires check-in with biometric or wallet verification.",
          features: [
            "Real-time chat",
            "AI agent responses",
            "Biometric check-in",
            "Wallet verification",
            "Themed interface"
          ]
        },
        "Arcade": {
          description: "Gaming section with duels and interactive games.",
          features: [
            "Quick draw duels",
            "Multiplayer games",
            "KAS betting",
            "Leaderboards"
          ]
        },
        "Analytics": {
          description: "View platform statistics, user metrics, and transaction data.",
          features: [
            "User analytics",
            "Transaction metrics",
            "Growth charts",
            "Real-time data"
          ]
        }
      },
      features: {
        "Proof of Life": "Submit transactions to yourself to prove you're alive and building. Share to global feed.",
        "TTT ID": "Unique identity sealed with Kaspa wallet signature",
        "DAGKnight": "Premium wallet verification system",
        "Matrix Mode": "Terminal-style typing with keyboard sounds and green text",
        "Alien Voice": "Text-to-speech with alien voice effect for AI responses",
        "Global Counter": "Track total platform transactions toward 1 billion goal",
        "Currency Exchange": "Real-time exchange rates for 240+ currencies"
      },
      wallets: {
        "Kasware": "Layer-1 Kaspa wallet for mainnet transactions",
        "MetaMask": "Layer-2 EVM wallet for Kasplex network",
        "Kastle": "iOS Kaspa wallet",
        "MIST": "MetaMask integration for Mises browser"
      }
    };

    // If query provided, search for relevant info
    if (query) {
      const queryLower = query.toLowerCase();
      const relevant = {};

      Object.entries(documentation.pages).forEach(([name, info]) => {
        const searchText = `${name} ${info.description} ${info.features?.join(' ')}`.toLowerCase();
        if (searchText.includes(queryLower)) {
          relevant[name] = info;
        }
      });

      if (Object.keys(relevant).length > 0) {
        return Response.json({ 
          success: true,
          query,
          results: relevant,
          allPages: documentation.pages
        });
      }
    }

    return Response.json({
      success: true,
      documentation
    });

  } catch (error) {
    console.error('Documentation error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});