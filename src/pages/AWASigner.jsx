import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AWAHowItWorks from "@/components/awasigner/AWAHowItWorks";
import AWAPaymentTerminal from "@/components/awasigner/AWAPaymentTerminal";
import AWATransactionLog from "@/components/awasigner/AWATransactionLog";

export default function AWASignerPage() {
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-10">
        {/* Back to Sector Selection */}
        <button
          onClick={() => navigate("/Sector6")}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sector Selection
        </button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">AWA — Air-Gapped AI Payments</h1>
          <p className="text-zinc-400 mt-3">Pay for AI compute with KAS, signed on a second phone</p>
        </div>

        {/* Section A */}
        <AWAHowItWorks />

        {/* Section B */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 tracking-wide">Payment Terminal</h2>
          <AWAPaymentTerminal onPayment={(tx) => setTransactions(prev => [tx, ...prev])} />
        </div>

        {/* Section C */}
        <AWATransactionLog transactions={transactions} />
      </div>
    </div>
  );
}