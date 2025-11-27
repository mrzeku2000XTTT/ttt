import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, Delete, RotateCcw, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [memory, setMemory] = useState(0);
  const [kasPrice, setKasPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  useEffect(() => {
    loadKasPrice();
    loadExchangeRates();
    const interval = setInterval(() => {
      loadKasPrice();
      loadExchangeRates();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadKasPrice = async () => {
    setLoadingPrice(true);
    try {
      const response = await base44.functions.invoke('getKaspaPrice');
      if (response.data?.price) {
        setKasPrice(response.data.price);
      }
    } catch (err) {
      console.error("Failed to load KAS price:", err);
    } finally {
      setLoadingPrice(false);
    }
  };

  const loadExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (err) {
      console.error("Failed to load exchange rates:", err);
    }
  };

  const buttons = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['±', '0', '.', '=']
  ];

  const scientificButtons = [
    ['sin', 'cos', 'tan', 'log'],
    ['√', 'x²', 'xʸ', '!'],
    ['(', ')', 'π', 'e'],
    ['MC', 'MR', 'M+', 'M-']
  ];

  const handleButtonClick = (value) => {
    switch(value) {
      case 'C':
        setDisplay("0");
        setEquation("");
        break;
      case '⌫':
        setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
        break;
      case '=':
        calculateResult();
        break;
      case '±':
        setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
        break;
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(memory.toString());
        break;
      case 'M+':
        setMemory(memory + parseFloat(display || 0));
        break;
      case 'M-':
        setMemory(memory - parseFloat(display || 0));
        break;
      case 'sin':
        setDisplay(Math.sin(parseFloat(display) * Math.PI / 180).toString());
        break;
      case 'cos':
        setDisplay(Math.cos(parseFloat(display) * Math.PI / 180).toString());
        break;
      case 'tan':
        setDisplay(Math.tan(parseFloat(display) * Math.PI / 180).toString());
        break;
      case 'log':
        setDisplay(Math.log10(parseFloat(display)).toString());
        break;
      case '√':
        setDisplay(Math.sqrt(parseFloat(display)).toString());
        break;
      case 'x²':
        setDisplay(Math.pow(parseFloat(display), 2).toString());
        break;
      case '!':
        setDisplay(factorial(parseFloat(display)).toString());
        break;
      case 'π':
        setDisplay(Math.PI.toString());
        break;
      case 'e':
        setDisplay(Math.E.toString());
        break;
      default:
        if (display === "0" && !['+', '-', '×', '÷', '.'].includes(value)) {
          setDisplay(value);
        } else {
          setDisplay(display + value);
        }
    }
  };

  const factorial = (n) => {
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
  };

  const calculateResult = () => {
    try {
      const result = eval(
        display
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/π/g, Math.PI)
          .replace(/e/g, Math.E)
      );
      const historyItem = `${display} = ${result}`;
      setHistory([historyItem, ...history.slice(0, 9)]);
      setEquation(display);
      setDisplay(result.toString());
    } catch (err) {
      setDisplay("Error");
    }
  };

  const parseSmartInput = (input) => {
    // Pattern: "100x 50kas" or "100 * 50kas" or "100 x 50 kas"
    const kasPattern = /(\d+\.?\d*)\s*[x*×]\s*(\d+\.?\d*)\s*kas/i;
    const match = input.match(kasPattern);
    
    if (match && kasPrice) {
      const usdAmount = parseFloat(match[1]);
      const kasAmount = parseFloat(match[2]);
      const result = usdAmount * kasAmount;
      return {
        isKasCalc: true,
        result,
        formula: `$${usdAmount} × ${kasAmount} KAS = ${result}`,
        kasValue: `≈ $${(kasAmount * kasPrice).toFixed(2)}`
      };
    }

    // Pattern: "50kas" to get USD value
    const kasOnlyPattern = /(\d+\.?\d*)\s*kas/i;
    const kasMatch = input.match(kasOnlyPattern);
    
    if (kasMatch && kasPrice) {
      const kasAmount = parseFloat(kasMatch[1]);
      const result = kasAmount * kasPrice;
      return {
        isKasCalc: true,
        result,
        formula: `${kasAmount} KAS @ $${kasPrice.toFixed(4)}`,
        kasValue: `= $${result.toFixed(2)}`
      };
    }

    return null;
  };

  const convertToUSD = (amount, currency) => {
    if (!exchangeRates || currency === 'USD') return amount;
    return amount / exchangeRates[currency];
  };

  const handleCurrencyConversion = () => {
    if (!aiInput.trim() || !kasPrice || !exchangeRates) return;

    const patterns = [
      /(\d+\.?\d*)\s*[$]?\s*(naira|ngn|usd|eur|gbp|jpy|cad|aud|chf|cny|inr|mxn|brl|krw|sgd|hkd|nzd|sek|nok|dkk|pln|thb|idr|myr|php|zar|try|rub|aed|sar|egp|kwd|qar|omr|bhd|jod)?\s+to\s+kas/i,
      /(\d+\.?\d*)\s*[$]?\s*(naira|ngn|usd|eur|gbp|jpy|cad|aud|chf|cny|inr|mxn|brl|krw|sgd|hkd|nzd|sek|nok|dkk|pln|thb|idr|myr|php|zar|try|rub|aed|sar|egp|kwd|qar|omr|bhd|jod)?\s+in\s+kas/i,
      /(\d+\.?\d*)\s*kas\s+to\s+(naira|ngn|usd|eur|gbp|jpy|cad|aud|chf|cny|inr|mxn|brl|krw|sgd|hkd|nzd|sek|nok|dkk|pln|thb|idr|myr|php|zar|try|rub|aed|sar|egp|kwd|qar|omr|bhd|jod)/i,
      /(\d+\.?\d*)\s*kas\s+in\s+(naira|ngn|usd|eur|gbp|jpy|cad|aud|chf|cny|inr|mxn|brl|krw|sgd|hkd|nzd|sek|nok|dkk|pln|thb|idr|myr|php|zar|try|rub|aed|sar|egp|kwd|qar|omr|bhd|jod)/i
    ];

    for (const pattern of patterns) {
      const match = aiInput.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const currency = match[2] 
          ? (match[2].toLowerCase() === 'naira' ? 'NGN' : match[2].toUpperCase())
          : 'USD'; // Default to USD if $ symbol used without currency name
        
        if (aiInput.toLowerCase().includes('kas to') || aiInput.toLowerCase().includes('kas in')) {
          const kasInUSD = amount * kasPrice;
          const result = currency === 'USD' ? kasInUSD : kasInUSD * exchangeRates[currency];
          setDisplay(result.toFixed(2));
          setHistory([`${amount} KAS → ${result.toFixed(2)} ${currency}`, ...history.slice(0, 9)]);
        } else {
          const amountInUSD = convertToUSD(amount, currency);
          const kasAmount = amountInUSD / kasPrice;
          setDisplay(kasAmount.toFixed(4));
          setHistory([`${amount} ${currency} → ${kasAmount.toFixed(4)} KAS`, ...history.slice(0, 9)]);
        }
        setAiInput("");
        return true;
      }
    }
    return false;
  };

  const handleAICalculate = async () => {
    if (!aiInput.trim()) return;

    if (handleCurrencyConversion()) return;

    setAiThinking(true);
    try {
      const prompt = kasPrice 
        ? `You are a mathematical calculator AI. KAS price = $${kasPrice.toFixed(6)} USD

Query: "${aiInput}"

STEP-BY-STEP CALCULATION RULES:

When "kas" appears in the query:
1. First convert "X kas" to its USD value: X × ${kasPrice.toFixed(6)}
2. Then perform the requested operation

Examples:
- "$50 divide by 2 kas"
  Step 1: 2 kas = 2 × ${kasPrice.toFixed(6)} = ${(2 * kasPrice).toFixed(6)}
  Step 2: $50 ÷ ${(2 * kasPrice).toFixed(6)} = ${(50 / (2 * kasPrice)).toFixed(4)}
  Answer: ${(50 / (2 * kasPrice)).toFixed(4)}

- "$100 in kas"
  Step 1: 100 ÷ ${kasPrice.toFixed(6)} = ${(100 / kasPrice).toFixed(4)}
  Answer: ${(100 / kasPrice).toFixed(4)}

- "50 kas in usd"
  Step 1: 50 × ${kasPrice.toFixed(6)} = ${(50 * kasPrice).toFixed(2)}
  Answer: ${(50 * kasPrice).toFixed(2)}

Now calculate "${aiInput}" step by step.

CRITICAL: Return ONLY the final number. No text, no currency symbols, just the number.`
        : `Calculate: "${aiInput}"

Return ONLY the final numerical result. No explanations.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      // Extract the cleanest number from response
      const cleaned = response.trim().replace(/[^\d.\-]/g, '');
      const result = cleaned || response.trim();
      
      setDisplay(result);
      setHistory([`${aiInput} = ${result}`, ...history.slice(0, 9)]);
      setAiInput("");
    } catch (err) {
      console.error("AI calculation failed:", err);
      setDisplay("Error");
    } finally {
      setAiThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
            AI Calculator
          </h1>
          <p className="text-white/60">Scientific calculator with AI-powered computation</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Calculator */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
              
              <div className="relative bg-black/60 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                {/* Display */}
                <div className="mb-6">
                  {equation && (
                    <div className="text-right text-white/40 text-sm mb-2 font-mono">
                      {equation}
                    </div>
                  )}
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-right">
                    <div className="text-5xl font-bold text-white font-mono break-all">
                      {display}
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-3 text-xs flex-wrap">
                      {kasPrice && exchangeRates && (
                        <>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            <span className="text-cyan-400 font-semibold">
                              KAS: ${kasPrice.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-400 font-semibold">
                              KAS: ₦{(kasPrice * exchangeRates.NGN).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                      {kasPrice && !exchangeRates && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                          <span className="text-cyan-400 font-semibold">
                            KAS: ${kasPrice.toFixed(4)}
                          </span>
                        </div>
                      )}
                      {memory !== 0 && (
                        <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 font-semibold">
                          M: {memory}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Input */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-50" />
                    <div className="relative flex gap-2">
                      <input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAICalculate()}
                        placeholder="100 NGN to KAS or 5000 Naira to KAS or 50 KAS to USD..."
                        className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
                      />
                      <Button
                        onClick={handleAICalculate}
                        disabled={aiThinking}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6"
                      >
                        {aiThinking ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Scientific Functions */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {scientificButtons.flat().map((btn, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleButtonClick(btn)}
                      className="h-12 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 rounded-xl text-white font-semibold text-sm hover:border-white/30 transition-all"
                    >
                      {btn}
                    </motion.button>
                  ))}
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-4 gap-3">
                  {buttons.flat().map((btn, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleButtonClick(btn)}
                      className={`h-16 rounded-2xl font-bold text-lg transition-all ${
                        btn === '='
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                          : ['÷', '×', '-', '+'].includes(btn)
                          ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 backdrop-blur-xl border border-white/20 text-white'
                          : btn === 'C'
                          ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30 backdrop-blur-xl border border-white/20 text-white'
                          : 'bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      {btn === '⌫' ? <Delete className="w-5 h-5 mx-auto" /> : btn}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* History Panel */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
              
              <div className="relative bg-black/60 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 shadow-2xl h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-400" />
                    History
                  </h2>
                  <button
                    onClick={() => setHistory([])}
                    className="text-white/40 hover:text-red-400 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
                  <AnimatePresence>
                    {history.length === 0 ? (
                      <div className="text-center py-12 text-white/40">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No calculations yet</p>
                      </div>
                    ) : (
                      history.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => {
                            const result = item.split('=')[1]?.trim();
                            if (result) setDisplay(result);
                          }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group/item"
                        >
                          <div className="flex items-start gap-2">
                            {item.startsWith('AI:') && (
                              <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 text-white/80 text-sm font-mono break-all group-hover/item:text-white transition-colors">
                              {item}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Features
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-white/60">
                <span className="text-green-400 font-semibold">NGN to KAS:</span> "5000 Naira to KAS"
              </div>
              <div className="text-white/60">
                <span className="text-cyan-400 font-semibold">USD to KAS:</span> "100 USD to KAS"
              </div>
              <div className="text-white/60">
                <span className="text-purple-400 font-semibold">KAS to Any:</span> "50 KAS to EUR"
              </div>
            </div>
            <div className="mt-3 text-xs text-white/40">
              Main: NGN (Naira), USD • Supported: EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, BRL, KRW, SGD, HKD, NZD, SEK, NOK, DKK, PLN, THB, IDR, MYR, PHP, ZAR, TRY, RUB, AED, SAR, EGP, KWD, QAR, OMR, BHD, JOD
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}