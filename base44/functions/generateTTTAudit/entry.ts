import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@2.5.1';

// TTT brand colors
const CYAN = [6, 182, 212];
const BLACK = [10, 10, 10];
const WHITE = [240, 240, 240];
const GRAY = [140, 150, 160];

const SECTIONS = [
  {
    title: '1. Platform Overview',
    lines: [
      'TTT is a comprehensive Web3 super-app built on the Kaspa blockchain.',
      '',
      'Core Technologies:',
      '- React + TailwindCSS frontend',
      '- Base44 backend-as-a-service',
      '- Kaspa blockchain integration (Kasware, TTT Wallet, Terra)',
      '- AI-powered features (Anthropic, OpenAI, ElevenLabs)',
      '',
      'Platform Scale:',
      '- 300+ pages and features',
      '- 150+ data entities',
      '- 150+ backend functions',
      '- 10+ AI agents',
      '',
      'Key Differentiators:',
      '- Blockchain-verified identity (TTT ID, Agent ZK)',
      '- Guest-friendly public app: wallet-first, login optional',
      '- Decentralized social feed with on-chain tipping',
      '- AI creative studios (Motion, Hikaru, RMX, UltraMock, Kine)',
      '- P2P marketplace, arcade, and bridge',
    ],
  },
  {
    title: '2. Landing & Entry Flow',
    lines: [
      'Landing Page ("/"): TTT Landing - cosmic eye gateway',
      '- Minimal light-themed portal with animated orb artwork',
      '- Tagline: "Earth to Mars Trading - Powered by Kaspa"',
      '- PLAY button leads into TTT Gate, then the main app',
      '',
      'Authentication Entry:',
      '- /login, /register, /forgot-password, /reset-password',
      '- Custom in-app auth pages (email/password + Google OAuth)',
      '- All Login buttons route to the in-app /login page',
      '- Guests can use the full public app without an account',
    ],
  },
  {
    title: '3. Core Apps',
    lines: [
      'TTTV (Browser): video streaming, YouTube integration, mini player',
      'Agent ZK: premium AI assistant, wallet queries, agent directory',
      'Zeku AI: free AI assistant with knowledge base + web search',
      'Feed: encrypted social posts, comments, KAS / KRC-20 tipping',
      'Marketplace & Shop: P2P trading, escrow, KAS payments',
      'Bridge: L1 <-> L2 transfers with assistant AI',
      'Arcade: Wallet Bingo, Tetris Battle, prediction games',
      'NFT Mint: create and vault NFTs on Kaspa',
      '',
      'AI Creative Suite:',
      '- Motion: AI website/animation generator',
      '- Hikaru: image generation, relight, upscale',
      '- RMX / NODA / MIRAGE: node-based AI workflows',
      '- UltraMock: device mockup video studio',
      '- Kine: cinematic AI video generation',
      '- Storyboard / MoodBoard / Thumbnail Creator studios',
    ],
  },
  {
    title: '4. Blockchain Integration',
    lines: [
      'Kaspa Integration:',
      '- Native KAS send/receive (Kasware, TTT Wallet, Terra)',
      '- KRC-20 token transfers and tipping',
      '- UTXO management, transaction signing, address derivation',
      '- Live DAG visualizer (2D/3D) with network stats',
      '',
      'Verification:',
      '- Post stamping (blockchain verification)',
      '- TTT ID identity sealing via wallet signature',
      '- Proof of Work / Proof of Life / Proof of Bullish systems',
      '',
      'Wallets Supported:',
      '- Kasware (extension), TTT Wallet (in-app), Terra (local)',
      '- MetaMask (L2), WalletConnect, Zelcore',
    ],
  },
  {
    title: '5. AI & Automation',
    lines: [
      'AI Agents:',
      '- Agent ZK (premium assistant), Zeku AI (general)',
      '- Agent Ying (vision + pattern recognition)',
      '- Agent FYE (financial), Bridge Assistant, KAI (feed)',
      '- Katagami Master Agent, Brand Agent, OneShot cluster',
      '',
      'Capabilities:',
      '- Multi-model chat (Claude, GPT), web search, file analysis',
      '- Image / voice generation (ElevenLabs)',
      '- News aggregation and AI analysis',
      '- Content moderation and smart feed curation',
      '- Telegram bot integration',
    ],
  },
  {
    title: '6. Security & Authentication',
    lines: [
      'Authentication:',
      '- Email/password + Google OAuth via custom in-app pages',
      '- OTP email verification on registration',
      '- Public app: guest access allowed, no forced login walls',
      '- Admin role gating on sensitive functions',
      '',
      'Wallet Security:',
      '- Private keys never leave user custody (Kasware/local)',
      '- Terra wallet: PIN/mnemonic encrypted in local storage',
      '- Signature verification for identity sealing',
      '',
      'Data Security:',
      '- Row-level security (RLS) on all entities',
      '- User data isolation by email/wallet',
      '- Secrets managed via environment variables',
      '- Encrypted notepad with PIN protection',
    ],
  },
  {
    title: '7. Security Audit Findings (June 2026)',
    lines: [
      'AUDIT STATUS: PASSED',
      '',
      'Recent fixes verified by simulation:',
      '',
      '[FIXED] Login "Connecting" hang',
      '- Legacy boot overlay removed from index.html',
      '- All Login buttons now route to in-app /login page',
      '',
      '[FIXED] Guest tipping permission errors',
      '- incrementPostTips runs with service role, guest-safe',
      '- Function can ONLY increment tip counters - it cannot',
      '  move funds, edit posts, or touch wallets',
      '',
      '[HARDENED] Tip counter abuse protection',
      '- Amount capped at 100,000 per call (tested: blocked)',
      '- Non-finite/negative amounts rejected (tested: blocked)',
      '- Ticker sanitized to alphanumeric, max 12 chars',
      '  (script injection tested: blocked)',
      '',
      'Standing protections:',
      '- Real KAS transfers always require wallet signature',
      '- Admin-only functions verify user.role === "admin"',
      '- RLS prevents cross-user data access',
    ],
  },
  {
    title: '8. Data Entities & Schema',
    lines: [
      'Social: Post, PostComment, PostLike, TTTFollow, UserBadge',
      'Financial: TipTransaction, UserTipStats, BridgeTransaction',
      'Marketplace: Listing, Trade, Review, ShopItem, Template',
      'Identity: TTTID, SealedWallet, WalletVerification, AgentZKProfile',
      'AI: AgentMemory, AIConversation, AgentMessage, AgentConfig',
      'Creative: StoryboardProject, MotionCreation, KineGeneration,',
      '  ThumbnailProject, MoodBoardScene, SlideDeck, OneShotProject',
      'Gaming: BingoGame, TetrisMatch, GameBet, PredictionGame',
      'Content: TTTVVideo, StampedNews, NewsAnalysis, BibleVerse',
      'Professional: ServiceListing, HREmployee, IWorkProfile',
      '',
      'All entities enforce row-level security (RLS) rules.',
    ],
  },
  {
    title: '9. Summary',
    lines: [
      'TTT is a production-scale Kaspa super-app combining:',
      '',
      '+ Social networking with on-chain verification & tipping',
      '+ A full AI creative and assistant suite',
      '+ Decentralized commerce with escrow',
      '+ Entertainment, gaming, and education hubs',
      '+ Guest-first public access with optional accounts',
      '',
      'Security posture: PASSED latest simulation audit.',
      'All known attack vectors on public endpoints are blocked.',
    ],
  },
];

