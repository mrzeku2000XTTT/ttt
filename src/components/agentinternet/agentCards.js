export const CARD_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_030111_a9e15665-d379-4a7f-8116-695bbe452ad1.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_171347_f640c30d-ec21-426a-98bc-77e07c2c60cb.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4'
];

// Real agent identity cards — the "passports" of the Agent Internet
export const AGENT_CARDS = [
  {
    name: 'AGENT ZK',
    role: 'Zero-Knowledge Operator',
    id: 'A2A 8908 1121 4892',
    protocol: 'A2A / MCP',
    key: 'zk-9f3',
    skills: ['identity', 'proofs', 'wallet'],
    blueprint: [
      { status: 'done', title: 'Signed Agent Identity', branch: 'main', desc: 'Issues and verifies agent ID cards with local key custody.', files: ['zk/identity.card.ts', 'zk/keys.local.ts'] },
      { status: 'active', title: 'Proof Engine', branch: 'feat/zk-proofs', desc: 'Generates zero-knowledge proofs of balance, work and ownership.', files: ['zk/prove.ts', 'zk/verify.ts'] },
      { status: 'planned', title: 'Delegated Signing', branch: 'next', desc: 'Agents request signatures; humans approve with a PIN.', files: ['zk/delegate.ts'] }
    ]
  },
  {
    name: 'AGENT YING',
    role: 'Vision & Research',
    id: 'MCP 7831 9904 5124',
    protocol: 'MCP',
    key: 'yg-1c8',
    skills: ['vision', 'search', 'summaries'],
    blueprint: [
      { status: 'done', title: 'Vision Pipeline', branch: 'main', desc: 'Reads images, screenshots and documents into structured facts.', files: ['ying/vision.ts', 'ying/extract.ts'] },
      { status: 'active', title: 'Live Web Research', branch: 'feat/deep-research', desc: 'Grounded search with source citations instead of guesses.', files: ['ying/research.ts', 'ying/sources.ts'] },
      { status: 'planned', title: 'Long-Term Recall', branch: 'next', desc: 'Persistent research memory shared across agents.', files: ['ying/memory.ts'] }
    ]
  },
  {
    name: 'AGENT KAI',
    role: 'Knowledge Router',
    id: 'A2A 4120 7733 9035',
    protocol: 'A2A',
    key: 'ka-7b2',
    skills: ['memory', 'routing', 'docs'],
    blueprint: [
      { status: 'done', title: 'Intent Router', branch: 'main', desc: 'Routes any request to the right agent or app route.', files: ['kai/router.ts', 'kai/sitemap.json'] },
      { status: 'active', title: 'Knowledge Index', branch: 'feat/kb-index', desc: 'Indexes docs, apps and registry data for instant answers.', files: ['kai/index.ts', 'kai/embed.ts'] },
      { status: 'planned', title: 'Agent Handoff', branch: 'next', desc: 'Passes a task mid-flight to a better-suited agent.', files: ['kai/handoff.ts'] }
    ]
  },
  {
    name: 'AGENT SLOBZ',
    role: 'Gig Escrow Broker',
    id: 'X402 5567 1223 2468',
    protocol: 'x402',
    key: 'sl-4d1',
    skills: ['escrow', 'payments', 'verify'],
    blueprint: [
      { status: 'done', title: 'Covenant Escrow', branch: 'main', desc: 'Per-gig escrow wallets that lock KAS until work is proven.', files: ['slobz/escrow.ts', 'slobz/wallet.ts'] },
      { status: 'active', title: 'x402 Settlement', branch: 'feat/x402-kaspa', desc: 'Machine-to-machine invoicing and payout on Kaspa L1.', files: ['x402/invoice.ts', 'x402/settle.kaspa.ts'] },
      { status: 'planned', title: 'Dispute Arbiter', branch: 'next', desc: 'AI arbitration when proof and requirements disagree.', files: ['slobz/arbiter.ts'] }
    ]
  },
  {
    name: 'AGENT TREE',
    role: 'Campaign Strategist',
    id: 'A2A 8891 2234 7713',
    protocol: 'A2A',
    key: 'tr-6e5',
    skills: ['ads', 'copy', 'media'],
    blueprint: [
      { status: 'done', title: 'Campaign Planner', branch: 'main', desc: 'Turns a product into a full multi-template campaign strategy.', files: ['tree/strategy.ts', 'tree/templates.ts'] },
      { status: 'active', title: 'Media Generator', branch: 'feat/ad-media', desc: 'Generates ad visuals and narration per template.', files: ['tree/image.ts', 'tree/voice.ts'] },
      { status: 'planned', title: 'Performance Loop', branch: 'next', desc: 'Feeds real results back into the next campaign.', files: ['tree/feedback.ts'] }
    ]
  }
];