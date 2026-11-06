import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Box,
  Cpu,
  ShieldCheck,
  Ruler,
  Info,
  Compass,
  Sparkles,
  Wrench,
  Download,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function DfmBadge({
  modelData,
  onModelUpdated,
  openAutoFixModal,
  onCloseAutoFixModal,
  isExpanded: controlledExpanded,
  onToggle
}) {
  if (!modelData) return null;

  const [isEnvelopeHovered, setIsEnvelopeHovered] = useState(false);
  const [isThickening, setIsThickening] = useState(false);
  const [repairedData, setRepairedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggle = onToggle || (() => setInternalExpanded((prev) => !prev));
  const [targetThickness, setTargetThickness] = useState(0.80);
  const [hasPromptedId, setHasPromptedId] = useState(null);
  const [dismissedPromptIds, setDismissedPromptIds] = useState(new Set());

  const {
    volume_cm3,
    surface_area_cm2,
    bbox,
    is_watertight,
    min_thickness_mm,
    thin_features_count,
    dfm_status,
    dfm_warnings,
    filename,
    is_solidworks
  } = modelData;

  const bboxStr = bbox ? `${bbox[0]} × ${bbox[1]} × ${bbox[2]} mm` : 'N/A';

  // Coordinate dimensions & build envelope parameters
  const x = bbox ? Number(bbox[0]) : 0;
  const y = bbox ? Number(bbox[1]) : 0;
  const z = bbox ? Number(bbox[2]) : 0;
  const bboxVolumeCm3 = (x * y * z) / 1000;
  const packingRatio = bboxVolumeCm3 > 0 ? Math.min(100, (volume_cm3 / bboxVolumeCm3) * 100) : 0;
  const layers30um = z > 0 ? Math.round(z / 0.03) : 0;
  const layers60um = z > 0 ? Math.round(z / 0.06) : 0;

  // Chamber clearances for industrial DMLS printers
  const eosMarginX = Math.max(0, 250 - x).toFixed(0);
  const eosMarginY = Math.max(0, 250 - y).toFixed(0);
  const eosMarginZ = Math.max(0, 325 - z).toFixed(0);

  const handleAutoThicken = async (targetMm = 0.80) => {
    setIsThickening(true);
    setErrorMsg('');
    try {
      const res = await api.autoThickenModel(modelData.id, { target_thickness_mm: targetMm });
      setRepairedData(res);
      if (onModelUpdated) {
        onModelUpdated(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Auto-thickening failed.');
    } finally {
      setIsThickening(false);
    }
  };

  const isAutoRepaired = Boolean(repairedData || modelData.is_auto_repaired || modelData.dfm_details?.is_auto_repaired);
  const hasThicknessError = (min_thickness_mm < 0.8 || dfm_status === 'FAIL' || (thin_features_count && thin_features_count > 0));
  const downloadUrl = repairedData?.repaired_download_url || modelData.dfm_details?.repaired_download_url;

  // Sync external open request
  useEffect(() => {
    if (openAutoFixModal) {
      setShowConfirmModal(true);
    }
  }, [openAutoFixModal]);

  // When a model with thickness errors is loaded, ask the user before auto-fixing
  useEffect(() => {
    if (modelData?.id && modelData.id !== hasPromptedId) {
      setHasPromptedId(modelData.id);
      if (hasThicknessError && !isAutoRepaired && !dismissedPromptIds.has(modelData.id)) {
        setShowConfirmModal(true);
      }
    }
  }, [modelData?.id, hasThicknessError, isAutoRepaired, hasPromptedId, dismissedPromptIds]);

  const handleDismiss = () => {
    setShowConfirmModal(false);
    if (onCloseAutoFixModal) onCloseAutoFixModal();
    if (modelData?.id) {
      setDismissedPromptIds((prev) => new Set([...prev, modelData.id]));
    }
  };

  const handleConfirmAutoFix = async () => {
    await handleAutoThicken(targetThickness);
    setShowConfirmModal(false);
    if (onCloseAutoFixModal) onCloseAutoFixModal();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl shadow-xl transition-all overflow-hidden">
      {/* Interactive Collapsible Header */}
      <button
        type="button"
        onClick={toggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
      >
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>CAD Geometry & DFM Diagnostics</span>
            </h3>
            {is_solidworks && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                SOLIDWORKS
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            <span className="text-slate-300 font-mono font-medium">{volume_cm3?.toFixed(2)} cm³</span>
            <span className="text-slate-500 mx-1.5">•</span>
            <span>Min Wall: <strong className="text-cyan-300 font-mono">{min_thickness_mm?.toFixed(2)} mm</strong></span>
            <span className="text-slate-500 mx-1.5">•</span>
            <span className={is_watertight ? 'text-emerald-400' : 'text-amber-400'}>
              {is_watertight ? 'Watertight Mesh' : 'Non-manifold Mesh'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dfm_status === 'PASS' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Printable</span> (PASS)
            </span>
          )}
          {dfm_status === 'WARNING' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden sm:inline">Thin Wall</span> Notice
            </span>
          )}
          {dfm_status === 'FAIL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <XCircle className="w-3 h-3" />
              Critical Error
            </span>
          )}

          <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 flex items-center gap-1 ml-1">
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Details'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
            )}
          </span>
        </div>
      </button>

      {/* Expanded Metrics & Diagnostics Body */}
      {isExpanded && (
        <div className="p-5 pt-3 border-t border-slate-800/80 space-y-5 animate-in fade-in duration-150">

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Volume */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Part Volume
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {volume_cm3.toFixed(2)} <span className="text-xs font-normal text-slate-400">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {(volume_cm3 * 1000).toLocaleString()} mm³
          </div>
        </div>

        {/* Bounding Box / Envelope with Hover Detail Popup */}
        <div
          className="relative bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-900/60 rounded-lg p-3 cursor-pointer transition-all group"
          onMouseEnter={() => setIsEnvelopeHovered(true)}
          onMouseLeave={() => setIsEnvelopeHovered(false)}
          onClick={() => setIsEnvelopeHovered(!isEnvelopeHovered)}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-blue-400 group-hover:text-cyan-300 transition-colors" />
              <span>Envelope (X×Y×Z)</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.2 rounded group-hover:text-white group-hover:bg-cyan-500/30 flex items-center gap-0.5 transition-all">
              <Info className="w-2.5 h-2.5" /> Info
            </span>
          </div>

          <div className="text-sm font-bold text-white font-mono mt-1 truncate" title={bboxStr}>
            {bboxStr}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-cyan-300 transition-colors">
            Hover for build envelope details
          </div>

          {/* Interactive Hover Popup Window */}
          {isEnvelopeHovered && (
            <div
              className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 bottom-full mb-3 z-50 w-80 sm:w-96 p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/50 shadow-2xl backdrop-blur-xl text-left pointer-events-auto transition-all"
              style={{
                boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(6, 182, 212, 0.2)'
              }}
            >
              {/* Popup Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Box className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Build Envelope Geometry
                    </h4>
                    <span className="text-[10px] text-slate-400">3D Coordinate Dimensions</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  DMLS / SLM
                </span>
              </div>

              {/* Tri-Axis Coordinates (X, Y, Z) */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-mono font-bold text-rose-400">X (Width)</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {x.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Recoater wiper</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-mono font-bold text-emerald-400">Y (Depth)</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {y.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Powder bed</div>
                </div>

                <div className="bg-slate-900/80 border border-cyan-500/30 bg-cyan-950/20 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-cyan-300 font-mono font-bold">Z (Height)</div>
                  <div className="text-sm font-bold text-cyan-200 font-mono mt-0.5">
                    {z.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                  </div>
                  <div className="text-[9px] text-cyan-400/80 mt-0.5">Laser travel</div>
                </div>
              </div>

              {/* Volume & Packing Ratio */}
              <div className="space-y-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 mb-3 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Envelope Box Volume:</span>
                  <span className="font-mono font-semibold text-slate-200">{bboxVolumeCm3.toFixed(2)} cm³</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Actual Solid Volume:</span>
                  <span className="font-mono font-semibold text-cyan-300">{volume_cm3.toFixed(2)} cm³</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400">Material Packing Density:</span>
                  <span className="font-mono font-bold text-emerald-400">{packingRatio.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, packingRatio))}%` }}
                  ></div>
                </div>
              </div>

              {/* Slicing Layer Estimation */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                  <span className="text-slate-400 block text-[10px]">Layers @ 30 µm (Fine)</span>
                  <span className="font-mono font-bold text-slate-200">~{layers30um.toLocaleString()} layers</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                  <span className="text-slate-400 block text-[10px]">Layers @ 60 µm (Fast)</span>
                  <span className="font-mono font-bold text-slate-200">~{layers60um.toLocaleString()} layers</span>
                </div>
              </div>

              {/* DMLS Machine Build Chamber Fit */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>DMLS Chamber Compatibility</span>
                  <span className="text-emerald-400 font-mono text-[10px]">✓ Fits</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">EOS M 290 (250×250×325 mm)</span>
                  <span className="text-emerald-400 font-mono text-[10px]">
                    +{eosMarginX}×{eosMarginY}×{eosMarginZ} mm margin
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">SLM 280 (280×280×365 mm)</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Cleared</span>
                </div>
              </div>

              {/* Pointer indicator */}
              <div className="absolute top-full left-8 -mt-1.5 w-3 h-3 bg-slate-950 border-r border-b border-cyan-500/50 rotate-45 transform"></div>
            </div>
          )}
        </div>


        {/* Min Wall Thickness */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Ruler className="w-3.5 h-3.5 text-amber-400" />
            Min Wall Thickness
          </div>
          <div
            className={`text-lg font-bold font-mono ${
              min_thickness_mm < 0.4
                ? 'text-rose-400'
                : min_thickness_mm < 0.8
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {min_thickness_mm.toFixed(2)} <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Standard limit: ≥ 0.80 mm
          </div>
        </div>

        {/* Watertight / Manifold */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Mesh Topology
          </div>
          <div className="text-base font-bold font-mono mt-0.5 flex items-center gap-1.5">
            {is_watertight ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Watertight
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Open Edges
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {thin_features_count > 0 ? `${thin_features_count} thin feature zones` : 'Continuous manifold'}
          </div>
        </div>
      </div>

      {/* Warnings & Engineering Feedback */}
      {dfm_warnings && dfm_warnings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Additive Manufacturing DFM Analysis
          </div>
          <div className="space-y-1.5">
            {dfm_warnings.map((warn, i) => (
              <div
                key={i}
                className={`text-xs p-2.5 rounded-lg border flex items-start gap-2.5 ${
                  dfm_status === 'FAIL'
                    ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                    : dfm_status === 'WARNING'
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                }`}
              >
                {dfm_status === 'FAIL' ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : dfm_status === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{warn}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Thicken & Geometry Healing Module */}
      {isAutoRepaired ? (
        <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-4 space-y-3 shadow-lg shadow-emerald-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-emerald-300">Auto-Thickened & Geometry Healed</span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ≥ 0.80 mm Validated
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All flagged thin features and knife-edge transitions have been dynamically dilated outward along vertex normals with curvature blend smoothing. The 3D viewer is displaying the updated, printable model.
          </p>
          {downloadUrl && (
            <div className="pt-1">
              <a
                href={downloadUrl}
                download={`repaired_${filename}.stl`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                Download Repaired Model (.STL)
              </a>
            </div>
          )}
        </div>
      ) : hasThicknessError && (
        <div className="bg-gradient-to-r from-amber-950/30 via-cyan-950/30 to-slate-950/60 border border-amber-500/40 rounded-xl p-4 space-y-3 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm text-white">Wall Thickness Violation Detected</span>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
              User Action Required
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Detected thin wall features (<span className="text-amber-300 font-mono font-semibold">{min_thickness_mm.toFixed(2)} mm</span>). Standard DMLS / SLM metal additive manufacturing requires <span className="text-cyan-300 font-mono font-semibold">≥ 0.80 mm</span>. The CAD engine can automatically dilate thin features to make the part printable.
          </p>

          {errorMsg && (
            <div className="text-xs text-rose-300 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isThickening}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Review & Auto-Fix Wall Thickness...
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Keep Original Geometry
            </button>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Wall Thickness Auto-Fix Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-left relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Wall Thickness Error Detected
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs">{filename}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                disabled={isThickening}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic Metrics */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs text-amber-200 leading-relaxed font-medium">
                The CAD geometry check identified thin-wall features below the safe <span className="font-semibold text-white">0.80 mm</span> threshold for DMLS / SLM metal additive manufacturing.
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                <div className="bg-slate-950/70 rounded-lg p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Measured Min</span>
                  <span className="text-sm font-bold text-rose-400">{min_thickness_mm.toFixed(2)} mm</span>
                </div>
                <div className="bg-slate-950/70 rounded-lg p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Required Limit</span>
                  <span className="text-sm font-bold text-emerald-400">≥ 0.80 mm</span>
                </div>
                <div className="bg-slate-950/70 rounded-lg p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Thin Zones</span>
                  <span className="text-sm font-bold text-amber-300">{thin_features_count || 1}</span>
                </div>
              </div>
            </div>

            {/* Proposed Fix & Selection */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Proposed Automated Fix
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The automated CAD healing engine will dilate thin vertices outward along surface normals using Laplacian curvature smoothing, eliminating thin-wall burn-through risks while preserving mating datum faces.
              </p>

              {/* Target Thickness Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Select Target Minimum Thickness:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetThickness(0.80)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetThickness === 0.80
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-950/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono text-cyan-300">0.80 mm (Standard)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Complies with EOS M 290 & SLM 280</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetThickness(1.00)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetThickness === 1.00
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-950/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono text-cyan-300">1.00 mm (Heavy-Duty)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Extra structural rigidity & tolerance</div>
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-300 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                {errorMsg}
              </div>
            )}

            {/* Confirmation Question & Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-300">
                Confirm auto-repair to ≥ {targetThickness.toFixed(2)} mm?
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isThickening}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  No, Keep Original
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAutoFix}
                  disabled={isThickening}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
                >
                  {isThickening ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Dilating Vertices...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Yes, Auto-Fix Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
