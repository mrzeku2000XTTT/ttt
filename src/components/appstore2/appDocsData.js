// Structured documentation content for every App Store app.
// Curated entries override the generator for flagship apps; everything else
// gets sensible, category-aware content derived from the catalog metadata.

// ── Curated docs for flagship apps ──
const CURATED = {
  Isolate: {
    tagline: "Learn anything through themes you love",
    overview: "ISOLATE turns any topic into a personalized course built around a theme you already love — Star Wars, cooking, anime, anything. An AI tutor teaches each module through themed metaphors, then a 'Here's what's actually true' callout grounds it in real facts. Progress through a game-like level-select map, earn XP, and keep learning infinitely with on-demand module generation. ISOLATE runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, and your course progress is tied to your wallet, no separate account required.",
    features: [
      { title: "Theme-based courses", desc: "Pick a topic + a theme you love; the AI builds a full curriculum where every module is taught through that theme's metaphors." },
      { title: "AI tutor chat", desc: "Ask questions inside any module and get themed, context-aware answers from your personal tutor." },
      { title: "Game mode", desc: "Transform the curriculum into a world map with progression markers, XP, and levels." },
      { title: "Infinite learning", desc: "Generate new modules on demand when you finish a course — your skill level advances automatically." },
      { title: "Knowledge checks", desc: "Each module ends with a quick check; fail and the content regenerates to help you relearn." },
      { title: "PDF export", desc: "Export any selection of courses to a consolidated, printable knowledge record." },
    ],
    howItWorks: [
      { title: "Choose your theme", desc: "Tell ISOLATE what you want to learn and the theme you love. Add optional addon themes." },
      { title: "AI builds the curriculum", desc: "Gemini generates a structured set of modules with themed hooks, real facts, and illustrations." },
      { title: "Learn module by module", desc: "Progress through a level-select map. Each module has content, a tutor chat, and a knowledge check." },
      { title: "Level up & keep going", desc: "Complete courses, earn XP, and generate fresh modules to keep your learning infinite." },
    ],
    getStarted: [
      { title: "Open ISOLATE", desc: "Launch the app from the store — no wallet needed to start learning." },
      { title: "Create your first course", desc: "Enter a topic and a theme, pick a skill level, and let the AI build your curriculum." },
      { title: "Start a module", desc: "Tap any module on the map to read, chat with the tutor, and check your understanding." },
    ],
  },
  DD: {
    tagline: "All your tools in one intelligent workspace",
    overview: "DD is an AI agent dashboard that organizes your day across every tool you use. Connect apps, fund your DD wallet with KKDAG credits, and let the agent orchestrate tasks, research, and automations — all in one place.",
    features: [
      { title: "Unified workspace", desc: "Gmail, Calendar, tasks, and projects side-by-side, with an AI agent that sees across all of them." },
      { title: "DD wallet & KKDAG credits", desc: "Fund your agent with KKDAG tokens; each action consumes credits transparently." },
      { title: "Automations", desc: "Build trigger→action automations (e.g. new email → draft reply → notify Slack) without code." },
      { title: "Research agent", desc: "Spin up a research run that browses the web and returns a cited summary." },
      { title: "Connected apps", desc: "Add apps from the DD store; the agent gains new tools it can call on your behalf." },
      { title: "Activity log", desc: "Every step the agent takes is logged so you always know what happened." },
    ],
    howItWorks: [
      { title: "Fund your wallet", desc: "Send KKDAG to your DD treasury address to load credits for agent actions." },
      { title: "Connect your apps", desc: "Add the tools you use — email, calendar, tasks — so the agent can act on them." },
      { title: "Give it a task", desc: "Type what you need in plain English. DD plans, calls tools, and reports back." },
      { title: "Review the activity", desc: "Every action and credit spent is visible in the activity log and usage records." },
    ],
    getStarted: [
      { title: "Open DD", desc: "Launch DD from the store and complete the onboarding flow." },
      { title: "Fund with KKDAG", desc: "Send KKDAG tokens to your DD wallet to unlock agent actions." },
      { title: "Connect your first app", desc: "Pick a tool from the DD store and connect it so the agent can use it." },
    ],
  },
  KaChingWallet: {
    tagline: "Privacy Kaspa wallet with fresh addresses & multisig",
    overview: "KaChing is a privacy-first Kaspa wallet that generates a fresh receive address for every transaction, gives you manual UTXO coin control, and supports m-of-n multisig — all wrapped in a clean, Apple-style interface. Run prediction games and tip on-chain, directly from the wallet.",
    features: [
      { title: "Fresh receive addresses", desc: "Every receive generates a new address to protect your privacy and transaction history." },
      { title: "Manual UTXO coin control", desc: "Select exactly which UTXOs to spend to optimize fees and privacy." },
      { title: "m-of-n multisig", desc: "Set up multi-signature wallets requiring several co-signers to approve sends." },
      { title: "Prediction markets", desc: "Create and join KaChing prediction games with on-chain settlement." },
      { title: "On-chain tips", desc: "Tip creators in KAS straight from the wallet." },
      { title: "Pacman rewards", desc: "Earn and send Pacman reward tokens natively." },
    ],
    howItWorks: [
      { title: "Create a wallet", desc: "Generate a new Kaspa wallet with a secure seed phrase stored locally on your device." },
      { title: "Receive KAS", desc: "Get a fresh address for each deposit to keep your history private." },
      { title: "Send with control", desc: "Pick your UTXOs, set the fee, and sign — or use multisig for shared funds." },
      { title: "Play & tip", desc: "Join prediction games or tip posts, all settled on-chain." },
    ],
    getStarted: [
      { title: "Open KaChing", desc: "Launch the wallet from the store — your keys stay on your device." },
      { title: "Back up your seed", desc: "Write down your seed phrase and store it offline. It's the only way to recover funds." },
      { title: "Receive your first KAS", desc: "Tap receive to generate an address and send yourself some Kaspa." },
    ],
  },
  KCC20: {
    tagline: "KCC-20 covenant wallet — mint & manage smart coins on Kaspa L1",
    overview: "KCC20 is a covenant-based wallet for the KCC-20 smart-coin standard on Kaspa L1. Mint new tokens, manage balances, and sign transactions with your PIN — all secured by Kaspa's covenant scripting, no L2 required.",
    features: [
      { title: "KCC-20 minting", desc: "Mint new KCC-20 smart coins on Kaspa L1 using covenant scripts." },
      { title: "PIN-secured signing", desc: "Sign transactions with a 6-digit PIN — your keys never leave the device." },
      { title: "Balance & transfer", desc: "View balances and send KCC-20 tokens to any Kaspa address." },
      { title: "Covenant-native", desc: "Built directly on Kaspa's covenant scripting — no second-layer bridge needed." },
      { title: "Test mode", desc: "Detect payments, create, and sign test transactions in a sandbox." },
    ],
    howItWorks: [
      { title: "Connect your wallet", desc: "Link a Kaspa wallet that supports KCC-20 covenants." },
      { title: "Mint or receive", desc: "Mint a new KCC-20 token or receive an existing one at your address." },
      { title: "Sign with PIN", desc: "Approve every transaction with your 6-digit PIN; the covenant script enforces the rules." },
    ],
    getStarted: [
      { title: "Open KCC20", desc: "Launch the app and connect a KCC-20-compatible wallet." },
      { title: "Set your PIN", desc: "Create a 6-digit PIN to secure transaction signing." },
      { title: "Mint your first token", desc: "Use the mint flow to create a KCC-20 smart coin on Kaspa L1." },
    ],
  },
  KCCNft: {
    tagline: "Mint KCC covenant NFT identities on Kaspa L1",
    overview: "KCC NFT lets you mint covenant-secured NFT identities directly on Kaspa L1. Each NFT is a unique, on-chain identity backed by Kaspa's covenant scripting — no bridges, no second layers, just native L1 security.",
    features: [
      { title: "Covenant NFT minting", desc: "Mint NFT identities secured by Kaspa L1 covenant scripts." },
      { title: "On-chain identity", desc: "Each NFT is a verifiable, portable on-chain identity." },
      { title: "Tiered mint", desc: "Choose from multiple mint tiers with different features." },
      { title: "Payment-verified", desc: "Minting is gated by an on-chain KAS payment to the treasury." },
    ],
    howItWorks: [
      { title: "Pick a tier", desc: "Choose the NFT tier that fits your needs." },
      { title: "Pay the mint fee", desc: "Send the required KAS to the treasury address; the payment is verified on-chain." },
      { title: "Mint your NFT", desc: "Once payment confirms, your covenant NFT identity is minted on Kaspa L1." },
    ],
    getStarted: [
      { title: "Open KCC NFT", desc: "Launch the app from the store." },
      { title: "Choose your tier", desc: "Review the tiers and pick the one you want." },
      { title: "Pay & mint", desc: "Send KAS to the treasury and your NFT is minted on confirmation." },
    ],
  },
  Slobz: {
    tagline: "Kaspa creator hub — gigs, market, wellness & animations",
    overview: "Slobz is a creator-first hub on Kaspa. Find gigs, sell in the market, track wellness, post animations, and earn through micro-tasks — all with on-chain tipping and a chaos-intake agent that turns rough ideas into structured plans.",
    features: [
      { title: "Gig marketplace", desc: "Post and claim Kaspa gigs with escrow-protected payments." },
      { title: "Creator market", desc: "List and sell digital creations with on-chain tips." },
      { title: "Wellness tracking", desc: "Log moods and build momentum with streaks and micro-steps." },
      { title: "Animations", desc: "Post and tip AI animations; the community funds what it loves." },
      { title: "Micro-tasks", desc: "Complete small tasks for small KAS rewards — no commitment." },
      { title: "Chaos intake", desc: "Brain-dump your messy ideas; the agent structures them into a plan." },
    ],
    howItWorks: [
      { title: "Set up your profile", desc: "Create your Slobz creator profile and connect a Kaspa wallet for tips." },
      { title: "Pick your lane", desc: "Browse gigs, the market, wellness, animations, or micro-tasks." },
      { title: "Earn on-chain", desc: "Complete work, get tipped in KAS, and build your creator streak." },
    ],
    getStarted: [
      { title: "Open Slobz", desc: "Launch the hub from the store." },
      { title: "Create your profile", desc: "Add a name and wallet so you can send and receive tips." },
      { title: "Explore a lane", desc: "Start with gigs or the market to find your first Kaspa earning opportunity." },
    ],
  },
  Hikaru: {
    tagline: "AI image studio",
    overview: "Hikaru is a full AI image studio: generate images from prompts, upscale them, relight scenes, and edit specific regions — all in one creative workspace with a gallery of your work. Hikaru runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, so your creations and credits stay tied to your wallet, not a separate account.",
    features: [
      { title: "Text-to-image", desc: "Generate images from detailed prompts with advanced cinematography framing." },
      { title: "Upscale", desc: "Boost resolution on any image without losing detail." },
      { title: "Relight", desc: "Change the lighting of a scene after generation." },
      { title: "Edit regions", desc: "Mask and re-generate specific parts of an image." },
      { title: "Motion SaaS", desc: "Turn stills into short motion graphics." },
      { title: "Gallery", desc: "Every creation is saved to a personal, downloadable gallery." },
    ],
    howItWorks: [
      { title: "Write a prompt", desc: "Describe the image you want; Hikaru wraps it in professional framing for better output." },
      { title: "Generate & iterate", desc: "Generate, then upscale, relight, or edit regions until it's right." },
      { title: "Save & download", desc: "Everything saves to your gallery for direct download." },
    ],
    getStarted: [
      { title: "Open Hikaru", desc: "Launch the studio from the store." },
      { title: "Write your first prompt", desc: "Describe a scene — the more specific, the better the result." },
      { title: "Generate & refine", desc: "Use upscale, relight, and edit to polish your image." },
    ],
  },
  Tree: {
    tagline: "Campaign agent — full ad campaigns from one brief",
    overview: "Tree is a campaign agent that takes a single brief and grows a full advertising campaign: ad copy, visuals, targeting suggestions, and a spend plan — all organized like branches on a tree. Tree runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, and any paid campaign budget you allocate settles directly on the Kaspa Layer-1 DAG.",
    features: [
      { title: "Brief to campaign", desc: "Give Tree one brief; it produces a complete multi-asset campaign." },
      { title: "Ad copy generation", desc: "Generates headlines, body copy, and CTAs tuned to your audience." },
      { title: "Visual concepts", desc: "Suggests and produces visual directions for each ad." },
      { title: "Spend plan", desc: "Proposes a budget split across channels and creatives." },
      { title: "Tree structure", desc: "Every campaign is a tree of branches you can expand or prune." },
    ],
    howItWorks: [
      { title: "Write a brief", desc: "Describe your product, audience, and goal in plain language." },
      { title: "Tree grows branches", desc: "The agent expands the brief into copy, visuals, and a plan." },
      { title: "Prune & export", desc: "Keep the branches you like and export the final campaign." },
    ],
    getStarted: [
      { title: "Open Tree", desc: "Launch the campaign agent from the store." },
      { title: "Write your brief", desc: "Tell Tree what you're promoting and who it's for." },
      { title: "Grow & prune", desc: "Expand the branches, keep what works, export the rest." },
    ],
  },
  Klipz: {
    tagline: "AI clip engine — clip live streams & videos natively",
    overview: "Klipz clips live streams and long videos into shareable moments, natively in the browser. Point it at a stream or video, let the AI find the highlights, and export clips — with an agent canvas for guided editing. Klipz runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, and paid editor hand-offs settle on-chain on Kaspa.",
    features: [
      { title: "Live stream clipping", desc: "Clip from live streams as they happen." },
      { title: "AI highlight detection", desc: "The agent surfaces the most shareable moments automatically." },
      { title: "Agent canvas", desc: "A guided editing canvas where the AI helps you trim and caption." },
      { title: "Native export", desc: "Export clips as MP4 directly — no third-party tools." },
      { title: "Hire an editor", desc: "Hand off clipping to a hired agent for a fee." },
    ],
    howItWorks: [
      { title: "Add your source", desc: "Paste a stream or video URL, or record live." },
      { title: "AI finds highlights", desc: "Klipz analyzes the content and suggests clip-worthy moments." },
      { title: "Edit & export", desc: "Trim and caption on the agent canvas, then export as MP4." },
    ],
    getStarted: [
      { title: "Open Klipz", desc: "Launch the clip engine from the store." },
      { title: "Add a source", desc: "Paste a video or stream URL to begin." },
      { title: "Clip your first moment", desc: "Let the AI suggest highlights, then trim and export." },
    ],
  },
  Kascov: {
    tagline: "Covenant explorer — scan ZK smart coins",
    overview: "Kascov is an explorer for Kaspa covenant smart coins. Scan addresses, inspect covenant scripts, and decode KCC-20 token data — a transparent window into Kaspa's on-chain smart-coin layer.",
    features: [
      { title: "Covenant scanning", desc: "Scan any Kaspa address for covenant smart coins." },
      { title: "Script decoding", desc: "Decode and inspect the covenant scripts behind each coin." },
      { title: "KCC-20 data", desc: "Read KCC-20 token metadata and balances directly from the registry." },
      { title: "Live updates", desc: "Refresh to see the latest on-chain state in real time." },
    ],
    howItWorks: [
      { title: "Enter an address", desc: "Paste any Kaspa address to start scanning." },
      { title: "Inspect covenants", desc: "Browse the smart coins and their covenant scripts." },
      { title: "Decode tokens", desc: "Read KCC-20 token tickers, amounts, and metadata." },
    ],
    getStarted: [
      { title: "Open Kascov", desc: "Launch the explorer from the store." },
      { title: "Paste an address", desc: "Enter a Kaspa address you want to inspect." },
      { title: "Explore", desc: "Browse covenants and tokens on that address." },
    ],
  },
  AgentZK: {
    tagline: "Crypto identity — your ZK-verifiable on-chain identity",
    overview: "Agent ZK gives you a zero-knowledge-verifiable identity on Kaspa. Prove ownership of wallets, sign claims, and connect with other agents — all without exposing your private data. Premium feature.",
    features: [
      { title: "ZK identity", desc: "Create an identity you can prove without revealing underlying data." },
      { title: "Wallet verification", desc: "Prove ownership of a Kaspa wallet by signing a challenge." },
      { title: "Agent connections", desc: "Connect with other agents and verify their identities." },
      { title: "Claim signing", desc: "Sign and verify claims on-chain, anchored by Kaspa self-sends." },
      { title: "Directory", desc: "Browse a directory of verified agents to connect with." },
    ],
    howItWorks: [
      { title: "Create your identity", desc: "Set up your Agent ZK profile with a display name and wallet." },
      { title: "Verify your wallet", desc: "Sign a challenge to prove you own the connected Kaspa wallet." },
      { title: "Connect & verify", desc: "Use your ZK identity to connect with other verified agents." },
    ],
    getStarted: [
      { title: "Open Agent ZK", desc: "Launch the identity app (premium feature)." },
      { title: "Set up your profile", desc: "Choose a display name and connect your Kaspa wallet." },
      { title: "Verify ownership", desc: "Sign the challenge to activate your ZK identity." },
    ],
  },
  Feed: {
    tagline: "Social feed + KAS tips",
    overview: "The TTT Feed is a social feed where every post can be tipped in KAS. Share updates, mint NFTs, play arcade games, and chat with the community — all with on-chain tipping baked in.",
    features: [
      { title: "On-chain tipping", desc: "Tip any post in KAS or KRC-20 tokens, sent directly on-chain." },
      { title: "NFT minting", desc: "Mint posts as NFTs straight from the feed." },
      { title: "Arcade", desc: "Built-in games like Pacman and a boxing mini-game." },
      { title: "Kai chatbot", desc: "An in-feed AI assistant for quick questions." },
      { title: "Reels", desc: "Swipe through short-form video reels." },
      { title: "Encrypted notes", desc: "Keep private encrypted notepads alongside your feed." },
    ],
    howItWorks: [
      { title: "Scroll the feed", desc: "Browse posts from the TTT community." },
      { title: "Tip a post", desc: "Tap the tip button on any post and send KAS on-chain." },
      { title: "Post & engage", desc: "Share your own updates, mint NFTs, or play the arcade." },
    ],
    getStarted: [
      { title: "Open Feed", desc: "Launch the feed from the store." },
      { title: "Connect a wallet", desc: "Add a Kaspa wallet so you can send and receive tips." },
      { title: "Tip your first post", desc: "Find a post you like and send it some KAS." },
    ],
  },
  Bridge: {
    tagline: "Send KAS cross-layer",
    overview: "Bridge lets you send Kaspa across layers — move KAS between L1 and L2 networks with proof-of-life verification and a live global counter of every bridged transaction.",
    features: [
      { title: "Cross-layer transfers", desc: "Move KAS between Kaspa L1 and supported L2 networks." },
      { title: "Proof of life", desc: "Each transfer is backed by a proof-of-life verification feed." },
      { title: "Global counter", desc: "Watch the total bridged value update in real time." },
      { title: "Transfer history", desc: "Track every bridge transaction with clear status." },
      { title: "Network switcher", desc: "Switch between source and destination networks easily." },
    ],
    howItWorks: [
      { title: "Pick networks", desc: "Choose the source and destination networks." },
      { title: "Enter amount", desc: "Specify how much KAS to bridge." },
      { title: "Confirm & track", desc: "Sign the transaction and follow it through proof-of-life to completion." },
    ],
    getStarted: [
      { title: "Open Bridge", desc: "Launch the bridge from the store." },
      { title: "Connect a wallet", desc: "Connect a Kaspa wallet with funds to bridge." },
      { title: "Send your first transfer", desc: "Pick networks, enter an amount, and confirm." },
    ],
  },
  Terra: {
    tagline: "Kaspa wallet manager",
    overview: "Terra is a full Kaspa wallet manager: create and import wallets, send and receive KAS, trade KRC-20 tokens, and manage multiple accounts — all with local key storage and a clean interface.",
    features: [
      { title: "Multi-wallet", desc: "Create and manage multiple Kaspa wallets with labels." },
      { title: "Send & receive", desc: "Send KAS to any address and generate receive addresses." },
      { title: "KRC-20 trading", desc: "View and transfer KRC-20 tokens natively." },
      { title: "UTXO management", desc: "Compound UTXOs to prevent storage-mass fee errors." },
      { title: "Local key storage", desc: "Keys and mnemonics stay on your device, never uploaded." },
    ],
    howItWorks: [
      { title: "Create or import", desc: "Generate a new wallet or import one with a seed phrase." },
      { title: "Fund it", desc: "Receive KAS at your wallet address." },
      { title: "Transact", desc: "Send KAS, trade KRC-20 tokens, and manage UTXOs as you go." },
    ],
    getStarted: [
      { title: "Open Terra", desc: "Launch the wallet manager from the store." },
      { title: "Create a wallet", desc: "Generate a new wallet and back up the seed phrase offline." },
      { title: "Receive KAS", desc: "Copy your address and send yourself some Kaspa." },
    ],
  },
  StakeDAG: {
    tagline: "Prediction markets on Kaspa",
    overview: "StakeDAG is a prediction-market game where you bet KAS on outcomes and settle on-chain. Create games, place bets, and watch results resolve automatically — a playful way to put your Kaspa to work.",
    features: [
      { title: "Prediction games", desc: "Create or join prediction markets on any topic." },
      { title: "On-chain bets", desc: "Bets are locked on-chain; winners are paid automatically." },
      { title: "Bet history", desc: "Track every bet you've placed and its outcome." },
      { title: "Wallet panel", desc: "Integrated Kaspa wallet for seamless betting." },
      { title: "Game cards", desc: "Browse and filter active games by category." },
    ],
    howItWorks: [
      { title: "Find a game", desc: "Browse active prediction markets or create your own." },
      { title: "Place a bet", desc: "Lock KAS on your predicted outcome." },
      { title: "Settle", desc: "When the outcome resolves, winners split the pot on-chain." },
    ],
    getStarted: [
      { title: "Open StakeDAG", desc: "Launch the prediction markets (admin feature)." },
      { title: "Fund your wallet", desc: "Make sure your connected wallet has KAS to bet." },
      { title: "Place your first bet", desc: "Pick a game and lock KAS on an outcome." },
    ],
  },
  TTTBuilder: {
    tagline: "AI site builder — prompt to live site",
    overview: "TTT Builder is an AI site builder: describe what you want and watch it generate a full, live site — code, design, and deploy. Chat with the agent, attach files, and push to GitHub when you're done. TTT Builder runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, and every published site is part of the Kaspa-native TTT ecosystem, no separate hosting account required.",
    features: [
      { title: "Prompt to site", desc: "Describe your site and the AI builds it — code, layout, and copy." },
      { title: "Agent chat", desc: "Iterate in a chat: ask for changes, attach files, drop images." },
      { title: "Live preview", desc: "See your site update in a live preview as you chat." },
      { title: "GitHub sync", desc: "Push the generated site straight to your GitHub repo." },
      { title: "Model selection", desc: "Choose the AI model that builds your site." },
      { title: "Push to store", desc: "Publish finished sites directly to the TTT App Store." },
    ],
    howItWorks: [
      { title: "Describe your site", desc: "Tell the builder what you want in plain English." },
      { title: "Iterate in chat", desc: "Refine the result by chatting with the agent and attaching assets." },
      { title: "Deploy", desc: "Push to GitHub or publish straight to the store." },
    ],
    getStarted: [
      { title: "Open TTT Builder", desc: "Launch the builder (admin/dev tool)." },
      { title: "Start a project", desc: "Describe the site you want to build." },
      { title: "Iterate & deploy", desc: "Chat to refine, then push to GitHub or the store." },
    ],
  },
  MotionFly: {
    tagline: "AI motion graphics scene builder",
    overview: "MotionFly builds motion-graphics scenes from a prompt. Layer panels, a live timeline, and instant previews let you compose animated scenes without opening a full motion suite. MotionFly runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, and any premium render credits settle on-chain on Kaspa.",
    features: [
      { title: "Prompt to scene", desc: "Describe a motion scene and MotionFly composes the layers." },
      { title: "Layer panel", desc: "Add, reorder, and tweak each layer independently." },
      { title: "Timeline tracks", desc: "Sequence animations across a visual timeline." },
      { title: "Instant preview", desc: "Preview the scene live as you edit." },
    ],
    howItWorks: [
      { title: "Describe the scene", desc: "Tell MotionFly what motion you want." },
      { title: "Compose layers", desc: "Adjust the layer panel and timeline to refine the scene." },
      { title: "Preview & export", desc: "Preview live, then export the final motion graphic." },
    ],
    getStarted: [
      { title: "Open MotionFly", desc: "Launch the scene builder from the store." },
      { title: "Write a scene prompt", desc: "Describe the motion graphic you want." },
      { title: "Compose & preview", desc: "Use the layer panel and timeline to refine, then preview." },
    ],
  },
  Kanta: {
    tagline: "AI lyrics writer — original songs from a single prompt",
    overview: "Kanta writes original song lyrics from a single prompt. Powered by TTT's built-in AI, it drafts a titled, structured lyric sheet — verses, chorus, bridge, outro — that you can edit, copy, or download and use anywhere. Kanta runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, and lyrics are generated by TTT's own AI with no external keys or quotas.",
    features: [
      { title: "Prompt to lyrics", desc: "Describe a vibe or story; Kanta writes titled, structured lyrics in seconds." },
      { title: "Structured songs", desc: "Full verses, repeating chorus, bridge, and outro — not just a few lines." },
      { title: "Editable", desc: "Tweak the generated title and lyrics freely before you save." },
      { title: "Copy & download", desc: "Copy to clipboard or download as a text file, royalty-free." },
      { title: "Regenerate", desc: "Spin a fresh take from the same prompt until it's right." },
      { title: "No external keys", desc: "Runs on TTT's own AI — no third-party API or quota limits." },
    ],
    howItWorks: [
      { title: "Write a prompt", desc: "Tell Kanta what the song should be about or feel like." },
      { title: "Generate lyrics", desc: "TTT's AI drafts a titled, structured lyric sheet." },
      { title: "Edit & export", desc: "Edit, copy, or download the lyrics — they're yours to keep." },
    ],
    getStarted: [
      { title: "Open Kanta", desc: "Launch the app from the store — it opens with built-in docs." },
      { title: "Write your prompt", desc: "Describe the song you want in a sentence or two." },
      { title: "Generate & download", desc: "Generate lyrics, then copy or download the text." },
    ],
  },
  Kutt: {
    tagline: "AI video editor — URL to viral video, real export",
    overview: "KUTT turns any video URL into a finished, viral-ready edit. Drop a link, let the AI analyze beats and scenes, pick a template, and export a real video file — no timeline expertise required. KUTT runs inside the TTT super app on the Kaspa network — your Kaspa wallet is your login, and any rendering credits or premium renders settle on the Kaspa Layer-1 DAG.",
    features: [
      { title: "URL to edit", desc: "Paste a video URL and KUTT pulls it in for editing." },
      { title: "Beat detection", desc: "AI finds the beats and cuts on them automatically." },
      { title: "Template gallery", desc: "Pick from curated viral edit templates." },
      { title: "Agent engine", desc: "A guided agent helps structure the edit and research the source." },
      { title: "Real export", desc: "Export a real MP4, not just a preview." },
    ],
    howItWorks: [
      { title: "Paste a URL", desc: "Drop the source video link into KUTT." },
      { title: "Pick a template", desc: "Choose a viral edit style and let the agent cut to the beats." },
      { title: "Export", desc: "Render and download the finished video." },
    ],
    getStarted: [
      { title: "Open KUTT", desc: "Launch the editor (admin feature)." },
      { title: "Paste a link", desc: "Add the video URL you want to edit." },
      { title: "Export your edit", desc: "Pick a template and export the final video." },
    ],
  },
};

