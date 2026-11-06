import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  FolderGit2,
  Layers,
  Box,
  Ruler,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  Package,
  Calendar,
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function MyProjects({ onSelectModelForQuoting, onSelectOrderForTracking }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUserProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load user projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">My Uploaded CAD Models & Projects</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track all SolidWorks parts and CAD models uploaded to your engineering account, view DFM diagnostics, and re-order builds.
          </p>
        </div>

        <button
          onClick={loadProjects}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 self-start md:self-auto"
          title="Refresh Projects"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isSolidworks = proj.filename.toLowerCase().endsWith('.sldprt');
            const bboxStr = `${proj.bbox_x} × ${proj.bbox_y} × ${proj.bbox_z} mm`;

            return (
              <div
                key={proj.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div className="space-y-3">
                  {/* Top tags */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isSolidworks
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {isSolidworks ? 'SOLIDWORKS .SLDPRT' : '3D CAD PART'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        proj.dfm_status === 'PASS'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : proj.dfm_status === 'WARNING'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {proj.dfm_status === 'PASS' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>{proj.dfm_status}</span>
                    </span>
                  </div>

                  {/* Title & Date */}
                  <div>
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors" title={proj.filename}>
                      {proj.filename}
                    </h3>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Uploaded {new Date(proj.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Geometric Diagnostics */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-sans">Volume:</span>
                      <span className="text-slate-200 font-semibold">{proj.volume_cm3.toFixed(2)} cm³</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-sans">Min Wall:</span>
                      <span
                        className={`font-semibold ${
                          proj.min_thickness_mm < 0.4
                            ? 'text-rose-400'
                            : proj.min_thickness_mm < 0.8
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {proj.min_thickness_mm.toFixed(2)} mm
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800/60 truncate">
                      <span className="block text-[10px] text-slate-500 font-sans">Bounding Box:</span>
                      <span className="text-slate-300 text-[11px]">{bboxStr}</span>
                    </div>
                  </div>

                  {/* Associated Orders / Status */}
                  {proj.latest_order_id && (
                    <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-cyan-400" />
                        Order: {proj.latest_order_id}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase">
                        {proj.latest_order_status?.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectModelForQuoting(proj)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Open 3D Viewer & Quote
                  </button>

                  {proj.latest_order_id && (
                    <button
                      type="button"
                      onClick={() => onSelectOrderForTracking(proj.latest_order_id)}
                      className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                      title="Track Order"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <FolderGit2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No Uploaded Projects Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Upload your first SolidWorks part or CAD model to have it permanently cataloged in your project dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
