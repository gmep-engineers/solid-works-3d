'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Upload,
  PenTool,
  Type,
  Loader2,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  Plus,
  X,
  Tag,
  RotateCcw,
  User as UserIcon,
  Wallet,
  DollarSign,
  AlertCircle,
  CreditCard,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';

const DEFAULT_FEATURE_TAGS = [
  'Golden yellow fur',
  'Detailed fur texture',
  'Realistic animal colors',
  'Cyberpunk armor',
  'Matte white marble',
];

interface StepCreateProps {
  generationData?: {
    generationId: string;
    modelGlbUrl: string;
    promptText: string;
    promptType: 'TEXT' | 'IMAGE' | 'SKETCH' | 'REFINE';
    previewUrl?: string;
    taskId?: string;
  } | null;
  onModelGenerated: (generationData: {
    generationId: string;
    modelGlbUrl: string;
    promptText: string;
    promptType: 'TEXT' | 'IMAGE' | 'SKETCH' | 'REFINE';
    previewUrl?: string;
    taskId?: string;
  }) => void;
  onProceedToCustomize?: () => void;
}

export const StepCreate: React.FC<StepCreateProps> = ({
  generationData,
  onModelGenerated,
  onProceedToCustomize,
}) => {
  const [activeTab, setActiveTab] = useState<'TEXT' | 'IMAGE' | 'SKETCH'>('TEXT');
  const [promptText, setPromptText] = useState(
    generationData?.promptText || 'A running dog',
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [lastTaskId, setLastTaskId] = useState<string | null>(generationData?.taskId || null);
  const [renderNotice, setRenderNotice] = useState<string | null>(
    generationData?.modelGlbUrl ? '3D Model active in display area' : null,
  );

  // Canvas sketchpad refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Quick preset inspirations
  const presets = [
    'A running dog',
    'Futuristic mechanical owl with spread wings',
    'Cyberpunk Samurai Guardian with floating halo',
    'Levitating Geometric Falcon with crystal wings',
  ];

  // User Feature Tags State & Persistence
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [featureTags, setFeatureTags] = useState<string[]>(DEFAULT_FEATURE_TAGS);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagSuccessFlash, setTagSuccessFlash] = useState<string | null>(null);

  // Digital Wallet & Tripo3D Scaled Markup Billing State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [pricingTable, setPricingTable] = useState<any>(null);
  const [billingNotice, setBillingNotice] = useState<string | null>(null);
  const [insufficientError, setInsufficientError] = useState<string | null>(null);

  // Load user-specific tags, wallet balance, and Tripo3D scaled pricing
  useEffect(() => {
    const loadUserAndTags = async () => {
      let userObj: any = null;
      try {
        const stored = localStorage.getItem('levitate3d_user');
        if (stored) {
          userObj = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Failed to parse user session:', err);
      }
      setCurrentUser(userObj);

      // Load Tripo3D scaled pricing rates
      try {
        const pricing = await api.getTripoPricing();
        setPricingTable(pricing);
      } catch (e) {
        console.warn('Failed to load pricing table:', e);
      }

      // Load User Wallet Balance
      const userEmail = userObj?.email || 'alex.mercer@gmail.com';
      try {
        const profile = await api.getUserProfile(userEmail);
        if (profile && typeof profile.wallet_balance === 'number') {
          setWalletBalance(profile.wallet_balance);
        }
      } catch (e) {
        console.warn('Failed to load wallet balance:', e);
      }

      const userKey = (userObj?.email || userObj?.id || 'guest').toLowerCase();
      const storageKey = `levitate3d_feature_tags_${userKey}`;
      const localTags = localStorage.getItem(storageKey);

      if (localTags) {
        try {
          const parsed = JSON.parse(localTags);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFeatureTags(parsed);
            return;
          }
        } catch (e) {}
      }

      // Try fetching from backend API if user is authenticated with email
      if (userObj?.email) {
        try {
          const remote = await api.getUserTags(userObj.email);
          if (remote?.tags && remote.tags.length > 0) {
            setFeatureTags(remote.tags);
            localStorage.setItem(storageKey, JSON.stringify(remote.tags));
            return;
          }
        } catch (e) {}
      }

      // Fallback to default starter tags
      setFeatureTags(DEFAULT_FEATURE_TAGS);
    };

    loadUserAndTags();

    const handleAuthChange = () => loadUserAndTags();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('levitate3d_auth_change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('levitate3d_auth_change', handleAuthChange);
    };
  }, []);

  // Save tags helper that updates state, localStorage per user, and backend
  const saveUserTags = (updatedTags: string[]) => {
    setFeatureTags(updatedTags);
    const userKey = (currentUser?.email || currentUser?.id || 'guest').toLowerCase();
    const storageKey = `levitate3d_feature_tags_${userKey}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedTags));
    } catch (e) {}

    // Persist to backend API asynchronously
    api.saveUserTags(updatedTags, userKey).catch((err) => {
      console.warn('Backend tag persistence sync:', err);
    });
  };

  const handleAddFeatureTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = newTagInput.replace(/^\+\s*/, '').trim();
    if (!cleaned) return;

    if (featureTags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTagSuccessFlash(`"${cleaned}" is already in your tags!`);
      setTimeout(() => setTagSuccessFlash(null), 2200);
      setNewTagInput('');
      setIsAddingTag(false);
      return;
    }

    const updated = [...featureTags, cleaned];
    saveUserTags(updated);
    setNewTagInput('');
    setIsAddingTag(false);
    setTagSuccessFlash(`Added "${cleaned}" to your tags!`);
    setTimeout(() => setTagSuccessFlash(null), 2200);
  };

  const handleRemoveFeatureTag = (index: number) => {
    const removedName = featureTags[index];
    const updated = featureTags.filter((_, i) => i !== index);
    saveUserTags(updated);
    setTagSuccessFlash(`Removed "${removedName}"`);
    setTimeout(() => setTagSuccessFlash(null), 2000);
  };

  const handleResetDefaultTags = () => {
    saveUserTags(DEFAULT_FEATURE_TAGS);
    setTagSuccessFlash('Reset to default feature tags');
    setTimeout(() => setTagSuccessFlash(null), 2000);
  };

  const handleApplyModifier = (tag: string) => {
    const cleaned = tag.replace(/^\+\s*/, '').trim();
    setPromptText((prev) => (prev && prev.trim() ? `${prev.trim()}, ${cleaned}` : cleaned));
    setTagSuccessFlash(`Appended "${cleaned}" to prompt`);
    setTimeout(() => setTagSuccessFlash(null), 1800);
  };

  // Initialize Canvas Sketchpad
  useEffect(() => {
    if (activeTab === 'SKETCH' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Main generator function
  const handleGenerate = async (refineCurrentModel = false) => {
    setIsGenerating(true);
    setProgress(10);
    setProgressStatus(
      refineCurrentModel
        ? 'Refining high-definition geometry with cloud engine...'
        : 'Connecting to Levitate3D Neural Engine & WORM Audit Logger...',
    );

    try {
      let imageUrlToSend = selectedImage;
      if (activeTab === 'SKETCH' && canvasRef.current) {
        imageUrlToSend = canvasRef.current.toDataURL('image/png');
      }

      const payload: any = {
        prompt_type: refineCurrentModel ? 'REFINE' : activeTab,
        prompt_text: promptText,
        image_url: imageUrlToSend || undefined,
        draft_task_id: refineCurrentModel && lastTaskId ? lastTaskId : undefined,
        user_email: currentUser?.email || 'alex.mercer@gmail.com',
      };

      setBillingNotice(null);
      setInsufficientError(null);

      const res = await api.startGeneration(payload);
      const taskId = res.task_id;
      const generationId = res.generation_id;
      setLastTaskId(taskId);

      if (typeof res.new_balance === 'number') {
        setWalletBalance(res.new_balance);
        setBillingNotice(
          res.message ||
            `✓ Deducted $${res.fee?.toFixed(2)} USD (${res.credits_used} credits) from wallet. Remaining balance: $${res.new_balance.toFixed(2)} USD.`,
        );
      }

      // Poll status every 1500ms
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.pollGenerationStatus(taskId);
          setProgress(statusRes.progress || 10);

          if (statusRes.progress < 30) {
            setProgressStatus('Synthesizing 3D volumetric neural geometry...');
          } else if (statusRes.progress < 60) {
            setProgressStatus('Generating UV texture coordinates and PBR materials...');
          } else if (statusRes.progress < 90) {
            setProgressStatus('Optimizing center of mass for magnetic levitation...');
          } else {
            setProgressStatus('Finalizing 3D mesh and streaming to display area...');
          }

          if (statusRes.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setProgressStatus('Cloud synthesis failed. Please try a different prompt.');
            return;
          }

          if (statusRes.status === 'SUCCESS' || statusRes.progress >= 100) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setProgress(100);
            setProgressStatus('3D Model generation complete!');

            const newModelUrl = statusRes.model_glb_url || '/models/sample_levitating_statue.glb';

            // Immediately send model to 3D display viewer!
            onModelGenerated({
              generationId,
              modelGlbUrl: newModelUrl,
              promptText: promptText,
              promptType: activeTab,
              previewUrl: statusRes.thumbnail_url || selectedImage || undefined,
              taskId,
            });

            setRenderNotice('3D Model rendered live in display area!');
          }
        } catch (err) {
          console.warn('Polling error:', err);
        }
      }, 1500);
    } catch (err: any) {
      console.error('Generation error:', err);
      setIsGenerating(false);
      if (err.message && err.message.includes('Insufficient wallet balance')) {
        setInsufficientError(err.message);
        setProgressStatus('Insufficient wallet balance. Please top up your wallet in Credential.');
      } else {
        setProgressStatus('Error initiating generation: ' + (err.message || 'Please check connection.'));
      }
    }
  };

  const hasActiveModel = !!generationData?.modelGlbUrl;
  const activeTaskKey = activeTab; // 'TEXT' | 'IMAGE' | 'SKETCH'
  const currentPrice =
    pricingTable?.tasks?.[activeTaskKey]?.retail_price_usd ?? (activeTab === 'TEXT' ? 0.25 : 0.30);
  const currentCredits =
    pricingTable?.tasks?.[activeTaskKey]?.retail_credits ?? (activeTab === 'TEXT' ? 25 : 30);
  const refinePrice = pricingTable?.tasks?.REFINE?.retail_price_usd ?? 0.50;
  const refineCredits = pricingTable?.tasks?.REFINE?.retail_credits ?? 50;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xl space-y-5 overflow-hidden">
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center space-x-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
            <span>Step 1 — Create & Fine-Tune Your 3D Sculpture</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Proprietary AI 3D Sculptor</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('TEXT')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'TEXT'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-cyan-600" />
            <span>Text</span>
          </button>
          <button
            onClick={() => setActiveTab('IMAGE')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'IMAGE'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-600" />
            <span>Photo</span>
          </button>
          <button
            onClick={() => setActiveTab('SKETCH')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SKETCH'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-cyan-600" />
            <span>Sketch</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Text Prompt */}
      {activeTab === 'TEXT' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Describe or fine-tune your statue (character, animal, object, styling)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Cloud AI ~25s</span>
            </div>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isGenerating && promptText.trim()) {
                    handleGenerate(false);
                  }
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition-all text-xs sm:text-sm shadow-sm"
              placeholder="e.g. A running dog, futuristic mechanical owl, samurai guardian..."
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>💡 Press <strong>Enter</strong> or click buttons below to render in display area.</span>
              <span className="font-mono text-cyan-700 font-bold">{promptText.length} chars</span>
            </div>
          </div>

          {/* User-Customizable Feature & Style Tags (Stored Per User) */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Tag className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-xs font-bold text-slate-800">Your Feature & Style Tags</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-medium flex items-center space-x-1">
                  <UserIcon className="w-2.5 h-2.5 text-cyan-700" />
                  <span>{currentUser?.email ? currentUser.email : 'Guest Session'}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {featureTags.length !== DEFAULT_FEATURE_TAGS.length && (
                  <button
                    type="button"
                    onClick={handleResetDefaultTags}
                    className="text-[11px] text-slate-500 hover:text-cyan-700 flex items-center space-x-1 transition-colors"
                    title="Restore default tags"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                {!isAddingTag && (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 bg-white hover:bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-200 shadow-sm flex items-center space-x-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-600 stroke-[2.5]" />
                    <span>Add New Tag</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline Add New Tag Form */}
            {isAddingTag && (
              <form onSubmit={handleAddFeatureTag} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  autoFocus
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="e.g. Polished bronze, neon cybernetic accents, glass armor..."
                  className="flex-1 bg-white border border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!newTagInput.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-colors whitespace-nowrap"
                >
                  Save Tag
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTagInput('');
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Tags Pills List */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {featureTags.map((tag, idx) => (
                <div
                  key={idx}
                  className="group inline-flex items-center bg-white hover:bg-cyan-50/70 border border-slate-200 hover:border-cyan-300 rounded-xl shadow-sm transition-all text-xs font-medium text-slate-700 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleApplyModifier(tag)}
                    className="px-2.5 py-1 text-left flex items-center space-x-1 text-slate-700 hover:text-cyan-800 transition-colors"
                    title={`Click to append "${tag}" to your prompt`}
                  >
                    <span className="text-cyan-600 font-bold">+</span>
                    <span>{tag}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFeatureTag(idx);
                    }}
                    className="px-1.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-l border-slate-100 transition-colors"
                    title={`Remove "${tag}" from your tags`}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              ))}

              {featureTags.length === 0 && (
                <span className="text-xs text-slate-400 italic py-1">
                  No custom tags yet. Click "+ Add New Tag" or "Reset" above.
                </span>
              )}
            </div>

            {/* Feedback / Notification Flash */}
            {tagSuccessFlash && (
              <div className="text-[11px] text-cyan-800 font-semibold bg-cyan-100/70 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 animate-fadeIn">
                <Check className="w-3 h-3 text-cyan-700 stroke-[3]" />
                <span>{tagSuccessFlash}</span>
              </div>
            )}
          </div>

          {/* Prompt Tip Banner */}
          <div className="bg-amber-50/90 border border-amber-200/90 px-3 py-2 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
            <span className="text-amber-600 font-bold shrink-0">💡 Tip:</span>
            <span>
              Always keep the subject in your prompt (e.g. <strong>"A running dog with golden yellow fur and realistic texture"</strong> instead of just <em>"yellow color"</em>) so the AI knows what to sculpt.
            </span>
          </div>

          {/* Quick preset pills */}
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5 font-medium">Or choose a quick inspiration prompt:</div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptText(p)}
                  className={`text-xs px-2.5 py-1 rounded-xl border transition-colors text-left font-medium ${
                    promptText === p
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-cyan-700 border-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Image Upload */}
      {activeTab === 'IMAGE' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 relative">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageFile}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {selectedImage ? (
              <div className="flex flex-col items-center space-y-2">
                <img src={selectedImage} alt="Selected source" className="h-32 object-contain rounded-xl shadow-md" />
                <span className="text-xs text-cyan-600 font-semibold">Click to replace source photo</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-1.5 py-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">Upload photo, character render, or artwork</div>
                <div className="text-[11px] text-slate-500">Supports .PNG, .JPG, .WEBP up to 25MB</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Canvas Sketchpad */}
      {activeTab === 'SKETCH' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Draw your statue concept directly with mouse or stylus</span>
            <button onClick={clearCanvas} className="text-rose-600 hover:underline font-semibold">
              Clear Canvas
            </button>
          </div>
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner flex justify-center">
            <canvas
              ref={canvasRef}
              width={560}
              height={220}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair w-full max-w-lg touch-none bg-white"
            />
          </div>
        </div>
      )}

      {/* Live Rendering Status / Banner if Model is active */}
      {hasActiveModel && !isGenerating && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <span className="font-bold block">3D Statue Rendered in Display Area!</span>
              <span className="text-[11px] text-emerald-700">
                Inspect your floating statue on the left (rotate, zoom, check details). Fine-tune prompt or proceed when ready.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar (during AI generation) */}
      {isGenerating && (
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-700 font-semibold flex items-center space-x-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600 shrink-0" />
              <span>{progressStatus}</span>
            </span>
            <span className="font-mono text-slate-700 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="pt-3 border-t border-slate-200 space-y-3">
        {/* Real-Time Digital Wallet & Tripo3D Scaled Rate Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                  Digital Wallet Balance:
                </span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  ${walletBalance !== null ? walletBalance.toFixed(2) : '175.00'} USD
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                Rate: <span className="font-semibold text-slate-700">${currentPrice.toFixed(2)} USD ({currentCredits} credits)</span> per generation • Scaled Tripo3D rate
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/credentials"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 text-xs transition-colors flex items-center space-x-1 shadow-sm"
              title="Top up wallet balance in Credentials"
            >
              <Plus className="w-3 h-3 text-cyan-600" />
              <span>Top Up Wallet</span>
            </Link>
          </div>
        </div>

        {/* Real-Time Billing & Wallet Deduction Feedback */}
        {billingNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{billingNotice}</span>
          </div>
        )}

        {/* Insufficient Funds Warning */}
        {insufficientError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{insufficientError}</span>
            </div>
            <Link
              href="/credentials"
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs whitespace-nowrap shadow-sm"
            >
              Reload Wallet
            </Link>
          </div>
        )}

        {/* Buttons Row */}
        <div className="grid grid-cols-12 gap-2.5 w-full">
          {/* Button 1: Render / Regenerate in Display Area with Scaled Fee Display */}
          <button
            type="button"
            disabled={isGenerating || !promptText.trim()}
            onClick={() => handleGenerate(false)}
            className={`${
              hasActiveModel ? 'col-span-12 sm:col-span-4' : 'col-span-12'
            } flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-cyan-600 text-cyan-700 hover:text-cyan-800 font-bold text-xs tracking-wide shadow-sm transition-all disabled:opacity-50`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-600 shrink-0" />
                <span>Generating (${currentPrice.toFixed(2)} USD)...</span>
              </>
            ) : hasActiveModel ? (
              <>
                <RefreshCw className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Re-generate (${currentPrice.toFixed(2)})</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Generate 3D Model (${currentPrice.toFixed(2)} USD / {currentCredits} cr)</span>
              </>
            )}
          </button>

          {/* Button 2: Refine High-Def Mesh (Available when model exists) */}
          {hasActiveModel && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGenerate(true)}
              className="col-span-12 sm:col-span-4 flex items-center justify-center space-x-1.5 py-3.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs tracking-wide shadow-sm transition-all disabled:opacity-50"
              title="Perform sub-millimeter mesh refinement and PBR baking"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Refine Mesh (${refinePrice.toFixed(2)})</span>
            </button>
          )}

          {/* Button 3: Proceed to Step 2 (Shown when a model has been rendered) */}
          {hasActiveModel && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={onProceedToCustomize}
              className="col-span-12 sm:col-span-4 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <span>Next: Customize</span>
              <ArrowRight className="w-4 h-4 text-white shrink-0" />
            </button>
          )}
        </div>

        {/* Fine-Tuning Tips */}
        {hasActiveModel && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>🔄 Adjust your prompt text above and click <strong>Re-generate</strong> to fine-tune details.</span>
            <span className="font-semibold text-emerald-700">Ready to proceed</span>
          </div>
        )}
      </div>
    </div>
  );
};
