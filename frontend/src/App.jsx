import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import CadViewer from './components/CadViewer';
import DfmBadge from './components/DfmBadge';
import CncMachiningCard from './components/CncMachiningCard';
import QuoteCalculator from './components/QuoteCalculator';
import OrderTracker from './components/OrderTracker';
import AdminPortal from './components/AdminPortal';
import AuthModal from './components/AuthModal';
import WalletModal from './components/WalletModal';
import AccountSettings from './components/AccountSettings';
import MyProjects from './components/MyProjects';
import ForgeStudio from './components/forge/ForgeStudio';
import ProjectManagerModal from './components/ProjectManagerModal';
import { api, getStoredUser, setStoredUser, setAuthToken } from './api';
import {
  UploadCloud,
  FileCode,
  Sparkles,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Cpu,
  Wallet,
  Save,
  FolderOpen,
  Maximize2,
  Minimize2,
  DollarSign
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('quote'); // 'quote' | 'projects' | 'tracker' | 'account' | 'admin'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Model & Quoting state
  const captureSnapshotRef = useRef(null);
  const [modelData, setModelData] = useState(null);
  const [selectedTechnology, setSelectedTechnology] = useState('dmls_metal');
  const [selectedMaterial, setSelectedMaterial] = useState('ti_6al_4v');
  const [selectedFinish, setSelectedFinish] = useState('as_printed');
  const [quantity, setQuantity] = useState(1);
  const [selectedLeadTime, setSelectedLeadTime] = useState('standard');
  const [currentQuote, setCurrentQuote] = useState(null);
  const [lightCoords, setLightCoords] = useState({ x: 0, y: 25, z: 0 });
  const [machining, setMachining] = useState({
    datum_faces: 0,
    tapped_holes: 0,
    reamed_bores: 0,
    wire_edm_cutoff: true,
    heat_treatment: 'stress_relief',
    display_base: 'none',
    floating_system: 'none',
    illumination: 'none',
    custom_engraving: ''
  });

  const handleTechnologyChange = (techId) => {
    setSelectedTechnology(techId);
    if (techId === 'dmls_metal') {
      setSelectedMaterial('ti_6al_4v');
      setSelectedFinish('as_printed');
      setMachining((m) => ({
        ...m,
        heat_treatment: 'stress_relief',
        wire_edm_cutoff: true,
        display_base: 'none',
        illumination: ['warm_edison_2700k', 'architectural_4000k', 'smart_rgbw_touch'].includes(m.illumination) ? 'none' : m.illumination
      }));
    } else if (techId === 'sla_optical') {
      setSelectedMaterial('sla_ultraclear');
      setSelectedFinish('optical_diamond_coat');
      setMachining((m) => ({
        ...m,
        heat_treatment: 'thermal_uv_anneal',
        wire_edm_cutoff: false,
        display_base: 'none'
      }));
    } else if (techId === 'hybrid_luminaire') {
      setSelectedMaterial('hybrid_metal_light');
      setSelectedFinish('hybrid_dual_finish');
      setMachining((m) => ({
        ...m,
        heat_treatment: 'hybrid_dual_cure',
        wire_edm_cutoff: true,
        display_base: 'none'
      }));
    }
  };

  const handleMaterialChange = (matId) => {
    setSelectedMaterial(matId);
    const slaMaterials = ['sla_ultraclear', 'sla_frosted_diffuser', 'sla_amber_crystal', 'sla_smoked_obsidian', 'sla_cyan_luminescent'];
    if (slaMaterials.includes(matId) && selectedTechnology !== 'sla_optical') {
      setSelectedTechnology('sla_optical');
      setSelectedFinish('optical_diamond_coat');
      setMachining((m) => ({ ...m, heat_treatment: 'thermal_uv_anneal', wire_edm_cutoff: false }));
    } else if (matId === 'hybrid_metal_light' && selectedTechnology !== 'hybrid_luminaire') {
      setSelectedTechnology('hybrid_luminaire');
      setSelectedFinish('hybrid_dual_finish');
      setMachining((m) => ({ ...m, heat_treatment: 'hybrid_dual_cure', wire_edm_cutoff: true }));
    } else if (!slaMaterials.includes(matId) && matId !== 'hybrid_metal_light' && selectedTechnology !== 'dmls_metal') {
      setSelectedTechnology('dmls_metal');
      setSelectedFinish('as_printed');
      setMachining((m) => ({ ...m, heat_treatment: 'stress_relief', wire_edm_cutoff: true }));
    }
  };
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
  const [openAutoFixModal, setOpenAutoFixModal] = useState(false);

  // Project Save & Load Modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState('save'); // 'save' | 'load'
  const [activeProjectName, setActiveProjectName] = useState('');

  const handleOpenSaveProject = () => {
    setProjectModalMode('save');
    setIsProjectModalOpen(true);
  };

  const handleOpenLoadProject = () => {
    setProjectModalMode('load');
    setIsProjectModalOpen(true);
  };

  const handleLoadProject = (proj) => {
    if (!proj) return;
    if (proj.modelData) {
      setModelData(proj.modelData);
    }
    if (proj.selectedMaterial) {
      setSelectedMaterial(proj.selectedMaterial);
    }
    if (proj.selectedFinish) {
      setSelectedFinish(proj.selectedFinish);
    }
    if (proj.machining) {
      setMachining(proj.machining);
    }
    if (proj.quantity) {
      setQuantity(proj.quantity);
    }
    if (proj.selectedLeadTime) {
      setSelectedLeadTime(proj.selectedLeadTime);
    }
    if (proj.projectName) {
      setActiveProjectName(proj.projectName);
    }
    setActiveTab('quote');
  };

  // Left Column independent accordion: 'cnc' | 'dfm' | null (Right and left are separate)
  const [activeLeftCard, setActiveLeftCard] = useState('cnc');

  const handleToggleLeftCard = (cardId) => {
    setActiveLeftCard((prev) => (prev === cardId ? null : cardId));
  };

  // Right Column independent accordion: 1 | 2 | 3 | 4 | 5 | null (Right and left are separate)
  const [activeRightSection, setActiveRightSection] = useState(1);
  const [allRightExpanded, setAllRightExpanded] = useState(false);

  const handleToggleRightSection = (sectionId) => {
    setAllRightExpanded(false);
    setActiveRightSection((prev) => (String(prev) === String(sectionId) ? null : sectionId));
  };

  const handleSelectRightSection = (sectionId) => {
    setAllRightExpanded(false);
    setActiveRightSection(sectionId);
    const el = document.getElementById(`quote-section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleExpandAllRight = () => {
    setAllRightExpanded(true);
  };

  const handleCollapseAllRight = () => {
    setAllRightExpanded(false);
    setActiveRightSection(null);
  };

  const materialLabels = {
    ti_6al_4v: 'Ti-6Al-4V',
    ss_316l: '316L SS',
    alsi10mg: 'AlSi10Mg',
    inconel_718: 'Inconel 718',
    ss_17_4ph: '17-4 PH',
    copper_cuni2sicr: 'CuNi2SiCr',
    scalmalloy: 'Scalmalloy',
    sla_ultraclear: 'UltraClear 92%',
    sla_frosted_diffuser: 'Frosted Opal',
    sla_amber_crystal: 'Amber Tint',
    sla_smoked_obsidian: 'Smoked Tint',
    sla_cyan_luminescent: 'Cyan Glow',
    hybrid_metal_light: 'Hybrid Light'
  };

  const finishLabels = {
    as_printed: 'As-Printed',
    vibratory_tumble: 'Vibratory',
    electrochemical: 'Electro-Chem',
    mirror_polish: 'Mirror',
    optical_diamond_coat: 'Diamond Clear',
    frosted_matte_diffusion: 'Frosted Matte',
    vapor_smoothing: 'Vapor Smooth',
    dyeing_tinting: 'Color Tint',
    uv_cure_wash: 'UV Cure/Wash',
    hybrid_dual_finish: 'Dual-Finish'
  };

  const heatLabels = {
    none: 'None',
    stress_relief: 'Stress Relief',
    hip: 'HIP Cycle',
    solution_aging: 'Aging Harden',
    uv_ambient_cure: 'UV Post-Cure',
    thermal_uv_anneal: 'UV Annealing',
    optical_degas: 'Vacuum Degas',
    inert_chamber_cure: 'Nitrogen UV',
    hybrid_dual_cure: 'Dual Cure'
  };

  const getShowcaseStepLabel = () => {
    if (machining?.illumination === 'warm_edison_2700k') return 'Edison Light';
    if (machining?.illumination === 'architectural_4000k') return 'Neutral Light';
    if (machining?.illumination === 'smart_rgbw_touch') return 'RGBW Light';
    if (machining?.floating_system === 'mag_levitation') return 'Mag-Lev';
    if (machining?.display_base && machining.display_base !== 'none') return 'Plinth';
    if (machining?.custom_engraving?.trim()) return 'Engraved';
    return 'Standard';
  };

  const isAdmin = currentUser?.role === 'admin';

  const refreshWallet = () => {
    if (currentUser?.role !== 'admin') {
      api.getWallet()
        .then((data) => setWalletBalance(data.balance))
        .catch((err) => console.log('Wallet fetch:', err));
    }
  };

  // Synchronize activeTab whenever role changes
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setActiveTab('admin');
    } else if (currentUser?.role === 'user' && activeTab === 'admin') {
      setActiveTab('quote');
    }
  }, [currentUser?.role]);

  // Auto-authenticate with pre-seeded demo user or stored user on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      api.getMe()
        .then((res) => {
          setCurrentUser(res.user);
          setStoredUser(res.user);
          if (res.user.role === 'admin') {
            setActiveTab('admin');
          } else {
            refreshWallet();
          }
          loadSampleModel('bracket');
        })
        .catch(() => {
          autoLoginDemoCustomer();
        });
    } else {
      autoLoginDemoCustomer();
    }
  }, []);

  const autoLoginDemoCustomer = () => {
    api.demoLogin('user')
      .then((res) => {
        setAuthToken(res.access_token);
        setStoredUser(res.user);
        setCurrentUser(res.user);
        refreshWallet();
        loadSampleModel('bracket');
      })
      .catch((err) => console.log('Demo login init:', err));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.uploadCad(formData);
      setModelData(res);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleModel = async (sampleKey) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const res = await api.loadSample(sampleKey);
      setModelData(res);
    } catch (err) {
      console.error('Error loading sample:', err);
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOrderPlaced = (orderId) => {
    refreshWallet();
    setActiveTrackingOrderId(orderId);
    setActiveTab('tracker');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        walletBalance={walletBalance}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ============================================================ */}
        {/* ADMIN WORKSPACE: Dedicated Operations Console Only           */}
        {/* ============================================================ */}
        {isAdmin ? (
          <AdminPortal
            onInspectModel={(order) => {}}
          />
        ) : (
          /* ============================================================ */
          /* GENERAL USER WORKSPACE: Customer Additive & Ordering Features */
          /* ============================================================ */
          <>
            {/* Tab 0: ForgeAI Dual-Engine Metal Customizer Studio */}
            {activeTab === 'forgeai' && (
              <ForgeStudio
                currentUser={currentUser}
                walletBalance={walletBalance}
                onOpenWalletModal={() => setIsWalletModalOpen(true)}
                onTransferToQuote={(cadData) => {
                  setModelData(cadData);
                  setActiveTab('quote');
                }}
                onOrderSuccess={(order) => {
                  refreshWallet();
                  if (order?.order_id) {
                    setActiveTrackingOrderId(order.order_id);
                    setActiveTab('tracker');
                  }
                }}
              />
            )}

            {/* Tab 1: Instant Quoting & 3D DFM Analysis */}
            {activeTab === 'quote' && (
              <div className="space-y-8">
                {/* Top CAD Upload & Sample Selector */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Cpu className="w-6 h-6 text-cyan-400 shrink-0" />
                        <h2 className="text-xl font-bold text-white">
                          Upload SolidWorks, STEP, or CAD Model
                        </h2>
                        {activeProjectName && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            Project: <strong>{activeProjectName}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        Our additive quoting engine parses STEP (<span className="text-cyan-300 font-mono">.step, .stp</span>), SolidWorks (<span className="text-cyan-300 font-mono">.sldprt</span>), STL, and 3MF geometry, computes volume, and checks for critical thin-wall printing thresholds (≥ 0.8 mm for DMLS / SLM).
                      </p>
                    </div>

                    {/* Upload Trigger, Project Save/Load & Sample Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
                      {/* File Upload Button */}
                      <label className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95">
                        <UploadCloud className="w-4 h-4 text-slate-950" />
                        <span>Upload CAD Part</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".step,.stp,.sldprt,.sldasm,.stl,.obj,.3mf,.iges"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>

                      {/* Save Project Button */}
                      <button
                        type="button"
                        onClick={handleOpenSaveProject}
                        disabled={!modelData}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Save your current 3D model, alloy, machining, and quote configuration"
                      >
                        <Save className="w-4 h-4 text-cyan-400" />
                        <span>Save Project</span>
                      </button>

                      {/* Load Project Button */}
                      <button
                        type="button"
                        onClick={handleOpenLoadProject}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        title="Browse and load saved CAD projects"
                      >
                        <FolderOpen className="w-4 h-4 text-amber-400" />
                        <span>Load Project</span>
                      </button>

                      {/* Built-in CAD & STEP Sample Selectors */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-medium px-2 hidden sm:inline">
                          Quick Samples:
                        </span>
                        <button
                          type="button"
                          onClick={() => loadSampleModel('bracket')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all flex items-center gap-1"
                          title="Load valid aerospace mounting bracket (Passes DFM)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Bracket (.sldprt)
                        </button>

                        <button
                          type="button"
                          onClick={() => loadSampleModel('step_part')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 transition-all flex items-center gap-1"
                          title="Load STEP AP214 turbine flange assembly (.step)"
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          Flange (.step)
                        </button>

                        <button
                          type="button"
                          onClick={() => loadSampleModel('thin_fin')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1"
                          title="Load thin fin heat sink (Triggers Thin Wall Warning <0.6mm)"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Thin Fins (<span className="text-amber-400">Warning</span>)
                        </button>

                        <button
                          type="button"
                          onClick={() => loadSampleModel('manifold')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all flex items-center gap-1"
                          title="Load fluid manifold (Ideal for CNC milling & thread tapping)"
                        >
                          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                          Manifold (.sldprt)
                        </button>
                      </div>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-200">
                      {uploadError}
                    </div>
                  )}
                </div>

                {/* 1. Workflow Steps Area (ON TOP) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                      Steps:
                    </span>
                    {[
                      { id: 1, label: '1. Tech & Alloy', activeLabel: `${selectedTechnology === 'dmls_metal' ? 'DMLS' : selectedTechnology === 'sla_optical' ? 'SLA' : 'Hybrid'} • ${materialLabels[selectedMaterial] || 'Alloy'}` },
                      { id: 2, label: '2. Finish', activeLabel: finishLabels[selectedFinish] || 'Finish' },
                      { id: 3, label: '3. Treatment', activeLabel: heatLabels[machining?.heat_treatment] || 'Treatment' },
                      { id: 4, label: '4. Showcase', activeLabel: getShowcaseStepLabel() },
                      { id: 5, label: '5. Quote', activeLabel: currentQuote ? `$${Math.round(currentQuote.total_price)}` : 'Pricing' }
                    ].map((s) => {
                      const isSelected = allRightExpanded || String(activeRightSection) === String(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectRightSection(s.id)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/40'
                              : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                          }`}
                        >
                          <span>{s.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${
                              isSelected ? 'bg-cyan-500/30 text-cyan-200 font-semibold' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {s.activeLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={handleOpenSaveProject}
                      disabled={!modelData}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Save current CAD setup, alloy, machining, and quote as a project"
                    >
                      <Save className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Save Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenLoadProject}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Browse and load saved CAD projects"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Load Project</span>
                    </button>

                    <div className="h-4 w-[1px] bg-slate-800 hidden sm:block mx-0.5"></div>

                    <button
                      type="button"
                      onClick={handleExpandAllRight}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Expand all quoting option sections"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Expand All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAllRight}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Collapse inactive option sections for compact view"
                    >
                      <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Compact View</span>
                    </button>

                    <div className="h-6 w-[1px] bg-slate-800 hidden sm:block mx-1"></div>

                    {/* Prominent Live Dollar Amount on the Right */}
                    <button
                      type="button"
                      onClick={() => handleSelectRightSection(5)}
                      className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 hover:from-emerald-900/80 hover:to-cyan-900/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 flex items-center gap-2.5 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer group shrink-0"
                      title="Total calculated price (Click to review quote & order)"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                          Total Quote
                        </span>
                        <span className="text-sm sm:text-base font-bold font-mono text-emerald-300 group-hover:text-emerald-200 leading-tight">
                          {currentQuote ? `$${currentQuote.total_price.toFixed(2)}` : '$--.--'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Interactive 3D CAD Display Area (UNDER THE STEPS AREA) */}
                <div className="w-full">
                  {modelData ? (
                    <CadViewer
                      modelUrl={modelData.web_model_path}
                      materialId={selectedMaterial}
                      illumination={machining?.illumination || 'none'}
                      lightCoords={lightCoords}
                      onLightCoordsChange={setLightCoords}
                      onSwitchMaterial={(id) => handleMaterialChange(id)}
                      onToggleIllumination={(val) => setMachining((m) => ({ ...m, illumination: val }))}
                      onCaptureReady={(fn) => { captureSnapshotRef.current = fn; }}
                      thinFeatures={modelData.thin_features || []}
                      dfmStatus={modelData.dfm_status}
                      bbox={modelData.bbox}
                      volume={modelData.volume_cm3}
                      className="h-[460px] w-full"
                    />
                  ) : (
                    <div className="h-[460px] w-full bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                      No 3D Model Loaded
                    </div>
                  )}
                </div>

                {/* 3. Under Display Area: Two Columns Showing Options */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Subtractive CNC Machining & Secondary Ops + DFM Diagnostics */}
                  <div className="space-y-6">
                    {modelData && (
                      <CncMachiningCard
                        machining={machining}
                        setMachining={setMachining}
                        technology={selectedTechnology}
                        isExpanded={activeLeftCard === 'cnc'}
                        onToggle={() => handleToggleLeftCard('cnc')}
                      />
                    )}

                    {modelData && (
                      <DfmBadge
                        modelData={modelData}
                        openAutoFixModal={openAutoFixModal}
                        onCloseAutoFixModal={() => setOpenAutoFixModal(false)}
                        isExpanded={activeLeftCard === 'dfm'}
                        onToggle={() => handleToggleLeftCard('dfm')}
                        onModelUpdated={(updatedModel) => {
                          setModelData((prev) => ({
                            ...prev,
                            ...updatedModel,
                            thin_features: updatedModel.thin_features || [],
                            min_thickness_mm: updatedModel.min_thickness_mm,
                            dfm_status: updatedModel.status || updatedModel.dfm_status,
                            dfm_warnings: updatedModel.dfm_warnings,
                            web_model_path: updatedModel.web_model_path
                              ? `${updatedModel.web_model_path}?t=${Date.now()}`
                              : prev.web_model_path
                          }));
                        }}
                      />
                    )}
                  </div>

                  {/* Right Column: Quoting Options (1. Alloy, 2. Finish, 3. Thermal, 4. Showcase, 5. Quote) */}
                  <div className="space-y-4">
                    <QuoteCalculator
                      modelData={modelData}
                      technology={selectedTechnology}
                      onTechnologyChange={handleTechnologyChange}
                      selectedMaterial={selectedMaterial}
                      onMaterialChange={handleMaterialChange}
                      selectedFinish={selectedFinish}
                      setSelectedFinish={setSelectedFinish}
                      quantity={quantity}
                      setQuantity={setQuantity}
                      selectedLeadTime={selectedLeadTime}
                      setSelectedLeadTime={setSelectedLeadTime}
                      machining={machining}
                      setMachining={setMachining}
                      lightCoords={lightCoords}
                      onLightCoordsChange={setLightCoords}
                      onOrderPlaced={handleOrderPlaced}
                      currentUser={currentUser}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                      onOpenWalletModal={() => setIsWalletModalOpen(true)}
                      onRequestAutoFix={() => setOpenAutoFixModal(true)}
                      onSaveProjectClick={handleOpenSaveProject}
                      onLoadProjectClick={handleOpenLoadProject}
                      onQuoteCalculated={setCurrentQuote}
                      onCaptureSnapshot={() => captureSnapshotRef.current ? captureSnapshotRef.current() : null}
                      activeSection={activeRightSection}
                      setActiveSection={setActiveRightSection}
                      allExpanded={allRightExpanded}
                      setAllExpanded={setAllRightExpanded}
                      onToggleSection={handleToggleRightSection}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: My Projects (Uploaded CAD Models Tracking) */}
            {activeTab === 'projects' && (
              <MyProjects
                onSelectModelForQuoting={(proj) => {
                  setModelData(proj);
                  setActiveTab('quote');
                }}
                onSelectOrderForTracking={(orderId) => {
                  setActiveTrackingOrderId(orderId);
                  setActiveTab('tracker');
                }}
              />
            )}

            {/* Tab 3: Order Tracker */}
            {activeTab === 'tracker' && (
              <OrderTracker
                initialOrderId={activeTrackingOrderId}
                onSelectOrderForView={(order) => {}}
              />
            )}

            {/* Tab 4: Account Credentials & Wallet */}
            {activeTab === 'account' && (
              <AccountSettings
                currentUser={currentUser}
                onProfileUpdated={(updated) => {
                  setCurrentUser(updated);
                  setStoredUser(updated);
                }}
                onOpenWalletModal={() => setIsWalletModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>TitanForge 3D Inc. • Metal Additive Manufacturing & CNC Machining Solutions</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>DMLS / SLM Powder Bed Fusion</span>
            <span>•</span>
            <span>{isAdmin ? 'Admin Console & Service Catalog' : 'Automated DFM & Digital Wallet'}</span>
          </div>
        </div>
      </footer>

      {/* Auth & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('quote');
            refreshWallet();
          }
        }}
      />

      {/* Wallet Refill & Credit Card Modal (Customer Only) */}
      {!isAdmin && (
        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          onBalanceUpdated={(newBal) => {
            setWalletBalance(newBal);
          }}
        />
      )}

      {/* Project Manager Modal (Save & Load Project in Quote & DFM) */}
      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        initialMode={projectModalMode}
        onClose={() => setIsProjectModalOpen(false)}
        currentProjectData={{
          modelData,
          selectedMaterial,
          selectedFinish,
          machining,
          quantity,
          selectedLeadTime,
          currentQuote
        }}
        onLoadProject={handleLoadProject}
        currentUser={currentUser}
      />
    </div>
  );
}
