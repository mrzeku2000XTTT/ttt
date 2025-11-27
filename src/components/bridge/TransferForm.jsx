
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, AlertCircle, Loader2, CheckCircle2, Wallet, Info, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";

export default function TransferForm({ 
  kaswareWallet, 
  metamaskWallet, 
  onTransactionComplete, 
  onConnectKasware, 
  onConnectMetaMask,
  onDisconnectKasware,
  onDisconnectMetaMask,
  network,
  detectedMetaMaskNetwork
}) {
  const [selectedNetworkMode, setSelectedNetworkMode] = useState(null);
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const networkMode = useMemo(() => {
    if (selectedNetworkMode) return selectedNetworkMode;
    
    if (kaswareWallet.connected && !metamaskWallet.connected) return "L1";
    if (metamaskWallet.connected && !kaswareWallet.connected) return "L2";
    if (kaswareWallet.connected && metamaskWallet.connected) return "L1";
    return null;
  }, [selectedNetworkMode, kaswareWallet.connected, metamaskWallet.connected]);

  const activeWallet = networkMode === "L1" ? kaswareWallet : (networkMode === "L2" ? metamaskWallet : null);

  const estimatedFee = parseFloat(amount || 0) * 0.001;
  const estimatedReceive = Math.max(0, parseFloat(amount || 0) - estimatedFee);

  useEffect(() => {
    // Only check network mismatch if both are connected and network mode is L2
    if (metamaskWallet.connected && networkMode === "L2" && detectedMetaMaskNetwork) {
      console.log('🔍 Network check:', {
        expected: network,
        detected: detectedMetaMaskNetwork,
        networkMode
      });
      
      // Clear any previous network errors if networks match
      if (detectedMetaMaskNetwork === network) {
        if (error && error.includes('Wrong network')) {
          setError(null);
        }
      } else {
        // Only set error if networks don't match
        setError(`⚠️ Please switch MetaMask to Kasplex L2 ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}`);
      }
    } else if (error && error.includes('Wrong network')) {
      // Clear network error if conditions no longer apply
      setError(null);
    }
  }, [network, metamaskWallet.connected, networkMode, detectedMetaMaskNetwork, error]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (onTransactionComplete) {
        await onTransactionComplete();
      }
      
      setSuccess('✅ Wallet balances refreshed!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to refresh:', err);
      setError('Failed to refresh balances');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnectKasware = () => {
    if (onDisconnectKasware) {
      onDisconnectKasware();
    }
    if (selectedNetworkMode === "L1") {
      setSelectedNetworkMode(null);
    }
  };

  const handleDisconnectMetaMask = () => {
    if (onDisconnectMetaMask) {
      onDisconnectMetaMask();
    }
    if (selectedNetworkMode === "L2") {
      setSelectedNetworkMode(null);
    }
  };

  const handleSelectNetworkMode = (mode) => {
    if (mode === "L1" && !kaswareWallet.connected) {
      setError("Please connect Kasware wallet first to select L1 mode.");
      return;
    }
    if (mode === "L2" && !metamaskWallet.connected) {
      setError("Please connect MetaMask wallet first to select L2 mode.");
      return;
    }
    
    setSelectedNetworkMode(mode);
    setError(null);
    setSuccess(null);
    setRecipient("");
    setAmount("");
  };

  const validateRecipient = () => {
    if (!networkMode) {
      setError("Please connect a wallet to determine the transfer network.");
      return false;
    }
    if (networkMode === "L1") {
      if (!recipient.startsWith('kaspa:')) {
        setError("L1 address must start with 'kaspa:'");
        return false;
      }
    } else {
      if (!recipient.startsWith('0x') || recipient.length !== 42) {
        setError("L2 address must be a valid EVM address (0x... 42 characters)");
        return false;
      }
    }
    return true;
  };

  const handleSendL1 = async () => {
    setError(null);
    setSuccess(null);

    const amountValue = parseFloat(amount);

    if (!amount || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountValue < 0.01) {
      setError("Minimum transfer amount is 0.01 KAS");
      return;
    }

    if (amountValue > kaswareWallet.balance) {
      setError("Insufficient balance");
      return;
    }

    if (!validateRecipient()) {
      return;
    }

    if (!kaswareWallet.connected) {
      setError("Please connect Kasware wallet for L1 transfers");
      return;
    }

    setIsProcessing(true);

    try {
      console.log('💸 Starting L1 KAS transfer...');
      console.log('From:', kaswareWallet.address);
      console.log('To:', recipient);
      console.log('Amount:', amountValue, 'KAS');

      const amountInSompi = Math.floor(amountValue * 100000000);
      
      console.log('📤 Calling Kasware sendKaspa...');

      let result;
      try {
        if (!window.kasware) {
          throw new Error('Kasware wallet not found. Please install Kasware extension.');
        }

        result = await window.kasware.sendKaspa(recipient, amountInSompi);
        console.log('📦 Raw Kasware response:', result);
        
      } catch (err) {
        console.error('❌ Kasware sendKaspa error:', err);
        
        if (err.message && err.message.includes('User reject')) {
          throw new Error('Transaction cancelled by user');
        }
        if (err.message && err.message.includes('Insufficient')) {
          throw new Error('Insufficient balance to complete transaction');
        }
        
        throw new Error('Failed to send transaction: ' + err.message);
      }

      let txId;
      
      if (typeof result === 'string') {
        try {
          const decodedResult = decodeURIComponent(result);
          console.log('📝 Decoded response:', decodedResult);
          
          const parsedResult = JSON.parse(decodedResult);
          console.log('📋 Parsed JSON:', parsedResult);
          
          txId = parsedResult.id;
          console.log('✅ Extracted TX ID from JSON:', txId);
          
        } catch (e) {
          console.log('⚠️ Not JSON, treating as plain string');
          txId = result.trim();
        }
        
      } else if (result && typeof result === 'object') {
        console.log('📋 Got object response:', JSON.stringify(result, null, 2));
        txId = result.id || result.txId || result.txid || result.hash || result.transactionId || result.transaction_id;
        console.log('✅ Extracted TX ID from object:', txId);
        
      } else {
        console.error('❌ Unexpected response type:', typeof result);
        throw new Error('Invalid transaction result from wallet');
      }
      
      if (!txId || typeof txId !== 'string') {
        console.error('❌ Could not extract transaction ID. Full result:', result);
        throw new Error('Could not extract transaction ID from Kasware response');
      }
      
      txId = txId.trim();
      
      if (txId.length !== 64 || !/^[a-f0-9]+$/i.test(txId)) {
        console.warn('⚠️ Transaction ID format unexpected:', txId);
        console.warn('⚠️ Length:', txId.length, 'Expected: 64');
      }
      
      console.log('✅ Final clean transaction ID:', txId);
      console.log('🔗 Explorer URL: https://kas.fyi/txs/' + txId);

      console.log('💾 Saving transaction to database...');

      const savedTransaction = await base44.entities.BridgeTransaction.create({
        from_network: "L1",
        to_network: "L1",
        from_address: kaswareWallet.address,
        to_address: recipient,
        amount: amountValue,
        token_type: "KAS",
        token_symbol: "KAS",
        status: "completed",
        tx_hash: txId,
        estimated_time: 1,
        fee: estimatedFee
      });

      console.log('✅ Transaction saved to database with ID:', savedTransaction.id);
      console.log('Full saved transaction:', savedTransaction);

      setSuccess(`✅ L1 Transfer successful! TXID: ${txId.substring(0, 8)}...${txId.substring(txId.length - 8)}`);
      setAmount("");
      setRecipient("");

      if (onTransactionComplete) {
        console.log('🔄 Calling onTransactionComplete callback...');
        await onTransactionComplete();
      }

    } catch (err) {
      console.error('❌ Transfer error:', err);
      
      if (err.message && err.message.includes('User reject')) {
        setError('Transaction cancelled by user');
      } else if (err.message && err.message.includes('Insufficient')) {
        setError('Insufficient balance for transaction');
      } else {
        setError(err.message || 'Transfer failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendL2 = async () => {
    setError(null);
    setSuccess(null);

    const amountValue = parseFloat(amount);

    if (!amount || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountValue < 0.01) {
      setError("Minimum transfer amount is 0.01 KAS");
      return;
    }

    if (amountValue > metamaskWallet.balance) {
      setError("Insufficient balance");
      return;
    }

    if (!validateRecipient()) {
      return;
    }

    if (!metamaskWallet.connected) {
      setError("Please connect MetaMask wallet for L2 transfers");
      return;
    }

    const expectedNetworkName = network;
    if (detectedMetaMaskNetwork !== expectedNetworkName) {
      setError(`⚠️ Please switch MetaMask to Kasplex L2 ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}`);
      return;
    }

    setIsProcessing(true);

    try {
      console.log('💸 Starting L2 KAS transfer...');
      console.log('From:', metamaskWallet.address);
      console.log('To:', recipient);
      console.log('Amount:', amountValue, 'KAS');
      console.log('Network:', detectedMetaMaskNetwork);

      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }

      const amountInWei = '0x' + (BigInt(Math.floor(amountValue * 1e18))).toString(16);
      console.log('💰 Amount in Wei:', amountInWei);

      // Try to get network fee data (EIP-1559)
      let feeData = null;
      try {
        const block = await window.ethereum.request({ method: 'eth_getBlockByNumber', params: ['latest', false] });
        
        if (block && block.baseFeePerGas) {
          console.log('📊 EIP-1559 network detected');
          const baseFeePerGas = BigInt(block.baseFeePerGas);
          const maxPriorityFeePerGas = BigInt('0x59682F00'); // 1.5 Gwei in wei
          const maxFeePerGas = baseFeePerGas * BigInt(2) + maxPriorityFeePerGas;
          
          feeData = {
            maxFeePerGas: '0x' + maxFeePerGas.toString(16),
            maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16)
          };
          
          console.log('⛽ EIP-1559 Fee Data:', feeData);
        } else {
          console.log('📊 EIP-1559 not supported or block data incomplete.');
        }
      } catch (err) {
        console.warn('⚠️ Could not get EIP-1559 fee data, will try legacy:', err);
      }

      // Estimate gas
      let gasLimit;
      try {
        gasLimit = await window.ethereum.request({
          method: 'eth_estimateGas',
          params: [{
            from: metamaskWallet.address,
            to: recipient,
            value: amountInWei,
          }]
        });
        console.log('⛽ Estimated gas limit:', gasLimit);
        
        // Add 20% buffer
        const gasLimitNum = parseInt(gasLimit, 16);
        const bufferedGas = Math.floor(gasLimitNum * 1.2);
        gasLimit = '0x' + bufferedGas.toString(16);
        
        console.log('⛽ Buffered gas limit:', gasLimit);
      } catch (err) {
        console.warn('⚠️ Could not estimate gas, using default (21000) for standard transfer:', err);
        gasLimit = '0x5208'; // 21000
      }

      console.log('📤 Sending L2 transaction via MetaMask...');

      let txHash = null;
      
      // Try EIP-1559 transaction first
      if (feeData) {
        try {
          console.log('🔄 Attempting EIP-1559 transaction...');
          txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: metamaskWallet.address,
              to: recipient,
              value: amountInWei,
              gas: gasLimit,
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
            }]
          });
          console.log('✅ EIP-1559 transaction sent:', txHash);
        } catch (eip1559Error) {
          console.warn('⚠️ EIP-1559 transaction failed, falling back to legacy:', eip1559Error);
          // Do not rethrow, allow the code to proceed to the legacy transaction attempt
          // txHash will remain null, triggering the legacy fallback
        }
      }
      
      // If EIP-1559 failed or not available, try legacy
      if (!txHash) {
        console.log('🔄 Attempting legacy transaction...');
        
        let gasPrice;
        try {
          gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' });
          console.log('⛽ Network gas price:', gasPrice);
          
          // Increase gas price by 20% for faster confirmation
          const gasPriceNum = BigInt(gasPrice);
          const increasedGasPrice = gasPriceNum * BigInt(120) / BigInt(100);
          gasPrice = '0x' + increasedGasPrice.toString(16);
          
          console.log('⛽ Increased gas price:', gasPrice);
        } catch (err) {
          console.warn('⚠️ Could not fetch gas price for legacy, using default:', err);
          gasPrice = '0x3B9ACA00'; // 1 Gwei default
        }
        
        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: metamaskWallet.address,
            to: recipient,
            value: amountInWei,
            gas: gasLimit,
            gasPrice: gasPrice
          }]
        });
        console.log('✅ Legacy transaction sent:', txHash);
      }

      console.log('✅ L2 Transaction sent! Hash:', txHash);

      const savedTransaction = await base44.entities.BridgeTransaction.create({
        from_network: "L2",
        to_network: "L2",
        from_address: metamaskWallet.address,
        to_address: recipient,
        amount: amountValue,
        token_type: "KAS",
        token_symbol: "KAS",
        status: "completed",
        tx_hash: txHash,
        estimated_time: 1,
        fee: estimatedFee
      });

      console.log('✅ Transaction saved to database with ID:', savedTransaction.id);

      // Construct explorer URL (assuming specific Kasplex explorers)
      const explorerUrl = detectedMetaMaskNetwork === 'mainnet'
        ? `https://explorer.kasplex.org/tx/${txHash}`
        : `https://frontend.kasplextest.xyz/tx/${txHash}`;

      setSuccess(`✅ L2 Transfer successful! TX: ${txHash.substring(0, 10)}...`);
      setAmount("");
      setRecipient("");

      if (onTransactionComplete) {
        console.log('🔄 Calling onTransactionComplete callback...');
        await onTransactionComplete();
      }

    } catch (error) {
      console.error('❌ L2 Transfer error:', error);
      
      if (error.code === 4001) {
        setError('Transaction cancelled by user');
      } else if (error.message && error.message.includes('insufficient funds')) {
        setError('Insufficient KAS balance for transaction + gas fees');
      } else if (error.message && error.message.includes('gas')) {
        setError('Gas estimation failed. Try refreshing and retrying.');
      } else if (error.message && error.message.includes('nonce')) {
        setError('Nonce error. Please refresh the page and try again.');
      } else {
        setError(error.message || 'Transfer failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = () => {
    if (networkMode === "L1") {
      handleSendL1();
    } else if (networkMode === "L2") {
      handleSendL2();
    } else {
      setError("Please connect a wallet to perform a transfer.");
    }
  };

  const canSend = !!activeWallet && activeWallet.connected && amount && recipient && parseFloat(amount) >= 0.01;

  return (
    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Send KAS</h2>
            <p className="text-sm text-gray-400">
              Transfer on {networkMode === "L1" 
                ? "Kaspa L1" 
                : networkMode === "L2" 
                  ? `Kasplex L2 ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}` 
                  : "Connect a wallet to get started"
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || (!kaswareWallet.connected && !metamaskWallet.connected)}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Network Mode Badge */}
        <div className="flex items-center justify-center gap-3">
          <Badge
            variant="outline"
            className={networkMode === "L1" 
              ? "bg-orange-500/20 text-orange-300 border-orange-500/30 text-lg px-4 py-2" 
              : networkMode === "L2" && network === 'mainnet'
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-lg px-4 py-2"
                : networkMode === "L2" && network === 'testnet'
                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-lg px-4 py-2"
                  : "bg-gray-500/20 text-gray-300 border-gray-500/30 text-lg px-4 py-2"
            }
          >
            {networkMode === "L1" 
              ? "🟠 Kaspa L1 Network" 
              : networkMode === "L2" 
                ? (network === 'mainnet' ? "🔵 Kasplex L2 Mainnet" : "🟡 Kasplex L2 Testnet") 
                : "Connect a Wallet"
            }
          </Badge>
        </div>

        {/* Clickable Wallet Boxes */}
        <div className="grid grid-cols-2 gap-4">
          {/* Kasware (L1) Box */}
          <button
            onClick={() => kaswareWallet.connected ? handleSelectNetworkMode("L1") : onConnectKasware()}
            disabled={isProcessing}
            className={`backdrop-blur-xl rounded-xl p-4 border-2 transition-all ${
              networkMode === "L1" && kaswareWallet.connected 
                ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50 shadow-lg shadow-orange-500/30' 
                : kaswareWallet.connected
                  ? 'bg-white/5 border-white/10 hover:border-orange-500/30 hover:bg-white/10 cursor-pointer'
                  : 'bg-white/5 border-white/10 hover:border-orange-500/30 hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400">Kasware (L1)</span>
              {kaswareWallet.connected && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnectKasware();
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              )}
            </div>
            {kaswareWallet.connected ? (
              <>
                <div className="text-lg font-bold text-white">
                  {kaswareWallet.balance.toFixed(4)} KAS
                </div>
                {networkMode === "L1" && (
                  <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Active for Sending
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">Click to Connect</div>
            )}
          </button>

          {/* MetaMask (L2) Box */}
          <button
            onClick={() => metamaskWallet.connected ? handleSelectNetworkMode("L2") : onConnectMetaMask()}
            disabled={isProcessing}
            className={`backdrop-blur-xl rounded-xl p-4 border-2 transition-all ${
              networkMode === "L2" && metamaskWallet.connected 
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/30' 
                : metamaskWallet.connected
                  ? 'bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/10 cursor-pointer'
                  : 'bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400">MetaMask (L2)</span>
              {metamaskWallet.connected && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnectMetaMask();
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              )}
            </div>
            {metamaskWallet.connected ? (
              <>
                <div className="text-lg font-bold text-white">
                  {(metamaskWallet.balance || 0).toFixed(4)} KAS
                </div>
                {metamaskWallet.nativeBalance !== undefined && metamaskWallet.wrappedBalance !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Native: {metamaskWallet.nativeBalance.toFixed(4)}</div>
                    <div>Wrapped: {metamaskWallet.wrappedBalance.toFixed(4)}</div>
                  </div>
                )}
                {networkMode === "L2" && (
                  <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Active for Sending
                  </div>
                )}
                {networkMode === "L2" && detectedMetaMaskNetwork && detectedMetaMaskNetwork !== network && (
                  <div className="text-xs text-red-400 mt-1">● Wrong network in MetaMask</div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">Click to Connect</div>
            )}
          </button>
        </div>

        {/* Form Fields */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Recipient Address {networkMode === "L1" ? "(kaspa:...)" : networkMode === "L2" ? "(0x...)" : ""}
          </label>
          <Input
            placeholder={networkMode === "L1" ? "kaspa:qqq..." : networkMode === "L2" ? "0x..." : "Click a wallet box to specify recipient"}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="backdrop-blur-xl bg-black/20 border-white/10 text-white placeholder:text-gray-700 font-mono text-sm"
            disabled={isProcessing || !networkMode}
          />
          <p className="text-xs text-gray-500 mt-1">
            {networkMode === "L1" 
              ? "Enter the recipient's Kaspa L1 address" 
              : networkMode === "L2"
                ? "Enter the recipient's EVM address (42 characters)"
                : "Click on a wallet box above to select transaction type"}
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Amount (KAS)</label>
          <div className="flex gap-3 mb-2">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="backdrop-blur-xl bg-black/20 border-white/10 text-2xl font-bold text-white placeholder:text-gray-700 h-auto p-4 flex-1"
              disabled={isProcessing || !activeWallet || !activeWallet.connected}
              min="0.01"
              step="0.01"
            />
            <Button
              variant="ghost"
              onClick={() => setAmount(activeWallet?.balance.toString() || "0")}
              className="text-gray-400 hover:text-white hover:bg-white/5 px-6"
              disabled={isProcessing || !activeWallet || !activeWallet.connected}
            >
              MAX
            </Button>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction Details</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network</span>
            <span className="text-white font-semibold">
              {networkMode === "L1" 
                ? "Kaspa L1" 
                : networkMode === "L2" 
                  ? `Kasplex L2 ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}` 
                  : "N/A"
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network Fee (~0.1%)</span>
            <span className="text-white font-semibold">{estimatedFee.toFixed(6)} KAS</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Recipient Receives</span>
            <span className="text-cyan-400 font-semibold">{estimatedReceive.toFixed(4)} KAS</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estimated Time</span>
            <span className="text-white font-semibold">~1 minute</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="backdrop-blur-xl bg-black/20 border border-white/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              {networkMode === "L1" ? (
                <>
                  <p className="font-semibold mb-2 text-gray-300">Direct L1 Transfer:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Sends KAS directly via Kaspa network</li>
                    <li>• Fast confirmation (~1 minute)</li>
                    <li>• Low fees (~0.1%)</li>
                    <li>• No intermediaries or smart contracts</li>
                  </ul>
                </>
              ) : networkMode === "L2" ? (
                <>
                  <p className="font-semibold mb-2 text-gray-300">Direct L2 Transfer:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Sends KAS via Kasplex L2 EVM network</li>
                    <li>• Instant confirmation</li>
                    <li>• Low gas fees</li>
                    <li>• Smart contract compatible</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-2 text-gray-300">Click a wallet box above to select:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Click Kasware for L1-to-L1 transfers</li>
                    <li>• Click MetaMask for L2-to-L2 transfers</li>
                    <li>• Both wallets can be connected simultaneously</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
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

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-100 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend || isProcessing || (networkMode === "L2" && error && error.includes('Wrong network'))}
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-3" />
              Send {amount || '0'} KAS on {networkMode || "unknown network"}
            </>
          )}
        </Button>

        {isProcessing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-gray-400"
          >
            Please approve the transaction in {networkMode === "L1" ? "Kasware" : networkMode === "L2" ? "MetaMask" : "your wallet"}...
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}
