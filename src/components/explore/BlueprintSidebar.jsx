import React, { useState } from "react";
import { Plus, FileText, Layers as LayersIcon, ChevronDown, Trash2, FolderOpen, FolderPlus, Edit2 } from "lucide-react";
import { COLORS } from "./blueprintConstants";

export default function BlueprintSidebar({
  pages, currentPageId, elements, selectedId,
  onSelectPage, onAddPage, onDeletePage, onRenamePage, onSelectElement,
  projectName, onRenameProject, projectsList, currentProjectId,
  onOpenProject, onDeleteProject, onNewProject, projectsOpen, setProjectsOpen
}) {
  const [pagesOpen, setPagesOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingProject, setRenamingProject] = useState(false);

  const currentPage = pages.find(p => p.id === currentPageId);

  return (
    <div className="w-48 lg:w-52 flex-shrink-0 flex flex-col border-r" style={{ background: COLORS.PANEL_BG, borderColor: COLORS.BORDER }}>
      <div className="px-3 py-3 border-b" style={{ borderColor: COLORS.BORDER }}>
        {renamingProject ? (
          <input
            autoFocus
            defaultValue={projectName}
            onBlur={(e) => { onRenameProject(e.target.value || 'Untitled site'); setRenamingProject(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            className="w-full text-xs font-bold bg-transparent outline-none border-b border-blue-400"
            style={{ color: COLORS.TEXT_DARK }}
          />
        ) : (
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-bold truncate flex-1" style={{ color: COLORS.TEXT_DARK }} title={projectName}>{projectName}</p>
            <button
              onClick={() => setRenamingProject(true)}
              className="flex-shrink-0 opacity-60 hover:opacity-100"
              title="Rename project"
            >
              <Edit2 className="w-3 h-3" style={{ color: COLORS.TEXT_MED }} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Projects section — persists across refresh */}
        <div className="border-b" style={{ borderColor: COLORS.BORDER }}>
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase"
            style={{ color: COLORS.TEXT_MED }}
          >
            <span className="flex items-center gap-1.5"><FolderOpen className="w-3 h-3" /> Projects</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${projectsOpen ? '' : 'rotate-[-90deg]'}`} />
          </button>
          {projectsOpen && (
            <div className="pb-1">
              {projectsList.length === 0 ? (
                <p className="px-3 py-2 text-[11px]" style={{ color: COLORS.TEXT_MED }}>No saved projects</p>
              ) : (
                projectsList.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => onOpenProject(proj)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-[12px] min-h-[32px] ${proj.id === currentProjectId ? '' : 'hover:bg-gray-50'}`}
                    style={proj.id === currentProjectId ? { background: '#eef2ff', color: COLORS.BLUE, fontWeight: 600 } : { color: COLORS.TEXT_DARK }}
                    title={proj.name + ' — updated ' + new Date(proj.updatedAt || 0).toLocaleString()}
                  >
                    <span className="flex-1 truncate">{proj.name || 'Untitled'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete project"
                    >
                      <Trash2 className="w-3 h-3" style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                ))
              )}
              <button
                onClick={onNewProject}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[12px] hover:bg-gray-50"
                style={{ color: COLORS.TEXT_MED }}
              >
                <FolderPlus className="w-3 h-3" /> New project
              </button>
            </div>
          )}
        </div>
        {/* Pages section */}
        <div className="border-b" style={{ borderColor: COLORS.BORDER }}>
          <button
            onClick={() => setPagesOpen(!pagesOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase"
            style={{ color: COLORS.TEXT_MED }}
          >
            <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Pages</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${pagesOpen ? '' : 'rotate-[-90deg]'}`} />
          </button>
          {pagesOpen && (
            <div className="pb-1">
              {pages.map((page, i) => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-[12px] min-h-[32px] ${page.id === currentPageId ? '' : 'hover:bg-gray-50'}`}
                  style={page.id === currentPageId ? { background: '#eef2ff', color: COLORS.BLUE, fontWeight: 600 } : { color: COLORS.TEXT_DARK }}
                >
                  {renamingId === page.id ? (
                    <input
                      autoFocus
                      defaultValue={page.name}
                      onBlur={(e) => { onRenamePage(page.id, e.target.value || `Page ${i+1}`); setRenamingId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      className="flex-1 text-[12px] bg-transparent outline-none border-b border-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate" onDoubleClick={() => setRenamingId(page.id)}>{page.name}</span>
                  )}
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" style={{ color: '#dc2626' }} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={onAddPage}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[12px] hover:bg-gray-50"
                style={{ color: COLORS.TEXT_MED }}
              >
                <Plus className="w-3 h-3" /> Add page
              </button>
            </div>
          )}
        </div>

        {/* Layers section */}
        <div>
          <button
            onClick={() => setLayersOpen(!layersOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase"
            style={{ color: COLORS.TEXT_MED }}
          >
            <span className="flex items-center gap-1.5"><LayersIcon className="w-3 h-3" /> Layers</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${layersOpen ? '' : 'rotate-[-90deg]'}`} />
          </button>
          {layersOpen && (
            <div className="pb-2">
              {elements.length === 0 ? (
                <p className="px-3 py-2 text-[11px]" style={{ color: COLORS.TEXT_MED }}>No elements yet</p>
              ) : (
                elements.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className={`px-3 py-1.5 cursor-pointer text-[12px] truncate ${el.id === selectedId ? '' : 'hover:bg-gray-50'}`}
                    style={el.id === selectedId ? { background: '#eef2ff', color: COLORS.BLUE, fontWeight: 600 } : { color: COLORS.TEXT_DARK }}
                  >
                    {el.type}: {(el.content || '').slice(0, 20) || 'empty'}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}