import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Phone } from "lucide-react";

const ORANGE = "#ff5a14";

export default function ContactsList({ contacts, onAdd, onDelete }) {
  const shortAddr = (addr) => addr ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : "";

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-base">Contacts</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
          style={{ background: "rgba(255,90,20,0.15)", border: "1px solid rgba(255,90,20,0.3)", color: ORANGE }}
        >
          <UserPlus size={12} />
          Add
        </button>
      </div>

      {contacts.length === 0 ? (
        <div
          className="rounded-2xl p-6 text-center mb-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}
        >
          <Phone size={28} color="rgba(255,255,255,0.12)" className="mx-auto mb-2" />
          <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>No contacts yet</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
            Save a contact and just say their name to pay them
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {contacts.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: "rgba(255,90,20,0.15)", color: ORANGE }}
              >
                {c.contact_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{c.contact_name}</div>
                <div className="text-white/30 text-xs font-mono truncate">{shortAddr(c.kaspa_address)}</div>
                {c.default_amount && (
                  <div className="text-xs mt-0.5" style={{ color: ORANGE }}>{c.default_amount} KAS default</div>
                )}
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}