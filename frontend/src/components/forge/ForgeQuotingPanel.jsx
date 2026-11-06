import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Download,
  Truck,
  Layers,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Info
} from 'lucide-react';
import { api } from '../../api';

export default function ForgeQuotingPanel({
  sessionId,
  sessionState,
  selectedMaterial,
  onMaterialChange,
  onOrderSuccess
}) {
  const [deliveryMode, setDeliveryMode] = useState('shared_batch'); // 'shared_batch' (30% off) | 'express'
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const quote = sessionState?.quote || {};
  const tiers = quote.tiers || {};
  const currentTier = tiers[selectedMaterial] || tiers['bronze_infused_steel'] || {};

  const isHollowed = sessionState?.is_hollowed;
  const solidVol = sessionState?.solid_volume_cm3 || 0;
  const hollowVol = sessionState?.hollowed_volume_cm3 || solidVol;
  const activeVol = isHollowed ? hollowVol : solidVol;
  const savingsUsd = currentTier.savings_from_hollowing_usd || 0;
  const savingsPct = currentTier.savings_percent || 0;

  const currentPrice = deliveryMode === 'shared_batch'
    ? currentTier.shared_batch_price_usd
    : currentTier.express_price_usd;

  const handlePlaceOrder = async () => {
    setIsOrdering(true);
    try {
      const res = await api.forgePlaceOrder(sessionId, {
        material_id: selectedMaterial,
        delivery_mode: deliveryMode
      });
      setOrderResult(res);
      if (onOrderSuccess) onOrderSuccess(res);
    } catch (err) {
      alert(`Order error: ${err.message}`);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full space-y-4 text-left">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            Live Metal Quoting & Order
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            SLM/DMLS Additive Manufacturing & Foundry Finishing
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
          Direct-to-Consumer
        </span>
      </div>

      {/* AI Cost Savings Hero Card */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/40 border border-emerald-500/40 rounded-xl p-3.5 space-y-2 relative overflow-hidden shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <TrendingDown className="w-4 h-4" />
            <span>AI Metal Powder Reduction</span>
          </div>
          {isHollowed ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 animate-pulse">
              Hollowing Saved -${savingsUsd.toFixed(2)} USD
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">Solid Mesh</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-center pt-1">
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Solid Volume</span>
            <span className="text-xs font-bold text-slate-300">{solidVol.toFixed(1)} cm³</span>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-lg border border-emerald-500/40">
            <span className="text-[10px] text-emerald-400 block">Active Print Volume</span>
            <span className="text-xs font-bold text-emerald-300">{activeVol.toFixed(1)} cm³</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
          {isHollowed ? (
            <>
              ✓ <span className="font-semibold text-emerald-300">{savingsPct}% powder reduction</span> with built-in base drainage port. Unfused metal powder drains cleanly for reuse.
            </>
          ) : (
            <>
              Click <span className="text-cyan-300 font-semibold font-mono">Auto-Hollow</span> in the left CAD panel to hollow the interior and save up to 60% in metal printing costs!
            </>
          )}
        </p>
      </div>

      {/* Metal Alloy Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Select Metal Alloy & Finish
        </label>
        <div className="space-y-2">
          {Object.entries(tiers).map(([matId, tier]) => {
            const isSelected = selectedMaterial === matId;
            return (
              <button
                key={matId}
                type="button"
                onClick={() => onMaterialChange(matId)}
                className={`w-full p-3 rounded-xl border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-700"
                      style={{ backgroundColor: tier.color_hex }}
                    />
                    <span className="text-xs font-bold text-white">{tier.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{tier.finish}</div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-cyan-300">
                    ${deliveryMode === 'shared_batch' ? tier.shared_batch_price_usd : tier.express_price_usd}
                  </div>
                  {tier.savings_from_hollowing_usd > 0 && (
                    <div className="text-[9px] text-emerald-400">
                      -${tier.savings_from_hollowing_usd} saved
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Build-Plate Batch vs Express Dedicated Run */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Batch & Delivery Option
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDeliveryMode('shared_batch')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              deliveryMode === 'shared_batch'
                ? 'bg-cyan-950/60 border-cyan-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">30% OFF</span>
              <span className="text-[10px] font-mono text-slate-400">12 Days</span>
            </div>
            <div className="text-xs font-bold text-white mt-1">Shared Build-Plate</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Nested with batch</div>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryMode('express')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              deliveryMode === 'express'
                ? 'bg-cyan-950/60 border-cyan-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">Express</span>
              <span className="text-[10px] font-mono text-slate-400">4 Days</span>
            </div>
            <div className="text-xs font-bold text-white mt-1">Dedicated Run</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Priority chamber</div>
          </button>
        </div>
      </div>

      {/* Checkout Summary & Action Buttons */}
      <div className="pt-2 border-t border-slate-800 space-y-2 mt-auto">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Estimated Total:</span>
          <div className="text-right">
            <span className="text-xl font-extrabold text-white font-mono">
              ${currentPrice || '38.00'}
            </span>
            <span className="text-[10px] text-slate-500 ml-1">USD</span>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isOrdering}
          className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-sans tracking-wide"
        >
          <ShoppingBag className="w-4 h-4 text-slate-950" />
          <span>Order Custom Metal Print</span>
        </button>

        {/* Manufacturing Download Exports */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`/api/forge/sessions/${sessionId}/download/stl`}
            download
            className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download STL
          </a>
          <a
            href={`/api/forge/sessions/${sessionId}/download/glb`}
            download
            className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export GLB
          </a>
        </div>
      </div>

      {/* Order Success Modal */}
      {orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Order Confirmed!</h4>
                <p className="text-xs text-slate-400 font-mono">ID: {orderResult.order_id}</p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Material:</span>
                <span className="font-semibold text-white">{orderResult.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Production Mode:</span>
                <span className="font-semibold text-cyan-300">{orderResult.delivery_mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Paid:</span>
                <span className="font-bold text-emerald-400 font-mono">${orderResult.total_price_usd} USD</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your CAD model has been sliced and queued for direct metal laser sintering (DMLS/SLM). Track production updates in your Order Tracker.
            </p>

            <button
              onClick={() => setOrderResult(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
            >
              Continue Customizing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
