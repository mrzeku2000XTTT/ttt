import { Coins, Droplets, LineChart, BookOpen, Layers, TrendingUp, TrendingDown, CandlestickChart, Clock, Activity, BarChart3, ShieldCheck, Target, AlertTriangle, Scale, Compass, Map, Flame, Gem, Lock, Network, Rocket, Gauge, Flag } from "lucide-react";

// 30 chapters grouped into 6 sections. Each chapter is taught live by a real AI
// (Slobby the Slobz tutor) — this file just seeds the topic + teaching instructions.
export const SECTIONS = [
  {
    name: "Foundations",
    color: "#7C4DFF",
    chapters: [
      { n: 1, title: "What is a Token?", icon: Coins, topic: "What a cryptocurrency token is, why coins exist, and the difference between a token and a coin. Kid-friendly.", keyIdea: "A token = a digital coin you can trade." },
      { n: 2, title: "Supply & Scarcity", icon: Gem, topic: "Token supply, max supply, circulating supply, and why scarcity makes things valuable (gold vs sand analogy).", keyIdea: "Fewer coins + more demand = higher price." },
      { n: 3, title: "Price & Demand", icon: Droplets, topic: "How price is set by buyers and sellers, the law of supply and demand, and what moves price up or down.", keyIdea: "More buyers than sellers → price up." },
      { n: 4, title: "Market Makers & Liquidity", icon: Layers, topic: "Who market makers are, what liquidity means, and why thin markets are dangerous. Use a lemonade-stand analogy.", keyIdea: "Liquidity = how easy it is to buy/sell without moving price." },
      { n: 5, title: "Order Books & Spreads", icon: BookOpen, topic: "Order books, bids, asks, and the bid-ask spread. Why the spread matters for small traders.", keyIdea: "Spread = the gap between best buy and best sell." },
      { n: 6, title: "The Bonding Curve", icon: LineChart, topic: "Bonding-curve token launches (like KRON): price rises automatically as more tokens are bought, falls when sold. Explain the math simply.", keyIdea: "Buy early = cheaper on a bonding curve." },
    ],
  },
  {
    name: "Reading Charts",
    color: "#4CAF50",
    chapters: [
      { n: 7, title: "Candlesticks Explained", icon: CandlestickChart, topic: "The 4 parts of a candle (open, high, low, close), green vs red, wicks, and what they reveal.", keyIdea: "Each candle = one period of price action." },
      { n: 8, title: "Timeframes (1m–1d)", icon: Clock, topic: "Multi-timeframe analysis: 1m vs 5m vs 1h vs 1d candles, and why pros check higher timeframes.", keyIdea: "Bigger timeframe = clearer trend." },
      { n: 9, title: "Spotting Trends", icon: TrendingUp, topic: "Uptrend, downtrend, sideways. Higher highs & higher lows vs lower highs & lower lows.", keyIdea: "The trend is your friend — trade with it." },
      { n: 10, title: "Higher Highs & Lows", icon: TrendingDown, topic: "How to mark swing highs and swing lows and use them to read market structure.", keyIdea: "Structure breaks signal trend changes." },
      { n: 11, title: "Volume & Liquidity", icon: BarChart3, topic: "Volume bars, why volume confirms moves, and volume spikes at breakouts.", keyIdea: "No volume = no conviction." },
      { n: 12, title: "Moving Averages", icon: Activity, topic: "Simple moving averages (SMA), the 20/50/200, golden cross & death cross in kid terms.", keyIdea: "MAs smooth price to show the trend." },
      { n: 13, title: "RSI & Momentum", icon: Gauge, topic: "RSI indicator, overbought (>70) and oversold (<30), and what momentum means.", keyIdea: "RSI tells you if a coin is 'tired' or 'pumped'." },
    ],
  },
  {
    name: "Chart Patterns",
    color: "#FF8A6B",
    chapters: [
      { n: 14, title: "Support & Resistance", icon: ShieldCheck, topic: "Price floors (support) and ceilings (resistance), how they form, and trading them.", keyIdea: "Buy near support, sell near resistance." },
      { n: 15, title: "Double Top & Bottom", icon: TrendingDown, topic: "M and W patterns, what they predict (reversals), and how to trade them.", keyIdea: "Double top → price may drop. Double bottom → may rise." },
      { n: 16, title: "Head & Shoulders", icon: Activity, topic: "Head and shoulders pattern (top and inverse), what it means, and why it's famous.", keyIdea: "Classic reversal pattern." },
      { n: 17, title: "Triangles", icon: TrendingUp, topic: "Ascending, descending, and symmetrical triangles and breakouts.", keyIdea: "Triangles = coiled springs; breakout coming." },
      { n: 18, title: "Flags & Pennants", icon: Flag, topic: "Bull flags, bear flags, pennants, and continuation trades.", keyIdea: "Flags = pause before the trend resumes." },
      { n: 19, title: "Reversal vs Continuation", icon: Compass, topic: "How to tell if a pattern reverses or continues the trend, and why context matters.", keyIdea: "Pattern + trend = confirmation." },
    ],
  },
  {
    name: "Strategy",
    color: "#3D2E7C",
    chapters: [
      { n: 20, title: "Entry, Stop & Target", icon: Target, topic: "Planning a trade: entry price, stop-loss, take-profit target before you ever buy.", keyIdea: "No plan = no trade." },
      { n: 21, title: "Risk Management", icon: ShieldCheck, topic: "Never risk what you can't lose, the 1–2% rule, and why it keeps you alive.", keyIdea: "Protect capital first, profits second." },
      { n: 22, title: "Position Sizing", icon: Scale, topic: "How to size a position based on stop distance and account size.", keyIdea: "Smaller stops = smaller risk." },
      { n: 23, title: "Risk/Reward Ratio", icon: Scale, topic: "R:R ratio, why 1:2+ matters, and how it makes you profitable even when you're often wrong.", keyIdea: "Aim for reward > risk." },
      { n: 24, title: "Trading Plans", icon: Map, topic: "Writing a trading plan, rules, and sticking to them.", keyIdea: "A plan removes emotions." },
      { n: 25, title: "When NOT to Trade", icon: AlertTriangle, topic: "No-setup conditions, choppy markets, news events, and the power of sitting out.", keyIdea: "Cash is a position." },
    ],
  },
  {
    name: "Trading Psychology",
    color: "#9C27B0",
    chapters: [
      { n: 26, title: "FOMO & FUD", icon: Flame, topic: "Fear of missing out and fear/uncertainty/doubt, how they wreck trades, and how to beat them.", keyIdea: "Don't trade emotions, trade the plan." },
      { n: 27, title: "Diamond vs Paper Hands", icon: Gem, topic: "Diamond hands vs paper hands, when each is right, and the danger of each.", keyIdea: "Hold winners, cut losers — not the other way around." },
      { n: 28, title: "Discipline & Patience", icon: Lock, topic: "Patience, waiting for setups, journaling, and reviewing trades.", keyIdea: "Discipline > intelligence." },
    ],
  },
  {
    name: "Kaspa & DeFi",
    color: "#00C2A8",
    chapters: [
      { n: 29, title: "What is Kaspa?", icon: Network, topic: "Kaspa: a proof-of-work cryptocurrency using a BlockDAG (not a chain), ghostdog, fast blocks, fair launches. Kid-friendly explanation.", keyIdea: "Kaspa = fast, fair, proof-of-work money." },
      { n: 30, title: "Launches & the Pro DEX", icon: Rocket, topic: "Bonding-curve token launches on Kaspa (KRON-style), the difference between the Slobz playground (fake TTT Demo money) and the Pro DEX (real testnet coins), and graduating a token to a DEX.", keyIdea: "Practice free in the playground, then try the Pro DEX." },
    ],
  },
];

export const ALL_CHAPTERS = SECTIONS.flatMap((s) => s.chapters.map((c) => ({ ...c, section: s.name, sectionColor: s.color })));