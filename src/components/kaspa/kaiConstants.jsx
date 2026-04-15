// KAI Constants — keywords, facts, app directory, prompts

export const STORAGE_KEY = "kaspa_avatar_video_url";
export const DEFAULT_AVATAR_IMG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png";
export const DEFAULT_VIDEO_URL = "https://base44.app/api/apps/6901295fa9bcfaa0f5ba2c2a/files/mp/public/6901295fa9bcfaa0f5ba2c2a/603409cb0_animation1.mp4";

export const KAI_THINKING_PHRASES = [
  "Scanning the blockDAG…",
  "Consulting the GHOSTDAG…",
  "Mining some knowledge…",
  "Checking the mempool…",
  "Traversing the DAG…",
  "Processing blocks…",
  "Syncing with Kaspa nodes…",
  "Thinking at 10 BPS…",
  "Querying the network…",
  "Reading the chain…",
];

export const KAI_FACTS = [
  "Kaspa runs at 10 BPS — live! 🔷",
  "blockDAG = parallel blocks ⚡",
  "No premine. No ICO. Fair launch.",
  "10 blocks per second, 1s finality!",
  "GHOSTDAG orders all blocks 🧠",
  "kHeavyHash = optical GPU mining ⛏️",
  "KRC-20 tokens are live on Kaspa",
  "32 BPS target on the roadmap 🚀",
  "Rusty Kaspa node rewrite is live",
  "Kaspa = fastest PoW crypto",
  "DAGKnight consensus is coming",
  "Kaspa smart contracts in development",
];

export const TTT_APP_DOCS = `TTT PLATFORM — COMPLETE APP DIRECTORY (use these exact descriptions):
- TTT Feed: Community social feed — posts, comments, media uploads, KAS tipping (including KRC-20 multi-token tips), Kaspa stamps, likes, threaded replies
- Agent ZK: Cryptographic wallet-based identity system — users verify ownership of Kasware, MetaMask, and TTT wallets to create a DAGKnight certificate. NOT an AI agent.
- TTTV: Built-in media browser and YouTube player — watch videos ad-free inside TTT. NOT for creating content.
- Send KAS (Bridge): Transfer KAS between L1 (Kasware) and L2 (Kasplex/MetaMask). Cross-layer bridge.
- StakeDAG: Prediction markets with escrow — bet on outcomes using KAS
- KA-CHING: Automated betting engine with live games and rounds
- DAGKnight Wallet: Advanced multi-wallet management with verification DAG and blue-score system
- Hikaru: AI image generation studio — generate images from text prompts. This is for IMAGE GENERATION.
- Xunhua: AI sketch-to-image studio — draw on a canvas and AI renders it into a full image. This is for DRAWING + AI rendering.
- Zeku AI: Premium AI assistant with advanced capabilities
- Terra: Kaspa WALLET manager — create wallets from mnemonic seed phrases, manage multiple wallets, send/receive KAS, view KRC-20 tokens, check balances. Terra is a WALLET app, NOT for image generation or AI.
- App Store: 80+ community-built apps and tools
- Encrypted Notepad: Private encrypted notes secured by your identity
- NFT Mint: Create and mint NFTs on Kaspa
- Stamped News: Blockchain-verified news publishing with Kasware signatures
- Bull Reels: Short-form video content feed
- Kaspa Node Map: Visual map of Kaspa network nodes worldwide
- K-University / KaSkool / Courses: Educational platform for learning about Kaspa and crypto
- Shop: Buy items with KAS
- Marketplace: P2P marketplace for buying/selling with KAS
- TTT ID: Register a unique identity tied to your Kaspa wallet
- DAG Feed: Alternative feed focused on DAG-related content
- Global History: Track global Kaspa network transactions toward milestones
- Arcade: Games including Tetris Battle, Bingo, PacMan
- KivR: IVR/phone system with Kaspa wallet integration
- Canvas: Template design studio
- Countdown: Kaspa milestone countdown timer
- Profile: User profile management
- Categories: Customizable app dashboard with drag-and-drop organization
- Subscription: Premium subscription management
- Prompto: AI prompt engineering tool
- Cinekas: Movie/cinema browser
- Speed: Quick image generation
- Farlands: Exploration game
- Klock: Clock/timer utility
- Security Audit: App security scanning tool
- Window: Embedded web browser
- Freedom: Privacy-focused tools
- Voxa: Voice/audio tools
- V1: Legacy version viewer

IMPORTANT CORRECTIONS — DO NOT CONFUSE THESE:
- Terra = WALLET (seed phrases, send KAS, KRC-20 tokens). NOT image generation.
- Hikaru = AI IMAGE generation from text. NOT a wallet.
- Xunhua = AI SKETCH-to-image (canvas drawing). NOT a wallet.
- Agent ZK = IDENTITY verification. NOT an AI chatbot.
- Zeku AI = Premium AI ASSISTANT. Different from Agent ZK.
- TTTV = VIDEO player/browser. NOT for creating videos.`;

