// The six covenant++ rule sets a KCC NFT can be minted with.
export const KCC_RULES = [
  { type: "zktimelock", label: "Soulbound", tagline: "Non-transferable until the timelock matures on-chain", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  { type: "zkgate", label: "Gated", tagline: "Transfer requires the secret gate key", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
  { type: "zkescrow", label: "Escrow Sale", tagline: "Trustless sale — arbiter-released escrow", color: "text-purple-400 border-purple-500/40 bg-purple-500/10" },
  { type: "zkvault", label: "Vaulted", tagline: "Value sealed in a covenant vault", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  { type: "xmsslock", label: "Quantum-Safe", tagline: "Post-quantum XMSS signature lock", color: "text-pink-400 border-pink-500/40 bg-pink-500/10" },
  { type: "sentinel", label: "Sentinel", tagline: "Watchdog covenant guards the UTXO", color: "text-red-400 border-red-500/40 bg-red-500/10" },
];

export const ruleFor = (type) => KCC_RULES.find((r) => r.type === type) || KCC_RULES[0];