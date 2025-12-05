import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, DollarSign, Clock, MapPin, Globe, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function CountryDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const countryName = searchParams.get("country");
  const countryFlag = searchParams.get("flag");
  const [currencyData, setCurrencyData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countryName) {
      fetchCurrencyData();
    }
  }, [countryName]);

  const fetchCurrencyData = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `For ${countryName}, provide the following information in JSON format:
        {
          "currency": "currency name and code",
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
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-slate-300 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-slate-900">Currency</h3>
              </div>
              <p className="text-slate-700 text-lg">{currencyData.currency}</p>
              <p className="text-sm text-slate-500 mt-2">Exchange Rate: {currencyData.exchangeRate}</p>
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
      </div>
    </div>
  );
}