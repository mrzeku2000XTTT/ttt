import React, { useState, useEffect } from "react";
import { Search, BookOpen, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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