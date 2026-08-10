import React from "react";
import { Folder, Trash2, X, Layout } from "lucide-react";
import { COLORS } from "./blueprintConstants";

export const PROJECTS_KEY = "blueprint_projects";

export function loadProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; } catch { return []; }
}

export function saveProject(project) {
  try {
    const projects = loadProjects().filter(p => p.id !== project.id);
    projects.unshift(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(0, 12)));
  } catch {}
}

export function deleteProject(id) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(loadProjects().filter(p => p.id !== id))); } catch {}
}

export default function BlueprintProjects({ currentId, onLoad, onClose }) {
  const [projects, setProjects] = React.useState(loadProjects);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteProject(id);
    setProjects(loadProjects());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
      <div
        className="relative w-full max-w-md rounded-xl overflow-hidden flex flex-col max-h-[70vh]"
        style={{ background: '#fff', border: `1px solid ${COLORS.BORDER}`, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: COLORS.BORDER }}>
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4" style={{ color: COLORS.BLUE }} />
            <p className="text-sm font-bold" style={{ color: COLORS.TEXT_DARK }}>My Blueprint Projects</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100" style={{ color: COLORS.TEXT_MED }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {projects.length === 0 ? (
            <p className="text-[12px] text-center py-10" style={{ color: COLORS.TEXT_MED }}>
              No saved projects yet. Your work auto-saves as you build.
            </p>
          ) : (
            projects.map(p => (
              <button
                key={p.id}
                onClick={() => onLoad(p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-gray-50"
                style={p.id === currentId ? { background: '#eef2ff' } : {}}
              >
                <Layout className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.TEXT_MED }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate" style={{ color: COLORS.TEXT_DARK }}>
                    {p.name || 'Untitled project'}
                    {p.id === currentId && <span className="ml-2 text-[10px] font-bold" style={{ color: COLORS.BLUE }}>CURRENT</span>}
                  </p>
                  <p className="text-[11px]" style={{ color: COLORS.TEXT_MED }}>
                    {p.updated ? new Date(p.updated).toLocaleString() : ''}{p.landingHtml ? ' · Landing page' : ''}
                  </p>
                </div>
                <span
                  onClick={(e) => handleDelete(e, p.id)}
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-red-50 cursor-pointer"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}