export const IMAGE_KEYWORDS = [
  'draw', 'sketch', 'paint', 'create image', 'generate image', 'make image',
  'make a picture', 'create a picture', 'design', 'illustrate', 'artwork',
  "let's draw", 'lets draw', 'can you draw', 'draw me', 'draw a', 'draw an',
  'show me', 'visualize', 'picture of', 'image of', 'art of', 'xunhua'
];

export const KASPA_NEWS_KEYWORDS = [
  'kaspa news', 'latest post', 'recent post', 'kaspa posts', 'x posts',
  'twitter posts', 'kaspa tweets', 'latest tweets', 'recent tweets',
  'show me posts', 'list posts', 'kaspa x', 'news posts', 'what are people posting',
  'latest kaspa', 'recent kaspa news', 'kaspa feed',
  "what's the latest", "whats the latest", "what's happening", "whats happening",
  'builder news', 'builder tweets', 'developer news', 'developer tweets',
  'kaspa videos', 'kaspa youtube', 'kaspa reddit', 'reddit posts',
  'ai pulse', 'pulse report', 'ai summary', 'kaspa digest',
  'community posts', 'show me news', 'any news'
];

export const SEARCH_KEYWORDS = [
  'search', 'google', 'look up', 'lookup', 'find out', 'who is',
  'when did', 'price of', 'latest news',
  'news about', 'search for', 'research'
];

export const FEED_KEYWORDS = [
  'ttt feed', 'latest posts', 'recent posts', 'whats on the feed',
  "what's on the feed", 'check feed', 'examine feed', 'what are people saying',
  'community posts', 'ttt posts', 'show me the feed'
];

export const USER_POST_KEYWORDS = [
  'posts by', 'analyze user', 'user posts',
  'examine posts', 'who posted', 'show me posts from', 'check posts'
];

export const TRAIN_KEYWORDS = [
  'train yourself', 'train on this', 'learn this', 'study this', 'read this',
  'watch this', 'ingest this', 'memorize this', 'remember this', 'learn from',
  'train on', 'study from', 'read from', 'learn about this', 'absorb this',
];

export const BUILD_KEYWORDS = [
  'build', 'code', 'create a function', 'write a function', 'make a function',
  'automate', 'build me', 'code me', 'create a script', 'write code',
  'morning brief', 'build a', 'create an automation', 'deploy',
  'now build', 'build based on', 'make a bot', 'write a bot',
];

export const BRAIN_KEYWORDS = [
  'what do you know', 'show me your brain', 'show your brain', 'your knowledge',
  'what have you learned', 'your memory', 'show memory', 'list knowledge',
  'what did you learn', 'knowledge base',
];

export const BROWSE_KEYWORDS = [
  'browse', 'search for', 'look up', 'lookup', 'go to site', 'open link',
  'open site', 'open website', 'navigate to site', 'visit', 'load site',
  'google', 'find me', 'check out site', 'show me site'
];

