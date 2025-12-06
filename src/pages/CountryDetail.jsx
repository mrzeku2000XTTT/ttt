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
  const [fromCurrency, setFromCurrency] = useState(null);
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [fromSearchQuery, setFromSearchQuery] = useState("");
  const [toSearchQuery, setToSearchQuery] = useState("");
  const [capitalImage, setCapitalImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRateUpdate, setLastRateUpdate] = useState(Date.now());

  useEffect(() => {
    if (countryName) {
      loadCountryDataAndImage();
    }
  }, [countryName]);

  useEffect(() => {
    if (currencyData?.currencyCode) {
      fetchExchangeRates();
    }
  }, [currencyData]);

  // Live UTC clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh rates every hour
  useEffect(() => {
    const interval = setInterval(() => {
      if (currencyData?.currencyCode) {
        fetchExchangeRates();
        setLastRateUpdate(Date.now());
      }
    }, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, [currencyData]);



  const loadCountryDataAndImage = async () => {
    setLoading(true);
    setLoadingImage(true);
    try {
      // Fetch country data
      const dataPromise = base44.integrations.Core.InvokeLLM({
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

      const data = await dataPromise;
      setCurrencyData(data);

      // Load capital image in parallel
      if (data?.capital) {
        const existing = await base44.entities.CountryCapitalImage.filter({
          country_name: countryName,
          capital_name: data.capital
        });

        if (existing.length > 0) {
          setCapitalImage(existing[0].image_url);
        } else {
          const response = await base44.functions.invoke('generateCapitalImage', {
            country_name: countryName,
            capital_name: data.capital
          });
          setCapitalImage(response.data.image_url);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
      setLoadingImage(false);
    }
  };

  const fetchExchangeRates = async () => {
    if (!currencyData?.currencyCode) return;
    
    setLoadingRates(true);
    try {
      const response = await base44.functions.invoke('getCurrencyRates', {
        currencyCode: currencyData.currencyCode
      });

      setExchangeRates(response.data);
      
      // Extract all currencies into a flat array
      const allCurr = [];
      Object.values(response.data.regions).forEach(region => {
        allCurr.push(...region);
      });
      setAllCurrencies(allCurr);
      
      // Set initial from currency
      setFromCurrency({
        flag: countryFlag,
        code: response.data.baseCurrency,
        country: countryName,
        rate: "1.0000"
      });
    } catch (err) {
      console.error("Failed to fetch exchange rates:", err);
      setExchangeRates(null);
    } finally {
      setLoadingRates(false);
    }
  };



  const handleSwapCurrencies = () => {
    if (selectedCurrency && fromCurrency) {
      // Swap currencies
      const tempFrom = fromCurrency;
      const tempTo = selectedCurrency;
      
      setFromCurrency(tempTo);
      setSelectedCurrency(tempFrom);
      
      // Recalculate with swapped rates
      const newRate = parseFloat(tempFrom.rate) / parseFloat(tempTo.rate);
      const newToAmount = (fromAmount * newRate).toFixed(2);
      setToAmount(newToAmount);
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

        {/* Modern Info Grid - Glassmorphic with Compact Sizes */}
        {currencyData && !loading && (
          <div className="grid grid-cols-12 gap-3">
            {/* Currency Card - Clickable - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCurrencyConverter(true);
              }}
              className="col-span-6 md:col-span-4 lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-xl p-3 shadow-md hover:shadow-xl hover:scale-105 transition-all cursor-pointer group border border-white/40"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900">Currency</h3>
                <DollarSign className="w-5 h-5 text-green-500 opacity-70" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">{currencyData.currency}</p>
              <div className="text-blue-600 text-[10px] flex items-center gap-1 group-hover:gap-2 transition-all">
                <ArrowRightLeft className="w-2 h-2" />
                Click to convert
              </div>
            </motion.div>

            {/* Capital Card with AI Photo - Clickable */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="col-span-6 md:col-span-4 lg:col-span-3 bg-white/50 backdrop-blur-xl rounded-xl shadow-md overflow-hidden relative border border-white/40 cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="absolute inset-0">
                {!capitalImage ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full" />
                          </div>
                        ) : (
                  <img 
                    src={capitalImage || `https://source.unsplash.com/400x300/?${encodeURIComponent(currencyData.capital)},city,landmark`}
                    alt={currencyData.capital}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="relative z-10 p-3 h-full flex flex-col justify-end">
                <h3 className="text-xs font-bold text-white/90 mb-1">Capital {!loadingImage && capitalImage && <span className="text-[8px] bg-purple-500/80 px-1 py-0.5 rounded ml-1">AI</span>}</h3>
                <p className="text-sm font-bold text-white">{currencyData.capital}</p>
              </div>
            </motion.div>

            {/* Timezone Card - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-6 md:col-span-4 lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-xl p-3 shadow-md border border-white/40"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900">Timezone</h3>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">{currencyData.timezone}</p>
            </motion.div>

            {/* Population Card - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="col-span-6 md:col-span-4 lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-xl p-3 shadow-md border border-white/40"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900">Population</h3>
              </div>
              <p className="text-sm font-bold text-slate-900">{currencyData.population}</p>
            </motion.div>

            {/* Language Card - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-6 md:col-span-4 lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-xl p-3 shadow-md border border-white/40"
            >
              <h3 className="text-xs font-bold text-slate-900 mb-2">Language</h3>
              <p className="text-sm font-bold text-slate-900">{currencyData.language}</p>
            </motion.div>

            {/* Fun Fact Card - Wide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="col-span-12 md:col-span-8 lg:col-span-6 bg-gradient-to-br from-purple-500/80 to-indigo-600/80 backdrop-blur-xl rounded-xl p-4 shadow-md text-white relative overflow-hidden border border-white/20"
            >
              <h3 className="text-xs font-bold mb-3">Fun Fact</h3>
              <p className="text-xs text-white/95 leading-relaxed">{currencyData.funFact}</p>
            </motion.div>
            </div>
            )}

        {/* Currency Converter Modal - Sunset Theme */}
        {showCurrencyConverter && (
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
                      <p className="text-white/80 text-xs mt-0.5">
                        Real-time rates • UTC {currentTime.toISOString().split('T')[1].split('.')[0]}
                      </p>
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
                {loadingRates ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-4" />
                    <p className="text-slate-700">Loading exchange rates...</p>
                  </div>
                ) : !exchangeRates ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">Failed to load exchange rates</p>
                    <button
                      onClick={fetchExchangeRates}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>

                {/* Compact Converter Interface */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
                  {/* You Send */}
                  <div className="col-span-1 md:col-span-3">
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">YOU SEND</label>
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-lg">
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFromAmount(value);
                          if (selectedCurrency && fromCurrency) {
                            const rate = parseFloat(selectedCurrency.rate) / parseFloat(fromCurrency.rate);
                            setToAmount((value * rate).toFixed(2));
                          }
                        }}
                        className="w-full bg-transparent text-3xl font-bold text-slate-900 outline-none mb-3"
                        placeholder="1"
                      />
                      {fromCurrency && (
                        <div className="relative">
                          <input
                            type="text"
                            value={fromSearchQuery}
                            onChange={(e) => setFromSearchQuery(e.target.value)}
                            onFocus={() => setFromSearchQuery('')}
                            placeholder="Search currency..."
                            className="w-full bg-white/80 backdrop-blur-sm rounded-xl p-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
                          />
                          {fromSearchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200 shadow-2xl max-h-64 overflow-y-auto z-50">
                              {allCurrencies
                                .filter(curr => {
                                  const searchLower = fromSearchQuery.toLowerCase();
                                  return (
                                    curr.country.toLowerCase().includes(searchLower) ||
                                    curr.code.toLowerCase().includes(searchLower)
                                  );
                                })
                                .map((curr) => (
                                  <button
                                    key={curr.code}
                                    onClick={() => {
                                      setFromCurrency(curr);
                                      setFromSearchQuery('');
                                      if (selectedCurrency) {
                                        const rate = parseFloat(selectedCurrency.rate) / parseFloat(curr.rate);
                                        setToAmount((fromAmount * rate).toFixed(2));
                                      }
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center gap-2"
                                  >
                                    <span className="text-xl">{curr.flag}</span>
                                    <div className="flex-1">
                                      <div className="font-bold text-sm text-slate-900">{curr.code}</div>
                                      <div className="text-xs text-slate-600">{curr.country}</div>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          )}
                          {!fromSearchQuery && (
                            <div className="mt-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{fromCurrency.flag}</span>
                                <div className="flex-1">
                                  <div className="font-bold text-sm text-slate-900">{fromCurrency.code}</div>
                                  <div className="text-xs text-slate-600">{fromCurrency.country}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="col-span-1 flex items-center justify-center my-2 md:my-0">
                    <button 
                      onClick={handleSwapCurrencies}
                      disabled={!selectedCurrency}
                      className="p-3 bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                    </button>
                  </div>

                  {/* You Receive */}
                  <div className="col-span-1 md:col-span-3">
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">YOU RECEIVE</label>
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-lg">
                      <input
                        type="number"
                        value={selectedCurrency ? toAmount : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setToAmount(value);
                          if (selectedCurrency && fromCurrency) {
                            const rate = parseFloat(fromCurrency.rate) / parseFloat(selectedCurrency.rate);
                            setFromAmount((value * rate).toFixed(2));
                          }
                        }}
                        className="w-full bg-transparent text-3xl font-bold text-slate-900 outline-none mb-3"
                        placeholder="0.00"
                      />
                      <div className="relative">
                        <input
                          type="text"
                          value={toSearchQuery}
                          onChange={(e) => setToSearchQuery(e.target.value)}
                          onFocus={() => setToSearchQuery('')}
                          placeholder="Search currency..."
                          className="w-full bg-white/80 backdrop-blur-sm rounded-xl p-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
                        />
                        {toSearchQuery && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200 shadow-2xl max-h-64 overflow-y-auto z-50">
                            {allCurrencies
                              .filter(curr => {
                                const searchLower = toSearchQuery.toLowerCase();
                                return (
                                  curr.country.toLowerCase().includes(searchLower) ||
                                  curr.code.toLowerCase().includes(searchLower)
                                );
                              })
                              .map((curr) => (
                                <button
                                  key={curr.code}
                                  onClick={() => {
                                    setSelectedCurrency(curr);
                                    setToSearchQuery('');
                                    if (fromCurrency) {
                                      const rate = parseFloat(curr.rate) / parseFloat(fromCurrency.rate);
                                      setToAmount((fromAmount * rate).toFixed(2));
                                    }
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center gap-2"
                                >
                                  <span className="text-xl">{curr.flag}</span>
                                  <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-900">{curr.code}</div>
                                    <div className="text-xs text-slate-600">{curr.country}</div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                        {selectedCurrency && !toSearchQuery && (
                          <div className="mt-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{selectedCurrency.flag}</span>
                              <div className="flex-1">
                                <div className="font-bold text-sm text-slate-900">{selectedCurrency.code}</div>
                                <div className="text-xs text-slate-600">{selectedCurrency.country}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exchange Rate Info - Glassmorphic */}
                {selectedCurrency && fromCurrency && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-white/60 backdrop-blur-xl rounded-xl border border-white/60 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Exchange Rate</p>
                        <p className="text-lg font-bold text-slate-900">
                          1 {fromCurrency.code} = {(parseFloat(selectedCurrency.rate) / parseFloat(fromCurrency.rate)).toFixed(4)} {selectedCurrency.code}
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

                {/* Quick Select Regions */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Select by Region</h3>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {currencies.map((currency, currIdx) => (
                          <motion.button
                            key={currIdx}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSelectedCurrency(currency);
                              if (fromCurrency) {
                                const rate = parseFloat(currency.rate) / parseFloat(fromCurrency.rate);
                                setToAmount((fromAmount * rate).toFixed(2));
                              }
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
                </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}


      </div>
    </div>
  );
}