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
      {/* Modern Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="relative max-w-6xl mx-auto px-8 py-8">
          <button
            onClick={() => navigate(createPageUrl("Earth"))}
            className="mb-6 text-white/80 hover:text-white transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Earth</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="text-8xl">{countryFlag}</div>
              <div>
                <div className="text-sm font-medium text-white/70 mb-1">Full Name</div>
                <h1 className="text-5xl font-bold mb-2">{countryName}</h1>
                <p className="text-xl text-white/80">Country Information Hub</p>
              </div>
            </div>
            
            <Button className="bg-white text-blue-600 hover:bg-white/90 gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Country Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Featured Country Card with Flag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="text-[200px] absolute right-0 top-1/2 -translate-y-1/2">{countryFlag}</div>
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">Country</h2>
            <p className="text-4xl font-black">{countryName}</p>
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
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer group col-span-1 md:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Currency</h3>
                  <p className="text-blue-600 text-sm flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                    <ArrowRightLeft className="w-3 h-3" />
                    Click to convert
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-800">{currencyData.currency}</p>
                <p className="text-sm text-slate-500">H1: 48px</p>
                <p className="text-sm text-slate-500">H1: 32px</p>
              </div>
            </motion.div>

            {/* SF Pro Typography Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">SF Pro</h3>
              <p className="text-blue-600 text-sm mb-4">Click to convert</p>
              <div className="space-y-1 text-sm text-slate-600">
                <p>H1: 32px</p>
                <p>body 16px</p>
              </div>
            </motion.div>

            {/* Compare Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">Compare with another country</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Quick Stats</span>
                  <span className="text-slate-600">Deep</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">GDP Rank</span>
                  <span className="text-slate-600">HDI</span>
                </div>
                <div className="text-sm text-slate-600">#1F2937</div>
              </div>
            </motion.div>

            {/* Capital Card with Gradient */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4 relative z-10">
                <h3 className="text-lg font-bold">Capital</h3>
                <button className="text-white/80 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <p className="text-2xl font-bold mb-4 relative z-10">{currencyData.capital}</p>
              <div className="h-20 relative">
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  <path d="M 0 50 Q 50 30, 100 40 T 200 20" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />
                  <circle cx="100" cy="40" r="4" fill="white" />
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 text-6xl opacity-10">{countryFlag}</div>
            </motion.div>

            {/* Timezone Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden relative"
            >
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" 
                  alt="Timezone"
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Timezone</h3>
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-slate-700 mb-4">more info ›</p>
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 mt-8">
                  <BarChart3 className="w-full h-16 text-blue-500" />
                </div>
              </div>
            </motion.div>

            {/* Population Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Population</h3>
                <span className="text-sm text-slate-500">more info ›</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-4">{currencyData.population}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{width: '75%'}} />
                  </div>
                  <span className="text-xs text-slate-500">-15%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{width: '60%'}} />
                  </div>
                  <span className="text-xs text-slate-500">-5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden">
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
              className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-lg overflow-hidden relative"
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
                  <h3 className="text-lg font-bold text-white">Language</h3>
                  <button className="text-white/80 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                    <Clock className="w-16 h-16 text-white" />
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
              className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start justify-between mb-4 relative z-10">
                <h3 className="text-lg font-bold">Fun Fact</h3>
                <button className="text-white/80 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center my-6 relative z-10">
                <div className="text-6xl">{countryFlag}</div>
              </div>
              <p className="text-sm text-white/90 relative z-10">{currencyData.funFact}</p>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16" />
            </motion.div>
          </div>
        )}

        {/* Currency Converter Modal */}
        {showCurrencyConverter && exchangeRates && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">Currency Converter</h2>
                  <button
                    onClick={() => setShowCurrencyConverter(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-blue-100">Convert {exchangeRates.baseCurrency} to any currency</p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Main Converter */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* From Currency */}
                    <div>
                      <label className="text-sm font-semibold text-slate-600 mb-2 block">From</label>
                      <div className="bg-slate-50 rounded-lg p-4 border-2 border-blue-200">
                        <input
                          type="number"
                          value={fromAmount}
                          onChange={(e) => {
                            setFromAmount(e.target.value);
                            if (selectedCurrency) {
                              setToAmount((e.target.value * parseFloat(selectedCurrency.rate)).toFixed(2));
                            }
                          }}
                          className="w-full bg-transparent text-3xl font-bold text-slate-900 outline-none"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-2xl">{countryFlag}</span>
                          <span className="text-lg font-semibold text-slate-700">{exchangeRates.baseCurrency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex items-center justify-center">
                      <ArrowRightLeft className="w-8 h-8 text-blue-600" />
                    </div>

                    {/* To Currency */}
                    <div>
                      <label className="text-sm font-semibold text-slate-600 mb-2 block">To</label>
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-purple-200">
                        <div className="text-3xl font-bold text-slate-900">
                          {selectedCurrency ? toAmount : "Select currency"}
                        </div>
                        {selectedCurrency && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-2xl">{selectedCurrency.flag}</span>
                            <span className="text-lg font-semibold text-slate-700">{selectedCurrency.code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedCurrency && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-slate-600">
                        1 {exchangeRates.baseCurrency} = {selectedCurrency.rate} {selectedCurrency.code}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Mid-market exchange rate</p>
                    </div>
                  )}
                </div>

                {/* Currency Grid by Region */}
                <div className="space-y-6">
                  {Object.entries(exchangeRates.regions).map(([region, currencies]) => (
                    <div key={region}>
                      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        {region}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currencies.map((currency, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedCurrency(currency);
                              setToAmount((fromAmount * parseFloat(currency.rate)).toFixed(2));
                            }}
                            className={`bg-white rounded-lg p-4 border-2 transition-all text-left hover:shadow-md ${
                              selectedCurrency?.code === currency.code
                                ? "border-blue-500 shadow-lg"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{currency.flag}</span>
                                <div>
                                  <div className="font-bold text-slate-900">{currency.code}</div>
                                  <div className="text-sm text-slate-600">{currency.country}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">{currency.rate}</div>
                                <div className={`text-xs font-semibold ${
                                  currency.change.startsWith('+') ? 'text-green-600' :
                                  currency.change.startsWith('-') ? 'text-red-600' :
                                  'text-slate-500'
                                }`}>
                                  {currency.change}%
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}


      </div>
    </div>
  );
}