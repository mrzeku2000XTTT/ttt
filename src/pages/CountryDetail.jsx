import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, DollarSign, Clock, MapPin, Globe, TrendingUp, Info, ArrowRightLeft, X, Search, MoreHorizontal, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function CountryDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const countryName = searchParams.get("country");
  const countryFlag = searchParams.get("flag");
  const [currencyData, setCurrencyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [convertAmount, setConvertAmount] = useState(100);
  const [loadingRates, setLoadingRates] = useState(false);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [fromAmount, setFromAmount] = useState(1);
  const [toAmount, setToAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  useEffect(() => {
    if (countryName) {
      fetchCurrencyData();
      fetchExchangeRates();
    }
  }, [countryName]);

  const fetchCurrencyData = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `For ${countryName}, provide the following information in JSON format:
        {
          "currency": "currency name and code",
          "currencyCode": "3-letter currency code only",
          "timezone": "main timezone",
          "capital": "capital city",
          "population": "approximate population",
          "language": "main language(s)",
          "exchangeRate": "approximate exchange rate to USD",
          "funFact": "one interesting fact"
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            currency: { type: "string" },
            currencyCode: { type: "string" },
            timezone: { type: "string" },
            capital: { type: "string" },
            population: { type: "string" },
            language: { type: "string" },
            exchangeRate: { type: "string" },
            funFact: { type: "string" }
          }
        }
      });
      setCurrencyData(response);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    setLoadingRates(true);
    try {
      // Wait for currency data to load first
      if (!currencyData?.currencyCode) {
        setTimeout(fetchExchangeRates, 500);
        return;
      }

      const response = await base44.functions.invoke('getCurrencyRates', {
        currencyCode: currencyData.currencyCode
      });

      setExchangeRates(response.data);
    } catch (err) {
      console.error("Failed to fetch exchange rates:", err);
    } finally {
      setLoadingRates(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
      {/* Simple Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate(createPageUrl("Earth"))}
            className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 group mb-4"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Earth</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{countryFlag}</div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Full Name</div>
                <h1 className="text-3xl font-bold text-slate-900">{countryName}</h1>
              </div>
            </div>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Country Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Featured Country Card with Flag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-end pr-12 opacity-10">
            <div className="text-[280px] font-black leading-none">
              {countryFlag.split(' ')[0]}
            </div>
          </div>
          <div className="relative">
            <div className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">Country</div>
            <h1 className="text-6xl font-bold tracking-tight">{countryName}</h1>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Loading country data...</p>
          </div>
        )}

        {/* Modern Info Grid */}
        {currencyData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Currency Card - Clickable */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowCurrencyConverter(true)}
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Currency</h3>
                  <button className="text-blue-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    <ArrowRightLeft className="w-3 h-3" />
                    Click to convert
                  </button>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-900">{currencyData.currency}</p>
                <p className="text-sm text-slate-600">H1: 48px</p>
                <p className="text-sm text-slate-600">H1: 32px</p>
              </div>
            </motion.div>

            {/* SF Pro Typography Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-8 shadow-md"
            >
              <h3 className="text-base font-bold text-slate-900 mb-3">SF Pro</h3>
              <button className="text-blue-600 text-sm mb-6 hover:underline">
                Click to convert
              </button>
              <div className="space-y-2">
                <p className="text-sm text-slate-700">H1: 32px</p>
                <p className="text-sm text-slate-700">body 16px</p>
              </div>
            </motion.div>

            {/* Compare Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-md"
            >
              <h3 className="text-base font-bold text-slate-900 mb-6">Compare with another country</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">Quick Stats</span>
                  <span className="text-slate-700">Deep</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">GDP Rank</span>
                  <span className="text-slate-700">HDI</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">#1F2937</div>
              </div>
            </motion.div>

            {/* Capital Card with Gradient */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 shadow-md text-white relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6 relative z-10">
                <h3 className="text-base font-bold">Capital</h3>
                <button className="text-white/70 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <p className="text-3xl font-bold mb-8 relative z-10">{currencyData.capital}</p>
              <div className="h-24 relative">
                <svg className="w-full h-full" viewBox="0 0 200 80">
                  <path d="M 0 60 Q 50 40, 100 50 T 200 30" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
                  <circle cx="100" cy="50" r="5" fill="white" opacity="0.8" />
                </svg>
              </div>
              <div className="absolute top-0 right-0 text-xs text-white/50 p-4">#BB2F6</div>
            </motion.div>

            {/* Timezone Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-200 rounded-2xl shadow-md overflow-hidden relative"
            >
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" 
                  alt="Timezone"
                  className="w-full h-full object-cover opacity-70"
                />
              </div>
              <div className="relative z-10 p-8">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900">Timezone</h3>
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-slate-700 mb-6">more info ›</p>
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 mt-8">
                  <div className="flex items-end justify-between gap-2 h-20">
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '30%'}}></div>
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '50%'}}></div>
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '70%'}}></div>
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '40%'}}></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Population Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl p-8 shadow-md"
            >
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-base font-bold text-slate-900">Population</h3>
                <span className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer">more info ›</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-6">{currencyData.population}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{width: '75%'}} />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">-15%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{width: '60%'}} />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">-5%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{width: '85%'}} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Language Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-600 rounded-2xl shadow-md overflow-hidden relative"
            >
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=400&h=300&fit=crop" 
                  alt="Language"
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="relative z-10 p-8">
                <div className="flex items-start justify-between mb-12">
                  <h3 className="text-base font-bold text-white">Language</h3>
                  <button className="text-white/70 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-32 h-32 rounded-full border-4 border-white/40 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <Clock className="w-16 h-16 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white text-center">{currencyData.language}</p>
              </div>
            </motion.div>

            {/* Fun Fact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 shadow-md text-white relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6 relative z-10">
                <h3 className="text-base font-bold">Fun Fact</h3>
                <button className="text-white/70 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center my-8 relative z-10">
                <div className="text-7xl">{countryFlag}</div>
              </div>
              <p className="text-sm text-white/95 relative z-10 leading-relaxed">{currencyData.funFact}</p>
            </motion.div>
          </div>
        )}

        {/* Currency Converter Modal */}
        {showCurrencyConverter && exchangeRates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Premium Header */}
              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <ArrowRightLeft className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">Currency Exchange</h2>
                        <p className="text-white/80 text-sm mt-1">Real-time conversion rates</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCurrencyConverter(false)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-all hover:rotate-90 duration-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Premium Converter Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                  {/* From Currency - Large */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">You Send</label>
                    <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-400 transition-all group">
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => {
                          setFromAmount(e.target.value);
                          if (selectedCurrency) {
                            setToAmount((e.target.value * parseFloat(selectedCurrency.rate)).toFixed(2));
                          }
                        }}
                        className="w-full bg-transparent text-4xl font-black text-slate-900 outline-none mb-4"
                        placeholder="0.00"
                      />
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                        <span className="text-4xl">{countryFlag}</span>
                        <div>
                          <div className="text-lg font-bold text-slate-900">{exchangeRates.baseCurrency}</div>
                          <div className="text-xs text-slate-500">{countryName}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="lg:col-span-1 flex items-center justify-center">
                    <button className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl hover:scale-110 transition-transform shadow-lg hover:shadow-xl">
                      <ArrowRightLeft className="w-6 h-6" />
                    </button>
                  </div>

                  {/* To Currency - Large */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">You Receive</label>
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
                      <div className="text-4xl font-black text-slate-900 mb-4">
                        {selectedCurrency ? toAmount : "0.00"}
                      </div>
                      {selectedCurrency ? (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                          <span className="text-4xl">{selectedCurrency.flag}</span>
                          <div>
                            <div className="text-lg font-bold text-slate-900">{selectedCurrency.code}</div>
                            <div className="text-xs text-slate-500">{selectedCurrency.country}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white/50 rounded-xl border-2 border-dashed border-slate-300 text-center">
                          <p className="text-sm text-slate-500">Select a currency below</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exchange Rate Info */}
                {selectedCurrency && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Exchange Rate</p>
                        <p className="text-2xl font-bold text-slate-900">
                          1 {exchangeRates.baseCurrency} = {selectedCurrency.rate} {selectedCurrency.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">24h Change</p>
                        <div className={`text-xl font-bold ${
                          selectedCurrency.change.startsWith('+') ? 'text-green-600' :
                          selectedCurrency.change.startsWith('-') ? 'text-red-600' :
                          'text-slate-600'
                        }`}>
                          {selectedCurrency.change}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Currency Selection - Cards */}
                <div className="space-y-6">
                  {Object.entries(exchangeRates.regions).map(([region, currencies], idx) => (
                    <motion.div
                      key={region}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {region}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currencies.map((currency, currIdx) => (
                          <motion.button
                            key={currIdx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedCurrency(currency);
                              setToAmount((fromAmount * parseFloat(currency.rate)).toFixed(2));
                            }}
                            className={`relative bg-white rounded-xl p-4 border-2 transition-all text-left shadow-sm hover:shadow-lg ${
                              selectedCurrency?.code === currency.code
                                ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            {selectedCurrency?.code === currency.code && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">{currency.flag}</span>
                              <div className="flex-1">
                                <div className="font-bold text-slate-900">{currency.code}</div>
                                <div className="text-xs text-slate-500">{currency.country}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-bold text-slate-700">{currency.rate}</div>
                              <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                                currency.change.startsWith('+') ? 'bg-green-100 text-green-700' :
                                currency.change.startsWith('-') ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {currency.change}%
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}


      </div>
    </div>
  );
}