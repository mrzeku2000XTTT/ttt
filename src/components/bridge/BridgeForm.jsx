
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, AlertCircle, Loader2, CheckCircle2, Wallet, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BridgeTransaction } from "@/entities/BridgeTransaction";
import { bridgeRelayer } from "@/functions/bridgeRelayer";

// Official Kasplex L2 bridge contract
const L2_BRIDGE_CONTRACT = "0x2c2Ae87Ba178F48637acAe54B87c3924F544a83e";

export default function BridgeForm({ wallets, onTransactionComplete }) {
  const [direction, setDirection] = useState("L1_TO_L2");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("KAS");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [depositId, setDepositId] = useState(null);
  const [bridgeWallet, setBridgeWallet] = useState(null);

  const fromNetwork = direction === "L1_TO_L2" ? "L1" : "L2";
  const toNetwork = direction === "L1_TO_L2" ? "L2" : "L1";
  const fromWallet = fromNetwork === "L1" ? wallets.kasware : wallets.metamask;
  const toWallet = toNetwork === "L1" ? wallets.kasware : wallets.metamask;

  const availableTokens = fromNetwork === "L2" && wallets.metamask.connected
    ? [
        { symbol: "KAS", balance: wallets.metamask.balance },
        ...wallets.metamask.tokens.map(t => ({ symbol: t.symbol, balance: t.balance, address: t.address, decimals: t.decimals }))
      ]
    : [{ symbol: "KAS", balance: fromWallet.balance }];

  const currentTokenData = availableTokens.find(t => t.symbol === selectedToken) || availableTokens[0];
  const currentBalance = currentTokenData?.balance || 0;

  const estimatedFee = parseFloat(amount || 0) * 0.001;
  const estimatedReceive = Math.max(0, parseFloat(amount || 0) - estimatedFee);
  const estimatedTime = fromNetwork === "L1" ? 3 : 2;

  const switchDirection = () => {
    setDirection(prev => prev === "L1_TO_L2" ? "L2_TO_L1" : "L1_TO_L2");
    setAmount("");
    setSelectedToken("KAS");
    setError(null);
    setSuccess(null);
    setDepositId(null);
    setBridgeWallet(null);
  };

  const handleBridge = async () => {
    setError(null);
    setSuccess(null);

    const amountValue = parseFloat(amount);

    if (!amount || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountValue < 0.01) {
      setError("Minimum bridge amount is 0.01 KAS");
      return;
    }

    if (amountValue > currentBalance) {
      setError("Insufficient balance");
      return;
    }

    if (!fromWallet.connected || !toWallet.connected) {
      setError("Please connect both wallets");
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🌉 Starting TTT Bridge transaction...');
      console.log('Direction:', fromNetwork, '→', toNetwork);
      console.log('Amount:', amountValue, selectedToken);

      if (fromNetwork === "L1") {
        // L1 → L2: Use backend relayer
        console.log('📝 Creating deposit record...');
        
        const { data: depositData } = await bridgeRelayer({
          action: 'createDeposit',
          amount: amountValue,
          l2_address: toWallet.address,
          direction: 'l1tol2'
        });

        if (!depositData.success) {
          throw new Error(depositData.error || 'Failed to create deposit');
        }

        console.log('✅ Deposit created:', depositData);
        console.log('Bridge wallet:', depositData.bridge_wallet);
        console.log('Amount to send:', amountValue, 'KAS');
        
        setDepositId(depositData.deposit_id);
        setBridgeWallet(depositData.bridge_wallet);

        // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
        const amountInSompi = Math.floor(amountValue * 100000000);
        
        console.log('📤 Calling Kasware with:');
        console.log('  - Address:', depositData.bridge_wallet);
        console.log('  - Amount (KAS):', amountValue);
        console.log('  - Amount (sompi):', amountInSompi);

        let txHash;
        try {
          // Ensure Kasware is available
          if (!window.kasware) {
            throw new Error('Kasware wallet not found. Please install Kasware extension.');
          }

          // Call Kasware sendKaspa with correct parameters
          txHash = await window.kasware.sendKaspa(
            depositData.bridge_wallet,
            amountInSompi
          );
          
          console.log('✅ Transaction sent! TXID:', txHash);
          
        } catch (err) {
          console.error('Kasware error:', err);
          
          if (err.message && err.message.includes('User reject')) {
            throw new Error('Transaction cancelled by user');
          }
          if (err.message && err.message.includes('Insufficient')) {
            throw new Error('Insufficient balance to complete transaction');
          }
          
          throw new Error('Failed to send transaction: ' + err.message);
        }

        // Update deposit with txid
        await BridgeTransaction.update(depositData.deposit_id, {
          tx_hash: txHash,
          status: 'processing'
        });

        setSuccess(`✅ Transaction sent! TXID: ${txHash.substring(0, 16)}...`);
        
        setTimeout(() => {
          setSuccess('⏳ Your deposit is being processed. Funds will appear on L2 in 2-5 minutes.');
        }, 2000);

        setAmount("");
        
      } else {
        // L2 → L1: Direct burn
        console.log('📝 L2→L1 Bridge');
        const isERC20 = selectedToken !== "KAS";
        
        let txHash;
        if (isERC20) {
          txHash = await signERC20Transaction(
            amountValue, 
            L2_BRIDGE_CONTRACT, 
            currentTokenData.address, 
            currentTokenData.decimals
          );
        } else {
          txHash = await bridgeL2ToL1(amountValue, toWallet.address);
        }
        
        console.log('✅ L2 transaction sent:', txHash);
        
        await BridgeTransaction.create({
          from_network: "L2",
          to_network: "L1",
          from_address: fromWallet.address,
          to_address: toWallet.address,
          amount: amountValue,
          token_type: isERC20 ? "ERC20" : "KAS",
          token_address: isERC20 ? currentTokenData.address : null,
          token_symbol: selectedToken,
          status: "processing",
          tx_hash: txHash,
          estimated_time: estimatedTime,
          fee: estimatedFee
        });
        
        setSuccess(`✅ Transaction sent! Hash: ${txHash.substring(0, 16)}...`);
        setAmount("");
      }

      if (onTransactionComplete) {
        onTransactionComplete();
      }

    } catch (err) {
      console.error('❌ Bridge error:', err);
      
      if (err.message && err.message.includes('User reject')) {
        setError('Transaction cancelled by user');
      } else if (err.message && err.message.includes('Insufficient')) {
        setError('Insufficient balance for transaction');
      } else {
        setError(err.message || 'Bridge transaction failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const bridgeL2ToL1 = async (amountKAS, l1RecipientAddress) => {
    try {
      console.log('=== L2→L1 Bridge ===');
      console.log('Amount:', amountKAS, 'KAS');
      console.log('L1 Recipient:', l1RecipientAddress);
      console.log('Bridge Contract:', L2_BRIDGE_CONTRACT);
      
      const amountWei = BigInt(Math.floor(amountKAS * 1e18));
      const amountHex = '0x' + amountWei.toString(16);
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallets.metamask.address,
          to: L2_BRIDGE_CONTRACT,
          value: amountHex,
        }],
      });
      
      console.log('✅ L2 Transaction Hash:', txHash);
      return txHash;
      
    } catch (err) {
      console.error('❌ L2→L1 Bridge error:', err);
      throw err;
    }
  };

  const signERC20Transaction = async (amount, recipientAddress, tokenAddress, decimals) => {
    try {
      const transferFunctionSignature = '0xa9059cbb';
      const paddedAddress = recipientAddress.slice(2).padStart(64, '0');
      const amountInSmallestUnit = Math.floor(amount * Math.pow(10, decimals));
      const paddedAmount = amountInSmallestUnit.toString(16).padStart(64, '0');
      const data = transferFunctionSignature + paddedAddress + paddedAmount;

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallets.metamask.address,
          to: tokenAddress,
          data: data,
        }],
      });
      
      return txHash;
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Transaction cancelled by user');
      }
      throw err;
    }
  };

  const canBridge = fromWallet.connected && toWallet.connected && amount && parseFloat(amount) >= 0.01;

  return (
    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
      <CardHeader className="border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Bridge Assets</h2>
        <p className="text-sm text-gray-400">Transfer between L1 and L2</p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Wallet Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div className="backdrop-blur-xl bg-black/20 border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">L1 Balance</span>
            </div>
            <div className="text-xl font-bold text-white">
              {wallets.kasware.connected ? wallets.kasware.balance.toFixed(4) : '0.0000'} KAS
            </div>
          </div>
          <div className="backdrop-blur-xl bg-black/20 border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">L2 Balance</span>
            </div>
            <div className="text-xl font-bold text-white">
              {wallets.metamask.connected ? wallets.metamask.balance.toFixed(4) : '0.0000'} KAS
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="space-y-4">
            {/* From Section */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-5 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">From</span>
                <span className="text-sm font-semibold text-white px-3 py-1 rounded-full bg-black/30 backdrop-blur-xl">
                  {fromNetwork === "L1" ? "Kaspa L1" : "Kasplex L2"}
                </span>
              </div>

              <div className="flex gap-3 mb-4">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="backdrop-blur-xl bg-black/20 border-white/10 text-2xl font-bold text-white placeholder:text-gray-700 h-auto p-4 flex-1"
                  disabled={isProcessing}
                  min="0.01"
                  step="0.01"
                />
                
                {fromNetwork === "L2" && availableTokens.length > 1 ? (
                  <Select value={selectedToken} onValueChange={setSelectedToken} disabled={isProcessing}>
                    <SelectTrigger className="w-32 backdrop-blur-xl bg-black/20 border-white/10 text-white font-semibold h-auto py-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-zinc-900 border-white/10">
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol} className="text-white">
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="px-6 py-4 backdrop-blur-xl bg-black/20 rounded-lg border border-white/10 flex items-center">
                    <span className="text-white font-bold">{selectedToken}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between backdrop-blur-xl bg-black/20 rounded-lg p-3 border border-white/5">
                <span className="text-sm text-gray-400">
                  Available: <span className="text-white font-semibold">{currentBalance?.toFixed(4) || '0.0000'} {selectedToken}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAmount(currentBalance?.toString() || "0")}
                  className="text-gray-400 hover:text-white hover:bg-white/5"
                  disabled={isProcessing}
                >
                  MAX
                </Button>
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={switchDirection}
                disabled={isProcessing}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 shadow-lg shadow-cyan-500/50"
              >
                <ArrowDownUp className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* To Section */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">To</span>
                <span className="text-sm font-semibold text-white px-3 py-1 rounded-full bg-black/30 backdrop-blur-xl">
                  {toNetwork === "L1" ? "Kaspa L1" : "Kasplex L2"}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl font-bold text-white flex-1 p-4">
                  {estimatedReceive.toFixed(4)}
                </div>
                <div className="px-6 py-4 backdrop-blur-xl bg-black/20 rounded-lg border border-white/10 flex items-center">
                  <span className="text-white font-bold">{selectedToken}</span>
                </div>
              </div>
              <div className="backdrop-blur-xl bg-black/20 rounded-lg p-3 border border-white/5">
                <span className="text-sm text-gray-400">
                  Recipient: <span className="text-white font-mono text-xs">{toWallet.address ? `${toWallet.address.substring(0, 10)}...${toWallet.address.substring(toWallet.address.length - 8)}` : 'Not connected'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction Details</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Bridge Fee (0.1%)</span>
            <span className="text-white font-semibold">{estimatedFee.toFixed(6)} {selectedToken}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">You'll Receive</span>
            <span className="text-cyan-400 font-semibold">{estimatedReceive.toFixed(4)} {selectedToken}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estimated Time</span>
            <span className="text-white font-semibold">~{estimatedTime} minutes</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="backdrop-blur-xl bg-black/20 border border-white/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="font-semibold mb-2 text-gray-300">How TTT Bridge Works:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>L1→L2:</strong> Send KAS to TTT bridge wallet, we forward to Kasplex pool</li>
                <li>• <strong>L2→L1:</strong> Burn wrapped KAS, receive native KAS on L1</li>
                <li>• <strong>Bridge fee:</strong> 0.1% per transaction</li>
                <li>• <strong>Time:</strong> 2-5 minutes for processing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="backdrop-blur-xl bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-cyan-100 font-medium">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bridge Button */}
        <Button
          onClick={handleBridge}
          disabled={!canBridge || isProcessing}
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Processing...
            </>
          ) : (
            `Bridge ${amount || '0'} ${selectedToken}`
          )}
        </Button>

        {isProcessing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-gray-400"
          >
            Please approve the transaction in your wallet...
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}
