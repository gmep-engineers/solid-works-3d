import React from 'react';
import { Cpu, Layers, Sparkles, CheckCircle2, Box, Activity } from 'lucide-react';

/**
 * High-tech CAD & AI progress indicator for 3D feature generation.
 * Supports HUD (viewport overlay), compact (panel inline), and banner variants.
 */
export default function ForgeProgressBar({
  progress = 0,
  stage = 'Processing...',
  title = 'Generating 3D Feature',
  variant = 'hud',
  isProcessing = false
}) {
  if (!isProcessing) return null;

  const boundedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Pipeline steps with progress thresholds
  const steps = [
    { label: 'Parameters', threshold: 15 },
    { label: 'CAD B-Rep', threshold: 45 },
    { label: 'Manifold Mesh', threshold: 75 },
    { label: 'PBR Render', threshold: 95 }
  ];

  if (variant === 'banner') {
    return (
      <div className="w-full relative overflow-hidden h-1.5 bg-slate-950/80 rounded-full border border-cyan-500/20">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 transition-all duration-300 ease-out shadow-md shadow-cyan-500/50"
          style={{ width: `${boundedProgress}%` }}
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-3 space-y-2 shadow-xl text-left">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono font-bold text-cyan-300 truncate max-w-[200px]">
              {title}
            </span>
          </div>
          <span className="font-mono font-extrabold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 text-[11px]">
            {boundedProgress}%
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-300 ease-out shadow-sm shadow-cyan-500/40"
            style={{ width: `${boundedProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="truncate">{stage}</span>
          <span className="text-cyan-500/80 shrink-0">SLM Engine</span>
        </div>
      </div>
    );
  }

  // HUD Viewport Overlay Variant
  return (
    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 pointer-events-none transition-all duration-300">
      <div className="w-full max-w-md bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 space-y-5 text-left relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header with animated icon and progress percent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-cyan-300/90 flex items-center gap-1.5 mt-0.5">
                <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>{stage}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              {boundedProgress}%
            </span>
          </div>
        </div>

        {/* Main High-Tech Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30 p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-300 ease-out shadow-lg shadow-cyan-500/60 relative"
              style={{ width: `${boundedProgress}%` }}
            >
              {/* Shimmer light bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* 4-Step Pipeline Stepper */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
          {steps.map((step, idx) => {
            const isCompleted = boundedProgress >= step.threshold + 20;
            const isActive = boundedProgress >= step.threshold && !isCompleted;
            return (
              <div key={idx} className="flex flex-col items-center text-center space-y-1">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50'
                      : isActive
                      ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/40 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                </div>
                <span
                  className={`text-[9px] font-medium leading-tight ${
                    isCompleted
                      ? 'text-emerald-400'
                      : isActive
                      ? 'text-cyan-300 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
