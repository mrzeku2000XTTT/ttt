import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Send, Coins, Key, Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function KurncyPage() {
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [showKeys, setShowKeys] = useState(false);
  const [copied, setCopied] = useState(false);

  // Wallet Creation/Import
  const [pin, setPin] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  // Transfer
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [ticker, setTicker] = useState("KURNCY");

  // Mint
  const [mintTicker, setMintTicker] = useState("KURNCY");
  const [iterations, setIterations] = useState(20);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = () => {
    const saved = localStorage.getItem("kurncy_wallet");
    if (saved) {
      setWallet(JSON.parse(saved));
    }
  };

  const saveWallet = (walletData) => {
    localStorage.setItem("kurncy_wallet", JSON.stringify(walletData));
    setWallet(walletData);
  };

  const handleCreateWallet = async () => {
    if (!pin || pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("kurncyWallet", {
        action: "create",
        pin,
        network: "mainnet"
      });

      if (data.success) {
        saveWallet(data);
        toast.success("Wallet created successfully!");
        setPin("");
      } else {
        toast.error(data.error || "Failed to create wallet");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportMnemonic = async () => {
    if (!pin || !mnemonic) {
      toast.error("PIN and mnemonic are required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("kurncyWallet", {
        action: "import-mnemonic",
        pin,
        mnemonic,
        network: "mainnet"
      });

      if (data.success) {
        saveWallet(data);
        toast.success("Wallet imported successfully!");
        setPin("");
        setMnemonic("");
      } else {
        toast.error(data.error || "Failed to import wallet");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPrivateKey = async () => {
    if (!pin || !privateKey) {
      toast.error("PIN and private key are required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("kurncyWallet", {
        action: "import-privatekey",
        pin,
        privateKey,
        network: "mainnet"
      });

      if (data.success) {
        saveWallet(data);
        toast.success("Wallet imported successfully!");
        setPin("");
        setPrivateKey("");
      } else {
        toast.error(data.error || "Failed to import wallet");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("kurncyWallet", {
        action: "balance",
        address: wallet.address,
        network: "mainnet"
      });

      if (data.success) {
        setWallet({ ...wallet, balance: data.balance });
        toast.success("Balance updated!");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!wallet || !toAddress || !amount || !ticker) {
      toast.error("All fields are required");
      return;
    }

    if (!pin) {
      toast.error("Enter PIN to decrypt private key");
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("kurncyKRC20", {
        action: "transfer",
        encryptedKey: wallet.privateKey,
        pin,
        fromAddress: wallet.address,
        toAddress,
        amount,
        ticker,
        network: "mainnet"
      });

      if (data.success) {
        toast.success(`Transfer successful! TX: ${data.transactionId}`);
        setToAddress("");
        setAmount("");
        setPin("");
      } else {
        toast.error(data.error || "Transfer failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!wallet || !mintTicker) {
      toast.error("Wallet and ticker are required");
      return;
    }

    if (!pin) {
      toast.error("Enter PIN to decrypt private key");
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("kurncyKRC20", {
        action: "mint",
        encryptedKey: wallet.privateKey,
        pin,
        fromAddress: wallet.address,
        ticker: mintTicker,
        iterations,
        network: "mainnet"
      });

      if (data.success) {
        toast.success(`Minted ${data.totalMinted}/${iterations} successfully!`);
        setPin("");
      } else {
        toast.error(data.error || "Minting failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const disconnectWallet = () => {
    localStorage.removeItem("kurncy_wallet");
    setWallet(null);
    toast.success("Wallet disconnected");
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Kurncy Wallet</h1>
            <p className="text-white/60">Create or import your Kaspa wallet</p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="mnemonic">Import Mnemonic</TabsTrigger>
              <TabsTrigger value="privatekey">Import Key</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Create New Wallet</CardTitle>
                  <CardDescription className="text-white/60">
                    Generate a new Kaspa wallet with 12-word recovery phrase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter PIN (min 4 digits)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Button 
                    onClick={handleCreateWallet} 
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
                    Create Wallet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mnemonic">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Import from Mnemonic</CardTitle>
                  <CardDescription className="text-white/60">
                    Restore wallet using 12-word recovery phrase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="word1 word2 word3..."
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Button 
                    onClick={handleImportMnemonic} 
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    Import Wallet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privatekey">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Import from Private Key</CardTitle>
                  <CardDescription className="text-white/60">
                    Import wallet using private key
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Private key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Button 
                    onClick={handleImportPrivateKey} 
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    Import Wallet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Kurncy Wallet</h1>
            <p className="text-white/60">Manage your Kaspa & KRC-20 tokens</p>
          </div>
          <Button onClick={disconnectWallet} variant="outline" className="text-red-400 border-red-400/20">
            Disconnect
          </Button>
        </div>

        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60">Address</span>
              <button onClick={() => copyToClipboard(wallet.address)} className="text-cyan-400 hover:text-cyan-300">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white font-mono text-sm break-all">{wallet.address}</p>

            {wallet.mnemonic && (
              <>
                <div className="flex items-center justify-between mt-6 mb-4">
                  <span className="text-white/60">Recovery Phrase</span>
                  <button onClick={() => setShowKeys(!showKeys)} className="text-cyan-400 hover:text-cyan-300">
                    {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {showKeys && (
                  <p className="text-yellow-400 text-sm break-all bg-yellow-500/10 p-3 rounded">{wallet.mnemonic}</p>
                )}
              </>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Balance</span>
                <Button onClick={handleRefreshBalance} disabled={loading} size="sm" variant="ghost">
                  <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-3xl font-bold text-white mt-2">
                {wallet.balance ? `${(wallet.balance / 100000000).toFixed(8)} KAS` : "-- KAS"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="transfer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="transfer">Transfer KRC-20</TabsTrigger>
            <TabsTrigger value="mint">Mint KRC-20</TabsTrigger>
          </TabsList>

          <TabsContent value="transfer">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Transfer KRC-20 Tokens</CardTitle>
                <CardDescription className="text-white/60">Send tokens to another address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Recipient address"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    placeholder="Ticker"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button 
                  onClick={handleTransfer} 
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Transfer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mint">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Mint KRC-20 Tokens</CardTitle>
                <CardDescription className="text-white/60">Mint new tokens (requires KAS for fees)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Ticker"
                    value={mintTicker}
                    onChange={(e) => setMintTicker(e.target.value.toUpperCase())}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    type="number"
                    placeholder="Iterations"
                    value={iterations}
                    onChange={(e) => setIterations(parseInt(e.target.value) || 20)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button 
                  onClick={handleMint} 
                  disabled={loading}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4 mr-2" />}
                  Start Minting
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}