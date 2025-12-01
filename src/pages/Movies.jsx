import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Film, Users, Play, X, Share2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LiveChat from "../components/movies/LiveChat";

export default function MoviesPage() {
  const [user, setUser] = useState(null);
  const [watchParties, setWatchParties] = useState([]);
  const [activeParty, setActiveParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [movieQuery, setMovieQuery] = useState("");
  const [searchingMovie, setSearchingMovie] = useState(false);

  useEffect(() => {
    loadUser();
    loadWatchParties();
    const interval = setInterval(loadWatchParties, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const loadWatchParties = async () => {
    try {
      const parties = await base44.entities.WatchParty.filter({ is_active: true });
      setWatchParties(parties.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    } catch (err) {
      console.error("Failed to load watch parties:", err);
      setLoading(false);
    }
  };

  const searchMovie = async () => {
    if (!movieQuery.trim()) return;
    
    setSearchingMovie(true);
    try {
      const result = await base44.functions.invoke('searchMovie', { query: movieQuery });
      
      if (result.data.embed_url) {
        await createWatchParty(result.data);
        setShowCreateModal(false);
        setMovieQuery("");
      }
    } catch (err) {
      console.error("Movie search failed:", err);
    } finally {
      setSearchingMovie(false);
    }
  };

  const createWatchParty = async (movieData) => {
    try {
      const party = await base44.entities.WatchParty.create({
        title: movieData.title,
        embed_url: movieData.embed_url,
        source: movieData.source,
        host_name: user.username || user.full_name || "Anonymous",
        host_wallet: user.created_wallet_address,
        is_active: true,
        participants: [{
          name: user.username || user.full_name || "Anonymous",
          wallet: user.created_wallet_address,
          joined_at: new Date().toISOString()
        }]
      });
      
      setActiveParty(party);
      await loadWatchParties();
    } catch (err) {
      console.error("Failed to create watch party:", err);
    }
  };

  const joinParty = async (party) => {
    try {
      const updatedParticipants = [
        ...(party.participants || []),
        {
          name: user.username || user.full_name || "Anonymous",
          wallet: user.created_wallet_address,
          joined_at: new Date().toISOString()
        }
      ];

      await base44.entities.WatchParty.update(party.id, {
        participants: updatedParticipants
      });

      setActiveParty({ ...party, participants: updatedParticipants });
    } catch (err) {
      console.error("Failed to join party:", err);
    }
  };

  const leaveParty = async () => {
    if (!activeParty) return;

    try {
      const updatedParticipants = activeParty.participants.filter(
        p => p.wallet !== user.created_wallet_address
      );

      if (updatedParticipants.length === 0) {
        await base44.entities.WatchParty.update(activeParty.id, { is_active: false });
      } else {
        await base44.entities.WatchParty.update(activeParty.id, {
          participants: updatedParticipants
        });
      }

      setActiveParty(null);
      await loadWatchParties();
    } catch (err) {
      console.error("Failed to leave party:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-purple-600 hover:bg-purple-700">
            Login to Watch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black">
      {activeParty ? (
        <div className="fixed inset-0 z-50 bg-black flex" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)' }}>
          {/* Left Side - Video Player (70%) */}
          <div className="flex-[7] flex flex-col">
            {/* Header */}
            <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Film className="w-6 h-6 text-purple-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">{activeParty.title}</h2>
                  <p className="text-gray-400 text-sm">Hosted by {activeParty.host_name}</p>
                </div>
              </div>
              <Button
                onClick={leaveParty}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-500/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Video Player */}
            <div className="flex-1 bg-black">
              <iframe
                src={activeParty.embed_url}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Bottom Info */}
            <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 p-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{activeParty.participants?.length || 0} watching</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeParty.participants?.slice(0, 5).map((p, i) => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full border border-white/20" />
                  ))}
                  {activeParty.participants?.length > 5 && (
                    <span className="text-gray-400 text-xs">+{activeParty.participants.length - 5}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Live Chat (30%) */}
          <div className="flex-[3] bg-zinc-900 border-l border-white/10">
            <LiveChat partyId={activeParty.id} currentUser={user} />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">Watch Parties</h1>
              <p className="text-white/60">Watch movies together with friends</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Party
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : watchParties.length === 0 ? (
            <div className="text-center py-20">
              <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No active watch parties</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchParties.map(party => (
                <motion.div
                  key={party.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{party.title}</h3>
                      <p className="text-white/60 text-sm">Host: {party.host_name}</p>
                      <p className="text-purple-400 text-xs">{party.source}</p>
                    </div>
                    <div className="flex items-center gap-1 text-white/60">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{party.participants?.length || 0}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => joinParty(party)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Join Party
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Start Watch Party</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Search for a movie</label>
                  <Input
                    value={movieQuery}
                    onChange={(e) => setMovieQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchMovie()}
                    placeholder="e.g., Inception, Avengers..."
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <Button
                  onClick={searchMovie}
                  disabled={searchingMovie || !movieQuery.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {searchingMovie ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Party
                    </>
                  )}
                </Button>

                <div className="text-xs text-white/40 space-y-1">
                  <p>💡 Quick commands:</p>
                  <p>• Type "!asian" for Asian dramas</p>
                  <p>• Type "!african" for African movies</p>
                  <p>• Type "!popcorn" for Popcornflix</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}