// ── Category-aware default generator ──
// Produces structured doc content for any app not in CURATED, based on its
// category and the keywords in its description.
function generateDocs(app) {
  const cat = app.cat || "Tools";
  const desc = app.desc || "A TTT app built on the Kaspa ecosystem.";
  const name = app.name;

  const isKaspa = /\bkaspa\b|\bkas\b|krc20|kcc|covenant|dag/i.test(`${name} ${desc}`);
  const isWallet = /wallet|vault|multisig|address|balance|send|receive|tip/i.test(desc);
  const isCreative = /image|video|motion|storyboard|thumbnail|design|studio|editor|mockup|clip|reel|typography|sketch|clone/i.test(desc);
  const isAgent = /agent|ai|llm|prompt|research|assistant|chatbot|predict|analyze/i.test(desc);
  const isGame = /game|play|duel|arena|battle|prediction|bet|arcade/i.test(desc);

  const features = [];
  if (isKaspa) features.push({ title: "Kaspa-native", desc: "Built directly on the Kaspa ecosystem — no wrappers or bridges in the way." });
  if (isWallet) features.push({ title: "On-chain transactions", desc: "Send and receive Kaspa with real on-chain settlement." });
  if (isCreative) features.push({ title: "AI generation", desc: "Create visuals or video from a prompt with AI assistance." });
  if (isAgent) features.push({ title: "AI-powered", desc: "An intelligent agent handles the heavy lifting so you don't have to." });
  if (isGame) features.push({ title: "Play & earn", desc: "Engage with game mechanics and earn on-chain rewards." });
  features.push({ title: "One-tap launch", desc: "Open instantly from the TTT App Store — no install required." });
  if (app.premium) features.push({ title: "Premium feature", desc: "Unlock advanced capabilities as a premium TTT member." });

  return {
    tagline: desc,
    overview: `${name} is a ${cat.toLowerCase()} app in the TTT ecosystem. ${desc} ${isKaspa ? "It's built natively on Kaspa, so every action settles on-chain." : "It runs entirely in your browser inside the TTT super app, which is built on the Kaspa network — your Kaspa wallet is your login, and any payment or reward settles on the Kaspa Layer-1 DAG."} ${isAgent ? "An AI agent guides you through the core workflow." : ""} Launch it directly from the store — no install needed.`,
    features: features.slice(0, 5),
    howItWorks: [
      { title: "Open the app", desc: `Launch ${name} from the store with a single tap.` },
      { title: "Set up", desc: isWallet ? "Connect or create a Kaspa wallet to get started." : isCreative ? "Write your first prompt or upload your first asset." : "Follow the in-app onboarding to configure your workspace." },
      { title: "Use it", desc: `Use the core ${cat.toLowerCase()} workflow — ${desc.toLowerCase()}.` },
    ],
    getStarted: [
      { title: "Launch", desc: `Open ${name} from the App Store.` },
      { title: "Connect", desc: isWallet ? "Connect your Kaspa wallet." : "Complete the quick setup step." },
      { title: "Go", desc: "Start using the app's core feature right away." },
    ],
  };
}

export function getAppDocs(app) {
  const key = Object.keys(CURATED).find(
    (k) => k.toLowerCase() === (app.path || app.name || "").toLowerCase()
  );
  return (key ? CURATED[key] : null) || generateDocs(app);
}

// Category → layout key. Drives which DocsLayout component renders.
export function getLayoutKey(app) {
  const cat = (app.cat || "").toLowerCase();
  if (cat === "creative" || cat === "media") return "creative";
  if (cat === "finance" || cat === "kaspa") return "finance";
  if (cat === "games") return "games";
  if (cat === "ai") return "ai";
  return "default";
}