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
    <div className="min-h-screen relative overflow-y-auto">
      {/* Aesthetic Sunset Background - Light */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-100/40 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-100/30 via-transparent to-transparent" />
      
      {/* Simple Header */}
      <div className="relative bg-white/40 backdrop-blur-md border-b border-white/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(createPageUrl("Earth"))}
            className="text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2 group mb-3"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to Earth</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{countryFlag}</div>
              <h1 className="text-2xl font-bold text-slate-900">{countryName}</h1>
            </div>
            <Button className="bg-blue-600/90 backdrop-blur text-white hover:bg-blue-700 gap-2 shadow-lg">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Country Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-blue-600 rounded-full mx-auto mb-4" />
            <p className="text-slate-700">Loading country data...</p>
          </div>
        )}

        {/* Featured Country Card with Flag - Glassmorphic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 backdrop-blur-xl rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-white/20"
        >
          <div className="absolute inset-0 flex items-center justify-end pr-8 opacity-10">
            <div className="text-[200px] font-black leading-none">
              {countryFlag.split(' ')[0]}
            </div>
          </div>
          <div className="relative">
            <div className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">COUNTRY</div>
            <h1 className="text-5xl font-bold tracking-tight">{countryName}</h1>
          </div>
        </motion.div>

        {/* Modern Info Grid - Glassmorphic with Uneven Sizes */}
        {currencyData && !loading && (
          <div className="grid grid-cols-12 gap-4">
            {/* Currency Card - Clickable - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowCurrencyConverter(true)}
              className="col-span-12 md:col-span-6 lg:col-span-4 bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all cursor-pointer group border border-white/40"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Currency</h3>
                  <button className="text-blue-600 text-xs flex items-center gap-1 hover:gap-2 transition-all">
                    <ArrowRightLeft className="w-3 h-3" />
                    Click to convert
                  </button>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-70" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-slate-900">{currencyData.currency}</p>
                <p className="text-xs text-slate-600">H1: 48px</p>
                <p className="text-xs text-slate-600">H1: 32px</p>
              </div>
            </motion.div>

            {/* SF Pro Typography Info - Smaller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="col-span-12 md:col-span-6 lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/40"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-2">SF Pro</h3>
              <button className="text-blue-600 text-xs mb-4 hover:underline">
                Click to convert
              </button>
              <div className="space-y-1">
                <p className="text-xs text-slate-700">H1: 32px</p>
                <p className="text-xs text-slate-700">body 16px</p>
              </div>
            </motion.div>

            {/* Compare Section - Larger */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-12 md:col-span-12 lg:col-span-5 bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/40"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-4">Compare with another country</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">Quick Stats</span>
                  <span className="text-slate-700">Deep</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">GDP Rank</span>
                  <span className="text-slate-700">HDI</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">#1F2937</div>
              </div>
            </motion.div>

            {/* Capital Card with Gradient - Medium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="col-span-12 md:col-span-6 lg:col-span-5 bg-gradient-to-br from-purple-500/80 to-indigo-600/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg text-white relative overflow-hidden border border-white/20"
            >
              <div className="flex items-start justify-between mb-5 relative z-10">
                <h3 className="text-sm font-bold">Capital</h3>
                <button className="text-white/60 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <p className="text-2xl font-bold mb-6 relative z-10">{currencyData.capital}</p>
              <div className="h-16 relative">
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  <path d="M 0 50 Q 50 30, 100 40 T 200 20" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
                  <circle cx="100" cy="40" r="4" fill="white" opacity="0.8" />
                </svg>
              </div>
              <div className="absolute top-0 right-0 text-xs text-white/40 p-3">#BB2F6</div>
            </motion.div>

            {/* Timezone Card - Tall */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-12 md:col-span-6 lg:col-span-4 bg-white/50 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden relative border border-white/40"
            >
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" 
                  alt="Timezone"
                  className="w-full h-full object-cover opacity-40"
                />
              </div>
              <div className="relative z-10 p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900">Timezone</h3>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-slate-700 mb-4">more info ›</p>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 mt-6">
                  <div className="flex items-end justify-between gap-1.5 h-16">
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '30%'}}></div>
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '50%'}}></div>
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '70%'}}></div>
                    <div className="bg-blue-500 rounded-t w-full" style={{height: '40%'}}></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Population Card - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="col-span-12 md:col-span-6 lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/40"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Population</h3>
                <span className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">more info ›</span>
              </div>
              <p className="text-xl font-bold text-slate-900 mb-4">{currencyData.population}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{width: '75%'}} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">-15%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{width: '60%'}} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">-5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{width: '85%'}} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Language Card - Wide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-12 md:col-span-12 lg:col-span-5 bg-slate-600/70 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden relative border border-white/20"
            >
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=400&h=300&fit=crop" 
                  alt="Language"
                  className="w-full h-full object-cover opacity-40"
                />
              </div>
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-8">
                  <h3 className="text-sm font-bold text-white">Language</h3>
                  <button className="text-white/60 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <Clock className="w-12 h-12 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold text-white text-center">{currencyData.language}</p>
              </div>
            </motion.div>

            {/* Fun Fact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="col-span-12 md:col-span-6 lg:col-span-4 bg-gradient-to-br from-purple-500/80 to-indigo-600/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg text-white relative overflow-hidden border border-white/20"
            >
              <div className="flex items-start justify-between mb-4 relative z-10">
                <h3 className="text-sm font-bold">Fun Fact</h3>
                <button className="text-white/60 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center my-6 relative z-10">
                <div className="text-6xl">{countryFlag}</div>
              </div>
              <p className="text-xs text-white/95 relative z-10 leading-relaxed">{currencyData.funFact}</p>
            </motion.div>
          </div>
        )}

        {/* Currency Converter Modal - Sunset Theme */}
        {showCurrencyConverter && exchangeRates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-50/95 via-pink-50/95 to-purple-50/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/40"
            >
              {/* Sunset Header */}
              <div className="relative bg-gradient-to-r from-orange-400/90 via-pink-500/90 to-purple-600/90 backdrop-blur-xl p-6 text-white overflow-hidden border-b border-white/20">
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Currency Exchange</h2>
                      <p className="text-white/80 text-xs mt-0.5">Real-time rates • UTC {new Date().toISOString().split('T')[1].split('.')[0]}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCurrencyConverter(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Compact Converter Interface */}
                <div className="grid grid-cols-7 gap-3 mb-6">
                  {/* You Send */}
                  <div className="col-span-3">
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">YOU SEND</label>
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-lg">
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => {
                          setFromAmount(e.target.value);
                          if (selectedCurrency) {
                            setToAmount((e.target.value * parseFloat(selectedCurrency.rate)).toFixed(2));
                          }
                        }}
                        className="w-full bg-transparent text-3xl font-bold text-slate-900 outline-none mb-3"
                        placeholder="1"
                      />
                      <select 
                        className="w-full bg-white/80 backdrop-blur-sm rounded-xl p-2 text-sm font-semibold text-slate-900 border border-slate-200 cursor-pointer"
                        value={exchangeRates.baseCurrency}
                      >
                        <option>{countryFlag} {exchangeRates.baseCurrency} - {countryName}</option>
                      </select>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button 
                      onClick={() => {
                        if (selectedCurrency) {
                          // Swap logic here
                          const temp = fromAmount;
                          setFromAmount(toAmount);
                          setToAmount(temp);
                        }
                      }}
                      className="p-3 bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                    </button>
                  </div>

                  {/* You Receive */}
                  <div className="col-span-3">
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">YOU RECEIVE</label>
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-lg">
                      <div className="text-3xl font-bold text-slate-900 mb-3">
                        {selectedCurrency ? toAmount : "0.00"}
                      </div>
                      {selectedCurrency ? (
                        <select className="w-full bg-white/80 backdrop-blur-sm rounded-xl p-2 text-sm font-semibold text-slate-900 border border-slate-200 cursor-pointer">
                          <option>{selectedCurrency.flag} {selectedCurrency.code} - {selectedCurrency.country}</option>
                        </select>
                      ) : (
                        <div className="text-xs text-slate-500 text-center py-2">Select currency below</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exchange Rate Info - Glassmorphic */}
                {selectedCurrency && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-white/60 backdrop-blur-xl rounded-xl border border-white/60 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Exchange Rate</p>
                        <p className="text-lg font-bold text-slate-900">
                          1 {exchangeRates.baseCurrency} = {selectedCurrency.rate} {selectedCurrency.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">24h Change</p>
                        <div className={`text-base font-bold ${
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

                {/* Currency Selection - Compact Glossy Cards */}
                <div className="space-y-4">
                  {Object.entries(exchangeRates.regions).map(([region, currencies], idx) => (
                    <motion.div
                      key={region}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        {region}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {currencies.map((currency, currIdx) => (
                          <motion.button
                            key={currIdx}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSelectedCurrency(currency);
                              setToAmount((fromAmount * parseFloat(currency.rate)).toFixed(2));
                            }}
                            className={`relative bg-white/70 backdrop-blur-xl rounded-xl p-3 border transition-all text-left shadow-md hover:shadow-xl ${
                              selectedCurrency?.code === currency.code
                                ? "border-orange-400 bg-orange-50/80 shadow-xl ring-2 ring-orange-200"
                                : "border-white/60 hover:border-orange-300"
                            }`}
                          >
                            {selectedCurrency?.code === currency.code && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{currency.flag}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-slate-900 truncate">{currency.code}</div>
                                <div className="text-xs text-slate-600 truncate">{currency.country}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-slate-700">{currency.rate}</div>
                              <div className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
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