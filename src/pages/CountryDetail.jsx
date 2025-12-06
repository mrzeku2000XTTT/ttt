import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, DollarSign, Clock, MapPin, Globe, TrendingUp, Info, ArrowRightLeft, X } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

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
    <div className="fixed inset-0 bg-white overflow-y-auto">
      {/* Standalone Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4">
        <button
          onClick={() => navigate(createPageUrl("Earth"))}
          className="text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Country Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Country Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-8xl mb-6">{countryFlag}</div>
          <h1 className="text-6xl font-bold text-slate-900 mb-4">
            {countryName}
          </h1>
          <p className="text-xl text-slate-600">Country Information Hub</p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Loading country data...</p>
          </div>
        )}

        {/* Country Information Cards */}
        {currencyData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowCurrencyConverter(true)}
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-300 shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-slate-900">Currency</h3>
              </div>
              <p className="text-slate-700 text-lg">{currencyData.currency}</p>
              <p className="text-sm text-slate-500 mt-2">Exchange Rate: {currencyData.exchangeRate}</p>
              <div className="mt-3 text-sm text-blue-600 flex items-center gap-1">
                <ArrowRightLeft className="w-4 h-4" />
                Click to convert
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-300 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-slate-900">Capital</h3>
              </div>
              <p className="text-slate-700 text-lg">{currencyData.capital}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-300 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Timezone</h3>
              </div>
              <p className="text-slate-700 text-lg">{currencyData.timezone}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-300 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-slate-900">Population</h3>
              </div>
              <p className="text-slate-700 text-lg">{currencyData.population}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-300 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-cyan-600" />
                <h3 className="text-xl font-bold text-slate-900">Language</h3>
              </div>
              <p className="text-slate-700 text-lg">{currencyData.language}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-300 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-bold text-slate-900">Fun Fact</h3>
              </div>
              <p className="text-slate-700">{currencyData.funFact}</p>
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