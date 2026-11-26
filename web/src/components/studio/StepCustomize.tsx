'use client';

import React from 'react';
import { Sparkles, Zap, Layers, Palette, MessageSquare, ArrowRight, Check, ShieldCheck } from 'lucide-react';

export interface CustomizationState {
  baseOption: string;
  internalLed: boolean;
  size: 'STANDARD' | 'LARGE';
  finish: 'MATTE_WHITE' | 'TRANSLUCENT_GLOW' | 'FULL_COLOR';
  designerNotes: string;
  referenceImageUrl?: string;
}

interface StepCustomizeProps {
  customization: CustomizationState;
  onChange: (updated: Partial<CustomizationState>) => void;
  onProceedToCheckout: () => void;
  onBackToCreate: () => void;
}

export const StepCustomize: React.FC<StepCustomizeProps> = ({
  customization,
  onChange,
  onProceedToCheckout,
  onBackToCreate,
}) => {
  // Price computation
  const basePrice = 149.0;
  const sizeDelta = customization.size === 'LARGE' ? 40.0 : 0.0;
  const ledDelta = customization.internalLed ? 35.0 : 0.0;
  const finishDelta =
    customization.finish === 'TRANSLUCENT_GLOW'
      ? 15.0
      : customization.finish === 'FULL_COLOR'
      ? 35.0
      : 0.0;
  const shippingPrice = 15.0;
  const totalPrice = basePrice + sizeDelta + ledDelta + finishDelta + shippingPrice;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xl space-y-5 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-0.5">
          <span className="w-2 h-2 rounded-full bg-cyan-600" />
          <span>Step 2 — Engineering & Lighting Customization</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Configure Your Levitation Platform</h2>
      </div>

      {/* 1. Base Option (Included) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 border border-cyan-200 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
              <span>Custom Magnetic Floating & Illumination Base</span>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.2 rounded-full border border-cyan-200">
                Included
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Active electromagnetic base with illuminated neon halo ring and 12V adapter.
            </div>
          </div>
        </div>
        <div className="text-xs font-mono text-cyan-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
          $149.00
        </div>
      </div>

      {/* 2. Internal Statue Embedded LED Lighting Toggle */}
      <div
        onClick={() => onChange({ internalLed: !customization.internalLed })}
        className={`cursor-pointer p-4 rounded-2xl border transition-all ${
          customization.internalLed
            ? 'bg-cyan-50/70 border-cyan-400 shadow-sm'
            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                customization.internalLed
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <span>Internal Wireless Inductive Statue Lighting</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.2 rounded-full border border-indigo-200">
                  +$35.00
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Embeds inductive receiver coil inside statue core powering embedded LEDs in mid-air (no batteries). 
                Flags job for internal wiring conduit hollowing.
              </p>
            </div>
          </div>

          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 mt-0.5 ${
              customization.internalLed
                ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm'
                : 'border-slate-300 bg-white'
            }`}
          >
            {customization.internalLed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      </div>

      {/* 3. Size & Finish Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Size Selection */}
        <div>
          <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
            <span>Sculpture Scale</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ size: 'STANDARD' })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                customization.size === 'STANDARD'
                  ? 'bg-cyan-50/80 border-cyan-500 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">Standard 12cm</div>
              <div className="text-[10px] text-slate-500">Included (Ideal Desk)</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ size: 'LARGE' })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                customization.size === 'LARGE'
                  ? 'bg-cyan-50/80 border-cyan-500 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">Large 18cm</div>
              <div className="text-[10px] text-cyan-700 font-semibold">+$40.00</div>
            </button>
          </div>
        </div>

        {/* Finish Selection */}
        <div>
          <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-cyan-600" />
            <span>Material & Finish</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'MATTE_WHITE', label: 'Matte White', extra: '$0' },
              { id: 'TRANSLUCENT_GLOW', label: 'Glow Resin', extra: '+$15' },
              { id: 'FULL_COLOR', label: 'Full Color', extra: '+$35' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ finish: f.id as any })}
                className={`p-2 rounded-xl border text-center transition-all ${
                  customization.finish === f.id
                    ? 'bg-cyan-50/80 border-cyan-500 shadow-sm text-slate-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="text-xs truncate">{f.label}</div>
                <div className="text-[10px] text-slate-500">{f.extra}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Designer Adjustment Notes */}
      <div>
        <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
          <span>Designer Refinement Notes</span>
        </label>
        <textarea
          rows={2}
          value={customization.designerNotes}
          onChange={(e) => onChange({ designerNotes: e.target.value })}
          placeholder="e.g. Smooth the face, hollow the torso for translucent LED glow, thicken magnetic socket cavity..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition-all text-xs shadow-sm"
        />
      </div>

      {/* Pricing Summary & Proceed Action Bar (Strictly Contained Inside Box) */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">All-Inclusive Total</div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              ${totalPrice.toFixed(2)} <span className="text-xs font-semibold text-slate-500">USD</span>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>Hardware Base + LEDs + 3D Model</div>
            <div className="text-emerald-700 font-semibold">+ $15 Express Courier Included</div>
          </div>
        </div>

        {/* Buttons Row - Guaranteed 100% inside container */}
        <div className="grid grid-cols-12 gap-2.5 w-full">
          <button
            type="button"
            onClick={onBackToCreate}
            className="col-span-3 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors text-center"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onProceedToCheckout}
            className="col-span-9 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Proceed to Fast Checkout</span>
            <ArrowRight className="w-4 h-4 text-white shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
