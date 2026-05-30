import { Sparkles, Rocket, Layers, Shield, Cpu, Globe, Users, Zap, Award, Boxes } from "lucide-react";

export const ABOUT_TABS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "mission", label: "Mission", icon: Rocket },
  { id: "ecosystem", label: "Ecosystem", icon: Layers },
  { id: "technology", label: "Technology", icon: Cpu },
  { id: "security", label: "Security", icon: Shield },
  { id: "community", label: "Community", icon: Users },
  { id: "milestones", label: "Milestones", icon: Zap },
  { id: "certifications", label: "Certifications", icon: Award },
];

export const STATS = [
  { icon: Boxes, value: "80+", label: "Apps shipped" },
  { icon: Globe, value: "10 bps", label: "Kaspa blocks/sec" },
  { icon: Users, value: "1", label: "Unified super app" },
  { icon: Zap, value: "Nov 7", label: "Born 2025" },
];

export const ECOSYSTEM = [
  { name: "AI Studio", desc: "Image, video & agent tools" },
  { name: "Finance", desc: "Wallets, bridges & tipping" },
  { name: "Games", desc: "Arcade & prediction markets" },
  { name: "Creative", desc: "Design, motion & storyboards" },
  { name: "Social", desc: "Encrypted feed & community" },
  { name: "Dev Tools", desc: "No-code AI workflows" },
];

export const TECH = [
  { title: "Kaspa BlockDAG", desc: "Real-time proof-of-work settlement at 10 blocks per second." },
  { title: "AI Agents", desc: "Autonomous agents that act, verify and create on your behalf." },
  { title: "On-chain Proof", desc: "Verifiable proofs anchored to the Kaspa network." },
  { title: "Zero-Knowledge", desc: "Privacy-first identity with Agent ZK." },
];

export const MILESTONES = [
  { date: "Nov 2025", text: "TTT super app launches on Kaspa." },
  { date: "Q4 2025", text: "App Store reaches 80+ live apps." },
  { date: "Q4 2025", text: "Agent ZK & on-chain identity shipped." },
  { date: "2026", text: "AI agent automations across the ecosystem." },
];

export const CERTIFICATIONS = [
  { title: "Kaspa Native", issuer: "Built on Kaspa BlockDAG", verified: true },
  { title: "On-chain Verified", issuer: "Proof-of-Work secured", verified: true },
  { title: "ZK Identity", issuer: "Agent ZK system", verified: true },
  { title: "Open Ecosystem", issuer: "Community-built apps", verified: true },
];