export const APP_DIRECTORY = [
  { names: ['hikaru'], path: 'Hikaru', label: 'Hikaru 🖼️', desc: 'AI image generation studio' },
  { names: ['xunhua', 'xùnhuà'], path: 'Xunhua', label: 'Xunhua 🎨', desc: 'AI sketch-to-image studio' },
  { names: ['terra'], path: 'Terra', label: 'Terra 💰', desc: 'Kaspa wallet manager' },
  { names: ['feed', 'ttt feed'], path: 'Feed', label: 'TTT Feed 📝', desc: 'Community social feed' },
  { names: ['agent zk', 'agentzk', 'zk'], path: 'AgentZK', label: 'Agent ZK 🔐', desc: 'Cryptographic identity system' },
  { names: ['bridge', 'send kas'], path: 'Bridge', label: 'Send KAS 🌉', desc: 'Transfer KAS between L1/L2' },
  { names: ['stakedag', 'stake dag', 'prediction'], path: 'StakeDAG', label: 'StakeDAG 🎯', desc: 'Prediction markets' },
  { names: ['dagknight', 'dag knight'], path: 'DAGKnightWallet', label: 'DAGKnight ⚔️', desc: 'Advanced multi-wallet' },
  { names: ['zeku', 'zeku ai'], path: 'ZekuAI', label: 'Zeku AI 🤖', desc: 'Premium AI assistant' },
  { names: ['tttv', 'browser', 'tv'], path: 'Browser', label: 'TTTV 📺', desc: 'Media browser & player' },
  { names: ['arcade', 'games'], path: 'Arcade', label: 'Arcade 🎮', desc: 'Games & entertainment' },
  { names: ['shop'], path: 'Shop', label: 'Shop 🛒', desc: 'Buy items with KAS' },
  { names: ['marketplace'], path: 'Marketplace', label: 'Marketplace 🏪', desc: 'P2P marketplace' },
  { names: ['nft', 'nft mint', 'mint'], path: 'NFTMint', label: 'NFT Mint 🏆', desc: 'Create & mint NFTs' },
  { names: ['wallet'], path: 'Wallet', label: 'Wallet 👛', desc: 'Kaspa wallet' },
  { names: ['profile'], path: 'Profile', label: 'Profile 👤', desc: 'User profile' },
  { names: ['app store', 'appstore', 'apps'], path: 'AppStore', label: 'App Store 📱', desc: '80+ community apps' },
  { names: ['courses', 'university', 'learn', 'kaskool'], path: 'Courses', label: 'Courses 📚', desc: 'Kaspa education' },
  { names: ['countdown'], path: 'Countdown', label: 'Countdown ⏰', desc: 'Kaspa milestone timer' },
  { names: ['analytics'], path: 'Analytics', label: 'Analytics 📊', desc: 'Platform analytics' },
  { names: ['subscription', 'premium'], path: 'Subscription', label: 'Subscription 👑', desc: 'Premium subscription' },
  { names: ['settings'], path: 'Settings', label: 'Settings ⚙️', desc: 'App settings' },
  { names: ['canvas'], path: 'Canvas', label: 'Canvas 🎨', desc: 'Template design studio' },
  { names: ['prompto', 'prompt'], path: 'Prompto', label: 'Prompto ✍️', desc: 'AI prompt engineering' },
  { names: ['cinekas', 'movies'], path: 'Cinekas', label: 'Cinekas 🎬', desc: 'Movie browser' },
  { names: ['speed'], path: 'Speed', label: 'Speed ⚡', desc: 'Quick image generation' },
  { names: ['security', 'audit'], path: 'SecurityAudit', label: 'Security Audit 🔒', desc: 'Security scanning' },
  { names: ['dag feed'], path: 'DAGFeed', label: 'DAG Feed 🌐', desc: 'DAG-focused content feed' },
  { names: ['global history', 'history'], path: 'GlobalHistory', label: 'Global History 🕐', desc: 'Global transaction tracker' },
  { names: ['area 51', 'area51'], path: 'Area51', label: 'Area 51 👽', desc: 'Experimental zone' },
  { names: ['voxa', 'voice'], path: 'Voxa', label: 'Voxa 🎤', desc: 'Voice/audio tools' },
  { names: ['freedom'], path: 'Freedom', label: 'Freedom 🕊️', desc: 'Privacy tools' },
  { names: ['farlands'], path: 'Farlands', label: 'Farlands 🌍', desc: 'Exploration game' },
  { names: ['klock', 'clock'], path: 'Klock', label: 'Klock 🕐', desc: 'Clock/timer' },
  { names: ['categories'], path: 'Categories', label: 'Categories 📂', desc: 'App dashboard' },
  { names: ['kivr', 'phone'], path: 'KivR', label: 'KivR 📞', desc: 'IVR/phone system' },
  { names: ['kaspa node', 'node map'], path: 'KaspaNodeMap', label: 'Node Map 🗺️', desc: 'Kaspa network node map' },
  { names: ['what is kaspa', 'kaspa info'], path: 'WhatIsKaspa', label: 'What is Kaspa 📖', desc: 'Kaspa education page' },
];