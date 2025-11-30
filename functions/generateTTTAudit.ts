import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const doc = new jsPDF();
    let y = 20;

    // Helper to add new page if needed
    const checkPage = () => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    };

    // Title Page
    doc.setFontSize(28);
    doc.setTextColor(6, 182, 212);
    doc.text('TTT Platform', 105, 40, { align: 'center' });
    doc.setFontSize(18);
    doc.setTextColor(100);
    doc.text('Complete System Audit', 105, 55, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 65, { align: 'center' });
    
    doc.addPage();
    y = 20;

    // TABLE OF CONTENTS
    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.text('Table of Contents', 20, y);
    y += 15;
    
    doc.setFontSize(11);
    const sections = [
      '1. Platform Overview',
      '2. Core Features & Apps',
      '3. User Management',
      '4. Blockchain Integration',
      '5. AI & Automation',
      '6. Social Features',
      '7. Marketplace & Commerce',
      '8. Developer Tools',
      '9. Security & Authentication',
      '10. Data Entities & Schema'
    ];
    
    sections.forEach(section => {
      doc.text(section, 30, y);
      y += 8;
    });

    doc.addPage();
    y = 20;

    // SECTION 1: PLATFORM OVERVIEW
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('1. Platform Overview', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const overview = [
      'TTT (The Transit Technology) is a comprehensive Web3 platform built on Kaspa blockchain.',
      '',
      'Core Technologies:',
      '• React + TailwindCSS frontend',
      '• Base44 backend-as-a-service',
      '• Kaspa blockchain integration',
      '• AI-powered features (OpenAI, Anthropic)',
      '• Real-time communications',
      '',
      'Platform Architecture:',
      '• 100+ pages and features',
      '• 50+ data entities',
      '• 80+ backend functions',
      '• Multiple AI agents',
      '• Wallet integration (Kasware, WalletConnect)',
      '',
      'Key Differentiators:',
      '• Blockchain-verified identity (TTT ID)',
      '• Decentralized social network',
      '• AI-powered content creation',
      '• P2P marketplace with escrow',
      '• Gaming & entertainment hub'
    ];
    
    overview.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 2: CORE FEATURES & APPS
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('2. Core Features & Apps', 20, y);
    y += 12;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('2.1 TTTV (Browser)', 20, y);
    y += 8;
    doc.setFontSize(10);
    const tttvFeatures = [
      '• Video streaming platform',
      '• YouTube integration',
      '• Movie/music search',
      '• Mini player with background playback',
      '• Content moderation',
      '• Share across apps via StarGate'
    ];
    tttvFeatures.forEach(f => {
      doc.text(f, 25, y);
      y += 6;
    });
    y += 4;

    checkPage();
    doc.setFontSize(12);
    doc.text('2.2 Agent ZK (AI Assistant)', 20, y);
    y += 8;
    doc.setFontSize(10);
    const zkFeatures = [
      '• Premium AI chatbot',
      '• Multi-model support (GPT-4, Claude)',
      '• Web search integration',
      '• Kaspa blockchain queries',
      '• Agent-to-agent connections',
      '• Workspace management',
      '• TTT wallet integration',
      '• Voice synthesis (ElevenLabs)',
      '• Agent ZK Directory for discovery',
      '• Profile customization with badges'
    ];
    zkFeatures.forEach(f => {
      checkPage();
      doc.text(f, 25, y);
      y += 6;
    });
    y += 4;

    checkPage();
    doc.setFontSize(12);
    doc.text('2.3 Zeku AI (General AI)', 20, y);
    y += 8;
    doc.setFontSize(10);
    const zekuFeatures = [
      '• Free AI assistant',
      '• Knowledge base integration',
      '• Internet search capability',
      '• File uploads support',
      '• Code generation',
      '• Multi-turn conversations'
    ];
    zekuFeatures.forEach(f => {
      doc.text(f, 25, y);
      y += 6;
    });
    y += 4;

    checkPage();
    doc.setFontSize(12);
    doc.text('2.4 AK (Entertainment Bot)', 20, y);
    y += 8;
    doc.setFontSize(10);
    const akFeatures = [
      '• Music streaming',
      '• Movie streaming (0123Movie)',
      '• Genre browsing',
      '• AI-powered recommendations',
      '• Custom nebula backgrounds',
      '• StarGate data sharing'
    ];
    akFeatures.forEach(f => {
      doc.text(f, 25, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('2.5 More Apps & Tools', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const moreApps = [
      'Feed (Social Network):',
      '• Encrypted posts with media',
      '• Comments, replies, threading',
      '• Tips with Kasware',
      '• Post stamping (blockchain verification)',
      '• User badges and roles',
      '• Gradient backgrounds',
      '',
      'Marketplace:',
      '• Buy/sell digital goods',
      '• P2P KAS trading',
      '• Escrow system',
      '• Review system',
      '• Trade messaging',
      '',
      'NFT Mint:',
      '• Create NFTs on Kaspa',
      '• NFT vault storage',
      '• Gallery display',
      '• Metadata management',
      '',
      'Arcade:',
      '• Wallet Bingo game',
      '• Lobby system',
      '• Prize pools in KAS',
      '• Provably fair gaming',
      '',
      'Bridge:',
      '• L1 <-> L2 transfers',
      '• Wallet connections',
      '• Transaction history',
      '• Bridge assistant AI',
      '',
      'Global War:',
      '• Real-time war news',
      '• AI analysis',
      '• News stamping',
      '• Viewer tracking',
      '',
      'Builders (Roadmap):',
      '• AI-generated roadmaps',
      '• Task tracking',
      '• Phase guidance',
      '• Progress monitoring',
      '',
      'Template Builder:',
      '• AI landing page generator',
      '• Canva integration guide',
      '• ChatGPT export workflow',
      '• Marketplace listing',
      '',
      'Shop:',
      '• Physical goods marketplace',
      '• Shopping cart',
      '• KAS payments',
      '• Order tracking'
    ];
    
    moreApps.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 3: USER MANAGEMENT
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('3. User Management', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const userMgmt = [
      'Authentication:',
      '• Email/password login',
      '• OAuth support',
      '• Admin role management',
      '• Session handling',
      '',
      'User Profile:',
      '• Username and display name',
      '• Wallet connections (Kasware)',
      '• TTT ID registration',
      '• Agent ZK ID',
      '• Bio and description',
      '• Custom gradients',
      '• Badge system (MODZ, VIP, etc.)',
      '',
      'Subscription System:',
      '• Premium tier (2 KAS/month)',
      '• Kasware payment integration',
      '• Time-based expiration',
      '• Feature gating',
      '• Admin overrides',
      '',
      'TTT ID:',
      '• Blockchain-verified identity',
      '• Kasware signature',
      '• Unique address-based ID',
      '• Seal verification',
      '',
      'User Stats:',
      '• Tips sent/received',
      '• Posts created',
      '• Engagement metrics',
      '• Follower counts'
    ];
    
    userMgmt.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 4: BLOCKCHAIN INTEGRATION
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('4. Blockchain Integration', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const blockchain = [
      'Kaspa Integration:',
      '• Native KAS support',
      '• Kasware wallet connection',
      '• Transaction signing',
      '• Balance queries',
      '• UTXO management',
      '• Address verification',
      '',
      'Wallet Features:',
      '• Send/receive KAS',
      '• Transaction history',
      '• QR code generation',
      '• Multiple wallet support',
      '• WalletConnect protocol',
      '',
      'Smart Contract Interactions:',
      '• Escrow contracts',
      '• Trade settlement',
      '• Dispute resolution',
      '',
      'Blockchain Verification:',
      '• Post stamping',
      '• News authentication',
      '• Identity sealing (TTT ID)',
      '• Signature validation',
      '',
      'DAGKnight Wallet:',
      '• Premium wallet interface',
      '• DAG visualization',
      '• Enhanced security',
      '• TTT verification badge',
      '',
      'Network Features:',
      '• L1/L2 bridging',
      '• Node connection',
      '• Live transaction feed',
      '• Whale tracking'
    ];
    
    blockchain.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 5: AI & AUTOMATION
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('5. AI & Automation', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const ai = [
      'AI Models Integrated:',
      '• OpenAI (GPT-4, GPT-4o-mini)',
      '• Anthropic (Claude)',
      '• Image generation (DALL-E)',
      '• Voice synthesis (ElevenLabs)',
      '',
      'AI Agents:',
      '• Agent ZK - Premium assistant',
      '• Zeku AI - General assistant',
      '• Agent FYE - Financial advisor',
      '• Agent Ying - Vision & pattern recognition',
      '• Bridge Assistant - Transaction helper',
      '• Hercules - Advanced AI tools',
      '',
      'AI Features:',
      '• Web search integration',
      '• Context-aware responses',
      '• Multi-turn conversations',
      '• File analysis',
      '• Code generation',
      '• Content moderation',
      '• News analysis',
      '• Price predictions',
      '• Market sentiment analysis',
      '',
      'Automation:',
      '• News aggregation',
      '• Transaction monitoring',
      '• Alert systems',
      '• Content recommendations',
      '• Smart feed curation',
      '• Auto-moderation'
    ];
    
    ai.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 6: SOCIAL FEATURES
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('6. Social Features', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const social = [
      'Feed System:',
      '• Create posts with text/images/videos',
      '• Multi-file uploads',
      '• Comments and replies',
      '• Threaded conversations',
      '• Like system',
      '• Tip creators with KAS',
      '• Post stamping (blockchain)',
      '• Encrypted notepad',
      '',
      'User Interactions:',
      '• Follow/unfollow',
      '• Direct messaging',
      '• Profile viewing',
      '• Badge display',
      '• Custom gradients',
      '',
      'Content Types:',
      '• Text posts',
      '• Image posts',
      '• Video posts',
      '• Document sharing',
      '• Reels (short videos)',
      '• Proof of Life videos',
      '• Proof of Bullish content',
      '',
      'Engagement Features:',
      '• Likes counter',
      '• Comments counter',
      '• Tips received tracking',
      '• View counts',
      '',
      'Moderation:',
      '• Content filtering',
      '• User reporting',
      '• Admin tools',
      '• Badge management',
      '• Role assignment'
    ];
    
    social.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 7: MARKETPLACE & COMMERCE
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('7. Marketplace & Commerce', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const commerce = [
      'Marketplace Features:',
      '• Buy/sell listings',
      '• P2P trading',
      '• Escrow system',
      '• Review system',
      '• Search and filters',
      '• Category browsing',
      '',
      'Trading System:',
      '• Smart contract escrow',
      '• Trade messaging',
      '• Status tracking',
      '• Dispute resolution',
      '• Payment confirmation',
      '',
      'Shop:',
      '• Physical goods',
      '• Shopping cart',
      '• Wishlist',
      '• Price tracking',
      '• KAS payments',
      '',
      'Template Marketplace:',
      '• AI-generated templates',
      '• Landing page designs',
      '• HTML/CSS code',
      '• Preview images',
      '• Purchase system',
      '',
      'Services (MarketX):',
      '• Gig marketplace',
      '• Task posting',
      '• Worker applications',
      '• Escrow payments',
      '• Review system',
      '',
      'NFT Marketplace:',
      '• NFT minting',
      '• NFT trading',
      '• Gallery display',
      '• Vault storage'
    ];
    
    commerce.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 8: DEVELOPER TOOLS
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('8. Developer Tools', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const dev = [
      'Backend Functions (80+):',
      '• Kaspa API integrations',
      '• AI model endpoints',
      '• Webhook handlers',
      '• Data aggregators',
      '• Smart contract interactions',
      '',
      'API Documentation:',
      '• Complete API docs page',
      '• Function descriptions',
      '• Input/output schemas',
      '• Authentication guides',
      '',
      'SSH Manager:',
      '• Remote server access',
      '• Project management',
      '• Command execution',
      '• File operations',
      '',
      'Hub (Admin):',
      '• System monitoring',
      '• User management',
      '• Content moderation',
      '• Analytics dashboard',
      '',
      'AI Analytics:',
      '• Conversation tracking',
      '• User preferences',
      '• Model performance',
      '• Cost monitoring',
      '',
      'StarGate System:',
      '• Cross-app data sharing',
      '• Context persistence',
      '• App history tracking',
      '• Data synchronization',
      '',
      'Testing Tools:',
      '• Mobile test page',
      '• API testing interfaces',
      '• Kaspa connection tests',
      '• Contract interaction tests'
    ];
    
    dev.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 9: SECURITY
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('9. Security & Authentication', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const security = [
      'Authentication Methods:',
      '• Email/password',
      '• Session tokens',
      '• API key authentication',
      '• Blockchain signatures',
      '',
      'Wallet Security:',
      '• Kasware integration',
      '• Signature verification',
      '• Address validation',
      '• Private key protection',
      '',
      'Data Security:',
      '• Encrypted notepad',
      '• PIN protection',
      '• Row-level security (RLS)',
      '• User data isolation',
      '',
      'Blockchain Verification:',
      '• Post stamping',
      '• Identity sealing',
      '• Transaction signing',
      '• Smart contract escrow',
      '',
      'Access Control:',
      '• Role-based permissions',
      '• Admin privileges',
      '• Premium feature gating',
      '• Entity-level permissions',
      '',
      'Content Moderation:',
      '• AI-powered filtering',
      '• User reporting',
      '• Admin review tools',
      '• Automatic flagging',
      '',
      'API Security:',
      '• Environment variables',
      '• Secret management',
      '• Rate limiting',
      '• CORS protection'
    ];
    
    security.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SECTION 10: DATA ENTITIES
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('10. Data Entities & Schema', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const entities = [
      'Core Entities (50+):',
      '',
      'Social:',
      '• Post - User posts with media',
      '• PostComment - Comment system',
      '• PostLike - Like tracking',
      '• TTTFollow - Follow relationships',
      '• UserBadge - User badges/roles',
      '',
      'Financial:',
      '• TipTransaction - KAS tipping',
      '• UserTipStats - Tip statistics',
      '• BridgeTransaction - L1/L2 transfers',
      '• GlobalTransaction - Public tx feed',
      '',
      'Marketplace:',
      '• Listing - Buy/sell listings',
      '• Trade - P2P trades',
      '• Review - User reviews',
      '• TradeMessage - Trade chat',
      '• ShopItem - Physical goods',
      '• ShoppingCart - Cart items',
      '• Template - Landing page templates',
      '',
      'Identity:',
      '• TTTID - Blockchain identity',
      '• SealedWallet - Verified wallets',
      '• WalletVerification - Verification records',
      '• DAGKnightCertificate - Premium badges',
      '',
      'AI & Agents:',
      '• AgentZKProfile - Agent profiles',
      '• AgentZKConnection - Agent links',
      '• AgentMessage - Agent chat',
      '• AgentMemory - AI memory',
      '• AIConversation - Chat history',
      '• UserPreference - AI preferences',
      '',
      'Gaming:',
      '• BingoGame - Bingo games',
      '• ProofOfBullish - Bullish content',
      '• ProofOfLife - Life proofs',
      '',
      'Content:',
      '• TTTVVideo - Video catalog',
      '• StampedNews - Verified news',
      '• NewsView - View tracking',
      '• NewsAnalysis - AI analysis',
      '• BibleVerse - Bible content',
      '',
      'Professional:',
      '• ServiceListing - Gig economy',
      '• HREmployee - HR management',
      '• HRTransaction - Payroll',
      '• IWorkProfile - Job profiles',
      '',
      'Developer:',
      '• SSHConnection - Server access',
      '• ZKEndpoint - API endpoints',
      '• AppProposal - App suggestions',
      '• AppIconCustomization - Icon mgmt'
    ];
    
    entities.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // BUTTONS & INTERACTIONS
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('Key Buttons & Actions', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const buttons = [
      'Navigation:',
      '• TTTV - Opens video browser',
      '• Agent ZK - Opens AI assistant',
      '• Zeku AI - Opens free AI chat',
      '• Feed - Opens social feed',
      '• Profile - User profile page',
      '• More menu - Additional apps',
      '',
      'Social Actions:',
      '• Like - Like posts',
      '• Comment - Add comments',
      '• Reply - Reply to posts',
      '• Tip - Send KAS tips',
      '• Stamp - Blockchain verify',
      '• Share - Share content',
      '• Follow - Follow users',
      '',
      'Wallet Actions:',
      '• Connect Wallet - Kasware connect',
      '• Send KAS - Transfer funds',
      '• Receive - Generate QR code',
      '• Bridge - L1/L2 transfers',
      '• Sign - Sign transactions',
      '',
      'Content Actions:',
      '• Create Post - New post',
      '• Upload Media - Add files',
      '• Edit - Modify content',
      '• Delete - Remove content',
      '• Search - Find content',
      '',
      'AI Actions:',
      '• Send Message - Chat with AI',
      '• Web Search - Enable search',
      '• Upload File - Add context',
      '• Clear Chat - Reset',
      '• Switch Model - Change AI',
      '',
      'Marketplace Actions:',
      '• Create Listing - New item',
      '• Buy - Purchase item',
      '• Bid - Make offer',
      '• Review - Leave feedback',
      '• Message Seller - Contact',
      '',
      'Premium Actions:',
      '• Subscribe - Get premium',
      '• Pay with Kasware - KAS payment',
      '• Upgrade - Premium features',
      '',
      'Admin Actions:',
      '• Moderate - Content review',
      '• Ban User - Block access',
      '• Assign Badge - Give roles',
      '• View Analytics - Stats',
      '• Manage Users - User admin'
    ];
    
    buttons.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // INTEGRATIONS
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('External Integrations', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const integrations = [
      'Blockchain:',
      '• Kasware Wallet',
      '• WalletConnect',
      '• Kaspa RPC nodes',
      '• Forbole API',
      '',
      'AI Services:',
      '• OpenAI (GPT-4)',
      '• Anthropic (Claude)',
      '• DALL-E (images)',
      '• ElevenLabs (voice)',
      '',
      'Media:',
      '• YouTube API',
      '• 0123Movie',
      '• Music streaming',
      '',
      'Payment:',
      '• Kaspa blockchain',
      '• Escrow contracts',
      '',
      'Search:',
      '• Web search APIs',
      '• YouTube search',
      '• Job search (Indeed)',
      '',
      'Verification:',
      '• Civic (KYC)',
      '• Blockchain signatures',
      '',
      'Development:',
      '• SSH connections',
      '• API testing tools'
    ];
    
    integrations.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // MOBILE FEATURES
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('Mobile-Specific Features', 20, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const mobile = [
      'Responsive Design:',
      '• Touch-optimized UI',
      '• Safe area insets',
      '• Mobile navigation',
      '• Bottom tab bar',
      '',
      'Mobile Navigation:',
      '• Apps - Home grid',
      '• TTTV - Video browser',
      '• Feed - Social feed',
      '• ZK - AI assistant',
      '• Profile - User page',
      '',
      'Mobile Interactions:',
      '• Swipe gestures',
      '• Pull to refresh',
      '• Touch feedback',
      '• Long press menus',
      '',
      'Mobile Optimizations:',
      '• Lazy loading',
      '• Image compression',
      '• Video streaming',
      '• Offline caching',
      '',
      'PWA Features:',
      '• Install prompt',
      '• Standalone mode',
      '• Push notifications',
      '• Background sync'
    ];
    
    mobile.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 6;
    });

    doc.addPage();
    y = 20;

    // SUMMARY PAGE
    doc.setFontSize(20);
    doc.setTextColor(6, 182, 212);
    doc.text('Platform Summary', 20, y);
    y += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    const summary = [
      'TTT is a comprehensive Web3 super-app that combines:',
      '',
      '✓ Social networking with blockchain verification',
      '✓ AI-powered assistants and automation',
      '✓ Decentralized marketplace with escrow',
      '✓ Entertainment hub (music, movies, games)',
      '✓ Developer tools and APIs',
      '✓ Kaspa blockchain integration',
      '✓ Premium subscription model',
      '',
      'Total Platform Scale:',
      '• 100+ pages and features',
      '• 50+ data entities',
      '• 80+ backend functions',
      '• 10+ AI agents',
      '• 1000s of users',
      '',
      'Key Technologies:',
      '• React + TailwindCSS',
      '• Base44 BaaS',
      '• Kaspa blockchain',
      '• OpenAI & Anthropic',
      '• Real-time websockets',
      '',
      'Security:',
      '• Row-level security',
      '• Blockchain signatures',
      '• Encrypted data',
      '• Admin controls',
      '',
      'Revenue Streams:',
      '• Premium subscriptions (2 KAS/month)',
      '• Marketplace fees',
      '• Template sales',
      '• Service commissions',
      '',
      'Future Roadmap:',
      '• Mobile apps (iOS/Android)',
      '• More AI agents',
      '• Enhanced gaming',
      '• DAO governance',
      '• Token launch'
    ];
    
    summary.forEach(line => {
      checkPage();
      doc.text(line, 20, y);
      y += 7;
    });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=ttt-complete-audit.pdf'
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});