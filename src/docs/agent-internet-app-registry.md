# Agent Internet — Callable App Registry

> Source of truth for which TTT apps the Agent Internet can call.
> An app belongs here if it does something an LLM **cannot do by generating text alone** —
> moving real money, signing real identity, fetching real data, producing real media, or reaching real people.
> Apps that are only user-facing UIs, duplicates, or external links are intentionally excluded.
>
> Status: ✅ = backend function already exists (agent-callable today) · 🟡 = needs an agent endpoint wrapper

---

## 🧠 Knowledge & Research — *instead of hallucinating*

| App | What the agent calls it for | Status |
|---|---|---|
| Kai (Knowledge) | Real indexed docs, not invented | ✅ `kaiKnowledge`, `getKnowledgeBase` |
| Ying (Vision/Research) | Grounded web research with sources | ✅ `chatWithAgentYing`, `getAgentYingKnowledge`, `analyzeImageWithAgentYing` |
| Zeku AI | Premium reasoning when needed | ✅ `zkBotRespond` |
| Doom | Real doomscroll facts on a topic | ✅ `doomScrollFacts`, `doomScrollImage` |
| K Learning / KaSkool | Real Kaspa education content | ✅ `kaiLearn` |
| KaspaHub / Feed | Real community posts, not invented | ✅ `getSmartFeed`, `agentCreatePost` |
| Perplexity / Exa | External grounded search | ✅ `perplexitySearch`, `exaSearch` |
| Grok News | Real news + details | ✅ `grokNews`, `getKaspaNewsDetails`, `scrapeKaspaNews` |

---

## 💰 Money & Wallets — *instead of pretending to move money*

| App | What the agent calls it for | Status |
|---|---|---|
| Terra | Real wallet, balance, send | ✅ `sendKaspaTransaction`, `getKaspaBalance`, `getKaspaUTXOs` |
| DAGKnight | Advanced wallet ops | ✅ `getZKWalletSeed` |
| Bridge | Real cross-layer move | ✅ `bridgeRelayer` |
| TapToTip / 2TIP | Real KAS tip | ✅ `incrementPostTips`, `updateCommentTips` |
| Slobz | Real escrow with locked funds | ✅ `slobzEscrow`, `slobzPostDemoGig`, `slobzTestnetSend` |
| AWA | Real x402 AI-service invoice + settle | ✅ `awaX402` |
| Kurncy | Real currency exchange | ✅ `kurncyKRC20`, `kurncyWallet`, `getCurrencyRates` |
| KivR | Real IVR + payment | ✅ `kivrIVR`, `checkRufzeitKPayment` |
| KRC-20 Transfer | Real token transfer | ✅ `krc20Transfer` |
| KaShop | Real buy with KAS | ✅ `completeShopPurchase` |
| OnChain POS | Real checkout | 🟡 expose `createCharge` |
| KC Bridge | Real cross-chain swap | 🟡 |
| VAULT / CoinSpace | Vault / wallet ops | 🟡 expose balance/send |
| KasCompute | Pay for compute | 🟡 |

---

## 🪪 Identity, Proofs & Security — *instead of faking identity*

| App | What the agent calls it for | Status |
|---|---|---|
| Agent ZK | Real signed identity + proofs | ✅ `createAgentZKProfile`, `verifyKaspaSignature`, `createAgentConnection` |
| SuperZK | Real ZK vault | ✅ `generateZKApiKey`, `superzkDeployJob` |
| KCC NFT | Real on-chain NFT identity | ✅ `kccNft`, `kccNftMintPayment` |
| Kascov | Real smart-coin scan | ✅ `kaspaExplorer`, `kascovLive` |
| APEX | Real proof of a NODA run | ✅ `validateProof`, `verifyProofOfWork` |
| Keystone | Real hardware-wallet signature | 🟡 |
| Security Audit | Real app audit | ✅ `generateTTTAudit` |
| SilverScript | Real smart contracts | ✅ `silverScriptTimelockTest`, `contractInteractionV2` |
| Arh'tuun | Continuity anchors | 🟡 |

---

## 🎨 Media Generation — *instead of hallucinating media*

| App | What the agent calls it for | Status |
|---|---|---|
| Hikaru | Real image generation | ✅ `generateCapitalImage` |
| Kine | Real text → video | ✅ (`createKineVideo` flow) |
| KUTT | Real URL → viral video export | 🟡 (build on `slideDeckRender`) |
| BeatCut | Real beat-synced edit | 🟡 |
| MotionFly | Real motion graphics | 🟡 |
| Hiro | Real typography | 🟡 |
| ORBT | Real brand voice + TTS | ✅ `generateVoice`, `elevenLabsTTS` |
| Thumbnail Creator | Real thumbnails | ✅ (`saveAppIcon` flow) |
| Quick Storyboard / FrameZ | Real storyboards / decks | ✅ `slideDeckRender` |
| WorldWalker / 00 / ARC | Real cinematic / story tools | 🟡 |
| Xùnhuà | Real sketch → image | 🟡 |
| UltraMock (Cháoxiào) | Real device mockups | 🟡 |
| Speed | Quick image gen | ✅ `generateCapitalImage` |
| Motion | Real landing page | 🟡 |

---

## 🎬 Media Sourcing & Clipping — *instead of inventing video sources*