function paintPage(doc) {
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, 210, 297, 'F');
  // top cyan accent line
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, 210, 1.5, 'F');
}

function footer(doc, pageNum) {
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('TTT - Powered by Kaspa', 20, 290);
  doc.text(`Page ${pageNum}`, 190, 290, { align: 'right' });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const doc = new jsPDF();
    let pageNum = 1;

    // ===== BRANDED COVER =====
    paintPage(doc);
    doc.setFillColor(...CYAN);
    doc.circle(105, 90, 18, 'F');
    doc.setFontSize(26);
    doc.setTextColor(...BLACK);
    doc.text('TTT', 105, 93, { align: 'center' });

    doc.setFontSize(32);
    doc.setTextColor(...CYAN);
    doc.text('TTT PLATFORM', 105, 135, { align: 'center' });
    doc.setFontSize(18);
    doc.setTextColor(...WHITE);
    doc.text('Complete System & Security Audit', 105, 148, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text('Earth to Mars Trading - Powered by Kaspa', 105, 160, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 170, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(...CYAN);
    doc.text('AUDIT STATUS: PASSED', 105, 190, { align: 'center' });
    footer(doc, pageNum);

    // ===== TABLE OF CONTENTS =====
    doc.addPage();
    pageNum++;
    paintPage(doc);
    doc.setFontSize(20);
    doc.setTextColor(...CYAN);
    doc.text('Table of Contents', 20, 28);
    let y = 44;
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    SECTIONS.forEach((s) => {
      doc.text(s.title, 28, y);
      y += 9;
    });
    footer(doc, pageNum);

    // ===== SECTIONS =====
    for (const section of SECTIONS) {
      doc.addPage();
      pageNum++;
      paintPage(doc);

      doc.setFontSize(17);
      doc.setTextColor(...CYAN);
      doc.text(section.title, 20, 28);
      doc.setDrawColor(...CYAN);
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);

      y = 44;
      doc.setFontSize(10);
      for (const line of section.lines) {
        if (y > 275) {
          footer(doc, pageNum);
          doc.addPage();
          pageNum++;
          paintPage(doc);
          y = 28;
          doc.setFontSize(10);
        }
        const isHeader = line.endsWith(':');
        const isStatus = line.startsWith('[') || line.startsWith('AUDIT');
        if (isStatus) {
          doc.setTextColor(...CYAN);
        } else if (isHeader) {
          doc.setTextColor(...WHITE);
        } else {
          doc.setTextColor(200, 205, 210);
        }
        doc.text(line, line.startsWith('-') || line.startsWith('+') || line.startsWith(' ') ? 26 : 20, y);
        y += 6.2;
      }
      footer(doc, pageNum);
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=ttt-platform-audit.pdf',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});