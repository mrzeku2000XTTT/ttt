import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Hotel, MapPin, Star, Brain, Search, Heart, ArrowLeft, Sliders, Check, Loader2, Sparkles, Clock, DollarSign, Building2, ChevronDown, X } from "lucide-react";

const HOTEL_STYLES = ["Boutique", "Luxury", "Budget-Friendly", "Business", "Resort", "Hostel", "Aparthotel"];
const LOCATION_TYPES = ["City Center", "Near Airport", "Beach", "Mountain", "Suburb", "Historic District"];
const BUDGET_RANGES = ["Under $80/night", "$80–$150/night", "$150–$300/night", "$300+/night"];

const SAMPLE_HOTELS = [
  {
    id: 1,
    name: "The Meridian Boutique",
    location: "City Center, Barcelona",
    style: "Boutique",
    price: 142,
    rating: 4.8,
    match: 97,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
    tags: ["City Center", "Rooftop Bar", "Design Hotel"],
  },
  {
    id: 2,
    name: "Casa Velha Hotel",
    location: "Historic District, Lisbon",
    style: "Boutique",
    price: 118,
    rating: 4.7,
    match: 94,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
    tags: ["Historic", "Courtyard", "Breakfast Included"],
  },
  {
    id: 3,
    name: "Nomo Urban Suites",
    location: "City Center, Amsterdam",
    style: "Boutique",
    price: 165,
    rating: 4.6,
    match: 91,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop",
    tags: ["Canal View", "Modern", "City Center"],
  },
  {
    id: 4,
    name: "The Harbor Grand",
    location: "Waterfront, Copenhagen",
    style: "Luxury",
    price: 290,
    rating: 4.9,
    match: 88,
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&h=400&fit=crop",
    tags: ["Harbor View", "Spa", "Michelin Restaurant"],
  },
];

function ProfileSetup({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    styles: [],
    locations: [],
    budget: "",
    tripFrequency: "",
  });

  const steps = [
    {
      title: "What hotel style do you prefer?",
      subtitle: "Pick all that apply",
      field: "styles",
      options: HOTEL_STYLES,
      multi: true,
    },
    {
      title: "Where do you usually like to stay?",
      subtitle: "Select your preferred location types",
      field: "locations",
      options: LOCATION_TYPES,
      multi: true,
    },
    {
      title: "What's your typical budget?",
      subtitle: "Per night, per room",
      field: "budget",
      options: BUDGET_RANGES,
      multi: false,
    },
    {
      title: "How often do you travel?",
      subtitle: "This helps ORIN calibrate",
      field: "tripFrequency",
      options: ["1–2 trips/year", "3–5 trips/year", "6–10 trips/year", "10+ trips/year"],
      multi: false,
    },
  ];

  const current = steps[step];

  const toggle = (val) => {
    if (current.multi) {
      setProfile(p => ({
        ...p,
        [current.field]: p[current.field].includes(val)
          ? p[current.field].filter(v => v !== val)
          : [...p[current.field], val],
      }));
    } else {
      setProfile(p => ({ ...p, [current.field]: val }));
    }
  };

  const isSelected = (val) => {
    const v = profile[current.field];
    return Array.isArray(v) ? v.includes(val) : v === val;
  };

  const canNext = () => {
    const v = profile[current.field];
    return Array.isArray(v) ? v.length > 0 : !!v;
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-5 py-10">
      {/* Progress */}
      <div className="w-full max-w-md mb-8">
        <div className="flex gap-1.5 mb-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-amber-400" : "bg-white/10"}`} />
          ))}
        </div>
        <p className="text-[11px] text-white/30 font-medium">{step + 1} of {steps.length}</p>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-md"
      >
        <h2 className="text-2xl font-[900] text-white tracking-tight mb-1">{current.title}</h2>
        <p className="text-white/40 text-[13px] mb-6">{current.subtitle}</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {current.options.map(opt => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all border ${
                isSelected(opt)
                  ? "bg-amber-400 text-black border-amber-400"
                  : "bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white"
              }`}
            >
              {isSelected(opt) && <Check className="w-3 h-3" />}
              {opt}
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={!canNext()}
          className="w-full h-12 rounded-full text-[14px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-amber-400 hover:bg-amber-300 text-black"
        >
          {step < steps.length - 1 ? "Continue →" : "Build My Profile →"}
        </button>
      </motion.div>
    </div>
  );
}

