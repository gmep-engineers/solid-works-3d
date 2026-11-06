import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import ForgeViewport from './ForgeViewport';
import ForgeCreationPanel from './ForgeCreationPanel';
import ForgeProgressBar from './ForgeProgressBar';
import { SaveProjectModal, LoadProjectModal } from './ForgeProjectModals';
import WalletModal from '../WalletModal';
import {
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Box,
  MessageSquare,
  CheckCircle2,
  Calculator,
  ArrowRight,
  Save,
  FolderOpen
} from 'lucide-react';

export default function ForgeStudio({
  currentUser,
  onTransferToQuote = null,
  onOrderSuccess = null,
  walletBalance: externalWalletBalance = null,
  onOpenWalletModal = null
}) {
  const [sessionId, setSessionId] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState('bronze_infused_steel');
  const [modelVersion, setModelVersion] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [progressTitle, setProgressTitle] = useState('');
  const progressTimerRef = useRef(null);

  // Wallet & Pricing States
  const [internalWalletBalance, setInternalWalletBalance] = useState(currentUser?.wallet_balance ?? 0);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const effectiveWalletBalance = externalWalletBalance !== null && externalWalletBalance !== undefined
    ? externalWalletBalance
    : internalWalletBalance;

  // Project Save & Load States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const [assistantMessage, setAssistantMessage] = useState(
    "ForgeAI Studio Ready. Enter a concept prompt or CAD command on the left to start synthesizing in real metal."
  );

  const fetchWalletAndPricing = async () => {
    try {
      const [pricingRes, walletRes] = await Promise.allSettled([
        api.forgeGetPricing(),
        api.getWallet()
      ]);
      if (pricingRes.status === 'fulfilled' && pricingRes.value) {
        setPricingConfig(pricingRes.value);
      }
      if (walletRes.status === 'fulfilled' && walletRes.value?.balance !== undefined) {
        setInternalWalletBalance(walletRes.value.balance);
      }
    } catch (err) {
      console.warn('Failed to load wallet or pricing in ForgeStudio:', err);
    }
  };

  useEffect(() => {
    fetchWalletAndPricing();
  }, []);

  // Smooth CAD progress simulator
  const startProgress = (title, initialStage = 'Analyzing CAD parameters & prompt...') => {
    setIsProcessing(true);
    setProgress(15);
    setProgressTitle(title);
    setProgressStage(initialStage);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    const startTime = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 600) {
        setProgress((p) => Math.min(38, p + 4));
        setProgressStage('Executing build123d OpenCASCADE B-Rep kernel...');
      } else if (elapsed < 1800) {
        setProgress((p) => Math.min(72, p + 2.5));
        setProgressStage('Synthesizing solid geometry & computing Boolean ops...');
      } else if (elapsed < 3500) {
        setProgress((p) => Math.min(88, p + 1.2));
        setProgressStage('Validating watertight manifold & calculating SLM mass...');
      } else {
        setProgress((p) => Math.min(94, p + 0.4));
        setProgressStage('Compiling binary GLB buffer & streaming mesh...');
      }
    }, 150);
  };

  const completeProgress = (delay = 400) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress(100);
    setProgressStage('3D Metal Feature Ready!');
    setTimeout(() => {
      setIsProcessing(false);
      setProgress(0);
      setProgressStage('');
      setProgressTitle('');
    }, delay);
  };

  const handleModelLoaded = () => {
    completeProgress(300);
  };

  const failProgress = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setIsProcessing(false);
    setProgress(0);
    setProgressStage('');
    setProgressTitle('');
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // No auto-init on mount: Start with an empty build plate unless the user creates or loads a model.

  const handleApplyFeature = async (featureType, params) => {
    // If no active session yet, create the session first
    if (!sessionId) {
      const featName = params?.prompt ? `Concept: "${params.prompt.slice(0, 25)}"` : 'Base Geometry';
      startProgress(`Synthesizing 3D Model: ${featName}`, 'Executing OpenCASCADE / Generative AI kernel...');
      try {
        const geminiKey = localStorage.getItem('forgeai_gemini_key') || '';
        const tripoKey = localStorage.getItem('forgeai_tripo_key') || '';
        const enginePref = localStorage.getItem('forgeai_engine_pref') || 'auto';
        const res = await api.forgeCreateSession({
          mode: params?.mode || 'ai_organic',
          prompt: params?.prompt || 'Custom Metal Part',
          preset_key: params?.preset_key,
          shape: params?.shape,
          height_mm: params?.height_mm || 60.0,
          gemini_api_key: geminiKey || undefined,
          tripo_api_key: tripoKey || undefined,
          engine_preference: enginePref
        });
        if (res.wallet_balance !== undefined) {
          setInternalWalletBalance(res.wallet_balance);
        }
        setSessionId(res.session_id);
        setSessionState(res);
        if (params?.prompt) {
          setCurrentProjectName(params.prompt.slice(0, 30));
        }
        setModelVersion((v) => v + 1);
        setProgress(95);
        setProgressStage('Rendering PBR metal in Three.js viewport...');
        setTimeout(() => {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setIsProcessing(false);
        }, 1500);
        if (res.wallet_balance !== undefined) {
          setInternalWalletBalance(res.wallet_balance);
        }
        if (res.ip_guard_notice) {
          setAssistantMessage(res.ip_guard_notice);
        } else {
          setAssistantMessage(`Created 3D model: ${params?.prompt || 'Base Geometry'}`);
        }
      } catch (err) {
        alert(`Session creation error: ${err.message}`);
        failProgress();
      }
      return;
    }

    const featName = featureType === 'create_base'
      ? (params?.prompt ? `Base: "${params.prompt.slice(0, 25)}"` : 'Base Geometry')
      : featureType.replace(/_/g, ' ');
    startProgress(`Applying Feature: ${featName}`, 'Executing SolidWorks B-Rep operation...');
    try {
      const res = await api.forgeApplyFeature(sessionId, {
        feature_type: featureType,
        params: params
      });
      setSessionState(res);
      setModelVersion((v) => v + 1);
      setProgress(95);
      setProgressStage('Rendering PBR metal in Three.js viewport...');
      setTimeout(() => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsProcessing(false);
      }, 2000);
      if (featureType === 'auto_hollow') {
        setAssistantMessage('Auto-hollow complete: 2.0mm SLM shell with powder drainage port applied — material savings reflected in live quotes!');
      } else {
        setAssistantMessage(`Applied CAD feature: ${featureType.replace(/_/g, ' ')}.`);
      }
    } catch (err) {
      alert(`Feature error: ${err.message}`);
      failProgress();
    }
  };

  const handleUndo = async () => {
    if (!sessionId) return;
    startProgress('Reverting CAD Feature', 'Restoring prior feature tree state...');
    try {
      const res = await api.forgeUndo(sessionId);
      setSessionState(res);
      setModelVersion((v) => v + 1);
      setProgress(95);
      setProgressStage('Rendering PBR metal in Three.js viewport...');
      setTimeout(() => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsProcessing(false);
      }, 2000);
      setAssistantMessage("Reverted last feature in history stack.");
    } catch (err) {
      console.error('Undo error:', err);
      failProgress();
    }
  };

  const handleRedo = async () => {
    if (!sessionId) return;
    startProgress('Restoring CAD Feature', 'Re-executing feature tree step...');
    try {
      const res = await api.forgeRedo(sessionId);
      setSessionState(res);
      setModelVersion((v) => v + 1);
      setProgress(95);
      setProgressStage('Rendering PBR metal in Three.js viewport...');
      setTimeout(() => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsProcessing(false);
      }, 2000);
      setAssistantMessage("Restored feature in history stack.");
    } catch (err) {
      console.error('Redo error:', err);
      failProgress();
    }
  };

  const handleChatCommand = async (command, customTripoKey = null) => {
    const shortCmd = command.length > 30 ? command.slice(0, 30) + '...' : command;
    const geminiKey = localStorage.getItem('forgeai_gemini_key') || '';
    const tripoKey = (customTripoKey && customTripoKey !== 'configured_on_server')
      ? customTripoKey
      : (localStorage.getItem('forgeai_tripo_key') || '');
    const enginePref = localStorage.getItem('forgeai_engine_pref') || 'auto';

    if (!sessionId) {
      const stageMsg = tripoKey
        ? 'Synthesizing 3D mesh with Tripo3D Neural Generative AI...'
        : 'Synthesizing initial 3D metal model from prompt...';
      startProgress(`AI Studio: "${shortCmd}"`, stageMsg);
      try {
        const res = await api.forgeCreateSession({
          mode: 'ai_organic',
          prompt: command,
          height_mm: 60.0,
          gemini_api_key: geminiKey || undefined,
          tripo_api_key: tripoKey || undefined,
          engine_preference: enginePref
        });
        if (res.wallet_balance !== undefined) {
          setInternalWalletBalance(res.wallet_balance);
        }
        setSessionId(res.session_id);
        setSessionState(res);
        setCurrentProjectName(command.slice(0, 30));
        setModelVersion((v) => v + 1);
        setProgress(95);
        setProgressStage('Rendering PBR metal in Three.js viewport...');
        setTimeout(() => {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setIsProcessing(false);
        }, 1500);
        setAssistantMessage(res.assistant_message || `Synthesized model for: "${command}"`);
      } catch (err) {
        alert(`Command error: ${err.message}`);
        failProgress();
      }
      return;
    }

    const stageMsg = tripoKey
      ? 'Synthesizing 3D model with Tripo3D Neural Generative AI & Gemini CAD...'
      : 'Translating natural language into CAD geometry...';
    startProgress(`AI Studio: "${shortCmd}"`, stageMsg);

    try {
      const res = await api.forgeChatCommand(sessionId, command, geminiKey, tripoKey, enginePref);
      setSessionState(res);
      setModelVersion((v) => v + 1);
      setProgress(95);
      setProgressStage('Rendering PBR metal in Three.js viewport...');
      setTimeout(() => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsProcessing(false);
      }, 2000);
      if (res.assistant_message) {
        setAssistantMessage(res.assistant_message);
      }
    } catch (err) {
      alert(`Command error: ${err.message}`);
      failProgress();
    }
  };

  const handleTransferToQuote = async () => {
    if (!sessionId) return;
    startProgress('Transferring to Quote & DFM', 'Exporting binary STL & running DFM wall-thickness inspection...');
    try {
      const res = await api.forgeTransferToQuote(sessionId);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsProcessing(false);
      setProgress(0);
      setProgressStage('');
      setProgressTitle('');
      if (onTransferToQuote) {
        onTransferToQuote(res);
      }
    } catch (err) {
      alert(`Transfer error: ${err.message}`);
      failProgress();
    }
  };

  const handleSaveProject = async (name) => {
    if (!sessionId) return;
    setIsSavingProject(true);
    try {
      const res = await api.forgeSaveProject({
        session_id: sessionId,
        name: name,
        material_id: selectedMaterial,
        project_id: currentProjectId || undefined
      });
      setCurrentProjectId(res.project_id);
      setCurrentProjectName(res.name);
      setShowSaveModal(false);
      setAssistantMessage(`Project '${res.name}' successfully saved!`);
    } catch (err) {
      alert(`Save project error: ${err.message}`);
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleOpenLoadModal = async () => {
    setShowLoadModal(true);
    setIsLoadingProjects(true);
    try {
      const list = await api.forgeListProjects();
      setSavedProjects(list);
    } catch (err) {
      console.error('Failed to list projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleLoadProject = async (projectId) => {
    startProgress('Loading Saved Project', 'Restoring CAD feature tree & 3D geometry...');
    try {
      const res = await api.forgeLoadProject(projectId);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsProcessing(false);
      setSessionId(res.session_state.session_id);
      setSessionState(res.session_state);
      setCurrentProjectId(res.project_id);
      setCurrentProjectName(res.name);
      if (res.material_id) setSelectedMaterial(res.material_id);
      setModelVersion((v) => v + 1);
      setShowLoadModal(false);
      setAssistantMessage(`Loaded project '${res.name}' (${res.session_state.feature_tree?.length || 0} CAD features).`);
    } catch (err) {
      alert(`Load project error: ${err.message}`);
      failProgress();
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await api.forgeDeleteProject(projectId);
      setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleOpenRefill = () => {
    if (onOpenWalletModal) {
      onOpenWalletModal();
    } else {
      setShowWalletModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              ForgeAI <span className="text-cyan-400 font-mono text-sm font-semibold">Dual-Engine Metal Studio</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              SLM & Binder Jetting
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Bridge organic AI figurines with SolidWorks-style parametric engineering. Add pedestals with embossed text, drill magnet holes, execute planar cuts, and auto-hollow for metal powder cost savings.
          </p>
        </div>

        {/* Right Header Controls & Status */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0 w-full md:w-auto">
          {/* Top Row: Horizontally Aligned Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-start md:justify-end">
            {/* Save Project Button */}
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              disabled={!sessionId || isProcessing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/60 flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save project design to your library"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>Save Project</span>
            </button>

            {/* Load Project Button */}
            <button
              type="button"
              onClick={handleOpenLoadModal}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-amber-500/60 flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Load a saved project from your library"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Load Project</span>
            </button>

            {/* Transfer to Quote & DFM Button */}
            <button
              onClick={handleTransferToQuote}
              disabled={!sessionId || isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Transfer 3D model to Quote & DFM tab for instant metal pricing"
            >
              <Calculator className="w-4 h-4 text-slate-950" />
              <span>Quote & DFM →</span>
            </button>
          </div>

          {/* Bottom Row: Status / Message Display Field under the three buttons */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <p className="text-[11px] text-slate-300 leading-tight line-clamp-1" title={assistantMessage}>
              {assistantMessage}
            </p>
          </div>
        </div>

        {/* Top Slim Banner Progress Bar */}
        {isProcessing && (
          <div className="absolute bottom-0 left-0 right-0">
            <ForgeProgressBar
              progress={progress}
              stage={progressStage}
              title={progressTitle}
              variant="banner"
              isProcessing={isProcessing}
            />
          </div>
        )}
      </div>

      {/* 2-Zone Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Creation & SolidWorks Feature Tree Panel (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <ForgeCreationPanel
            sessionId={sessionId}
            sessionState={sessionState}
            onApplyFeature={handleApplyFeature}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onChatCommand={handleChatCommand}
            isProcessing={isProcessing}
            progress={progress}
            progressStage={progressStage}
            progressTitle={progressTitle}
            walletBalance={effectiveWalletBalance}
            pricingConfig={pricingConfig}
            onOpenRefillModal={handleOpenRefill}
          />
        </div>

        {/* Center & Right 3D Metal Studio Viewport (Expanded 8 cols) */}
        <div className="lg:col-span-8 h-[650px] lg:h-auto">
          <ForgeViewport
            sessionId={sessionId}
            sessionState={sessionState}
            modelVersion={modelVersion}
            materialId={selectedMaterial}
            onMaterialChange={setSelectedMaterial}
            isHollowed={sessionState?.is_hollowed}
            isProcessing={isProcessing}
            progress={progress}
            progressStage={progressStage}
            progressTitle={progressTitle}
            onModelLoaded={handleModelLoaded}
            onTransferToQuote={handleTransferToQuote}
            onSaveProject={() => setShowSaveModal(true)}
            onLoadProject={handleOpenLoadModal}
            className="h-full min-h-[580px]"
          />
        </div>
      </div>

      {/* Save Project Modal */}
      <SaveProjectModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveProject}
        isSaving={isSavingProject}
        defaultName={currentProjectName}
        sessionState={sessionState}
        selectedMaterial={selectedMaterial}
      />

      {/* Load Project Modal */}
      <LoadProjectModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoadProject={handleLoadProject}
        projects={savedProjects}
        isLoading={isLoadingProjects}
        onDeleteProject={handleDeleteProject}
        activeSessionId={sessionId}
      />

      {/* In-Studio Wallet Refill Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onBalanceUpdated={(newBal) => {
          setInternalWalletBalance(newBal);
          fetchWalletAndPricing();
        }}
      />
    </div>
  );
}
