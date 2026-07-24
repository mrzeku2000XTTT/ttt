import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Crown, ExternalLink, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

const APPS = [
  // ── 🆕 Newest (add new apps HERE at the top) ──
  { name: "2TIP", path: "Tip", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c44e4a998_generated_image.png", desc: "Instant KAS tipping", admin: true },
  { name: "KCC NFT", path: "KCCNft", cat: "Kaspa", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2e60c6e4a_generated_image.png", desc: "Mint KCC covenant NFT identities on Kaspa L1" },
  { name: "KUTT", path: "Kutt", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8d4bef7cb_generated_image.png", desc: "AI video editor — URL to viral video, real export" },
  { name: "Tree", path: "Tree", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b404d810b_generated_image.png", desc: "Campaign agent — full ad campaigns from one brief" },
  { name: "KLIPZ", path: "Klipz", cat: "Media", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3ddaedfc7_generated_image.png", desc: "AI clip engine — clip live streams & videos natively" },
  { name: "Kascov", path: "Kascov", cat: "Kaspa", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4f1bb97ec_generated_image.png", desc: "Covenant explorer · scan ZK smart coins" },
  { name: "Calculator", path: "Calculator", cat: "TTT", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bedec5aa6_generated_image.png", desc: "TTT AI calculator" },
  { name: "KAS SWORD", path: null, externalUrl: "https://kassword.com", cat: "Security", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/636eaa7be_generated_image.png", desc: "Post-quantum DAG vault" },
  { name: "SuperZK", path: "SuperZK", cat: "Security", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f56df5112_generated_image.png", desc: "ZK vault · secure identity" },
  { name: "KasBillboard", path: "KasBillboard", cat: "Kaspa", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/571fc08c6_image.png", desc: "Kaspa billboard advertising" },
  { name: "KaScan", path: null, externalUrl: "https://kascan.io", cat: "Tools", logo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=200&fit=crop", desc: "Kaspa blockchain scanner" },
  { name: "Ghost Frame", path: "GhostFrame", cat: "Creative", logo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&h=200&fit=crop", desc: "Frame consistency suite · AI music video", admin: true },
  { name: "ORIN", path: "ORINLanding", cat: "Tools", logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop", desc: "Travel intelligence · hotel matching" },
  { name: "TTT Builder", path: "TTTBuilder", cat: "Dev Tools", logo: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=200&fit=crop", desc: "AI site builder — prompt to live site", admin: true },
  { name: "ORBT", path: "ORBT", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ecf033abc_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/6fa1d3056_generated_video.mp4", desc: "AI brand voice & copy transformer" },
  { name: "MotionFly", path: "MotionFly", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b941540b_generated_image.png", desc: "AI motion graphics scene builder" },
  { name: "WorldWalker", path: "WorldWalker", cat: "Creative", logo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop", desc: "Walk any image · cinematic camera shots", admin: true },
  { name: "00", path: "DoubleO", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6bba145cf_generated_image.png", desc: "Book-to-movie story studio" },
  { name: "ARC", path: "ARC", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0c5a37d9e_generated_image.png", desc: "Viral template decoder & remixer" },
  { name: "MetaMimic", path: "MetaMimic", cat: "Dev Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d7223a3d9_generated_image.png", desc: "Images & files to HTML clones" },
  { name: "Kasthletics", path: "Kasthletics", cat: "Fitness", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/88f689596_generated_image.png", desc: "Proof-of-Workout fitness on Kaspa" },
  { name: "Quick Storyboard", path: "QuickStoryboard", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e83c9a29b_image.png", desc: "Idea to storyboard sheet" },
  { name: "Thumbnail Creator", path: "ThumbnailCreator", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6ac2ec072_generated_image.png", desc: "AI thumbnails for creators" },
  { name: "K6ix", path: null, externalUrl: "https://k6ix.base44.app", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bd502aa5a_image.png", desc: "Creative AI API" },
  { name: "FrameZ", path: "FrameZ", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b5a1b9a40_generated_image.png", desc: "AI interactive decks", admin: true },
  { name: "Kine", path: "Kine", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d4040c3da_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/b38409cda_generated_video.mp4", desc: "AI video agent · text to video" },
  { name: "TRINITY", path: "Trinity", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3e8b286e0_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/7ab3a0079_generated_video.mp4", desc: "3 agents · 3 results · 1 prompt" },
  { name: "BeatCut", path: "BeatCut", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/80ea7b3ed_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/f59063451_generated_video.mp4", desc: "AI beat-synced auto editor" },
  { name: "Doom", path: "Doom", cat: "Media", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/da5ef69c7_generated_image.png", desc: "Doomscroll any topic" },
  { name: "型紙 Katagami", path: "Katagami", cat: "Education", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b83d219ef_generated_image.png", desc: "Motion design masterclass" },
  { name: "Cháoxiào", path: "UltraMock", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/15c852849_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/4ae7e645c_generated_video.mp4", desc: "Cheeky device mockups" },
  { name: "APEX", path: "APEX", cat: "Security", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/de2e1af61_generated_image.png", desc: "ZK proof for NODA runs" },
  { name: "NODA", path: "NODA", cat: "Dev Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4a4455642_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/e294fb91a_generated_video.mp4", desc: "Node-based AI workflows" },
  { name: "Motion", path: "Motion", cat: "Dev Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/81791a703_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/86cffc2ea_generated_video.mp4", desc: "Vibe-code landing pages", admin: true },
  { name: "RMX Ultra", path: "RMX", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f2f74ca6e_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/d46344bca_generated_video.mp4", desc: "Visual workflow automation" },
  { name: "TELE", path: "TELE", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/242215e43_generated_image.png", desc: "TTT agent on Telegram" },
  { name: "Hiro", path: "Hiro", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1a11decfa_generated_image.png", desc: "AI typography studio" },
  { name: "NEPU", path: "NEPU", cat: "Media", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8f9fda87e_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/52b020b2c_generated_video.mp4", desc: "Free TV shows & movies" },

  // ── Featured / Core ──
  { name: "Feed", path: "Feed", cat: "Community", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fdf274d16_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/e412d2ebc_generated_video.mp4", desc: "Social feed + KAS tips" },
  { name: "Agent ZK", path: "AgentZK", cat: "AI", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png", desc: "Crypto identity", premium: true },
  { name: "TTTV", path: "Browser", cat: "Media", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f510ff896_generated_image.png", video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/04070fcbe_generated_video.mp4", desc: "Ad-free video browser" },
  { name: "Bridge", path: "Bridge", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1678c90a9_generated_image.png", desc: "Send KAS cross-layer" },
  { name: "StakeDAG", path: "StakeDAG", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png", desc: "Prediction markets", admin: true },
  { name: "DAGKnight", path: "DAGKnightWallet", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/90ec7400b_generated_image.png", desc: "Advanced wallet", premium: true },
  { name: "Hikaru", path: "Hikaru", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bf98870ab_generated_image.png", desc: "AI image studio" },
  { name: "Zeku AI", path: "ZekuAI", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ee7c7d611_generated_image.png", desc: "Premium AI assistant", premium: true },
  { name: "Xùnhuà", path: "Xunhua", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3baf54085_generated_image.png", desc: "AI sketch to image" },
  { name: "Terra", path: "Terra", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/02e4109c7_generated_image.png", desc: "Kaspa wallet manager" },

  // ── Finance ──
  { name: "TapToTip", path: "TapToTip", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ea6112210_generated_image.png", desc: "Quick KAS tipping" },
  { name: "Kurve", path: "Kurve", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/926f3b5ef_generated_image.png", desc: "Kaspa charts" },
  { name: "CoinSpace", path: "CoinSpace", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5b76c63a9_generated_image.png", desc: "Wallet app" },
  { name: "OnChain POS", path: "OnChainPOS", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5642bf460_generated_image.png", desc: "Point of sale" },
  { name: "KC Bridge", path: "KCbridge", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3ffa2873f_generated_image.png", desc: "Cross-chain bridge" },
  { name: "Kurncy", path: "Kurncy", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/567e67ab8_generated_image.png", desc: "Currency exchange" },
  { name: "KivR", path: "KivR", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/44af2ccc6_generated_image.png", desc: "IVR + KAS payments" },
  { name: "VAULT", path: "Vault", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6cf3bf06c_generated_image.png", desc: "Secure vault" },

  // ── AI ──
  { name: "Freedom", path: "Freedom", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1d153c186_generated_image.png", desc: "Privacy AI tools" },
  { name: "Prompto", path: "Prompto", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1994014c6_generated_image.png", desc: "Prompt engineering" },
  { name: "Arh'tuun", path: "Arhtuun", cat: "AI", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a2caf932e_image.png", desc: "Continuity anchors", premium: true, admin: true },

  // ── Games ──
  { name: "VALORANT", path: "ValorantArena", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/501fefdc2_generated_image.png", desc: "Arena mode" },
  { name: "Training Range", path: "ValorantRange", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/501fefdc2_generated_image.png", desc: "Realistic bot training · 6 modes" },
  { name: "KasPlay", path: "KasPlay", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e3c47106d_generated_image.png", desc: "Kaspa games" },
  { name: "Poki", path: "Poki", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1e9b920b3_generated_image.png", desc: "Mini games" },
  { name: "Duel", path: "DuelLobby", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/da7e5b70b_generated_image.png", desc: "1v1 duels" },
  { name: "AYOMUIZ", path: "AYOMUIZHub", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/dbf0ae51a_generated_image.png", desc: "Game hub" },
  { name: "Farlands", path: "Farlands", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/dbf0ae51a_generated_image.png", desc: "Exploration game" },

  // ── Tools ──
  { name: "KASIA", path: "KASIA", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e82671e16_generated_image.png", desc: "Kaspa toolbox" },
  { name: "KFlow", path: "KFlow", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ae5257d69_generated_image.png", desc: "Workflow builder" },
  { name: "EXPLORER", path: "Explorer", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5ad9e4f62_generated_image.png", desc: "Block explorer" },
  { name: "KasCompute", path: "KasCompute", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6ba544644_generated_image.png", desc: "Compute tasks" },
  { name: "K GigZ", path: "KGigZ", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/cc40dddaf_generated_image.png", desc: "Gig marketplace" },
  { name: "BRAHIM", path: "BRAHIMHub", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1eb999ca9_generated_image.png", desc: "Tools hub" },
  { name: "Peculiar", path: "Peculiar", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/456209566_generated_image.png", desc: "Unique tools" },
  { name: "Kehinde", path: "Kehinde", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/dde08d1e8_generated_image.png", desc: "Utilities" },
  { name: "HAYPHASE", path: "HAYPHASE", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/7cde495bb_generated_image.png", desc: "Phase tools" },
  { name: "Olatomiwa", path: "OlatomiwaHub", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/20bda2f7b_generated_image.png", desc: "Hub app" },
  { name: "Kolade", path: "Kolade", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/20bda2f7b_generated_image.png", desc: "Tools" },
  { name: "MODZ", path: "MODZHub", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8e6aa7eb7_generated_image.png", desc: "Mods hub" },
  { name: "Olivia Apps", path: "OliviaApps", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c8a6a1425_generated_image.png", desc: "App collection" },
  { name: "Keystone", path: "Keystone", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/efafddda8_generated_image.png", desc: "Hardware wallet" },
  { name: "Klock", path: "Klock", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9a6a54c5e_generated_image.png", desc: "Clock / timer" },
  { name: "Speed", path: "Speed", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b612978a6_generated_image.png", desc: "Quick image gen" },
  { name: "DAG", path: "DAGVisualizer", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4a4455642_generated_image.png", desc: "DAG visualizer" },
  { name: "Voxa", path: "Voxa", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2da5df519_generated_image.png", desc: "Voice tools" },
  { name: "ShiLLz", path: "ShiLLz", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/a2097be45_generated_image.png", desc: "Shill manager" },
  { name: "OuTKasTT", path: "OuTKasTT", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e82671e16_generated_image.png", desc: "Kaspa tools" },
  { name: "Kasplore", path: "Kasplore", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5ad9e4f62_generated_image.png", desc: "Explorer" },
  { name: "ALPHA", path: "ALPHA", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/dde08d1e8_generated_image.png", desc: "Alpha tools" },
  { name: "TTT", path: "TTT", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1eb999ca9_generated_image.png", desc: "Classic TTT" },
  { name: "SIMPLE", path: "SIMPLE", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/44fa89310_generated_image.png", desc: "Simple tools" },
  { name: "KasLens", path: "KasLens", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/862816f7f_generated_image.png", desc: "Data lens" },
  { name: "Vox Invicta", path: "VoxInvicta", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2da5df519_generated_image.png", desc: "Voice platform" },
  { name: "MMN", path: "MMN", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/20bda2f7b_generated_image.png", desc: "Network" },

  // ── Creative ──
  { name: "Canvas", path: "Canvas", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/64cafecad_generated_image.png", desc: "Template studio" },

  // ── Education ──
  { name: "K Learning", path: "Learning", cat: "Education", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/87dc17eb2_generated_image.png", desc: "Learning hub" },
  { name: "BMT Univ", path: "BMTUniv", cat: "Education", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/eea05cba6_generated_image.png", desc: "University" },
  { name: "K-University", path: "KUniversity", cat: "Education", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6e8f312b1_generated_image.png", desc: "Kaspa education" },
  { name: "KaSkool", path: "KaSkool", cat: "Education", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/77f3d5e19_generated_image.png", desc: "Learn Kaspa", admin: true },
  { name: "Hwork", path: "Hwork", cat: "Education", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/cad822cab_generated_image.png", desc: "Homework helper" },

  // ── Community ──
  { name: "KFANS", path: "KasFans", cat: "Community", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d6880fa0e_generated_image.png", desc: "Fan community" },
  { name: "Area 51", path: "Area51", cat: "Community", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/750c493a5_generated_image.png", desc: "Experimental zone" },
  { name: "KaspaHub", path: "KaspaHub", cat: "Community", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/771a0257d_generated_image.png", desc: "Community hub" },
  { name: "DGT", path: "DGT", cat: "Community", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/45b029b27_generated_image.png", desc: "Digital governance" },

  // ── Social ──
  { name: "Ksocial", path: "Ksocial", cat: "Social", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4f6c5539b_generated_image.png", desc: "Social network" },

  // ── Media ──
  { name: "CineKas", path: "Cinekas", cat: "Media", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8ef99a2a2_generated_image.png", desc: "Movie browser" },

  // ── Communication ──
  { name: "RufzeitK", path: "RufzeitKHome", cat: "Communication", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6643a9592_generated_image.png", desc: "Call system" },
  { name: "Flux Kmail", path: "FluxKmail", cat: "Communication", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fbbdb0a0b_generated_image.png", desc: "Encrypted email" },

  // ── Dev Tools ──
  { name: "SilverScript", path: "SilverScript", cat: "Dev Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/42e922e76_generated_image.png", desc: "Smart contracts" },

  // ── Shop ──
  { name: "KaShop", path: "KaShop", cat: "Shop", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/683d69403_generated_image.png", desc: "Buy with KAS" },
  { name: "Velour", path: "V1", cat: "Shop", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3ca58f39b_generated_image.png", desc: "Merchandise" },

  // ── Security ──
  { name: "Security Audit", path: "SecurityAudit", cat: "Security", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/48a7275db_generated_image.png", desc: "Audit your app" },

  // ── New ──
  { name: "Krust", path: "Krust", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e2e8601a9_generated_image.png", desc: "Web weaver" },
  { name: "OneShot", path: "UICloner", cat: "Dev Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/17316d6b3_generated_image.png", desc: "Clone & vibe-code any UI", admin: true },

];

// Curated Kaspa apps in priority order (KaspaHub first, Ksocial second, etc.)
const KASPA_APPS_ORDER = [
  "KCC NFT",
  "Kascov",
  "KaspaHub",
  "Ksocial",
  "CineKas",
  "Flux Kmail",
  "KAS SWORD",
  "KasBillboard",
  "KaScan",
  "Kasthletics",
  "K6ix",
  "StakeDAG",
  "Terra",
  "TapToTip",
  "Kurve",
  "CoinSpace",
  "OnChain POS",
  "KC Bridge",
  "Kurncy",
  "KivR",
  "KasPlay",
  "KASIA",
  "KFlow",
  "KasCompute",
  "K GigZ",
  "Keystone",
  "KasLens",
  "K Learning",
  "BMT Univ",
  "K-University",
  "KaSkool",
  "SilverScript",
  "KaShop",
];

function AppIcon({ app, hovered }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [hovered]);

  if (app.logo) {
    return (
      <div className="relative w-full h-full">
        <img
          src={app.logo}
          alt={app.name}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl"
          loading="lazy"
        />
        {app.video && (
          <video
            ref={videoRef}
            src={app.video}
            muted
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    );
  }
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center">
      <span className="text-xl font-[900] text-zinc-500">{app.name[0]}</span>
    </div>
  );
}

export default function AppStoreGrid({ search, category, isAdmin, refreshKey = 0, view = "all", onViewChange }) {
  const [communityApps, setCommunityApps] = useState([]);

  useEffect(() => {
    base44.entities.AppProposal.filter({ status: "approved" }, "-created_date", 200)
      .then((list) => {
        setCommunityApps(
          list.map((p) => ({
            name: p.app_name,
            path: null,
            externalUrl: p.app_link,
            cat: p.category || "Tools",
            logo: p.icon_url,
            desc: p.description?.slice(0, 60) || "Community app",
            community: true,
          }))
        );
      })
      .catch(() => setCommunityApps([]));
  }, [refreshKey]);

  const allApps = [...APPS, ...communityApps];

  const isKaspaApp = (app) => {
    const text = `${app.name} ${app.desc} ${app.path || ""}`.toLowerCase();
    return /\bkaspa\b|\bkas\b|krc20|krc-20|\bdag\b/.test(text);
  };

  const filtered = view === "kaspa"
    ? KASPA_APPS_ORDER
        .map((name) => allApps.find((a) => a.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean)
        .filter((app) => {
          if (app.admin && !isAdmin) return false;
          if (search) {
            const q = search.toLowerCase();
            return app.name.toLowerCase().includes(q) || app.desc.toLowerCase().includes(q);
          }
          return true;
        })
    : allApps.filter((app) => {
        if (app.admin && !isAdmin) return false;
        if (category === "Kaspa") {
          if (!isKaspaApp(app)) return false;
        } else if (category === "TTT") {
          // TTT Apps = all apps in the store (every app is a TTT-built app)
        } else if (category !== "All" && app.cat !== category) return false;
        if (search) {
          const q = search.toLowerCase();
          return app.name.toLowerCase().includes(q) || app.cat.toLowerCase().includes(q) || app.desc.toLowerCase().includes(q);
        }
        return true;
      });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-400 text-sm">
        No apps found.
      </div>
    );
  }

  // Re-key the container on filter change so the stagger replays when user
  // searches or switches categories — adds a satisfying re-shuffle feel.
  const containerKey = `${view}|${category}|${search}|${filtered.length}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.025, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.85 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 380, damping: 26 },
    },
  };

  return (
    <div>
      <motion.div
        key={containerKey}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-5"
      >
        {filtered.map((app, i) => {
          const Wrapper = ({ children }) => {
            const [hovered, setHovered] = React.useState(false);
            return (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.06, transition: { type: "spring", stiffness: 400, damping: 18 } }}
                whileTap={{ scale: 0.92 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onTouchStart={() => setHovered(true)}
                onTouchEnd={() => setHovered(false)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                {typeof children === "function" ? children(hovered) : children}
              </motion.div>
            );
          };
          const inner = (
            <Wrapper>
              {(hovered) => (<>
              <motion.div
                className="relative w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-xl transition-shadow"
                animate={{ y: [0, -1.5, 0] }}
                transition={{
                  duration: 3 + (i % 5) * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 7) * 0.15,
                }}
              >
                <AppIcon app={app} hovered={hovered} />
                {/* Glossy hover sheen */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                {app.premium && (
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Crown className="w-2.5 h-2.5 text-yellow-900" />
                  </motion.div>
                )}
                {app.community && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center shadow-sm" title="Community submission">
                    <ExternalLink className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.div>
              <div className="text-center max-w-[72px]">
                <p className="text-[11px] font-semibold text-zinc-800 truncate leading-tight group-hover:text-zinc-950 transition-colors">{app.name}</p>
                <p className="text-[9px] text-zinc-400 truncate">{app.desc}</p>
              </div>
              </>)}
            </Wrapper>
          );

          if (app.externalUrl) {
            return (
              <a key={app.name + (app.path || app.externalUrl) + i} href={app.externalUrl} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return (
            <Link
              key={app.name + app.path + i}
              to={createPageUrl(app.path)}
              onClick={() => { try { localStorage.setItem('came_from_categories', 'true'); } catch {} }}
            >
              {inner}
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}