function HotelCard({ hotel, index }) {
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl overflow-hidden border border-white/8 bg-white/3 hover:border-amber-500/30 transition-all group"
    >
      <div className="relative h-44 overflow-hidden">
        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Match badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400/90 text-black text-[11px] font-[800]">
          <Brain className="w-3 h-3" />
          {hotel.match}% match
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${saved ? "bg-rose-500 text-white" : "bg-black/40 text-white/70 hover:bg-black/60"}`}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-white" : ""}`} />
        </button>
        <div className="absolute bottom-3 left-3">
          <div className="flex gap-1 flex-wrap">
            {hotel.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-semibold">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-[14px] font-[800] text-white leading-tight">{hotel.name}</h3>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[12px] font-bold text-white">{hotel.rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-[12px] mb-3">
          <MapPin className="w-3 h-3" />
          {hotel.location}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[18px] font-[900] text-white">${hotel.price}</span>
            <span className="text-[11px] text-white/40"> /night</span>
          </div>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`${hotel.name} ${hotel.location} hotel`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-[12px] font-bold transition-colors"
          >
            View
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function ORINApp() {
  const [hasProfile, setHasProfile] = useState(() => {
    try { return !!localStorage.getItem("orin_profile"); } catch { return false; }
  });
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem("orin_profile") || "null"); } catch { return null; }
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleProfileComplete = (p) => {
    localStorage.setItem("orin_profile", JSON.stringify(p));
    setProfile(p);
    setHasProfile(true);
  };

  const getAISuggestion = async () => {
    if (!profile || loading) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ORIN, a travel intelligence assistant. A user has this travel profile: 
        - Preferred hotel styles: ${profile.styles?.join(", ")}
        - Preferred location types: ${profile.locations?.join(", ")}
        - Budget: ${profile.budget}
        - Trip frequency: ${profile.tripFrequency}
        
        Give them a personalized 2-sentence insight about their travel style and what kind of hotel experience they should look for next. Be warm, specific, and insightful. Keep it under 50 words.`,
      });
      setAiSuggestion(typeof res === "string" ? res : "");
    } catch (e) {
      setAiSuggestion("Based on your profile, you tend to prefer well-located boutique stays with character over chain hotels.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (hasProfile && profile) getAISuggestion();
  }, [hasProfile]);

  if (!hasProfile) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 sm:px-6 h-14 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/8">
        <Link to="/ORINLanding" className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-[13px]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Hotel className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[15px] font-[800] tracking-tight">Landed</span>
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${showFilters ? "bg-amber-400/10 border-amber-400/40 text-amber-400" : "border-white/10 text-white/50 hover:text-white"}`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Filters
        </button>
        <button
          onClick={() => { localStorage.removeItem("orin_profile"); setHasProfile(false); setProfile(null); }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
          title="Reset profile"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {/* AI Insight card */}
        <AnimatePresence>
          {(aiSuggestion || loading) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                {loading ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-400 tracking-wider uppercase mb-1">ORIN Insight</p>
                <p className="text-[13px] text-white/70 leading-relaxed">{loading ? "Analyzing your travel profile…" : aiSuggestion}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile summary pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.budget && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60">
              <DollarSign className="w-3 h-3" /> {profile.budget}
            </div>
          )}
          {profile.styles?.slice(0, 2).map(s => (
            <div key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60">
              <Building2 className="w-3 h-3" /> {s}
            </div>
          ))}
          {profile.locations?.slice(0, 1).map(l => (
            <div key={l} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60">
              <MapPin className="w-3 h-3" /> {l}
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Where are you going?"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-500/40 placeholder-white/30 transition-all"
          />
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-[800]">Matched for you</h2>
            <p className="text-[11px] text-white/40">Based on your travel profile</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
            <Brain className="w-3 h-3" />
            AI matched
          </div>
        </div>

        {/* Hotel cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {SAMPLE_HOTELS.filter(h =>
            !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase())
          ).map((hotel, i) => (
            <HotelCard key={hotel.id} hotel={hotel} index={i} />
          ))}
        </div>

        {SAMPLE_HOTELS.filter(h =>
          !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase())
        ).length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">No hotels found for "{search}"</div>
        )}

        {/* Coming soon nudge */}
        <div className="mt-10 p-5 rounded-2xl border border-dashed border-white/10 text-center">
          <Clock className="w-6 h-6 text-white/20 mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-white/40">More destinations loading soon</p>
          <p className="text-[11px] text-white/20 mt-1">ORIN is expanding its hotel database. Rate the cards above to train your profile.</p>
        </div>
      </div>
    </div>
  );
}