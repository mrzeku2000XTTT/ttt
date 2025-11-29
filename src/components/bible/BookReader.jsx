import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function BookReader() {
  const [currentBook, setCurrentBook] = useState("Psalms");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [leftPage, setLeftPage] = useState(null);
  const [rightPage, setRightPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState("right");

  useEffect(() => {
    loadPages(currentBook, currentChapter);
  }, [currentBook, currentChapter]);

  const loadPages = async (book, chapter) => {
    setLoading(true);
    try {
      // Load current chapter for left page
      const leftChapterData = await base44.integrations.Core.InvokeLLM({
        prompt: `Fetch ${book} chapter ${chapter} from KJV Bible. Return JSON with book, chapter, and verses array.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            book: { type: "string" },
            chapter: { type: "number" },
            verses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "number" },
                  text: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Load next chapter for right page
      const rightChapterData = await base44.integrations.Core.InvokeLLM({
        prompt: `Fetch ${book} chapter ${chapter + 1} from KJV Bible. Return JSON with book, chapter, and verses array.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            book: { type: "string" },
            chapter: { type: "number" },
            verses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "number" },
                  text: { type: "string" }
                }
              }
            }
          }
        }
      });

      setLeftPage(leftChapterData);
      setRightPage(rightChapterData);
    } catch (err) {
      console.error("Failed to load pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Parse this Bible reference: "${searchQuery}". Return the book name and chapter number. Examples: "John 3:16" -> book: "John", chapter: 3. "Psalms 23" -> book: "Psalms", chapter: 23.`,
        response_json_schema: {
          type: "object",
          properties: {
            book: { type: "string" },
            chapter: { type: "number" }
          }
        }
      });

      if (result.book && result.chapter) {
        setFlipDirection(result.chapter > currentChapter ? "right" : "left");
        setIsFlipping(true);
        
        setTimeout(() => {
          setCurrentBook(result.book);
          setCurrentChapter(result.chapter);
          setIsFlipping(false);
        }, 800);
      }
    } catch (err) {
      console.error("Search failed:", err);
      alert("Could not find that reference. Try: 'John 3:16' or 'Psalms 23'");
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    setFlipDirection("right");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentChapter(prev => prev + 2);
      setIsFlipping(false);
    }, 800);
  };

  const previousPage = () => {
    if (currentChapter > 1) {
      setFlipDirection("left");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentChapter(prev => Math.max(1, prev - 2));
        setIsFlipping(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex flex-col items-center justify-center p-4">
      {/* Search Bar */}
      <div className="w-full max-w-4xl mb-6">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search verse (e.g., 'John 3:16' or 'Psalms 23')..."
            className="bg-white/90 backdrop-blur-sm border-amber-300 text-amber-900 placeholder:text-amber-600"
            disabled={loading || isFlipping}
          />
          <Button
            onClick={handleSearch}
            disabled={loading || isFlipping}
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Book */}
      <div className="relative" style={{ perspective: "2000px" }}>
        <motion.div
          className="relative"
          style={{
            width: "90vw",
            maxWidth: "1200px",
            height: "70vh",
            maxHeight: "800px",
          }}
        >
          {/* Book Shadow */}
          <div className="absolute inset-0 bg-black/30 blur-2xl transform translate-y-4" />

          {/* Book Container */}
          <div className="relative w-full h-full bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg shadow-2xl overflow-hidden flex">
            {/* Book Spine Shadow */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/20 via-black/10 to-black/20 z-10" />

            <AnimatePresence mode="wait">
              {isFlipping && flipDirection === "right" && (
                <motion.div
                  key="flip-right"
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: -180 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute left-1/2 top-0 w-1/2 h-full bg-amber-50 shadow-xl z-20 origin-left"
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden"
                  }}
                >
                  <div className="absolute inset-0 p-8 overflow-hidden">
                    {rightPage && (
                      <div className="h-full flex flex-col">
                        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 text-center">
                          {rightPage.book} {rightPage.chapter}
                        </h2>
                        <div className="flex-1 overflow-y-auto columns-1 gap-4 text-sm leading-relaxed">
                          {rightPage.verses?.map((verse) => (
                            <p key={verse.number} className="mb-2 text-amber-900 font-serif">
                              <span className="font-bold text-amber-700">{verse.number}</span> {verse.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {isFlipping && flipDirection === "left" && (
                <motion.div
                  key="flip-left"
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 180 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute right-1/2 top-0 w-1/2 h-full bg-amber-50 shadow-xl z-20 origin-right"
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden"
                  }}
                >
                  <div className="absolute inset-0 p-8 overflow-hidden transform scale-x-[-1]">
                    {leftPage && (
                      <div className="h-full flex flex-col">
                        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 text-center">
                          {leftPage.book} {leftPage.chapter}
                        </h2>
                        <div className="flex-1 overflow-y-auto columns-1 gap-4 text-sm leading-relaxed">
                          {leftPage.verses?.map((verse) => (
                            <p key={verse.number} className="mb-2 text-amber-900 font-serif">
                              <span className="font-bold text-amber-700">{verse.number}</span> {verse.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Left Page */}
            <div className="w-1/2 h-full p-6 md:p-8 overflow-hidden relative">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
                </div>
              ) : leftPage ? (
                <div className="h-full flex flex-col">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-900 mb-4 text-center">
                    {leftPage.book} {leftPage.chapter}
                  </h2>
                  <div className="flex-1 overflow-y-auto text-xs md:text-sm leading-relaxed space-y-2">
                    {leftPage.verses?.map((verse) => (
                      <p key={verse.number} className="text-amber-900 font-serif">
                        <span className="font-bold text-amber-700">{verse.number}</span> {verse.text}
                      </p>
                    ))}
                  </div>
                  <div className="text-center text-xs text-amber-600 mt-4">{leftPage.chapter}</div>
                </div>
              ) : null}
            </div>

            {/* Right Page */}
            <div className="w-1/2 h-full p-6 md:p-8 overflow-hidden relative">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
                </div>
              ) : rightPage ? (
                <div className="h-full flex flex-col">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-900 mb-4 text-center">
                    {rightPage.book} {rightPage.chapter}
                  </h2>
                  <div className="flex-1 overflow-y-auto text-xs md:text-sm leading-relaxed space-y-2">
                    {rightPage.verses?.map((verse) => (
                      <p key={verse.number} className="text-amber-900 font-serif">
                        <span className="font-bold text-amber-700">{verse.number}</span> {verse.text}
                      </p>
                    ))}
                  </div>
                  <div className="text-center text-xs text-amber-600 mt-4">{rightPage.chapter}</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={previousPage}
            disabled={currentChapter <= 1 || isFlipping}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-900/30 rounded-full flex items-center justify-center text-white shadow-lg transition-all disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextPage}
            disabled={isFlipping}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-900/30 rounded-full flex items-center justify-center text-white shadow-lg transition-all disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </motion.div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-amber-200 text-sm">
        <p>Search for any verse or use arrow buttons to turn pages</p>
      </div>
    </div>
  );
}