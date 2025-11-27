import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, ExternalLink, AlertCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DeployContractPage() {
  const [copied, setCopied] = useState(false);

  const MAINNET_CONFIG = {
    name: "Kasplex L2 Mainnet",
    rpcUrl: "https://evmrpc.kasplex.org",
    chainId: 202555,
    explorer: "https://explorer.kasplex.org",
    currency: "KAS"
  };

  const TESTNET_CONFIG = {
    name: "Kasplex L2 Testnet",
    rpcUrl: "https://evmrpc-testnet.kasplex.org",
    chainId: 202555,
    explorer: "https://explorer-testnet.kasplex.org",
    currency: "KAS (Test)"
  };

  const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KASEscrow {
    struct Trade {
        address payable seller;
        address payable buyer;
        uint256 kasAmount;
        uint256 fiatAmount;
        string paymentMethod;
        string paymentDetails;
        bool buyerConfirmed;
        bool sellerConfirmed;
        bool isActive;
        bool isDisputed;
    }

    mapping(uint256 => Trade) public trades;
    uint256 public tradeCounter;
    address public owner;

    event TradeCreated(uint256 indexed tradeId, address indexed seller, uint256 kasAmount, uint256 fiatAmount);
    event TradeAccepted(uint256 indexed tradeId, address indexed buyer);
    event PaymentConfirmedBySeller(uint256 indexed tradeId);
    event PaymentConfirmedByBuyer(uint256 indexed tradeId);
    event TradeCompleted(uint256 indexed tradeId);
    event TradeCancelled(uint256 indexed tradeId);
    event DisputeRaised(uint256 indexed tradeId);

    constructor() {
        owner = msg.sender;
    }

    function createTrade(
        uint256 _fiatAmount,
        string memory _paymentMethod,
        string memory _paymentDetails
    ) external payable returns (uint256) {
        require(msg.value > 0, "Must deposit KAS");
        require(_fiatAmount > 0, "Fiat amount must be positive");

        uint256 tradeId = tradeCounter++;
        trades[tradeId] = Trade({
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            kasAmount: msg.value,
            fiatAmount: _fiatAmount,
            paymentMethod: _paymentMethod,
            paymentDetails: _paymentDetails,
            buyerConfirmed: false,
            sellerConfirmed: false,
            isActive: true,
            isDisputed: false
        });

        emit TradeCreated(tradeId, msg.sender, msg.value, _fiatAmount);
        return tradeId;
    }

    function acceptTrade(uint256 _tradeId) external {
        Trade storage trade = trades[_tradeId];
        require(trade.isActive, "Trade not active");
        require(trade.buyer == address(0), "Trade already accepted");
        require(msg.sender != trade.seller, "Seller cannot accept own trade");

        trade.buyer = payable(msg.sender);
        emit TradeAccepted(_tradeId, msg.sender);
    }

    function confirmPaymentSent(uint256 _tradeId) external {
        Trade storage trade = trades[_tradeId];
        require(trade.isActive, "Trade not active");
        require(msg.sender == trade.buyer, "Only buyer can confirm");
        require(!trade.buyerConfirmed, "Already confirmed");

        trade.buyerConfirmed = true;
        emit PaymentConfirmedByBuyer(_tradeId);
    }

    function confirmPaymentReceived(uint256 _tradeId) external {
        Trade storage trade = trades[_tradeId];
        require(trade.isActive, "Trade not active");
        require(msg.sender == trade.seller, "Only seller can confirm");
        require(trade.buyerConfirmed, "Buyer must confirm first");
        require(!trade.sellerConfirmed, "Already confirmed");

        trade.sellerConfirmed = true;
        trade.isActive = false;

        // Release KAS to buyer
        trade.buyer.transfer(trade.kasAmount);

        emit PaymentConfirmedBySeller(_tradeId);
        emit TradeCompleted(_tradeId);
    }

    function cancelTrade(uint256 _tradeId) external {
        Trade storage trade = trades[_tradeId];
        require(trade.isActive, "Trade not active");
        require(
            msg.sender == trade.seller || msg.sender == trade.buyer,
            "Only participants can cancel"
        );

        trade.isActive = false;

        // Refund KAS to seller
        trade.seller.transfer(trade.kasAmount);

        emit TradeCancelled(_tradeId);
    }

    function raiseDispute(uint256 _tradeId) external {
        Trade storage trade = trades[_tradeId];
        require(trade.isActive, "Trade not active");
        require(
            msg.sender == trade.seller || msg.sender == trade.buyer,
            "Only participants can raise dispute"
        );

        trade.isDisputed = true;
        emit DisputeRaised(_tradeId);
    }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(contractCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addNetwork = async (config) => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x' + config.chainId.toString(16),
          chainName: config.name,
          nativeCurrency: {
            name: 'Kaspa',
            symbol: 'KAS',
            decimals: 18
          },
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.explorer]
        }]
      });
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl("Marketplace")}>
            <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white hover:bg-white/5">
              ← Back
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Deploy KASEscrow Contract
            </h1>
            <p className="text-gray-400 text-lg">
              Deploy the escrow contract to Kasplex L2 Mainnet or Testnet
            </p>
          </motion.div>

          {/* Network Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            <Card className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardHeader className="border-b border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Mainnet</h3>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Production
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Chain ID</div>
                  <div className="text-white font-mono">{MAINNET_CONFIG.chainId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">RPC URL</div>
                  <div className="text-white font-mono text-sm break-all">{MAINNET_CONFIG.rpcUrl}</div>
                </div>
                <Button
                  onClick={() => addNetwork(MAINNET_CONFIG)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Add Mainnet to MetaMask
                </Button>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
              <CardHeader className="border-b border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Testnet</h3>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    Testing
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Chain ID</div>
                  <div className="text-white font-mono">{TESTNET_CONFIG.chainId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">RPC URL</div>
                  <div className="text-white font-mono text-sm break-all">{TESTNET_CONFIG.rpcUrl}</div>
                </div>
                <Button
                  onClick={() => addNetwork(TESTNET_CONFIG)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Add Testnet to MetaMask
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deployment Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Deployment Steps</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Copy Contract Code</h3>
                    <div className="relative">
                      <pre className="bg-black/50 border border-white/10 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono max-h-96">
{contractCode}
                      </pre>
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Open Remix IDE</h3>
                    <p className="text-gray-400 mb-3">
                      Go to Remix IDE and create a new file called <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">KASEscrow.sol</code>
                    </p>
                    <a
                      href="https://remix.ethereum.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Remix IDE
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Compile Contract</h3>
                    <p className="text-gray-400">
                      In Remix, go to the "Solidity Compiler" tab and click "Compile KASEscrow.sol"
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Deploy Contract</h3>
                    <div className="space-y-2 text-gray-400">
                      <p>• Go to "Deploy & Run Transactions" tab</p>
                      <p>• Select "Injected Provider - MetaMask" as environment</p>
                      <p>• Make sure you're on the correct network (Mainnet or Testnet)</p>
                      <p>• Click "Deploy"</p>
                      <p>• Approve the transaction in MetaMask</p>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Copy Contract Address</h3>
                    <p className="text-gray-400 mb-3">
                      After deployment, copy the contract address from Remix
                    </p>
                    <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-cyan-200">
                          <p className="font-semibold mb-2">For Mainnet:</p>
                          <p>Set CONTRACT_ADDRESS in environment variables</p>
                          <p className="font-semibold mb-2 mt-3">For Testnet:</p>
                          <p>Set TESTNET_CONTRACT_ADDRESS in environment variables</p>
                          <p className="mt-2">Then set ENVIRONMENT='testnet' to use testnet</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}