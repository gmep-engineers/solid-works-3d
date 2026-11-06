import React, { useState, useEffect } from 'react';
import {
  Save,
  FolderOpen,
  X,
  Trash2,
  Clock,
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Check,
  Cpu,
  ArrowRight
} from 'lucide-react';

export function SaveProjectModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  defaultName = '',
  sessionState = null,
  selectedMaterial = 'bronze_infused_steel'
}) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName || 'Bespoke Metal Model');
      setError(null);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }
    onSave(name.trim());
  };

  const featureCount = sessionState?.feature_tree?.length || 0;
  const bbox = sessionState?.bbox_mm || [0, 0, 0];
  const volume = sessionState?.is_hollowed
    ? sessionState?.hollowed_volume_cm3
    : sessionState?.solid_volume_cm3;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Save className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Save ForgeAI Project</h3>
              <p className="text-[11px] text-slate-400">Save CAD features & 3D mesh to your project library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Name <span className="text-cyan-400">*</span>
            </label>
            <input
              id="forge-project-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Wolf Plinth Trophy v2"
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          {/* Model Summary Metadata Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Project Snapshot
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Features:</span>
                <span className="text-cyan-300 font-bold">{featureCount} steps</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Volume:</span>
                <span className="text-amber-300 font-bold">{volume ? `${volume} cm³` : '—'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 col-span-2">
                <span className="text-slate-400">Bounding Box:</span>
                <span className="text-slate-200">{bbox[0]} × {bbox[1]} × {bbox[2]} mm</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-project-submit-btn"
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-950" />
                  <span>Save Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoadProjectModal({
  isOpen,
  onClose,
  onLoadProject,
  projects = [],
  isLoading = false,
  onDeleteProject = null,
  activeSessionId = null
}) {
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved project?')) {
      setDeletingId(projectId);
      try {
        if (onDeleteProject) {
          await onDeleteProject(projectId);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col text-left overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Load ForgeAI Project</h3>
              <p className="text-[11px] text-slate-400">Restore your saved 3D designs, feature tree, and materials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Project List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Loading saved projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Box className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 font-semibold">No Saved Projects Found</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Synthesize or customize any 3D model in ForgeAI Studio and click "Save Project" to save your parametric design here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {projects.map((proj) => {
                const isCurrent = proj.session_id === activeSessionId;
                const dateStr = proj.updated_at
                  ? new Date(proj.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Recent';

                return (
                  <div
                    key={proj.id}
                    onClick={() => onLoadProject(proj.id)}
                    className="p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/60 bg-slate-950/70 hover:bg-slate-950 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-sm hover:shadow-cyan-950/30"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                          {proj.name}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Currently Active
                          </span>
                        )}
                        {proj.engine_used && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                            {proj.engine_used}
                          </span>
                        )}
                      </div>

                      {proj.base_prompt && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                          "{proj.base_prompt}"
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          {proj.feature_count} {proj.feature_count === 1 ? 'feature' : 'features'}
                        </span>
                        <span>•</span>
                        <span>{proj.solid_volume_cm3} cm³</span>
                        <span>•</span>
                        <span>{proj.bbox ? `${proj.bbox[0]}×${proj.bbox[1]}×${proj.bbox[2]}mm` : ''}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, proj.id)}
                        disabled={deletingId === proj.id}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onLoadProject(proj.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{projects.length} saved {projects.length === 1 ? 'project' : 'projects'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
