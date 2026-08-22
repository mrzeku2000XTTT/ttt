import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { buildProductivityPrompt } from '../../shared/productivityKnowledge.ts';

// AWA — x402-style payment gateway on Kaspa L1.
// Flow: request → HTTP 402 Payment Required (KAS quote) → pay on L1 → settle (tx verified on-chain) → AI service delivered.
const SERVICES = {
  "oracle-research": {
    name: "AWA Oracle — Live Deep Research Report",
    price_kas: 0.5,
    result_type: "markdown",
  },
  "forge-image": {
    name: "AWA Forge — AI Artwork Commission",
    price_kas: 0.25,
    result_type: "image_url",
  },
  "covenant-architect": {
    name: "AWA Architect — Covenant++ Blueprint",
    price_kas: 1,
    result_type: "markdown",
  },
  "productivity-coach": {
    name: "Better Ideas AI — Productivity Coach Reply",
    price_kas: 0.05,
    result_type: "markdown",
  },
  "tree-campaign": {
    name: "AWA Tree — Full Ad Campaign Unlock",
    price_kas: 0.5,
    result_type: "markdown",
  },
};