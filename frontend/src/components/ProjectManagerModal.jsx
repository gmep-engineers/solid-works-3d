import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  X,
  Save,
  FolderOpen,
  Trash2,
  Check,
  Sparkles,
  Clock,
  Layers,
  Box,
  Wrench,
  Flame,
  DollarSign,
  AlertCircle,
  Calendar,
  Search,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'titanforge_quote_saved_projects';

export default function ProjectManagerModal({
  isOpen,
  initialMode = 'save',
  onClose,
  currentProjectData,
  onLoadProject,
  currentUser
}) {
  const [mode, setMode] = useState(initialMode); // 'save' | 'load'
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStatusMessage(null);
      // Generate default name if empty
      if (!projectName) {
        const defaultBase = currentProjectData?.modelData?.filename
          ? currentProjectData.modelData.filename.replace(/\.[^/.]+$/, '')
          : 'CAD Part';
        const mat = (currentProjectData?.selectedMaterial || 'ti_6al_4v').replace(/_/g, ' ').toUpperCase();
        setProjectName(`${defaultBase} [${mat}]`);
      }
      fetchProjects();
    }
  }, [isOpen, initialMode]);

  // Load projects from API and localStorage fallback
  const fetchProjects = async () => {
    setIsLoadingList(true);
    let apiProjects = [];
    try {
      if (currentUser) {
        apiProjects = await api.listQuoteProjects();
      }
    } catch (err) {
      console.warn('API list projects error, falling back to local storage:', err);
    }

    // Merge with localStorage
    let localProjects = [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localProjects = JSON.parse(stored);
      }
    } catch (err) {
      console.error('LocalStorage parse error:', err);
    }

    // Deduplicate by id
    const map = new Map();
    localProjects.forEach((p) => map.set(p.id, p));
    apiProjects.forEach((p) => map.set(p.id, p));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    );

    setProjectsList(merged);
    setIsLoadingList(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    if (!currentProjectData?.modelData) {
      setStatusMessage({ type: 'error', text: 'Cannot save an empty project. Please upload or load a CAD model first.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const projectPayload = {
      name: projectName.trim(),
      model_id: currentProjectData.modelData.id || `model_${Date.now()}`,
      model_data: currentProjectData.modelData,
      material_id: currentProjectData.selectedMaterial,
      finish_id: currentProjectData.selectedFinish || 'as_printed',
      machining_options: currentProjectData.machining || {},
      quantity: currentProjectData.quantity || 1,
      lead_time_id: currentProjectData.selectedLeadTime || 'standard',
      quote_summary: currentProjectData.currentQuote
        ? {
            unit_price: currentProjectData.currentQuote.unit_price,
            total_price: currentProjectData.currentQuote.total_price,
            mass_grams: currentProjectData.currentQuote.mass_grams
          }
        : null,
      notes: notes.trim()
    };

    let savedResult = null;

    // 1. Save to Backend if logged in
    try {
      if (currentUser) {
        savedResult = await api.saveQuoteProject(projectPayload);
      }
    } catch (err) {
      console.warn('Backend save project failed, saving to local browser storage:', err);
    }

    // 2. Save to localStorage cache as backup
    try {
      const id = savedResult?.id || `local_prj_${Date.now()}`;
      const nowIso = new Date().toISOString();
      const localItem = {
        ...projectPayload,
        id,
        created_at: nowIso,
        updated_at: nowIso
      };

      const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const filtered = existing.filter((p) => p.name !== localItem.name && p.id !== id);
      const updated = [localItem, ...filtered];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (localErr) {
      console.error('LocalStorage save error:', localErr);
    }

    setIsSaving(false);
    setStatusMessage({ type: 'success', text: `Project "${projectName.trim()}" saved successfully!` });
    fetchProjects();

    // Auto-switch to load tab after brief delay or keep confirmation
    setTimeout(() => {
      setStatusMessage(null);
      setMode('load');
    }, 1200);
  };

  const handleSelectProject = (proj) => {
    if (!onLoadProject) return;

    onLoadProject({
      modelData: proj.model_data,
      selectedMaterial: proj.material_id || 'ti_6al_4v',
      selectedFinish: proj.finish_id || 'as_printed',
      machining: proj.machining_options || {},
      quantity: proj.quantity || 1,
      selectedLeadTime: proj.lead_time_id || 'standard',
      projectName: proj.name
    });

    onClose();
  };

  const handleDelete = async (projectId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved project?')) return;

    setDeletingId(projectId);
    try {
      if (currentUser && !projectId.startsWith('local_')) {
        await api.deleteQuoteProject(projectId);
      }
    } catch (err) {
      console.warn('API delete project error:', err);
    }

    // Also remove from localStorage
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const updated = existing.filter((p) => p.id !== projectId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('LocalStorage delete error:', err);
    }

    setProjectsList((prev) => prev.filter((p) => p.id !== projectId));
    setDeletingId(null);
  };

  if (!isOpen) return null;

  const filteredProjects = projectsList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.material_id?.toLowerCase().includes(q) ||
      p.model_data?.filename?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              {mode === 'save' ? <Save className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'save' ? 'Save Current Project' : 'Load Saved Project'}
              </h3>
              <p className="text-xs text-slate-400">
                Preserve CAD geometry, chosen alloys, CNC machining, secondary ops, and instant quotes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-800/80 flex items-center gap-2 bg-slate-950/30">
          <button
            type="button"
            onClick={() => setMode('save')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'save'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Save Current Setup
          </button>
          <button
            type="button"
            onClick={() => setMode('load')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'load'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Load Project
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono ml-1">
              {projectsList.length}
            </span>
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`mx-5 mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {mode === 'save' ? (
            /* SAVE FORM */
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Title / Part Description <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Titanium Bracket Rev 2 (Threaded M6 + Wire EDM)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Engineering Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Aerospace grade HIP required. Critical datum face tolerances ±0.02 mm."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Current Configuration Summary Card */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Current Project Snapshot
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Live Workspace</span>
                </div>

                {currentProjectData?.modelData ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="block text-[10px] text-slate-500">CAD Geometry:</span>
                      <span className="font-semibold text-white truncate block">
                        {currentProjectData.modelData.filename}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentProjectData.modelData.volume_cm3?.toFixed(2)} cm³
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="block text-[10px] text-slate-500">Selected Alloy:</span>
                      <span className="font-semibold text-cyan-300 capitalize truncate block">
                        {currentProjectData.selectedMaterial?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">DMLS / SLM</span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="block text-[10px] text-slate-500">Surface Finish:</span>
                      <span className="font-semibold text-slate-200 capitalize truncate block">
                        {(currentProjectData.selectedFinish || 'as_printed').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="block text-[10px] text-slate-500">Subtractive Ops:</span>
                      <span className="font-semibold text-amber-300 text-[11px] block truncate">
                        {[
                          currentProjectData.machining?.tapped_holes > 0 && `${currentProjectData.machining.tapped_holes}x Tapped`,
                          currentProjectData.machining?.datum_faces > 0 && `${currentProjectData.machining.datum_faces}x Milled`,
                          currentProjectData.machining?.wire_edm_cutoff && 'Wire EDM'
                        ].filter(Boolean).join(', ') || 'None selected'}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="block text-[10px] text-slate-500">Thermal / HIP:</span>
                      <span className="font-semibold text-orange-300 text-[11px] capitalize block truncate">
                        {(currentProjectData.machining?.heat_treatment || 'stress_relief').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="block text-[10px] text-slate-500">Batch & Total:</span>
                      <span className="font-semibold font-mono text-white text-[11px] block">
                        {currentProjectData.quantity || 1} pcs
                        {currentProjectData.currentQuote?.total_price && (
                          <strong className="text-cyan-400 ml-1">
                            (${currentProjectData.currentQuote.total_price.toFixed(2)})
                          </strong>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 py-2">
                    No 3D CAD model loaded yet. Upload or select a model first to save your project.
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !currentProjectData?.modelData}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving Project...' : 'Save Project'}
                </button>
              </div>
            </form>
          ) : (
            /* LOAD LIST */
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved projects by title, alloy, or filename..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Project Cards List */}
              {isLoadingList ? (
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading saved projects...
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredProjects.map((proj) => {
                    const updatedAt = proj.updated_at || proj.created_at;
                    const dateFormatted = updatedAt ? new Date(updatedAt).toLocaleDateString() : '';

                    return (
                      <div
                        key={proj.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-xs">{proj.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300 uppercase">
                              {proj.material_id?.replace(/_/g, ' ')}
                            </span>
                            {proj.quote_summary?.total_price && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                                ${proj.quote_summary.total_price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                            <span className="text-slate-300 truncate max-w-[200px]">
                              {proj.model_data?.filename || 'CAD Model'}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono">{proj.model_data?.volume_cm3?.toFixed(1)} cm³</span>
                            <span className="text-slate-600">•</span>
                            <span>{proj.quantity || 1} pcs</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px]">
                              <Clock className="w-3 h-3" />
                              {dateFormatted}
                            </span>
                          </div>

                          {proj.notes && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                              "{proj.notes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleSelectProject(proj)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Load Project
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(proj.id, e)}
                            disabled={deletingId === proj.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
                            title="Delete saved project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <HardDrive className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No saved projects found.</p>
                  <button
                    type="button"
                    onClick={() => setMode('save')}
                    className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Save your current CAD & quote setup now →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
