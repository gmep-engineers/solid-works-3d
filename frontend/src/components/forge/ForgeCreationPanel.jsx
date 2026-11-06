import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Sparkles,
  Scissors,
  Layers,
  Undo2,
  Redo2,
  Send,
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  CircleDot,
  Box,
  Key,
  Compass,
  Check,
  Plus,
  Cpu,
  Settings,
  Code2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { api } from '../../api';
import ForgeProgressBar from './ForgeProgressBar';

export default function ForgeCreationPanel({
  sessionId,
  sessionState,
  onApplyFeature,
  onUndo,
  onRedo,
  onChatCommand,
  walletBalance = 0,
  pricingConfig = null,
  onOpenRefillModal = null,
  isProcessing = false,
  progress = 0,
  progressStage = '',
  progressTitle = ''
}) {
  const [activeTab, setActiveTab] = useState('ai_prompt'); // 'ai_prompt' | 'tree'
  const [promptText, setPromptText] = useState('');
  const [targetHeight, setTargetHeight] = useState(60);
  const [ipNotice, setIpNotice] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedFace, setSelectedFace] = useState('BOTTOM');

  // AI Generative 3D Engine connection state
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('forgeai_gemini_key') || '');
  const [tripoApiKey, setTripoApiKey] = useState(() => localStorage.getItem('forgeai_tripo_key') || '');
  const [enginePreference, setEnginePreference] = useState(() => localStorage.getItem('forgeai_engine_pref') || 'auto');
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [showTripoModal, setShowTripoModal] = useState(false);
  const [tempTripoKey, setTempTripoKey] = useState('');
  const [tripoStatus, setTripoStatus] = useState({ is_active: false, masked_key: '' });

  // Sync server-side Tripo key status
  useEffect(() => {
    api.forgeGetTripoKey()
      .then((res) => {
        if (res) {
          setTripoStatus(res);
          if (res.is_active && !tripoApiKey) {
            setTripoApiKey('configured_on_server');
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveTripoKeyDirect = async (keyToSave) => {
    const key = (keyToSave || tempTripoKey).trim();
    if (!key) return;
    setTripoApiKey(key);
    localStorage.setItem('forgeai_tripo_key', key);
    try {
      const res = await api.forgeSaveTripoKey(key);
      if (res) setTripoStatus(res);
    } catch (e) {
      console.error('Failed to sync Tripo key with backend:', e);
    }
    setShowTripoModal(false);
  };

  // Quick CAD Action States
  const [sliceHeight, setSliceHeight] = useState(2.0);
  const [pedestalShape, setPedestalShape] = useState('round');
  const [pedestalDiam, setPedestalDiam] = useState(32);
  const [embossText, setEmbossText] = useState('');
  const [hollowWall, setHollowWall] = useState(2.0);

  // Live IP Guard Checking on prompt change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (promptText && promptText.trim().length > 3) {
        api.forgeCheckIp(promptText)
          .then((res) => {
            if (res.is_rewritten) {
              setIpNotice(res);
            } else {
              setIpNotice(null);
            }
          })
          .catch(() => {});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [promptText]);

  const handleGenerateBase = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!promptText || !promptText.trim()) return;
    onApplyFeature('create_base', {
      mode: 'ai_organic',
      prompt: promptText.trim(),
      height_mm: targetHeight,
      gemini_api_key: geminiApiKey ? geminiApiKey.trim() : undefined,
      tripo_api_key: tripoApiKey ? tripoApiKey.trim() : undefined,
      engine_preference: enginePreference
    });
    setActiveTab('tree');
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onChatCommand(chatInput, tripoApiKey);
    setChatInput('');
  };

  const featureTree = sessionState?.feature_tree || [];
  const historyIndex = sessionState?.history_index ?? -1;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full space-y-4 text-left">
      {/* Wallet Status Bar */}
      <div className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-medium">Wallet:</span>
          <span className="font-mono font-bold text-emerald-400">${(walletBalance ?? 0).toFixed(2)}</span>
        </div>
        {onOpenRefillModal && (
          <button
            type="button"
            onClick={onOpenRefillModal}
            className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-0.5 rounded border border-emerald-500/30 transition-all cursor-pointer"
          >
            + Top Up
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tree'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Feature Tree & CAD
        </button>
        <button
          onClick={() => setActiveTab('ai_prompt')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ai_prompt'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Concept-to-3D
        </button>
      </div>

      {/* Active 3D Feature Progress Status Bar */}
      {isProcessing && (
        <ForgeProgressBar
          progress={progress}
          stage={progressStage}
          title={progressTitle}
          variant="compact"
          isProcessing={isProcessing}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: AI Concept-to-3D Generator                                        */}
      {/* ========================================================================= */}
      {activeTab === 'ai_prompt' && (
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">


          {/* AI Model Connection Status & Settings */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={`w-2 h-2 rounded-full ${
                  tripoApiKey && geminiApiKey ? 'bg-gradient-to-r from-purple-400 to-amber-400 animate-pulse' :
                  tripoApiKey ? 'bg-purple-400 animate-pulse' :
                  geminiApiKey ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
                }`} />
                <span className="font-semibold text-slate-300">
                  Engine:{' '}
                  <span className={
                    tripoApiKey && geminiApiKey ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 font-bold' :
                    tripoApiKey ? 'text-purple-400 font-bold' :
                    geminiApiKey ? 'text-amber-400 font-bold' : 'text-cyan-400'
                  }>
                    {tripoApiKey && geminiApiKey ? 'Dual-Engine: Tripo3D (Mesh) + Gemini (CAD)' :
                     tripoApiKey ? 'Tripo3D AI (Neural Generative Mesh)' :
                     geminiApiKey ? 'Google Gemini 2.5 Flash LLM-to-CAD' : 'TitanForge Procedural Engine'}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAiSettings(!showAiSettings)}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline shrink-0"
              >
                <Settings className="w-3 h-3" />
                {showAiSettings ? 'Hide AI Config' : 'AI Engine Config'}
              </button>
            </div>

            {showAiSettings && (
              <div className="pt-2.5 border-t border-slate-800/80 space-y-3 text-[11px]">
                {/* Engine Mode Selection */}
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Engine Routing Mode:
                  </label>
                  <select
                    value={enginePreference}
                    onChange={(e) => {
                      setEnginePreference(e.target.value);
                      localStorage.setItem('forgeai_engine_pref', e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="auto">Smart Auto-Routing (Tripo for Organic, Gemini for CAD)</option>
                    <option value="tripo">Tripo3D Priority (Neural Generative 3D Mesh)</option>
                    <option value="gemini">Google Gemini Priority (build123d Parametric CAD)</option>
                    <option value="procedural">Offline Procedural Synthesizer Only</option>
                  </select>
                </div>

                {/* Tripo3D API Key */}
                <div className="space-y-1.5 p-2 rounded-lg bg-purple-950/20 border border-purple-800/40">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Tripo3D API Key (tripo3d SDK):
                    </label>
                    <a
                      href="https://platform.tripo3d.ai"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-purple-400 hover:underline"
                    >
                      Get Tripo Key ↗
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="Paste Tripo Key (starts with tsk_...)"
                    value={tripoApiKey}
                    onChange={(e) => {
                      setTripoApiKey(e.target.value);
                      localStorage.setItem('forgeai_tripo_key', e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Generates organic watertight 3D meshes & PBR textures (dogs, figures, sculptures)</span>
                    {tripoApiKey && <span className="text-emerald-400 font-semibold">✓ Active</span>}
                  </div>
                </div>

                {/* Google Gemini API Key */}
                <div className="space-y-1.5 p-2 rounded-lg bg-amber-950/20 border border-amber-800/40">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Google Gemini API Key:
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Get Free Key ↗
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="Paste Gemini API Key (starts with AIzaSy...)"
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value);
                      localStorage.setItem('forgeai_gemini_key', e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Converts text prompts into executable build123d CAD scripts</span>
                    {geminiApiKey && <span className="text-emerald-400 font-semibold">✓ Active</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generated Python CAD Code Viewer (When Gemini generates build123d code) */}
          {sessionState?.generated_cad_code && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowCodeViewer(!showCodeViewer)}
                className="w-full p-2.5 flex items-center justify-between bg-amber-950/20 hover:bg-amber-950/30 text-amber-300 font-mono text-[11px] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gemini Generated build123d Python Script</span>
                </div>
                {showCodeViewer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {showCodeViewer && (
                <div className="p-3 bg-slate-950 max-h-48 overflow-y-auto border-t border-amber-500/20">
                  <pre className="text-[10px] font-mono text-cyan-300/90 whitespace-pre-wrap leading-relaxed">
                    {sessionState.generated_cad_code}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Photo / Sketch Dropzone */}
          <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/40">
            <UploadCloud className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
            <span className="text-xs font-medium text-slate-300 block">Upload Pet Photo or Character Sketch</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">PNG, JPG, or SVG (Auto-synthesized to 3D)</span>
          </div>

          {/* Prompt Input with IP Guard */}
          <form onSubmit={handleGenerateBase} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Prompt / Concept Description:
              </label>
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  setSelectedPreset(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateBase(e);
                  }
                }}
                placeholder="Describe your 3D metal part (e.g. 'hexagonal carabiner', 'manifold bracket', 'turbine blade'). Press Enter to synthesize..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Live IP Guard Notice Banner */}
            {ipNotice && (
              <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>IP-Safety Gatekeeper Active</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {ipNotice.notice}
                </p>
                <div className="text-[10px] font-mono text-cyan-300 pt-1">
                  Rewritten: <span className="font-semibold text-white">"{ipNotice.clean_prompt}"</span>
                </div>
              </div>
            )}

            {/* Target Height Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Target Finished Height:</span>
                <span className="font-mono font-bold text-cyan-400">{targetHeight} mm</span>
              </div>
              <input
                type="range"
                min={20}
                max={150}
                step={5}
                value={targetHeight}
                onChange={(e) => setTargetHeight(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Wallet Cost Breakdown & Pre-Generation Transparency */}
            {(() => {
              const textCost = pricingConfig?.fee_structure?.textTo3dDraftCost ?? 0.50;
              const hasFunds = (walletBalance ?? 0) >= textCost;
              return (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generation Fee:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">${textCost.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500">(Auto-Escrow Hold)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !hasFunds}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      !hasFunds
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {hasFunds
                      ? `Synthesize Organic 3D Base ($${textCost.toFixed(2)})`
                      : `Insufficient Balance — Top Up Wallet ($${textCost.toFixed(2)} needed)`}
                  </button>

                  {!hasFunds && onOpenRefillModal && (
                    <button
                      type="button"
                      onClick={onOpenRefillModal}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Top Up Wallet Balance (+ $10 / $25 / $50)
                    </button>
                  )}
                </div>
              );
            })()}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SolidWorks-Style Feature Tree & CAD Operations                     */}
      {/* ========================================================================= */}
      {activeTab === 'tree' && (
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Undo / Redo Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Feature History Tree
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={onUndo}
                disabled={!sessionState?.can_undo || isProcessing}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Undo Feature"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!sessionState?.can_redo || isProcessing}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Redo Feature"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chronological Feature Stack */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {featureTree.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50 text-center text-xs text-slate-500">
                No features created yet. Enter a concept prompt or CAD command to synthesize your first metal part.
              </div>
            ) : (
              featureTree.map((item, idx) => {
                const isCurrent = idx === historyIndex;
                const isFuture = idx > historyIndex;
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/50 border-cyan-500 text-white font-semibold shadow-md'
                        : isFuture
                        ? 'bg-slate-950/40 border-slate-800/40 text-slate-600'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-cyan-400">
                        {idx + 1}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Parametric CAD Action Tiles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Parametric CAD Operations
            </span>

            {/* 1. Planar Cut */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                  Planar Slice (Flatten Bottom)
                </span>
                <span className="font-mono text-cyan-400 font-bold">{sliceHeight} mm</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10.0}
                step={0.5}
                value={sliceHeight}
                onChange={(e) => setSliceHeight(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <button
                type="button"
                onClick={() =>
                  onApplyFeature('slice_plane', {
                    origin: [0, 0, sliceHeight],
                    normal: [0, 0, 1],
                    keep_side: 'positive'
                  })
                }
                disabled={isProcessing}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all disabled:opacity-50"
              >
                Apply Cut at Z = {sliceHeight} mm
              </button>
            </div>

            {/* 2. Precision Pedestal */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  Attach Tabletop Pedestal
                </span>
                <span className="text-[10px] font-mono text-amber-300">build123d B-Rep</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Embossed Text (e.g. CHAMPION)"
                  value={embossText}
                  onChange={(e) => setEmbossText(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white placeholder-slate-500"
                />
                <select
                  value={pedestalShape}
                  onChange={(e) => setPedestalShape(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                >
                  <option value="round">Round Ø{pedestalDiam}mm</option>
                  <option value="octagonal">Octagonal Base</option>
                  <option value="square">Square Plinth</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  onApplyFeature('attach_pedestal', {
                    shape: pedestalShape,
                    diameter_mm: pedestalDiam,
                    height_mm: 6.0,
                    front_emboss_text: embossText,
                    magnet_hole_diameter_mm: 5.2
                  })
                }
                disabled={isProcessing}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-50"
              >
                Attach Base + 5mm Magnet Recess
              </button>
            </div>

            {/* 3. Auto-Hollow & Keychain Loop */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onApplyFeature('auto_hollow', {
                    wall_thickness_mm: 2.0,
                    drain_hole_diam_mm: 4.0
                  })
                }
                disabled={isProcessing}
                className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 hover:bg-emerald-950/30 text-emerald-300 text-xs font-bold text-left transition-all"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Auto-Hollow
                </div>
                <span className="text-[10px] text-slate-400 block font-normal">
                  2mm wall + powder drain
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onApplyFeature('hardware_loop', {
                    position: 'top',
                    inner_diam_mm: 4.5,
                    wall_thickness_mm: 2.0
                  })
                }
                disabled={isProcessing}
                className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 hover:bg-cyan-950/30 text-cyan-300 text-xs font-bold text-left transition-all"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  Keychain Loop
                </div>
                <span className="text-[10px] text-slate-400 block font-normal">
                  Weld Ø4.5mm top eyelet
                </span>
              </button>
            </div>
          </div>

          {/* Natural Language CAD Assistant Input */}
          <form onSubmit={handleChatSubmit} className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Natural Language CAD Assistant
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempTripoKey(tripoApiKey.startsWith('configured_') ? '' : tripoApiKey);
                  setShowTripoModal(!showTripoModal);
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                  (tripoApiKey && tripoApiKey !== 'configured_on_server') || tripoStatus.is_active
                    ? 'bg-purple-950/80 text-purple-300 border-purple-600/60 hover:border-purple-400'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/60 hover:border-amber-400'
                }`}
                title="Configure Tripo3D Neural Generative AI API Key"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (tripoApiKey && tripoApiKey !== 'configured_on_server') || tripoStatus.is_active
                    ? 'bg-purple-400 animate-pulse'
                    : 'bg-amber-400'
                }`} />
                <span>
                  {(tripoApiKey && tripoApiKey !== 'configured_on_server') || tripoStatus.is_active
                    ? 'Tripo3D: Linked'
                    : 'Tripo3D: Connect Key'}
                </span>
              </button>
            </div>

            {/* Inline Tripo Key Configuration Drawer/Modal */}
            {showTripoModal && (
              <div className="bg-purple-950/50 border border-purple-500/50 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Connect Tripo3D AI API Key</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTripoModal(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Tripo3D synthesizes complex organic 3D models (characters, animals, jewelry, figurines) with full PBR textures directly from your natural language prompt.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={tempTripoKey}
                    onChange={(e) => setTempTripoKey(e.target.value)}
                    placeholder="Paste Tripo Key: tsk_..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTripoKeyDirect(tempTripoKey)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors shrink-0"
                  >
                    Save & Link
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-0.5">
                  <a
                    href="https://platform.tripo3d.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Get Free Tripo Key (platform.tripo3d.ai)</span>
                    <span>↗</span>
                  </a>
                  {tripoStatus.masked_key && (
                    <span className="text-slate-400 font-mono">Server Key: {tripoStatus.masked_key}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="e.g. 'girl riding on a horse', 'sculpt an eagle', 'cut 3mm off bottom'..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isProcessing || !chatInput.trim()}
                className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Generated Python CAD Code Viewer on Feature Tree tab */}
          {sessionState?.generated_cad_code && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowCodeViewer(!showCodeViewer)}
                className="w-full p-2.5 flex items-center justify-between bg-amber-950/20 hover:bg-amber-950/30 text-amber-300 font-mono text-[11px] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>build123d Python CAD Script</span>
                </div>
                {showCodeViewer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {showCodeViewer && (
                <div className="p-3 bg-slate-950 max-h-48 overflow-y-auto border-t border-amber-500/20">
                  <pre className="text-[10px] font-mono text-cyan-300/90 whitespace-pre-wrap leading-relaxed">
                    {sessionState.generated_cad_code}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
