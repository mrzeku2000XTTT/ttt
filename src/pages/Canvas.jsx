import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence } from "framer-motion";
import { Loader2, Paintbrush } from "lucide-react";
import CanvasHeader from "@/components/canvas/CanvasHeader";
import CategoryFilter from "@/components/canvas/CategoryFilter";
import TemplateCard from "@/components/canvas/TemplateCard";
import TemplateDetailModal from "@/components/canvas/TemplateDetailModal";
import CreateTemplateModal from "@/components/canvas/CreateTemplateModal";

export default function CanvasPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStyle, setActiveStyle] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTemplates, currentUser] = await Promise.all([
        base44.entities.DesignTemplate.list('-created_date', 100),
        base44.auth.me().catch(() => null),
      ]);
      setTemplates(allTemplates);
      setUser(currentUser);
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
    setLoading(false);
  };

  const handleDelete = async (template) => {
    if (!confirm('Delete this template?')) return;
    try {
      await base44.entities.DesignTemplate.delete(template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
    } catch {}
  };

  const filtered = templates.filter(t => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false;
    if (activeStyle !== "All" && t.style !== activeStyle) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        t.category?.toLowerCase().includes(q) ||
        t.style?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-[#08080c] flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] bg-indigo-600/[0.06] rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
        <CanvasHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewTemplate={() => setShowCreate(true)}
        />

        <CategoryFilter
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeStyle={activeStyle}
          onStyleChange={setActiveStyle}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-white/25 text-sm">Loading templates...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Paintbrush className="w-7 h-7 text-white/10" />
                </div>
                <p className="text-white/30 text-sm font-medium">No templates found</p>
                <p className="text-white/15 text-xs">
                  {searchQuery ? 'Try a different search' : 'Create your first template'}
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-bold hover:bg-indigo-500/25 transition-colors"
                >
                  + New Template
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onOpen={setSelectedTemplate}
                    onDelete={isAdmin ? handleDelete : null}
                    isAdmin={isAdmin}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onOpen={setSelectedTemplate}
                    onDelete={isAdmin ? handleDelete : null}
                    isAdmin={isAdmin}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedTemplate && (
          <TemplateDetailModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
        )}
        {showCreate && (
          <CreateTemplateModal onClose={() => setShowCreate(false)} onCreated={loadData} />
        )}
      </AnimatePresence>
    </div>
  );
}