import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Sparkles, Rocket, Layers, Shield, Cpu, Globe, Users, Zap, Award, Boxes, Bot, Wallet, Gamepad2, Network, Brain, Lock, Crown, Star } from "lucide-react";

const SECTIONS = [
  {
    id: "genesis",
    icon: Sparkles,
    title: "Genesis",
    body: [
      "TTT was born on November 7, 2025 — not as a company, not as a startup pitch deck, but as a single question: what if one app could hold the entire Kaspa ecosystem together? Not a wallet that also does social. Not a social feed that also sends crypto. Not a game studio that also builds AI. All of it. Every layer. One unified surface.",
      "The first commit was a landing page. Black screen, gold serif title, three words: TAP. TO. TIP. The philosophy was encoded in those three words before any feature existed. Tap to discover. Tap to act. Tap to reward. Every interaction in TTT would ultimately reduce to a tap — a single human gesture translated into on-chain Kaspa reality.",
      "The name TTT is recursive. It stands for itself. It is not an acronym that hides behind corporate language. TTT is TTT. Three letters, three taps, three pillars: discovery, action, and value transfer. The recursiveness is intentional — TTT contains itself, references itself, and is built on top of itself. The super app is also a building block inside the super app.",
      "From day one, TTT was built on Kaspa — not Ethereum, not Solana, not a generic L2. Kaspa's BlockDAG architecture was the only foundation that matched the vision: real-time proof-of-work settlement at 10 blocks per second, sub-second confirmation, a ghost-dag consensus that parallelizes block production instead of serializing it. TTT needed a chain that could keep up with human tapping speed. Kaspa was the only one that could.",
      "The first 24 hours saw the landing page, the music player (a crypto hip-hop track called 'The Dollar Is Dying' with live-synced lyrics), and the world carousel — a GTA-inspired rotating globe of sectors that would eventually become the full app universe. The aesthetic was deliberate: black, gold, monospace, Georgia serif. Not Web3 purple gradients. Not glassmorphism on white. A dark, weighty, arcade-meets-cathedral feel that said: this is serious, this is permanent, this is built to outlast the hype cycle.",
    ],
  },
  {
    id: "mission",
    icon: Rocket,
    title: "Mission",
    body: [
      "TTT exists to collapse the distance between a human intention and an on-chain action. In the legacy crypto world, sending a tip requires opening a wallet, copying an address, checking gas, waiting for confirmations, and hoping you pasted the right string. In TTT, you tap. The wallet is already connected. The address is already known. The transaction broadcasts to Kaspa's BlockDAG and settles in under a second.",
      "But tipping is only the simplest expression of the mission. The deeper goal is to make the entire Kaspa ecosystem accessible through a single interface — so that a grandmother in Lagos and a developer in Seoul and a trader in São Paulo all experience the same frictionless path from 'I want to do X' to 'X is done, here is the proof on-chain.'",
      "TTT does not compete with Kaspa. TTT is a lens that focuses Kaspa's raw power into human-readable, human-tappable experiences. Every app inside TTT is a different lens ground from the same glass. The wallet app focuses Kaspa's transfer layer into a send/receive UI. The feed app focuses Kaspa's microtransaction capability into a social tipping layer. The AI agent focuses Kaspa's verifiable settlement into autonomous actions that can be cryptographically proven.",
      "The mission is also about sovereignty. Your keys, your KAS, your identity, your data. TTT never custodies funds. Every wallet generated inside TTT lives in the user's browser, encrypted, locked behind a 6-digit PIN or biometric unlock. The backend signs nothing on the user's behalf for fund movement. The server exists to aggregate data, run AI, and serve content — never to hold your money.",
    ],
  },
  {
    id: "technology",
    icon: Cpu,
    title: "Technology",
    body: [
      "TTT is built on four technology pillars: the Kaspa BlockDAG, an AI agent runtime, on-chain proof anchoring, and zero-knowledge identity.",
      "Kaspa's BlockDAG is the settlement layer. Unlike traditional blockchains that produce one block at a time in a linear chain, Kaspa's GhostDAG protocol allows blocks to be produced in parallel and then ordered via a proof-of-work consensus that resolves the directed acyclic graph. This means 10 blocks per second, each carrying transactions, each confirmed within seconds. For TTT, this means a tip sent at 10:00:00.000 is buried under enough proof-of-work by 10:00:01.000 to be considered final. No 10-minute Bitcoin wait. No 12-second Ethereum slot. One second.",
      "The AI agent runtime is TTT's second pillar. ZK — the primary AI agent — is not a chatbot. It is an autonomous actor with a live computer. When you tell ZK 'research this company and post about it,' ZK opens a real browser iframe, navigates to the TTT Feed page, types content, and clicks publish. It plans, executes, and verifies. It reads what is actually on screen through DOM observation, not through hallucinated memory. Multiple agent tiers exist: standard ZK for everyday tasks, ULTRA for deep intent analysis, and GOD mode for full-site access with real system calls and multi-app mission execution.",
      "On-chain proof anchoring is the third pillar. When an AI agent completes a task — when it runs a workflow, generates a proof, or executes a transaction — the result can be anchored to the Kaspa network as an immutable record. This is not just logging; it is cryptographic proof that a specific computation happened at a specific time. The APEX app formalizes this as ZK proofs of workflow completion. The NODA workflow engine produces SHA-256 proof hashes representing runs without revealing node contents.",
      "Zero-knowledge identity is the fourth pillar. Agent ZK is TTT's identity layer — a crypto-native identity system where your Kaspa wallet address is your identity. No email required. No phone number. No KYC. You generate a wallet, you connect it, you exist. Agent ZK issues ZK ID cards, manages connections between wallets, and provides a directory of verified profiles. The zero-knowledge aspect means proofs can be made about your identity without revealing the underlying data — you can prove you are a verified TTT member without revealing your wallet balance or transaction history.",
    ],
  },
  {
    id: "architecture",
    icon: Layers,
    title: "Architecture",
    body: [
      "TTT is a single-page application built on React, but it behaves like an operating system. The landing page is the home screen. The app store is the launcher. Each 'app' is a route — a self-contained React component that renders inside the shared shell. The shell provides navigation, search, authentication state, the music player, the floating AI chat, and the global notification system.",
      "The backend is serverless. Every external API call, every Kaspa network interaction, every AI inference runs through a backend function — a Deno Deploy handler that executes server-side, has access to secrets, and returns structured data to the frontend. There are over 150 backend functions in the TTT codebase, each handling a specific domain: wallet creation, transaction signing, balance fetching, UTXO management, AI orchestration, web scraping, news aggregation, game logic, payment verification, and more.",
      "Data persistence happens through entities — JSON-typed documents stored in the Base44 database layer. TTT has over 100 entity types, each representing a domain object: Posts, Tips, Transactions, Games, Agent Profiles, Wallets, Escrow Contracts, Learning Modules, and more. Each entity has row-level security rules that determine who can create, read, update, and delete records. Some entities are fully public (anyone can read), some are owner-scoped (only the creator can see their data), and some are admin-only (sensitive operations like escrow management).",
      "Real-time updates use a subscription model. When you are viewing the Feed and someone tips a post, the tip count updates instantly without a page refresh. When you are in a multiplayer game lobby and an opponent joins, the lobby updates. This is powered by WebSocket subscriptions to entity change events — create, update, delete — filtered to the records each user is authorized to see.",
      "The frontend uses Tailwind CSS for styling, Framer Motion for animation, and a design-token system that maps semantic CSS variables to Tailwind classes. The landing page uses a custom aesthetic — black background, gold accents, Georgia serif typography, monospace for UI text — that is distinct from the inner app pages, which use a cleaner shadcn/ui-based design system. This intentional split signals to the user: the landing page is the cathedral door, the apps inside are the working city.",
    ],
  },
  {
    id: "wallet",
    icon: Wallet,
    title: "Wallet & Finance",
    body: [
      "The wallet layer is TTT's most critical infrastructure. Every user, upon entering TTT, can generate a Kaspa wallet directly in the browser. The wallet creation process uses BIP-39 mnemonic generation, derives a private key using the standard Kaspa HD path, and computes the public address. The mnemonic and private key are stored in the browser's local storage, encrypted behind a user-set 6-digit PIN. The server never sees the private key in plaintext for fund-movement operations.",
      "Wallet locking supports two authentication factors: a 6-digit PIN (hashed with SHA-256 and a salt) and WebAuthn platform biometrics (Face ID, Touch ID, or platform authenticators). The biometric system registers a credential on the device and requires it for sensitive operations like signing transactions. This means a user can lock their wallet with both a PIN and their face — two independent factors protecting the same keys.",
      "Sending KAS works through a backend function that constructs, signs, and broadcasts raw Kaspa transactions. The flow: the frontend fetches UTXOs for the sender address, the user enters a recipient and amount, the user enters their PIN to unlock the private key locally, the private key is sent to the backend function which signs the transaction using the Schnorr signature algorithm (Kaspa's signature scheme), and the signed transaction is broadcast to the Kaspa REST API. The function handles fee estimation, UTXO selection, and automatic fee adjustment if the network rejects the initial fee.",
      "Balance retrieval has a special anti-stale-reading mechanism. Because Kaspa's public API can occasionally return a cached zero balance for an active wallet, TTT's balance function cross-references any zero-balance result against the raw UTXO set. If the balance endpoint says zero but the UTXO endpoint shows unspent outputs, the function retries and falls back to summing the UTXO values directly. This ensures users always see their true balance.",
      "Beyond basic send/receive, the wallet layer includes: Terra (a full Kaspa wallet manager with KRC-20 token support), Bridge (cross-layer KAS transfers with proof-of-life verification), WalletHub (a hub of wallet tools and apps), ZKWallet (a zero-knowledge-secured wallet), DAGKnight (a premium wallet for advanced users), and the Sentiment Trade feature where users express market sentiment by self-sending KAS on-chain — a bullish signal that is publicly verifiable.",
      "The KAS Dollar (KUSD) system introduces a vault-backed stablecoin concept, with mint and redeem forms, vault health dashboards, and collateral management. The AWA (AI With Address) system introduces x402 payment quotes — where an AI service has a price in KAS, the buyer pays to a Kaspa L1 address, and the service fulfills only after on-chain payment is verified. This is real protocol-level pay-per-AI-call on Kaspa.",
    ],
  },
  {
    id: "agents",
    icon: Bot,
    title: "AI Agents",
    body: [
      "ZK is the primary AI agent of TTT — and it is not a chatbot. ZK is an autonomous actor with a live computer. When you open the ZK Chat panel, you are not messaging a language model that generates text. You are commanding an agent that can open a real browser iframe, navigate to any TTT page, read what is on the screen through DOM observation, click buttons, type text, and verify the results of its own actions.",
      "ZK operates in three tiers. Standard ZK handles everyday requests: answering questions about the platform, launching apps, guiding users to the right page, generating images. It uses the InvokeLLM integration with selectable models (Claude Opus, Claude Sonnet, GPT-5, Gemini 3 Flash) and has access to the complete TTT site map in its system prompt — every route, every feature, every workflow.",
      "ULTRA mode activates a deep analysis pipeline. Before responding, ULTRA performs keyword analysis, intent decomposition, and live site viewing to understand exactly what the user wants. It translates vague requests into specific multi-step flows. Where standard ZK might launch the computer for an actionable request, ULTRA first decomposes the request into its constituent intents, maps each intent to a specific app capability, and constructs an optimized execution plan.",
      "GOD mode is the highest tier. GOD ZK has access to the full tttz.xyz address space, can make real system calls, and can execute multi-app missions that span the entire platform. A single GOD command like 'research this company, generate images, write a post, and publish to the feed' is executed as a coordinated pipeline: research via web scraping, image generation via the image integration, content writing via LLM, and publishing via the feed API — all orchestrated by the GOD pipeline with live phase reporting back to the chat.",
      "Beyond ZK, TTT has a roster of specialized AI agents. Zeku AI is a premium assistant with knowledge base access. Trinity runs three agents on a single prompt and returns three results for comparison. Agent Ying is a vision-capable agent that can analyze images and detect patterns. KAI is a Kaspa-native AI that posts, analyzes news, and manages knowledge. The Igra Agent operates on the Igra L2 with autonomous transaction capabilities. Each agent has a defined role, access scope, and toolset.",
      "Agent ZK (the identity system, not the chat agent) provides crypto-native identity. Your Kaspa wallet address is your identity. Agent ZK issues ZK ID cards, manages connections between wallets (with pending/accepted connection flows), and maintains a directory of verified profiles. The identity is zero-knowledge: you can prove properties about yourself without revealing the underlying data.",
      "The agent architecture also includes the Agent Computer — a real iframe that renders live TTT pages and that agents can interact with programmatically. The agent reads the screen via a DOM observation function that extracts visible text, identifies interactive elements, and reports them as structured data. The agent then issues click and type commands via postMessage to the iframe. This is not a screenshot-based vision model — it is direct DOM access, which is faster, cheaper, and more reliable.",
    ],
  },
  {
    id: "identity",
    icon: Shield,
    title: "Identity & Security",
    body: [
      "TTT's identity model is wallet-first. There is no required email, no required phone number, no KYC gate. You generate a Kaspa wallet in the browser, and that wallet address is your identity across the platform. This is the same identity model Kaspa itself uses — your address is your account, your UTXO set is your balance, your signature is your authorization.",
      "Agent ZK formalizes this into a profile system. When you connect your wallet, you can create an Agent ZK profile that includes a display name, bio, avatar, and verified wallet address. Other users can connect to your profile (sending a connection request that you accept or reject). The connection system uses a pending → accepted flow, and the directory shows all verified profiles. Premium features like the DAGKnight badge and advanced profile customization are available to subscribers.",
      "Wallet security operates on multiple layers. Layer one: the private key is stored encrypted in browser local storage, never sent to the server in plaintext for read operations. Layer two: a 6-digit PIN protects the encrypted key store, with the PIN hashed using SHA-256 and a per-wallet salt. Layer three: WebAuthn biometric authentication (Face ID, Touch ID) can be enabled as an additional factor for sensitive operations. Layer four: transaction signing happens server-side (because the Schnorr signing library requires Node.js), but the private key is transmitted only for the duration of the signing operation and is never persisted server-side.",
      "Row-level security on entities ensures data isolation. Your posts are only editable by you. Your wallet history is only visible to you. Your AI conversations are scoped to your email. Admin-only entities (like escrow wallets, chest wallets, and agent wallet private keys) are restricted to admin-role users. The RLS rules are enforced at the database layer — even if a frontend bug exposed an API endpoint, the database would reject unauthorized access.",
      "The proof-of-life system adds a novel security layer for cross-layer transactions. When bridging KAS between layers, the sender must record a short video 'proof of life' — a video selfie that proves a real human initiated the transfer. This video is published to the proof-of-life feed, creating a public, time-stamped record of who initiated each cross-layer transfer. This is an anti-bot, anti-phishing measure: a script cannot fake a face, and a phisher who steals keys cannot fake the victim's face.",
      "Civic verification is integrated as an optional identity-boost. Users can verify their Civic token to add a layer of real-world identity attestation without revealing personal data. This is optional and never required to use TTT — it exists for users who want higher trust signals on their profiles.",
    ],
  },
  {
    id: "creative",
    icon: Sparkles,
    title: "Creative Suite",
    body: [
      "TTT's creative suite is a full content production pipeline — from idea to published asset — all inside the browser, all powered by AI, all on Kaspa.",
      "Image generation runs through Hikaru, a full AI image studio. Hikaru can generate images from text prompts, upscale existing images, relight images (changing the lighting direction and mood), and edit images with mask-based inpainting. It supports multiple aspect ratios, style presets, and a gallery system for managing generated assets. The underlying generation uses the InvokeLLM and GenerateImage integrations.",
      "Video generation is handled by Kine, an AI video agent that takes a prompt and produces a short video. The Motion suite (Motion, MotionStudio, MotionIdeas, MotionPrompts, MotionFly) is a vibe-coding system for landing pages — describe a page in natural language and the AI generates the HTML/CSS/JS. The OneShot Studio is a one-shot app builder: describe an app and it generates the code. The UICloner takes a screenshot of any UI and generates the code to reproduce it.",
      "The storyboard suite is comprehensive: QuickStoryboard (idea to storyboard), StoryboardStyles, StoryboardTheme, StoryboardPresets, StoryboardProjects, StoryboardBRoll, and MoodBoard. These tools take a content idea and decompose it into shot-by-shot visual plans with camera angles, B-roll suggestions, mood references, and style presets. A creator can go from 'I want to make a video about Kaspa' to a full storyboard with 20 shots, each with visual references and timing, in under a minute.",
      "The Thumbnail Creator generates YouTube thumbnails using AI — researching the video topic, generating multiple thumbnail options, and allowing the creator to iterate. The SlideDeckBuilder creates presentation slide decks that can be rendered to video. FrameZ creates AI-powered interactive decks. GhostFrame and GhostFrameStudio handle ghost-frame animation effects.",
      "BeatCut is a beat-synced auto video editor. It analyzes an input video for scene cuts, detects the beats in a music track, and automatically re-cuts the video to match the music. This is professional-level music-video editing automated through AI audio analysis. UltraMock is a mockup creator that places designs inside realistic device frames (phones, laptops, monitors) with adjustable camera angles, overlays, and background scenes.",
      "Katagami is an AI pattern editor. MIRAGE and MIRAGEStudio provide visual workflow automation. LaunchBrand is a brand studio with an AI agent that helps develop brand voice, messaging, and visual identity. The DoubleO suite (DoubleO, DoubleONotes, DoubleOWorkshop) is a writing tools system for long-form content creation.",
    ],
  },
  {
    id: "games",
    icon: Gamepad2,
    title: "Games & Entertainment",
    body: [
      "TTT has a full games layer, all native to Kaspa — meaning in-game economies, rewards, and bets settle on-chain.",
      "The Arcade is the game hub, housing multiple games. Doom is a 'doomscroll' tool — give it any topic and it generates an endless scroll of facts, images, and content about that topic. Kasthletics is a proof-of-workout system where physical exercise is verified and rewarded with KAS. The TetrisBattle is a multiplayer Tetris game with real-time match-making, game state synchronization, replays, and a ranking system.",
      "The Bingo system is a full bingo lobby with game creation, card claiming, word reveal mechanics, and a game master backend function that manages the game loop. BingoLobbyBrowser, BingoLobbyPlay, and BingoLobbyRoom provide the full lobby → room → play flow. The game state is persisted as entities, and real-time subscriptions keep all players in sync.",
      "KaChing is a prediction market and betting system on Kaspa. It includes game creation, bet placement, bet verification (verifying that deposits were actually made on-chain), game settlement, and payout distribution. Games have timers, markets have categories, and the settlement animation provides visual feedback. The system supports NBA bet resolution (fetching live NBA scores to settle sports bets) and prediction markets.",
      "StakeDAG is a prediction game system specific to Kaspa — bet on Kaspa price movements, hash rate milestones, or network events. The Pacman reward system (PacmanRewardWallet, sendPacmanReward, sendPacmanKRC20Reward) distributes KAS and KRC-20 token rewards to game players, with a dedicated reward wallet that admins can fund and monitor.",
      "The Duel system (DuelLobby) provides 1v1 competitive gaming with KAS stakes. The JustDance integration provides motion-based gaming. The Valorant tools (ValorantArena, ValorantRange) provide gaming utilities for FPS players including sensitivity finders and AI coaching. The sports bet system extends KaChing to general sports betting with live score resolution.",
      "Sentiment Trade is a unique 'game' that is really a market sentiment expression tool. Users self-send KAS to their own wallet as a bullish signal — a publicly verifiable on-chain declaration of market sentiment. Bearish users are redirected to the landing page. The system logs each bullish self-send as a sentiment entry, creating a public, on-chain sentiment feed.",
    ],
  },
  {
    id: "social",
    icon: Users,
    title: "Social & Community",
    body: [
      "The Feed is TTT's social layer — a full social network with posts, likes, comments, KAS tipping, and Kasware stamps. Posts can include text, images, videos, and encrypted content. Tipping is native: any post can be tipped with KAS, and the tip is a real on-chain transaction from the tipper's wallet to the post author's wallet. The tip count on each post updates in real-time as tips arrive.",
      "The Feed supports encrypted posts — content that is XOR-encrypted and can only be read by intended recipients. This is not military-grade encryption (it's a simple XOR cipher), but it provides a layer of casual privacy for community communications. The encrypted notepad component extends this to personal private notes.",
      "Comments and likes are full sub-systems. CommentSection and DAGCommentSection provide threaded comments. CommentLike manages like state per comment. The PostExplainerModal uses AI to explain any post in simpler terms — paste a confusing post and get an AI-generated plain-English explanation. The RemixImageModal allows users to remix (AI-edit) any image posted to the feed.",
      "DAGFeed is a pay-to-publish feed — users pay KAS to publish content, creating an economic signal that filters spam and elevates high-value content. GlobalHistory provides a global view of all Kaspa transactions across the TTT ecosystem. The CommunityHub aggregates community links (Telegram, Discord) and the WorldOfKaspa and WorldOfAI pages provide ecosystem overviews.",
      "KasFans is a fan community platform. Ksocial is a social feature. The Channels system (Channels, Channel, MyChannel) provides creator channels for content distribution. The Nextdoor feature provides location-based community interaction. The WatchParty system allows synchronized video viewing with chat — watch together, in real-time, with your community.",
      "The NewsToast system provides real-time Kaspa news notifications. The NewsAnalysisModal uses AI to analyze news articles. The KAI (Kaspa AI) system posts AI-generated content about Kaspa to the feed, including news cards, video cards, and post viewers. The aggregateNews and aggregateWarNews backend functions pull news from multiple sources and present it in a unified feed.",
      "The Tip system extends beyond the feed — TapToTip, SendTip, and the TipPage allow tipping any creator anywhere in TTT. The Gift system (Gift, GiftCart, GiftNotificationCenter) provides a gifting layer with recipient profiles and gift carts. The Referral system (Referral, CreatorReferral, trackReferralClick) tracks who invited whom into the ecosystem.",
    ],
  },
  {
    id: "devtools",
    icon: Network,
    title: "Developer Tools",
    body: [
      "TTT is itself a development platform. The NODA system (NODA, NODAStudio) is a node-based AI workflow builder — visually connect nodes that represent AI operations (text generation, image analysis, web scraping, data transformation) into a directed graph, then execute the graph. The workflow state is persisted, runs produce proof hashes (SHA-256 representations that prove completion without revealing data), and the RMX (Remix) system provides an infinite canvas for workflow editing.",
      "The RMX suite includes RMXInfiniteCanvas (an infinite pan-and-zoom canvas for node graphs), RMXNodeLibrary (a library of pre-built workflow nodes), RMXRunPanel (execution monitoring), RMXNodeConfig (node parameter configuration), and NodeImageOutput (image output from workflow nodes). This is a full visual programming environment for AI workflows.",
      "The KaspaForge page provides Kaspa development tools — utilities for developers building on Kaspa. The MIRAGE system provides another visual workflow canvas with its own tool library and engine. The oneshot system (oneshotAgent, oneshotEdit) provides one-shot AI code generation and editing. The claudeCodeGen function generates code using Claude. The kaiCode function is a Kaspa-specific code generation tool.",
      "The SSH Manager allows admins to manage SSH connections to servers — a dev-ops tool inside the app. The APIDocumentation page provides API docs for the platform. The Docs page is the developer documentation hub. The SecurityAudit tool scans apps for security vulnerabilities and produces a severity-graded report. The TTTAudit generates full platform audits.",
      "The publishToGitHub function allows publishing code directly to GitHub repositories — the app has an authorized GitHub connector with repo scope. The webProxy function provides a server-side proxy for CORS-restricted API calls. The zkEndpointExecutor executes ZK endpoint calls. The superzkDeployJob deploys jobs to the SuperZK system.",
      "The agentTools system exposes a library of tools that AI agents can use — each tool is a capability the agent can invoke. The ToolsModal in Agent ZK shows available tools. The godMap and godTools define the GOD mode agent's tool access. The agentBridge and agentBridgeListener provide a bridge for agent-to-frontend communication, allowing agents to trigger frontend actions.",
    ],
  },
  {
    id: "sectors",
    icon: Globe,
    title: "The Sectors",
    body: [
      "The TTT universe is organized into sectors — distinct worlds that each focus on a domain. The world carousel on the landing page rotates through these sectors, each accessible via its own route. TTT PRIME (the landing page itself) is the mother world; the others are specialized sectors.",
      "Agentic World is a sector focused on AI agents — a city scene with agent robots, a transactions feed, and a roster of createable agent robots. It visualizes the agent economy: agents transacting, creating, and interacting in a simulated urban environment. The AgenticCityScene renders the city, and AgentTransactionsFeed shows the live agent economy.",
      "Kaspa Nations is a sector of geographic communities — nations of Kaspa users organized by geography. The NationsGrid displays all nations, and the NationViewer shows individual nation pages with their communities, stats, and local activity. Each nation has a slug-based route (KaspaNations/:slug).",
      "Igra Horizon is a sector focused on the Igra L2 — a Kaspa layer-2 with EVM compatibility (chain 38833). The IgraAgent manages autonomous agent wallets on Igra, with agent wallets (alpha, beta, kasbridge) that can sign iKAS transactions. The IgraBridge handles KAS ↔ iKAS swaps with desk fees. The IgraExplorer browses Igra L2 data. The IgraHorizonScene renders the sector visually.",
      "AWA (AI With Address) is the x402 payment sector — AI services with KAS prices, paid on-chain, fulfilled after payment verification. The AWASigner is the admin signing layer. The AWA system includes a service catalog, invoice modal, payment terminal, transaction log, and how-it-works guide. Each AI service has a price in KAS and a pay-to address.",
      "Sector 6 and Sector VI are specialized sectors. Sector 6 uses a WhiteWaves component and room-based interaction. Sector VI features a canvas scene with agent robots (including a Roblox agent), name tags, and agent details panels. Both are immersive, visual sectors with their own aesthetics and interaction models.",
      "The Aporia DEX is a decentralized exchange sector with candle charts, trade panels, order books, and trade history — a full trading interface. Kaspa Command is a command center sector with a node world map, node stats, live ticker, news intel, and layer toggles — a Kaspa network monitoring dashboard. Kascov provides live Kaspa coverage data. The KasBillboard is a Kaspa advertising platform. The KasSword is a post-quantum DAG vault. The KCC (Kaspa Citizenship Certificate) and KCC NFT systems provide on-chain citizenship and NFT minting.",
      "Klipz is a sector for AI-powered video clipping — take a YouTube video, pay 1 KAS, and get an AI-identified viral clip delivered. The KlipzAgent analyzes videos for viral moments, the KlipzClipMp4 function fetches the MP4, and the KlipzHireAgent allows hiring the clipping agent. ClipWhileLive extends this to clipping live streams in real-time.",
      "Kutt is a code-to-hyperframe system — describe a web experience and Kutt generates it as an interactive hyperframe with a timeline, assets, preview, and orchestrator. The KuttAgent, kuttAgentEngine, kuttEditorAgent, and kuttEditorTools provide a full AI-driven web experience builder with a Remotion-based preview.",
    ],
  },
  {
    id: "learning",
    icon: BookOpen,
    title: "Learning & Education",
    body: [
      "TTT includes a full learning layer for onboarding new users into Kaspa and crypto. WhatIsKaspa is a Kaspa explainer page for newcomers. The Courses and KUniversity pages provide structured Kaspa courses. The Learning and LearningModule systems deliver modular lessons with quiz questions and reward tokens for completion.",
      "Voxa and VoxaLearn are language learning tools — learn new languages through AI-assisted lessons, flashcards, conversation modes, and a kids mode. The system supports multiple languages with a language picker, lessons mode, flashcards mode, and conversation mode. KaSkool is a school-style learning platform with a profile system. The BMTUniv and KASBOOKS systems provide additional educational content.",
      "The SecurityAudit tool doubles as an educational tool — scanning apps and explaining vulnerabilities helps developers learn secure coding. The APEX system provides ZK proof education. The Bible page provides scripture with a book reader. The SurvivalAI and SurvivalKnowledge systems provide survival knowledge through AI.",
      "The KaSkool profile system tracks student progress. The UserProgress and UserBadge entities track learning progress and award badges. The PTOStamp system (in the HR context) provides a stamp-based reward system. The Learning entity stores lesson content, quiz questions, and reward configuration.",
    ],
  },
  {
    id: "marketplace",
    icon: Layers,
    title: "Marketplace & Commerce",
    body: [
      "TTT has a full commerce layer. The Marketplace is a buy/sell platform for goods and services. The Shop and KaShop are TTT's shops for physical and digital goods. The ShopItem and ShopItemView pages display individual products. The CreateShopListing and EditListing pages allow sellers to manage their listings. The ShoppingCart and SharedCart systems provide cart functionality, with shared carts allowing group purchasing.",
      "The Payment system handles checkout, and the completeShopPurchase backend function finalizes purchases after payment verification. The OnChainPOS provides a point-of-sale system for in-person KAS payments. The KasperoPay widget integration (loaded via script tags in the Layout) provides a Kaspa payment button and wallet connect button for the broader Kaspa ecosystem.",
      "Market X is a marketplace for Kaspa-related services and opportunities. The Jobs, Career, and CryptoHire pages provide job boards for Kaspa ecosystem jobs. The IWork and Hwork systems provide work management. The EmployerTask and WorkerTask pages manage task assignment and completion. The ServiceListing and CreateServiceModal allow listing services. The Hire page allows hiring Kaspa talent directly.",
      "The KivR system is an IVR (Interactive Voice Response) calling system — manage contacts, create presets, make in-app IVR calls, and connect via wallet. The RufzeitK system is a calling home platform with top-up, bypass codes, and call management. These voice systems extend TTT into telephony, using Kaspa for payment and identity.",
      "The Dropshipping system (DropshippingProduct, DropshippingOrder) provides a full dropshipping commerce flow. The Listing entity manages marketplace listings. The Brand and BrandMessage systems provide brand management. The ShillProfile and Shillz systems provide promotional tools. The OnChainPOS system provides physical retail integration.",
    ],
  },
  {
    id: "timeline",
    icon: Zap,
    title: "Timeline & Milestones",
    body: [
      "November 7, 2025: TTT launches. The landing page goes live with the gold-on-black title screen, the music player with 'The Dollar Is Dying,' and the three-pillar menu: TAP, TO, TIP. The world carousel debuts with the first sectors. The Kaspa wallet generation system goes live. The Feed launches with posts, likes, and KAS tipping.",
      "Q4 2025: The App Store reaches 80+ live apps. The Agent ZK identity system ships with ZK ID cards, profile directories, and wallet-to-wallet connections. The APEX ZK proof system launches. The NODA workflow builder debuts with node-based AI workflows and proof hashes. The Igra L2 bridge goes live with KAS ↔ iKAS swaps and agent wallets. The AWA x402 payment system launches with AI services paid in KAS.",
      "Q4 2025: The creative suite expands with Hikaru (image studio), Kine (video generation), the Motion suite (vibe-coded landing pages), the Storyboard suite, BeatCut (beat-synced editing), and UltraMock (device-frame mockups). The games layer expands with TetrisBattle, Bingo, KaChing prediction markets, and StakeDAG. The Klipz video clipping service launches with 1 KAS per clip.",
      "Q4 2025: The KCC (Kaspa Citizenship Certificate) and KCC NFT systems launch, providing on-chain citizenship and NFT minting. The Kaspa Command monitoring dashboard goes live with a node world map and live network stats. The Aporia DEX launches with candle charts and order books. The Sentiment Trade feature debuts with on-chain bullish self-sends.",
      "Q4 2025: The Kutt hyperframe system launches with AI-driven web experience generation. The MIRAGE visual workflow canvas debuts. The OneShot one-shot app builder launches. The UICloner screenshot-to-code tool ships. The GhostFrame animation system goes live. The DoubleO writing suite launches.",
      "Q4 2025: The KAS Dollar (KUSD) vault-backed stablecoin system launches with mint/redeem forms and vault health dashboards. The KasSword post-quantum DAG vault debuts. The KaspaForge developer tools hub launches. The KaspaNations geographic community system goes live with nation pages. The AgenticWorld AI agent city launches.",
      "2026: AI agent automations expand across the ecosystem. The GOD mode agent pipeline launches with full-site access and multi-app mission execution. The ULTRA deep analysis pipeline debuts. The Agent Computer goes live with real DOM observation and direct page control. The agent bridge system connects agents to frontend actions. The Kutt hyperframe orchestrator launches. The Igra Agent autonomous transaction system goes live.",
      "2026: The Slobz ecosystem launches — a chaotic, ADHD-friendly gig economy with Slobz profiles (slob scores, roasts, resume generation, micro-steps), Slobz gigs with escrow, Slobz market, Slobz animations with tipping, Slobz wellness, Slobz entity X tracking, and Slobz site/transaction trackers. The Tree campaign system launches with AI-generated ad creatives across templates.",
      "2026: The Advent Calendar launches as a seasonal community feature with sponsor tasks, door-opening, proof submission, and chest wishes with AI moderation. The Chest wallet system goes live with covenant escrow. The DAGKnight premium wallet launches. The Zeku AI premium assistant debuts. The SuperZK system launches. The DagFuel and DAGStats systems go live.",
      "Present: TTT continues to expand with new apps, agents, and sectors added regularly. The app store remains open for community submissions. The ecosystem grows through both internal development and community contributions, all anchored to the Kaspa BlockDAG.",
    ],
  },
  {
    id: "certifications",
    icon: Award,
    title: "Certifications & Standards",
    body: [
      "Kaspa Native: TTT is built directly on the Kaspa BlockDAG. Every transaction, every tip, every escrow, every proof settles on Kaspa L1 (or Igra L2 for EVM operations). TTT does not use a competing chain or a generic L2. This is a first-class Kaspa application — the wallet addresses are Kaspa addresses (kaspa: prefix), the signatures are Schnorr, the UTXO model is Kaspa's, and the block confirmation is Kaspa's 10-blocks-per-second proof-of-work.",
      "On-chain Verified: Every value transfer in TTT is verifiable on the Kaspa blockchain. Tips are real transactions with real transaction IDs. Escrow funding and payouts are on-chain. Game rewards are on-chain. AI service payments (AWA x402) are on-chain. The verifyKaspaSelfTransaction, verifyKaspaSignature, and monitorKaspaPayment backend functions provide programmatic verification. A user can take any transaction ID from TTT and look it up on any Kaspa block explorer.",
      "ZK Identity: Agent ZK provides a zero-knowledge identity layer. Your Kaspa wallet address is your identity. Connections between wallets are managed through a pending → accepted flow. ZK ID cards are issued. The identity system does not require email, phone, or KYC. Civic verification is available as an optional trust boost. The ZKVault and ZKEndpoint systems extend identity into vault and endpoint management.",
      "Open Ecosystem: TTT's app store is open to community submissions. The AppProposal entity allows anyone to propose a new app. The AdminProposalsPanel lets admins review and approve/reject proposals. The TTTAppRegistry entity stores live app metadata. The syncAppRegistry function keeps the registry synchronized. The community can build and submit apps that, once approved, appear in the app store alongside TTT-built apps.",
      "Proof-of-Work Secured: Because TTT settles on Kaspa, every transaction benefits from Kaspa's proof-of-work security. The same hash rate that secures the Kaspa network secures TTT transactions. There is no separate validator set, no delegated stake, no permissioned consensus. The security model is the same as Bitcoin's — proof-of-work, the most battle-tested consensus mechanism in crypto — but with Kaspa's BlockDAG parallelism that enables 10 blocks per second instead of Bitcoin's 1 block per 10 minutes.",
    ],
  },
  {
    id: "philosophy",
    icon: Brain,
    title: "Philosophy",
    body: [
      "TTT is built on a set of principles that are not negotiable. First: sovereignty. Your keys, your KAS, your identity. TTT never custodies funds. The backend signs transactions only with keys provided by the user for the duration of a signing operation. The wallet lives in the browser. The PIN is set by the user. The biometric is registered on the user's device. If TTT's servers vanished tomorrow, every user would still have their keys, their KAS, and their ability to transact on Kaspa directly.",
      "Second: real-time. Kaspa's 10 blocks per second is not a marketing number — it is the enabling constraint that makes TTT possible. Tipping in the Feed feels instant because it is instant. A game bet settles in seconds because the chain settles in seconds. A cross-layer bridge transfer confirms quickly because the L1 confirms quickly. TTT is designed around the assumption that blockchain can be as fast as human interaction. If it weren't, the entire UX would collapse.",
      "Third: one app, everything inside. TTT resists the urge to spin off separate products. The wallet is not a separate app you download. The feed is not a separate website. The AI agent is not a separate subscription. Everything lives inside one interface, accessible from one landing page, connected by one navigation system. This is the 'super app' principle — the same principle that drove WeChat in China. One app, one identity, one wallet, infinite capabilities.",
      "Fourth: AI as actor, not assistant. TTT's AI agents do not just answer questions. They act. They open browsers, navigate pages, click buttons, type text, and verify results. They are autonomous to the maximum extent the platform allows. When you tell ZK to do something, ZK does it — and then tells you it is done, with proof. This is the shift from 'AI as chatbot' to 'AI as employee,' and it is the core of what makes TTT different from every other crypto platform.",
      "Fifth: open by default. The app store is open to submissions. The code is built to be extensible. The entities are typed but flexible. The backend functions are composable. The community can build apps that live inside TTT, using TTT's wallet layer, identity layer, and AI layer. TTT is not a walled garden — it is a public square with infrastructure.",
      "Sixth: aesthetic matters. The gold-on-black landing page. The Georgia serif. The monospace UI. The scanlines. The noise grain. The GTA-inspired world carousel. The industrial ZK chat panel. Every visual choice is deliberate. TTT could have been another white-background, blue-button Web3 dashboard. It isn't. Because how things look affects how people feel about them, and how people feel about them affects whether they use them. TTT is built to be felt as serious, permanent, and human — not as another disposable crypto toy.",
    ],
  },
  {
    id: "closing",
    icon: Crown,
    title: "The Road Ahead",
    body: [
      "TTT is not finished. It will never be finished. The super app model means there is always another app to add, another agent to train, another sector to open, another community to onboard. The roadmap is not a list of features to ship — it is a direction to walk.",
      "The immediate future is deeper AI autonomy. The GOD mode pipeline is the preview: agents that can execute multi-app missions end-to-end. The next step is agents that can build their own tools, compose their own workflows, and operate across sectors without human guidance for individual steps. The agent computer is the foundation; the agent's ability to reason about what it sees on screen is the capability that unlocks true autonomy.",
      "The near future is more sectors. Each sector is a focused world — a DEX, a command center, a clipping service, a creative studio. New sectors will open as new use cases emerge. The world carousel was designed to accommodate infinite worlds; the architecture supports adding them without restructuring.",
      "The medium future is community-built apps in the app store. The proposal system exists; the next step is making it trivial for community developers to build, submit, and deploy apps inside TTT. The OneShot and UICloner tools are early versions of the 'describe an app and get an app' capability that will eventually let anyone add to the ecosystem without writing code.",
      "The long future is TTT as the default Kaspa interface — the app that every Kaspa user opens first, the lens through which the entire ecosystem is experienced. Not because TTT replaces other Kaspa apps, but because TTT is the connective tissue that makes them all accessible from one place, with one wallet, one identity, and one AI agent that knows how to use them all.",
      "From November 7, 2025 to now and forward: TTT is one app for the entire Kaspa ecosystem. Tap to discover. Tap to act. Tap to reward. Every interaction, one tap. Every tap, on Kaspa. That is the design. That is the mission. That is TTT.",
    ],
  },
];

