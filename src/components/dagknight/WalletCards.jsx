import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Loader2, Shield, Copy, LogOut, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WalletCards({
  wallets,
  getWalletVerifications,
  hasGenesisFor,
  createGenesisVerification,
  isVerifying,
  activeVerification,
  loadDAGKnightStatus,
  onVerifyTTTWallet,
  onDisconnectWallet
}) {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);

  const handleCopyAddress = async (address, type) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDisconnect = async (type) => {
    if (!confirm(`⚠️ Disconnect this wallet? This will remove it from DAGKnight verification.`)) {
      return;
    }

    setDisconnecting(type);
    try {
      await onDisconnectWallet(type);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8">
      {/* Kasware L1 */}
      <Card className="bg-black border-zinc-800 hover:border-orange-500/30 transition-colors">
        <CardHeader className="border-b border-zinc-800 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-white">Kasware L1</h3>
            {hasGenesisFor('kasware_l1') && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Genesis
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {wallets.kasware ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <code className="text-xs text-orange-400 font-mono flex-1 break-all">
                  {wallets.kasware.substring(0, 30)}...
                </code>
                <Button
                  onClick={() => handleCopyAddress(wallets.kasware, 'kasware')}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0"
                >
                  {copiedAddress === 'kasware' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Verifications: <span className="text-white">{getWalletVerifications(wallets.kasware).length}</span>
              </div>
              <div className="space-y-2">
                {!hasGenesisFor('kasware_l1') && (
                  <Button
                    onClick={() => createGenesisVerification('kasware_l1', wallets.kasware)}
                    disabled={isVerifying}
                    className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                  >
                    {isVerifying && activeVerification === 'kasware_l1' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Create Genesis
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => handleDisconnect('kasware')}
                  disabled={disconnecting === 'kasware'}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {disconnecting === 'kasware' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">Not connected</p>
              <Button
                onClick={async () => {
                  if (window.kasware) {
                    try {
                      await window.kasware.requestAccounts();
                      loadDAGKnightStatus();
                    } catch (err) {
                      console.error('Kasware connection error:', err);
                      if (err.message?.includes('User rejected')) {
                        alert('Connection cancelled');
                      } else {
                        alert('Failed to connect Kasware');
                      }
                    }
                  } else {
                    alert('Kasware not found. Please install Kasware extension.');
                  }
                }}
                className="w-full bg-black border border-zinc-800 text-white hover:bg-zinc-900"
              >
                Connect Kasware
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TTT Wallet */}
      <Card className="bg-black border-zinc-800 hover:border-purple-500/30 transition-colors">
        <CardHeader className="border-b border-zinc-800 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-white">TTT Wallet</h3>
            {hasGenesisFor('ttt_wallet') && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Genesis
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {wallets.ttt ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <code className="text-xs text-purple-400 font-mono flex-1 break-all">
                  {wallets.ttt.substring(0, 30)}...
                </code>
                <Button
                  onClick={() => handleCopyAddress(wallets.ttt, 'ttt')}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0"
                >
                  {copiedAddress === 'ttt' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Verifications: <span className="text-white">{getWalletVerifications(wallets.ttt).length}</span>
              </div>
              <div className="space-y-2">
                {!hasGenesisFor('ttt_wallet') && (
                  <Button
                    onClick={() => onVerifyTTTWallet(wallets.ttt)}
                    className="w-full bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Wallet
                  </Button>
                )}
                <Button
                  onClick={() => navigate(createPageUrl("Wallet"))}
                  variant="outline"
                  className="w-full bg-black border border-zinc-800 text-white hover:bg-zinc-900"
                >
                  Manage Wallet
                </Button>
                <Button
                  onClick={() => handleDisconnect('ttt')}
                  disabled={disconnecting === 'ttt'}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {disconnecting === 'ttt' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">No wallet created</p>
              <Button
                onClick={() => navigate(createPageUrl("Wallet"))}
                className="w-full bg-black border border-zinc-800 text-white hover:bg-zinc-900"
              >
                Create TTT Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ZK Wallet */}
      <Card className="bg-black border-zinc-800 hover:border-cyan-500/30 transition-colors">
        <CardHeader className="border-b border-zinc-800 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-white">ZK Wallet</h3>
            {hasGenesisFor('zk_wallet') && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Genesis
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {wallets.zk ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <code className="text-xs text-cyan-400 font-mono flex-1 break-all">
                  {wallets.zk.substring(0, 30)}...
                </code>
                <Button
                  onClick={() => handleCopyAddress(wallets.zk, 'zk')}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0"
                >
                  {copiedAddress === 'zk' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Verifications: <span className="text-white">{getWalletVerifications(wallets.zk).length}</span>
              </div>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-3">
                <p className="text-xs text-cyan-300">
                  🔐 VP Import wallet from Agent ZK
                </p>
              </div>

              <div className="space-y-2">
                {!hasGenesisFor('zk_wallet') && (
                  <Button
                    onClick={() => createGenesisVerification('zk_wallet', wallets.zk)}
                    disabled={isVerifying}
                    className="w-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    {isVerifying && activeVerification === 'zk_wallet' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Create Genesis
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => navigate(createPageUrl("AgentZK"))}
                  variant="outline"
                  className="w-full bg-black border border-zinc-800 text-white hover:bg-zinc-900"
                >
                  Manage in Agent ZK
                </Button>
                <Button
                  onClick={() => handleDisconnect('zk')}
                  disabled={disconnecting === 'zk'}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {disconnecting === 'zk' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">No ZK wallet imported</p>
              <Button
                onClick={() => navigate(createPageUrl("AgentZK"))}
                className="w-full bg-black border border-zinc-800 text-white hover:bg-zinc-900"
              >
                Import via Agent ZK
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}