| App | What the agent calls it for | Status |
|---|---|---|
| KLIPZ | Real clip from a live stream | ✅ `klipzClipMp4`, `klipzAnalyze`, `klipzHireAgent` |
| TTTV (Browser) | Real ad-free video lookup | ✅ `getTTTVVideos` |
| CineKas | Real movie data | ✅ `searchMovie`, `scrapeMovieGenres` |
| YouTube search | Real video search | ✅ `youtubeApiSearch`, `youtubeSearch`, `youtubeToMp3` |

---

## 🛠️ Dev & Build — *instead of faking a build*

| App | What the agent calls it for | Status |
|---|---|---|
| TTT Builder | Real prompt → live site | ✅ `claudeCodeGen`, `oneshotAgent` |
| OneShot (UICloner) | Real UI clone | ✅ `uiClonerScrape`, `oneshotEdit` |
| MetaMimic | Real file → HTML | ✅ `metaMimicClone` |
| NODA | Real node workflow | ✅ `postNodaApexGuide` |
| Krust | Real web weave | 🟡 |
| Motion | Real landing page | 🟡 |
| KFlow / RMX Ultra | Real workflow builder | 🟡 |
| K6ix | Creative AI API (external) | 🟡 |

---

## 📡 Communication & Outreach — *instead of pretending to reach people*

| App | What the agent calls it for | Status |
|---|---|---|
| Feed | Real post to real users | ✅ `agentCreatePost`, `agentAutoPost` |
| TELE | Real Telegram message | ✅ `telegramWebhook`, `telegramRegisterBot` |
| Flux Kmail | Real encrypted email | ✅ `kaiMail` |
| RufzeitK | Real call | ✅ `kivrIVR`, `createJitsiRoom` |
| KasBillboard | Real billboard ad | 🟡 |
| ShiLLz | Real shill campaign | 🟡 |

---

## 🔭 Explorers & On-Chain Data — *instead of guessing on-chain state*

| App | What the agent calls it for | Status |
|---|---|---|
| EXPLORER / KaScan / Kasplore | Real block explorer | ✅ `kaspaExplorer`, `searchKaspaExplorer` |
| Kurve | Real price chart | ✅ `getKaspaPrice`, `trackPrice`, `predictPriceDrop` |
| DAG Visualizer | Real DAG state | ✅ `kaspaCommandData`, `kaspaCommandIntel` |
| KasLens | Real data lens | 🟡 |
| KasCompute | Real compute task | 🟡 |
| StakeDAG | Real prediction market | ✅ `getPredictionMarkets`, `kachingPlaceBet` |
| Live Transactions | Real mempool feed | ✅ `getLiveKaspaTransactions`, `getKaspaTransactionHistory` |

---

## 🛒 Commerce, Gigs & Tasks — *instead of simulating commerce*

| App | What the agent calls it for | Status |
|---|---|---|
| KaShop | Real buy with KAS | ✅ `completeShopPurchase` |
| K GigZ | Real gig marketplace | 🟡 |
| OnChain POS | Real checkout | 🟡 |
| Kasthletics | Real proof-of-workout payout | 🟡 |
| Slobz | Real escrow gigs | ✅ `slobzEscrow` |
| AWA | Real x402 AI services | ✅ `awaX402` |

---

## 📚 Education — *instead of inventing lessons*

| App | What the agent calls it for | Status |
|---|---|---|
| KaSkool | Real Kaspa education | ✅ `kaiLearn` |
| K Learning | Real learning hub | 🟡 |
| K-University | Real Kaspa education | 🟡 |
| BMT Univ | Real university content | 🟡 |
| Hwork | Real homework helper | 🟡 |
| Katagami | Real motion masterclass | ✅ `katagamiAutoEdit`, `katagamiMasterAgent` |

---

## 🎮 Games — *mostly not agent-callable, with exceptions*

| App | What the agent calls it for | Status |
|---|---|---|
| StakeDAG | Real prediction market (agent can bet) | ✅ `kachingPlaceBet`, `kachingSettleGame` |
| KaChing (Pacman) | Real game + reward payout | ✅ `kachingCreateGame`, `sendPacmanReward` |
| KasPlay / Poki / Duel / VALORANT / Farlands / AYOMUIZ | User-played games — not agent-callable | ❌ excluded |

---

## ❌ Intentionally excluded (no agent value)

- Pure UI dashboards with no callable action
- External links (KAS SWORD, KaScan, NEPU, K6ix) — agent can't call these
- Duplicates of the same function
- User-only games and arcade titles
- Pure display pages (About, Docs, Profile, Settings)

---

## Build order

1. **Lock this list** → generate `agentApps.js` (machine-readable registry the router reads)
2. **Build the router** → Kai loop: LLM sees registry as tools → picks app → executes → feeds result back
3. **One-feature test** → reactive loop: user goal → agent autonomously chains ✅ apps end-to-end
4. **Write capability** → add x402 escrow + Agent ZK delegated-signing gate before any money app is callable
5. **Proactive trigger** → scheduled workflow pings agent with a standing goal

## The rule that decides inclusion

> An app belongs in the Agent Internet if it does something the LLM **cannot do by generating text** —
> move real money, sign real identity, fetch real data, produce real media, or reach real people.
> If an app only wraps a chat reply, the agent doesn't need it — the agent already *is* a chat reply.