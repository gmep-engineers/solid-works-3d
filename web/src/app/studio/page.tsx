'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModelViewer } from '@/components/3d/ModelViewer';
import { StepCreate } from '@/components/studio/StepCreate';
import { StepCustomize, CustomizationState } from '@/components/studio/StepCustomize';
import { StepCheckout } from '@/components/studio/StepCheckout';
import { Sparkles, Layers, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function StudioPage() {
  const router = useRouter();

  // Studio Flow State: 1 = Create, 2 = Customize, 3 = Checkout
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Generated 3D Model State
  const [generationData, setGenerationData] = useState<{
    generationId: string;
    modelGlbUrl: string;
    promptText: string;
    promptType: 'TEXT' | 'IMAGE' | 'SKETCH';
    previewUrl?: string;
  } | null>(null);

  // Customization Specs State
  const [customization, setCustomization] = useState<CustomizationState>({
    baseOption: 'MAGNETIC_LEVITATING_BASE',
    internalLed: false,
    size: 'STANDARD',
    finish: 'FULL_COLOR',
    designerNotes:
      'Please ensure hollow conduit for internal LED inductive receiver coil and calibrate center of gravity for levitation balance.',
  });

  const handleModelGenerated = (data: any) => {
    setGenerationData(data);
    // Keep user on Step 1 so they can inspect in display area and fine-tune prompt if desired
  };

  const handleUpdateCustomization = (updated: Partial<CustomizationState>) => {
    setCustomization((prev) => ({ ...prev, ...updated }));
  };

  const handleOrderCompleted = (orderId: string, orderNumber: string) => {
    router.push(`/tracking/${orderId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Studio Header (Compact) */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Sculpt in AI. <span className="gradient-text">Levitate on Your Desk.</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-normal">
          AI 3D generation with precision magnetic levitation and wireless inductive illumination.
        </p>

        {/* 3-Step Stepper Progress Bar */}
        <div className="pt-3 max-w-xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-cyan-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            />

            {[
              { num: 1, label: '1. Create (AI Sculpt)' },
              { num: 2, label: '2. Customize & LEDs' },
              { num: 3, label: '3. Fast Checkout' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num as any)}
                className={`relative z-10 flex flex-col items-center group transition-all ${
                  currentStep >= s.num ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    currentStep === s.num
                      ? 'bg-cyan-600 text-white ring-4 ring-cyan-100 shadow-md'
                      : currentStep > s.num
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep > s.num ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : s.num}
                </div>
                <span className="text-[10px] font-semibold mt-1">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Interactive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Interactive Three.js 3D Viewer */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
          <ModelViewer
            modelUrl={generationData?.modelGlbUrl}
            internalLed={customization.internalLed}
            finish={customization.finish}
            size={customization.size}
            autoRotate={true}
          />

          {/* Quick Real-Time Spec Badges */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Levitation Field</span>
              <span className="font-bold text-cyan-700">Neodymium N52</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Statue Lighting</span>
              <span className="font-bold text-indigo-700">
                {customization.internalLed ? 'Wireless Inductive' : 'Pedestal Ring'}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Legal Protection</span>
              <span className="font-bold text-emerald-700">WORM SHA-256</span>
            </div>
          </div>
        </div>

        {/* Right Side: Step Card */}
        <div className="lg:col-span-6">
          {currentStep === 1 && (
            <StepCreate
              generationData={generationData}
              onModelGenerated={handleModelGenerated}
              onProceedToCustomize={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <StepCustomize
              customization={customization}
              onChange={handleUpdateCustomization}
              onProceedToCheckout={() => setCurrentStep(3)}
              onBackToCreate={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StepCheckout
              generationId={generationData?.generationId}
              customization={customization}
              onOrderCompleted={handleOrderCompleted}
              onBackToCustomize={() => setCurrentStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