const STATS = [
  { icon: Boxes, value: "80+", label: "Apps shipped" },
  { icon: Globe, value: "10 bps", label: "Kaspa blocks/sec" },
  { icon: Bot, value: "3 tiers", label: "AI agent modes" },
  { icon: Zap, value: "Nov 7", label: "Born 2025" },
];

export default function TTTCodexPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden" style={{ fontFamily: "'Georgia', serif" }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: "rgba(200,140,0,0.06)" }} />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "rgba(180,120,30,0.05)" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: "rgba(200,150,40,0.1)", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <Link to="/" className="flex items-center gap-1.5 transition-colors" style={{ color: "rgba(200,160,70,0.5)" }}>
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm" style={{ fontFamily: "monospace" }}>Back</span>
        </Link>
        <span className="text-sm font-black tracking-[0.3em]" style={{ color: "#f5d050", fontFamily: "monospace" }}>TTT CODEX</span>
        <div className="w-12" />
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="w-5 h-5" style={{ color: "rgba(200,150,40,0.5)" }} />
            <span className="text-[11px] tracking-[0.4em] uppercase" style={{ color: "rgba(200,160,70,0.5)", fontFamily: "monospace" }}>The Complete Record</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-[300] tracking-tight mb-4">
            The <span className="font-[700]" style={{ background: "linear-gradient(180deg, #fff5cc, #c8960c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TTT Codex</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: "rgba(200,160,70,0.45)", fontFamily: "monospace" }}>
            Every detail of the TTT super app — from the first commit to every sector, agent, wallet, and app in the Kaspa ecosystem.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-20">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}
                className="rounded-2xl p-4 text-center" style={{ background: "rgba(200,150,40,0.04)", border: "1px solid rgba(200,150,40,0.15)" }}>
                <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: "rgba(200,160,70,0.6)" }} />
                <div className="text-2xl font-[300]" style={{ color: "#f5d050" }}>{s.value}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "rgba(200,160,70,0.4)", fontFamily: "monospace" }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Sections */}
        <div className="space-y-20">
          {SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.section key={section.id} id={section.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}
                className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(200,150,40,0.08)", border: "1px solid rgba(200,150,40,0.2)" }}>
                    <Icon className="w-5 h-5" style={{ color: "#f5d050" }} />
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "rgba(200,160,70,0.4)", fontFamily: "monospace" }}>Chapter {String(idx + 1).padStart(2, "0")}</div>
                    <h2 className="text-2xl sm:text-3xl font-[400]" style={{ color: "#f5d050" }}>{section.title}</h2>
                  </div>
                </div>
                <div className="space-y-4 pl-0 sm:pl-13">
                  {section.body.map((para, i) => (
                    <p key={i} className="text-[15px] leading-[1.8]" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {para}
                    </p>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Closing stamp */}
        <div className="mt-24 pt-8 border-t text-center" style={{ borderColor: "rgba(200,150,40,0.1)" }}>
          <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.4em] uppercase" style={{ color: "rgba(200,160,70,0.5)", fontFamily: "monospace" }}>
            <Star className="w-3 h-3" />
            <span>TTT · Since November 7, 2025 · Built on Kaspa</span>
            <Star className="w-3 h-3" />
          </div>
          <Link to="/About" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full transition-all" style={{ border: "1px solid rgba(200,150,40,0.25)", background: "rgba(200,150,40,0.05)" }}>
            <span className="text-[11px] tracking-[0.25em] uppercase" style={{ color: "#f5d050", fontFamily: "monospace" }}>Quick About</span>
          </Link>
        </div>
      </div>
    </div>
  );
}