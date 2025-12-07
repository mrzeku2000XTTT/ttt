import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, X, Crown } from "lucide-react";

export default function TetrisLobby({ mode, user, ranking, onMatchStart, onCancel }) {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [searching, setSearching] = useState(true);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    findMatch();
    const interval = setInterval(checkMatch, 2000);
    return () => clearInterval(interval);
  }, []);

  const findMatch = async () => {
    try {
      // Look for existing waiting match
      const existingMatches = await base44.entities.TetrisMatch.filter({
        mode: mode.id,
        status: "waiting"
      });

      if (existingMatches.length > 0) {
        const match = existingMatches[0];
        if (match.players.length < mode.maxPlayers) {
          // Join existing match
          const updatedPlayers = [
            ...match.players,
            {
              user_email: user.email,
              username: user.username || user.email.split('@')[0],
              rank: ranking?.rank || 1,
              score: 0,
              lines_cleared: 0,
              finished: false
            }
          ];

          await base44.entities.TetrisMatch.update(match.id, {
            players: updatedPlayers,
            status: updatedPlayers.length === mode.maxPlayers ? "in_progress" : "waiting"
          });

          setCurrentMatch(match);
          setPlayers(updatedPlayers);

          if (updatedPlayers.length === mode.maxPlayers) {
            onMatchStart(match);
          }
        } else {
          createNewMatch();
        }
      } else {
        createNewMatch();
      }
    } catch (error) {
      console.error("Failed to find match:", error);
    }
  };

  const createNewMatch = async () => {
    const match = await base44.entities.TetrisMatch.create({
      mode: mode.id,
      status: "waiting",
      players: [
        {
          user_email: user.email,
          username: user.username || user.email.split('@')[0],
          rank: ranking?.rank || 1,
          score: 0,
          lines_cleared: 0,
          finished: false
        }
      ],
      max_players: mode.maxPlayers
    });

    setCurrentMatch(match);
    setPlayers(match.players);
  };

  const checkMatch = async () => {
    if (!currentMatch) return;

    try {
      const updatedMatch = await base44.entities.TetrisMatch.filter({
        id: currentMatch.id
      });

      if (updatedMatch.length > 0) {
        const match = updatedMatch[0];
        setPlayers(match.players);

        if (match.status === "in_progress") {
          setSearching(false);
          onMatchStart(match);
        }
      }
    } catch (error) {
      console.error("Failed to check match:", error);
    }
  };

  const handleCancel = async () => {
    if (currentMatch && players.length === 1) {
      await base44.entities.TetrisMatch.delete(currentMatch.id);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black border border-cyan-500/30 rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">{mode.name}</h2>
            <p className="text-white/60 text-sm">{mode.description}</p>
          </div>
          <Button onClick={handleCancel} variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Card className="bg-black/40 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <p className="text-white font-semibold">Searching for players...</p>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-green-400" />
                  <p className="text-white font-semibold">Match found!</p>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge className="bg-cyan-500/20 text-cyan-400">
                {players.length} / {mode.maxPlayers} Players
              </Badge>
            </div>

            <div className="space-y-2">
              {players.map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${player.user_email === user.email ? 'text-yellow-400' : 'text-white/40'}`} />
                    <span className="text-white font-semibold">{player.username}</span>
                  </div>
                  <Badge className="bg-white/10 text-white/60">
                    Rank {player.rank}
                  </Badge>
                </motion.div>
              ))}

              {[...Array(mode.maxPlayers - players.length)].map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center justify-center p-3 bg-white/5 rounded-lg border-2 border-dashed border-white/20"
                >
                  <span className="text-white/40 text-sm">Waiting for player...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleCancel} variant="outline" className="w-full border-white/20 text-white">
          Cancel
        </Button>
      </motion.div>
    </div>
  );
}