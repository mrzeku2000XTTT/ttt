import React from "react";
import { FolderOpen, Save, Trash2 } from "lucide-react";

function when(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Saved";
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${date.toLocaleTimeString(
    undefined,
    { hour: "numeric", minute: "2-digit" }
  )}`;
}

/** Named snapshots of the scene, kept in the browser. */
export default function ProjectsPanel({ name, onName, onSave, history, onOpen, onDelete }) {
  return (
    <>
      <p className="ts-hint">
        The scene saves itself as you work, so a refresh never loses it. Save a named copy here to keep a version you
        can come back to.
      </p>

      <div className="ts-save-row">
        <input
          className="ts-input"
          placeholder="Scene name"
          value={name}
          onChange={(event) => onName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSave();
          }}
        />
        <button type="button" className="ts-btn ts-btn-compact" onClick={onSave}>
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>

      {history.length === 0 ? (
        <p className="ts-hint">No saved scenes yet.</p>
      ) : (
        <div className="ts-asset-list">
          {history.map((entry) => (
            <div key={entry.id} className="ts-asset-row">
              <button type="button" className="ts-asset-pick" onClick={() => onOpen(entry)}>
                <span className="ts-asset-name">{entry.name}</span>
                <span className="ts-asset-kind">{when(entry.savedAt)}</span>
              </button>
              <button
                type="button"
                className="ts-asset-del"
                title={`Delete ${entry.name}`}
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="ts-hint">
        <FolderOpen className="ts-inline-icon" />
        Reopening a saved scene replaces what is on the stage right now.
      </p>
    </>
  );
}