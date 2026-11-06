import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';

export default function CncMachiningCard({
  machining,
  setMachining,
  technology = 'dmls_metal',
  isExpanded: controlledExpanded,
  onToggle
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggle = onToggle || (() => setInternalExpanded((prev) => !prev));

  if (!machining || !setMachining) return null;

  const isResin = technology === 'sla_optical';
  const isHybrid = technology === 'hybrid_luminaire';

  // For non-conductive resins, Wire EDM spark cutoff cannot physically operate
  const effectiveEdmCutoff = isResin ? false : Boolean(machining.wire_edm_cutoff);

  const totalOpsCost =
    (machining.tapped_holes || 0) * 14 +
    (machining.datum_faces || 0) * 65 +
    (machining.reamed_bores || 0) * 22 +
    (effectiveEdmCutoff ? 45 : 0);

  const activeOpsList = [];
  if (machining.tapped_holes > 0) {
    activeOpsList.push(isResin ? `${machining.tapped_holes}x Helicoil` : `${machining.tapped_holes}x Tapped`);
  }
  if (machining.datum_faces > 0) {
    activeOpsList.push(isResin ? `${machining.datum_faces}x Diamond Milled` : `${machining.datum_faces}x Milled Face`);
  }
  if (machining.reamed_bores > 0) {
    activeOpsList.push(`${machining.reamed_bores}x H7 Bore`);
  }
  if (effectiveEdmCutoff) {
    activeOpsList.push('Wire EDM');
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl shadow-xl transition-all overflow-hidden">
      {/* Interactive Collapsible Header */}
      <button
        type="button"
        onClick={toggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm truncate">
                {isResin
                  ? 'Precision CNC Post-Machining & Inserts (SLA)'
                  : isHybrid
                  ? 'Hybrid CNC Machining & Secondary Ops'
                  : 'Precision CNC Machining & Secondary Ops'}
              </h3>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border hidden sm:inline ${
                isResin
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : isHybrid
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                  : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
              }`}>
                {isResin ? 'Optical Resin Spec' : isHybrid ? 'Hybrid Spec' : 'DMLS Metal Spec'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activeOpsList.length > 0 ? (
                <span className="text-amber-300 font-mono">
                  {activeOpsList.join(' • ')} (+${totalOpsCost})
                </span>
              ) : (
                <span className="text-slate-500">None selected (Click to configure subtractive ops)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {totalOpsCost > 0 && !isExpanded && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hidden sm:inline">
              +${totalOpsCost}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 flex items-center gap-1">
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Configure'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
            )}
          </span>
        </div>
      </button>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="p-5 pt-1 border-t border-slate-800/70 space-y-4 animate-in fade-in duration-150">
          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            {isResin
              ? 'Precision subtractive machining operations calibrated for optical resins (high-speed diamond tooling, Helicoil brass/stainless thread inserts, and optical face fly-cutting).'
              : isHybrid
              ? 'Dual-process localized machining: wire EDM separation and datum face milling for the metal heatsink, paired with thread inserts for optical fixtures.'
              : 'Localized subtractive operations applied directly to specific CAD geometry (tapped threads, datum mating faces, tight-tolerance dowel bores, and EDM build plate cutoff).'}
          </p>

          {/* CNC Machining & Secondary Ops Grid: 2 columns in the left panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Thread Tapping / Helicoil Inserts */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  {isResin ? 'Helicoil Thread Inserts' : 'CNC Hole Threading'}
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-bold">+$14 / hole</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isResin
                  ? 'Heat-staked brass or 18-8 stainless Helicoil inserts for durable optical threads.'
                  : 'Tapped internal threads (M3 – M12 / 1/4"-20) post-print.'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMachining((m) => ({ ...m, tapped_holes: Math.max(0, m.tapped_holes - 1) }))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm text-cyan-300 w-8 text-center">
                  {machining.tapped_holes}
                </span>
                <button
                  type="button"
                  onClick={() => setMachining((m) => ({ ...m, tapped_holes: m.tapped_holes + 1 }))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                >
                  +
                </button>
                <span className="text-[11px] text-slate-500">
                  {isResin ? 'inserts' : 'tapped holes'}
                </span>
              </div>
            </div>

            {/* Datum Face Milling / Optical Fly-Cutting */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  {isResin ? 'Optical Diamond Fly-Cutting' : 'Datum Face Milling'}
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-bold">+$65 / face</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isResin
                  ? 'Single-point diamond fly-cutting for specular optical window flatness (<0.01 mm).'
                  : 'CNC precision face milling for critical mating surface flatness.'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMachining((m) => ({ ...m, datum_faces: Math.max(0, m.datum_faces - 1) }))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm text-cyan-300 w-8 text-center">
                  {machining.datum_faces}
                </span>
                <button
                  type="button"
                  onClick={() => setMachining((m) => ({ ...m, datum_faces: m.datum_faces + 1 }))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                >
                  +
                </button>
                <span className="text-[11px] text-slate-500">surfaces</span>
              </div>
            </div>

            {/* Precision Bore Reaming */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  {isResin ? 'H7 Precision Bore Reaming & Bushings' : 'H7 Precision Reaming'}
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-bold">+$22 / bore</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isResin
                  ? 'Precision reamed dowel locating pins and pressed bronze sleeve bearings.'
                  : 'Dowel pin & bearing bores reamed to H7 tolerance.'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMachining((m) => ({ ...m, reamed_bores: Math.max(0, m.reamed_bores - 1) }))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm text-cyan-300 w-8 text-center">
                  {machining.reamed_bores}
                </span>
                <button
                  type="button"
                  onClick={() => setMachining((m) => ({ ...m, reamed_bores: m.reamed_bores + 1 }))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                >
                  +
                </button>
                <span className="text-[11px] text-slate-500">bores</span>
              </div>
            </div>

            {/* Wire EDM Cutoff: Active for Metal/Hybrid, Filtered/Disabled for Resin */}
            {isResin ? (
              <div className="bg-slate-950/70 border border-slate-800/50 rounded-xl p-3.5 flex flex-col justify-between space-y-2 opacity-60">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 line-through">Wire EDM Cutoff</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-800/80">
                      N/A for Photopolymer
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Wire EDM uses high-voltage spark erosion through conductive metals. Dielectric optical resin is non-conductive. Manual precision razor shear included.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500">Wire EDM Spark Cut:</span>
                  <span className="text-[11px] font-mono text-slate-500">Disabled ($0)</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      {isHybrid ? 'Wire EDM Cutoff (Metal Base)' : 'Wire EDM Cutoff'}
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">+$45</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isHybrid
                      ? 'Submerged wire EDM separation of the metal heatsink from the build plate.'
                      : 'Flush baseplate cut-off (no residual stub).'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Enable Wire EDM:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(machining.wire_edm_cutoff)}
                      onChange={(e) => setMachining((m) => ({ ...m, wire_edm_cutoff: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
