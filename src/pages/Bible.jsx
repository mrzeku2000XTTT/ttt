import React, { useState, useEffect } from "react";
import { Search, BookOpen, ChevronDown, Heart, Share2, MessageCircle, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const books = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
  "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation"
];

export default function BiblePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookList, setShowBookList] = useState(false);
  const [user, setUser] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({
    book: "",
    chapter: "",
    verse: "",
    text: "",
    reflection: ""
  });
  const [likedVerses, setLikedVerses] = useState(new Set());

  useEffect(() => {
    loadUser();
    loadVerses();
    loadLikedVerses();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const loadVerses = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BibleVerse.list("-created_date", 50);
      setVerses(data);
    } catch (err) {
      console.error("Failed to load verses:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLikedVerses = () => {
    const saved = localStorage.getItem("liked_bible_verses");
    if (saved) {
      setLikedVerses(new Set(JSON.parse(saved)));
    }
  };

  const handleShareVerse = async () => {
    if (!shareData.text || !shareData.book) return;

    try {
      let authorName = "Anonymous";
      if (user) {
        if (user.username) {
          authorName = user.username;
        } else if (user.created_wallet_address) {
          try {
            const profile = await base44.entities.AgentZKProfile.filter({
              wallet_address: user.created_wallet_address
            });
            if (profile.length > 0 && profile[0].display_name) {
              authorName = profile[0].display_name;
            }
          } catch (err) {
            console.log("No profile found");
          }
        }
      }

      await base44.entities.BibleVerse.create({
        ...shareData,
        author_name: authorName,
        author_wallet_address: user?.created_wallet_address || "",
        likes: 0
      });

      setShowShareModal(false);
      setShareData({ book: "", chapter: "", verse: "", text: "", reflection: "" });
      loadVerses();
    } catch (err) {
      console.error("Failed to share verse:", err);
      alert("Failed to share verse");
    }
  };

  const handleLike = async (verse) => {
    const newLikedVerses = new Set(likedVerses);
    const isLiked = likedVerses.has(verse.id);

    try {
      if (isLiked) {
        newLikedVerses.delete(verse.id);
        await base44.entities.BibleVerse.update(verse.id, {
          likes: Math.max(0, verse.likes - 1)
        });
      } else {
        newLikedVerses.add(verse.id);
        await base44.entities.BibleVerse.update(verse.id, {
          likes: verse.likes + 1
        });
      }

      setLikedVerses(newLikedVerses);
      localStorage.setItem("liked_bible_verses", JSON.stringify([...newLikedVerses]));
      loadVerses();
    } catch (err) {
      console.error("Failed to like verse:", err);
    }
  };

  const filteredBooks = books.filter(book =>
    book.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-amber-700" />
            <h1 className="text-4xl font-bold text-amber-900">Holy Bible</h1>
          </div>
          <p className="text-amber-700">King James Version</p>
        </motion.div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="pl-10 h-12 bg-white border-amber-200 focus:border-amber-400 text-amber-900"
            />
          </div>
        </div>

        {/* Book Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-amber-900">Select a Book</h2>
            <Button
              onClick={() => setShowBookList(!showBookList)}
              variant="ghost"
              className="text-amber-700 hover:text-amber-900"
            >
              {showBookList ? "Hide" : "Show"} Books
              <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${showBookList ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showBookList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 md:grid-cols-3 gap-2"
            >
              {filteredBooks.map((book) => (
                <Button
                  key={book}
                  onClick={() => {
                    setSelectedBook(book);
                    setShowBookList(false);
                  }}
                  variant={selectedBook === book ? "default" : "outline"}
                  className={`justify-start ${
                    selectedBook === book
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-amber-200 text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  {book}
                </Button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Selected Book Display */}
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-amber-100 p-6"
          >
            <h3 className="text-2xl font-bold text-amber-900 mb-4">{selectedBook}</h3>
            <div className="prose prose-amber max-w-none">
              <p className="text-amber-800 leading-relaxed">
                Select a chapter and verse to read from {selectedBook}.
              </p>
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 italic">
                  "For God so loved the world, that he gave his only begotten Son, 
                  that whosoever believeth in him should not perish, but have everlasting life."
                  <br />
                  <span className="font-semibold">- John 3:16 (KJV)</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Share Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowShareModal(true)}
          className="fixed right-4 bottom-20 w-14 h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-full flex items-center justify-center shadow-lg z-50"
        >
          <Share2 className="w-6 h-6" />
        </motion.button>

        {/* Share Verse Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6"
              >
                <h3 className="text-2xl font-bold text-amber-900 mb-4">Share a Verse</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Book"
                      value={shareData.book}
                      onChange={(e) => setShareData({...shareData, book: e.target.value})}
                      className="border-amber-200"
                    />
                    <Input
                      placeholder="Chapter"
                      type="number"
                      value={shareData.chapter}
                      onChange={(e) => setShareData({...shareData, chapter: e.target.value})}
                      className="border-amber-200"
                    />
                    <Input
                      placeholder="Verse"
                      value={shareData.verse}
                      onChange={(e) => setShareData({...shareData, verse: e.target.value})}
                      className="border-amber-200"
                    />
                  </div>

                  <Textarea
                    placeholder="Verse text..."
                    value={shareData.text}
                    onChange={(e) => setShareData({...shareData, text: e.target.value})}
                    className="border-amber-200 min-h-24"
                  />

                  <Textarea
                    placeholder="Your reflection (optional)..."
                    value={shareData.reflection}
                    onChange={(e) => setShareData({...shareData, reflection: e.target.value})}
                    className="border-amber-200"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleShareVerse}
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      onClick={() => setShowShareModal(false)}
                      variant="outline"
                      className="border-amber-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verse Feed */}
        <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Community Verses
          </h2>

          {loading ? (
            <div className="text-center py-8 text-amber-600">Loading verses...</div>
          ) : verses.length === 0 ? (
            <div className="text-center py-8 text-amber-600">No verses shared yet. Be the first!</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {verses.map((verse) => (
                <motion.div
                  key={verse.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 rounded-lg p-4 border border-amber-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-amber-900">{verse.author_name}</span>
                      <span className="text-amber-600 text-sm ml-2">
                        {verse.book} {verse.chapter}:{verse.verse}
                      </span>
                    </div>
                    <span className="text-xs text-amber-600">
                      {new Date(verse.created_date).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-amber-800 italic mb-2 leading-relaxed">"{verse.text}"</p>

                  {verse.reflection && (
                    <p className="text-amber-700 text-sm mb-3 pl-4 border-l-2 border-amber-300">
                      {verse.reflection}
                    </p>
                  )}

                  <button
                    onClick={() => handleLike(verse)}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${likedVerses.has(verse.id) ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    <span className="text-sm">{verse.likes}</span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Default View */}
        {!selectedBook && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <p className="text-amber-700">Select a book to begin reading</p>
          </div>
        )}
      </div>
    </div>
  );
}