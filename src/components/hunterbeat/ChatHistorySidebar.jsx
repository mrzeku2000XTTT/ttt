import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageSquare, X } from "lucide-react";

export default function ChatHistorySidebar({ open, onClose, chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white/90 backdrop-blur-xl border-r border-zinc-200/60 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-11 border-b border-zinc-200/60">
              <span className="text-[13px] font-bold text-zinc-700">Chats</span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New chat */}
            <div className="p-3">
              <button
                onClick={onNewChat}
                className="w-full flex items-center gap-2 px-3 h-9 rounded-full bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New chat
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {chats.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <MessageSquare className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
                  <p className="text-[11px] text-zinc-400">No chats yet. Start a new one.</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 px-3 h-10 rounded-xl cursor-pointer transition-colors ${
                      chat.id === activeChatId ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="flex-1 text-[12px] font-medium text-zinc-600 truncate">
                      {chat.title || "New chat"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}