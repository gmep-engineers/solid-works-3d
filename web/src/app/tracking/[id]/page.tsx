'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModelViewer } from '@/components/3d/ModelViewer';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Share2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '44444444-4444-4444-4444-444444444444';

  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTracking() {
      try {
        const data = await api.getOrderTracking(orderId);
        setTrackingData(data);
      } catch (err) {
        console.warn('Could not load tracking data, using demo state:', err);
        setTrackingData({
          order_id: orderId,
          order_number: 'LEV-2026-891042',
          current_status: 'QUALITY_CHECK_SHIPPED',
          size: 'LARGE',
          finish: 'TRANSLUCENT_GLOW',
          internal_led_lighting: true,
          carrier: 'DHL Express',
          tracking_number: 'DHL-9847291048',
          tracking_url: 'https://www.dhl.com/en/express/tracking.html?AWB=DHL-9847291048',
          refined_model_url: '/models/sample_levitating_statue.glb',
          share_token: 'share_alex_cyberpunk_samurai_2026',
          is_delivered: false,
          milestones: [
            {
              step: 1,
              key: 'ORDER_PLACED',
              label: 'Order Placed',
              description: 'Order confirmed and locked into WORM legal ledger.',
              status: 'COMPLETED',
            },
            {
              step: 2,
              key: 'DESIGNER_REFINING',
              label: '3D Designer Refining Model',
              description: 'Supplier 3D engineer preparing magnet cavity and internal wiring channels.',
              status: 'COMPLETED',
            },
            {
              step: 3,
              key: 'REFINED_MODEL_READY',
              label: 'Refined 3D Model Ready',
              description: '3D print-ready model calibrated for magnetic levitation balance.',
              status: 'COMPLETED',
            },
            {
              step: 4,
              key: 'PRINTING_LED_ASSEMBLY',
              label: '3D Printing & LED Assembly',
              description: 'Statue 3D printing, inductive coil mounting, and LED illumination wiring.',
              status: 'COMPLETED',
            },
            {
              step: 5,
              key: 'QUALITY_CHECK_SHIPPED',
              label: 'Quality Check & Shipped',
              description: 'Levitation balance tested. Boxed with magnetic floating base & power supply.',
              status: 'IN_PROGRESS',
            },
            {
              step: 6,
              key: 'DELIVERED',
              label: 'Delivered',
              description: 'Statue delivered. Social Media Showcase Kit unlocked!',
              status: 'PENDING',
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    loadTracking();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-cyan-700 font-bold">
        Loading live milestone tracker...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
            <span>Live Order Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Order #{trackingData.order_number}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Statue Size: {trackingData.size} • Finish: {trackingData.finish} • Internal LEDs:{' '}
            {trackingData.internal_led_lighting ? 'Active' : 'Standard'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/worm?orderId=${trackingData.order_id}`}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-emerald-700 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verify WORM Audit</span>
          </Link>

          {trackingData.share_token && (
            <Link
              href={`/showcase/${trackingData.share_token}`}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>Social Share Kit</span>
            </Link>
          )}
        </div>
      </div>

      {/* Client Approval Action Card */}
      {(trackingData.requires_client_approval || ['PENDING_CLIENT_APPROVAL', 'REFINED_MODEL_READY'].includes(trackingData.current_status)) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Step 4: Your Approval Required to Begin 3D Printing</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              The Manufacturer Has Refined Your 3D Model!
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              The 3D engineering lab has carved the 18.2mm Neodymium N52 magnet socket and calibrated the center of mass for levitation balance.
              Inspect the refined 3D sculpture below. Once you approve, the manufacturer will immediately begin high-resolution 3D printing and fabrication.
            </p>
          </div>
          <button
            onClick={async () => {
              await api.clientApproveRefinedModel(orderId, 'Client inspected and approved refined 3D model.');
              alert('✓ Refined Model Approved! The manufacturer has been authorized to begin 3D printing & LED assembly.');
              window.location.reload();
            }}
            className="w-full md:w-auto whitespace-nowrap px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Approve Model & Start Printing</span>
          </button>
        </div>
      )}

      {/* Client Rejection & Refund Card */}
      {(trackingData.is_rejected || trackingData.current_status === 'ORDER_REJECTED') && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-rose-800 font-black text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>Order Not Approved by Engineering Review • Full Refund Issued</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-rose-950">
              Order Cancelled by Engineering Feasibility Check
            </h3>
            <p className="text-xs text-rose-800 max-w-2xl leading-relaxed">
              <strong>Reason:</strong> {trackingData.rejection_reason || 'UNPRINTABLE_PHYSICAL_GEOMETRY'}<br />
              <strong>Feedback:</strong> {trackingData.rejection_notes || 'The 3D model geometry cannot achieve stable magnetic levitation balance or violates structural minimum thickness.'}
            </p>
            <div className="text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-3 py-1.5 rounded-xl inline-block mt-1">
              ✓ Full payment has been automatically refunded to your original payment method.
            </div>
          </div>
          <Link
            href="/studio"
            className="w-full md:w-auto whitespace-nowrap px-6 py-3.5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span>Return to Studio to Adjust Model</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Grid: 3D Model Preview on Left, Milestone Tracker on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Model Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <ModelViewer
            modelUrl={trackingData.refined_model_url}
            internalLed={trackingData.internal_led_lighting}
            finish={trackingData.finish}
            size={trackingData.size}
            autoRotate={true}
          />

          {/* Leg 1: Factory Inbound Freight to US Hub */}
          {trackingData.inbound_freight && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2 text-indigo-800 font-bold">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Leg 1: Inbound Freight to US Hub</span>
                </span>
                <span className="font-mono text-slate-700 font-bold">{trackingData.inbound_freight.carrier}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Route: {trackingData.inbound_freight.origin} → {trackingData.inbound_freight.destination}
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-slate-900 font-bold">{trackingData.inbound_freight.tracking_number}</span>
                <a
                  href={trackingData.inbound_freight.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-700 hover:underline flex items-center space-x-1 font-bold"
                >
                  <span>Track Inbound</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Leg 2: US Company Hub to End Client */}
          {trackingData.tracking_number && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2 text-cyan-800 font-bold">
                  <Truck className="w-4 h-4 text-cyan-600" />
                  <span>Leg 2: Final Outbound Delivery to You</span>
                </span>
                <span className="font-mono text-slate-700 font-bold">{trackingData.carrier}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Dispatched from Levitate3D US Hub directly to your delivery address.
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-slate-900 font-bold">{trackingData.tracking_number}</span>
                <a
                  href={trackingData.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-700 hover:underline flex items-center space-x-1 font-bold"
                >
                  <span>Track Package</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right: Milestone Steps Tracker */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <span>Two-Stage Fulfillment Journey</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Manufacturer → US Company Hub → Client
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-slate-200">
            {trackingData.milestones?.map((m: any, idx: number) => {
              const isCompleted = m.status === 'COMPLETED';
              const isInProgress = m.status === 'IN_PROGRESS';

              return (
                <div key={idx} className="relative flex items-start space-x-4 pl-1">
                  {/* Step Icon */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : isInProgress
                        ? 'bg-cyan-600 text-white ring-4 ring-cyan-100 animate-pulse'
                        : 'bg-white border border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : m.step}
                  </div>

                  {/* Step Description */}
                  <div className="flex-1 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isCompleted ? 'text-slate-900' : isInProgress ? 'text-cyan-800' : 'text-slate-500'}`}>
                        {m.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isInProgress
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{m.description}</p>

                    {m.facility && (
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 pt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Facility: {m.facility}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
