
import React, { useState, useEffect, useCallback } from "react";
import { BridgeTransaction } from "@/entities/BridgeTransaction";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  ExternalLink 
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTxs, setFilteredTxs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const filterTransactions = useCallback(() => {
    if (!searchTerm) {
      setFilteredTxs(transactions);
      return;
    }

    const filtered = transactions.filter(tx => 
      tx.from_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount?.toString().includes(searchTerm)
    );
    setFilteredTxs(filtered);
  }, [searchTerm, transactions]);

  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const txs = await BridgeTransaction.list('-created_date');
      setTransactions(txs);
      setFilteredTxs(txs);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  const stats = {
    total: transactions.length,
    completed: transactions.filter(tx => tx.status === 'completed').length,
    processing: transactions.filter(tx => tx.status === 'processing').length,
    totalVolume: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-black p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Bridge History
          </h1>
          <p className="text-gray-400 text-lg">
            View all your cross-chain transactions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-2">Total Bridges</div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-950 border-green-900/30">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-2">Completed</div>
              <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-950 border-blue-900/30">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-2">Processing</div>
              <div className="text-3xl font-bold text-blue-400">{stats.processing}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-950 border-purple-900/30">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-2">Total Volume</div>
              <div className="text-2xl font-bold text-purple-400">{stats.totalVolume.toFixed(2)} KAS</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-950 border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">All Transactions</h2>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by address or tx hash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              ) : filteredTxs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">
                    {searchTerm ? 'No transactions found' : 'No transactions yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Route</TableHead>
                        <TableHead className="text-gray-400">From</TableHead>
                        <TableHead className="text-gray-400">To</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Tx Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTxs.map((tx) => (
                        <TableRow 
                          key={tx.id} 
                          className="border-gray-800 hover:bg-gray-900 transition-colors"
                        >
                          <TableCell className="text-gray-300">
                            {format(new Date(tx.created_date), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={
                                tx.from_network === "L1" 
                                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30" 
                                  : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                              }>
                                {tx.from_network}
                              </Badge>
                              <ArrowRight className="w-3 h-3 text-gray-500" />
                              <Badge variant="outline" className={
                                tx.to_network === "L1" 
                                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30" 
                                  : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                              }>
                                {tx.to_network}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-400">
                            {truncateAddress(tx.from_address)}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-400">
                            {truncateAddress(tx.to_address)}
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            {tx.amount} KAS
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(tx.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(tx.status)}
                                {tx.status}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tx.tx_hash ? (
                              <a
                                href={`#`} // Placeholder, update with actual block explorer link
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-mono text-sm"
                              >
                                {truncateAddress(tx.tx_hash)}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
