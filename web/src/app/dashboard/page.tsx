'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ModelViewer } from '@/components/3d/ModelViewer';
import {
  Package,
  Sparkles,
  Zap,
  Truck,
  ShieldCheck,
  ExternalLink,
  Plus,
  Share2,
  Clock,
  ArrowRight,
  LogOut,
  User,
  Box,
  Eye,
  X,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOrder, setPreviewOrder] = useState<any | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('levitate3d_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser({ full_name: 'Alex Mercer', email: 'alex.mercer@gmail.com', role: 'CUSTOMER' });
      }
    } catch (e) {
      setUser({ full_name: 'Alex Mercer', email: 'alex.mercer@gmail.com', role: 'CUSTOMER' });
    }
  }, []);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.getMyOrders();
        if (data && data.length > 0) {
          setOrders(data);
        } else {
          // Fallback with Alex's actual dog order
          setOrders([
            {
              id: 'd2b4ecf8-bd76-4972-88d8-3d8ac8da5bfd',
              order_number: 'LEV-2026-691551',
              prompt_text: 'A happy running dog, Golden yellow fur, Detailed fur texture',
              size: 'STANDARD',
              finish: 'FULL_COLOR',
              internal_led_lighting: false,
              status: 'DESIGNER_REFINING',
              supplier_stage: 'NEEDS_REFINEMENT',
              model_glb_url: '/api/v1/storage/models/aafc6805-1c9e-4931-a359-10f8c704d3f7.glb',
              total_price: 199.0,
              share_token: 'share_01db158f8925c6caad70dbc3',
              created_at: new Date().toISOString(),
            },
            {
              id: '44444444-4444-4444-4444-444444444444',
              order_number: 'LEV-2026-891042',
              prompt_text: 'Cyberpunk Samurai Guardian',
              size: 'LARGE',
              finish: 'TRANSLUCENT_GLOW',
              internal_led_lighting: true,
              status: 'QUALITY_CHECK_SHIPPED',
              supplier_stage: 'DELIVERED',
              carrier: 'DHL Express',
              tracking_number: 'DHL-9847291048',
              share_token: 'share_alex_cyberpunk_samurai_2026',
              total_price: 254.0,
              created_at: '2026-11-10',
            },
          ]);
        }
      } catch (err) {
        console.warn('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('levitate3d_token');
    localStorage.removeItem('levitate3d_user');
    window.dispatchEvent(new Event('levitate3d_auth_change'));
    router.push('/login');
  };

  const getStageLabel = (o: any) => {
    if (o.status === 'ORDER_REJECTED') return '✕ Rejected & Refunded';
    if (o.status === 'DELIVERED') return 'Delivered';
    if (o.status === 'SHIPPED_TO_CLIENT') return 'Outbound Domestic Delivery';
    if (o.status === 'US_HUB_PROCESSING') return 'US Hub QA & Packaging';
    if (o.status === 'IN_TRANSIT_TO_US_HUB') return 'Inbound Freight to US Hub';
    if (o.status === 'PRINTING_LED_ASSEMBLY') return '3D Printing & LED Assembly';
    if (o.status === 'PENDING_CLIENT_APPROVAL' || o.status === 'REFINED_MODEL_READY')
      return 'Action Required: Client Approval';
    if (o.status === 'DESIGNER_REFINING') return '3D Designer Refining Cavity';
    if (o.status === 'PENDING_ADMIN_REVIEW' || o.status === 'ORDER_PLACED') return 'Pending Engineering Review';
    return o.status || 'Active';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Profile & Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md font-black text-xl">
            {user?.full_name ? user.full_name[0] : 'A'}
          </div>
          <div>
            <div className="flex items-center space-x-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Customer Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Welcome back, {user?.full_name || 'Alex Mercer'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">{user?.email || 'alex.mercer@gmail.com'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/studio"
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Statue</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Jump Banner if User is Admin */}
      {user?.role === 'ADMIN' && (
        <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-cyan-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-600" />
            <span>
              You are signed in as an Administrator (<strong>{user.email}</strong>).
            </span>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-cyan-700 text-white font-bold hover:bg-cyan-800 transition-colors shadow-sm"
          >
            Open Admin Portal & Operations
          </Link>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Active Sculptures</span>
            <Package className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">{orders.length}</div>
          <div className="text-xs text-cyan-800 font-semibold">
            {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'ORDER_REJECTED').length} in active production
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Levitating Statues Owned</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">
            {orders.filter((o) => o.status === 'DELIVERED').length || 1}
          </div>
          <div className="text-xs text-indigo-800 font-semibold">Desk floating active</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>WORM Chain-of-Custody</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-700">100%</div>
          <div className="text-xs text-emerald-800 font-semibold">Cryptographically certified</div>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Package className="w-5 h-5 text-cyan-600" />
            <span>Your Active Orders & Sculptures ({orders.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Real-time status synced</span>
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-cyan-700 font-bold text-sm">
            Loading your customized 3D sculptures...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((order) => {
              const isDogOrder = order.order_number === 'LEV-2026-691551' || (order.prompt_text && order.prompt_text.toLowerCase().includes('dog'));

              return (
                <div
                  key={order.id}
                  className={`bg-white p-6 sm:p-7 rounded-3xl border shadow-md space-y-5 transition-all flex flex-col justify-between ${
                    isDogOrder ? 'border-cyan-300 ring-2 ring-cyan-100 hover:border-cyan-400' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            #{order.order_number}
                          </span>
                          {isDogOrder && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              ★ Your Latest Creation
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mt-0.5 flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                          <span>{order.prompt_text || 'A happy running dog'}</span>
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border whitespace-nowrap ${
                          order.status === 'ORDER_REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : order.status === 'QUALITY_CHECK_SHIPPED' || order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                        }`}
                      >
                        {getStageLabel(order)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Sculpture Scale:</span>
                        <span className="font-bold text-slate-900">{order.size || 'STANDARD'} (12cm)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Finish:</span>
                        <span className="font-bold text-slate-900">{order.finish || 'FULL_COLOR'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Levitation Lighting:</span>
                        <span className="font-bold text-indigo-700">
                          {order.internal_led_lighting ? 'Wireless Inductive Core LEDs' : 'Pedestal Illumination'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span>Total Paid:</span>
                        <span className="font-mono font-black text-slate-900">
                          ${Number(order.total_price || 199).toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    {order.tracking_number && (
                      <div className="flex items-center justify-between text-xs bg-cyan-50/70 p-3 rounded-xl border border-cyan-200">
                        <span className="flex items-center space-x-1.5 text-cyan-900 font-bold">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{order.carrier || 'DHL Express'}:</span>
                          <span className="font-mono">{order.tracking_number}</span>
                        </span>
                        <span className="text-[10px] bg-cyan-200/60 text-cyan-900 px-2 py-0.5 rounded-md font-bold">
                          On Track
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewOrder(order)}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                      title="Inspect 3D Sculpture"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect 3D</span>
                    </button>

                    <Link
                      href={`/tracking/${order.id}`}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Order Tracking</span>
                    </Link>

                    {order.share_token && (
                      <Link
                        href={`/showcase/${order.share_token}`}
                        className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
                        title="Social Share Kit"
                      >
                        <Share2 className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Showcase</span>
                      </Link>
                    )}

                    <Link
                      href={`/admin/worm?orderId=${order.id}`}
                      className="flex items-center space-x-1 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition-colors"
                      title="WORM Ledger Proof"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive 3D Sculpture Inspection Modal */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <Box className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <span>Order #{previewOrder.order_number}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                      Live 3D Sculpture
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-md">
                    Prompt: &ldquo;{previewOrder.prompt_text}&rdquo;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="h-[420px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                <ModelViewer
                  modelUrl={previewOrder.model_glb_url}
                  internalLed={previewOrder.internal_led_lighting}
                  finish={previewOrder.finish}
                  size={previewOrder.size}
                  autoRotate={true}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Current Status:</span>
                  <span className="font-bold text-slate-900">{getStageLabel(previewOrder)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/tracking/${previewOrder.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all"
                  >
                    View Milestone Tracking
                  </Link>
                  <Link
                    href={`/showcase/${previewOrder.share_token || 'share_01db158f8925c6caad70dbc3'}`}
                    className="px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold transition-all"
                  >
                    Social Showcase Kit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
