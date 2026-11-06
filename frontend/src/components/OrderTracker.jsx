import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Flame,
  Wrench,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Columns2,
  LayoutList,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Copy,
  Check,
  FileCode,
  FileCheck,
  Download,
  Gauge,
  Thermometer,
  Zap,
  Activity
} from 'lucide-react';

const STAGES = [
  { key: 'SUBMITTED', label: 'Order Placed', icon: Package, desc: 'DFM verified and scheduled' },
  { key: 'DFM_APPROVED', label: 'CAM / Slicing', icon: Layers, desc: 'Laser toolpaths generated' },
  { key: 'PRINTING', label: 'Laser Sintering', icon: Flame, desc: 'DMLS powder bed fusion' },
  { key: 'HEAT_TREATMENT', label: 'Stress Relief & HIP', icon: Flame, desc: 'Vacuum furnace cycle' },
  { key: 'SECONDARY_MACHINING', label: 'CNC Machining', icon: Wrench, desc: 'Wire EDM & thread tapping' },
  { key: 'QUALITY_INSPECTION', label: 'CMM Inspection', icon: ShieldCheck, desc: 'Precision dimensional scan' },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck, desc: 'Handed to carrier' },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, desc: 'Received and verified' }
];

const STAGE_COLORS = {
  SUBMITTED: 'bg-slate-800 text-slate-300 border-slate-700',
  DFM_APPROVED: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60',
  PRINTING: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60',
  HEAT_TREATMENT: 'bg-amber-950/70 text-amber-300 border-amber-600/60',
  SECONDARY_MACHINING: 'bg-blue-950/70 text-blue-300 border-blue-600/60',
  QUALITY_INSPECTION: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60',
  SHIPPED: 'bg-purple-950/70 text-purple-300 border-purple-600/60',
  DELIVERED: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80'
};

export default function OrderTracker({ initialOrderId = null, onSelectOrderForView }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialOrderId || '');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PRODUCTION' | 'SHIPPED' | 'DELIVERED'
  const [sortOption, setSortOption] = useState('NEWEST'); // 'NEWEST' | 'OLDEST' | 'PRICE_HIGH' | 'PRICE_LOW'
  const [viewMode, setViewMode] = useState('split'); // 'split' (Master-Detail) | 'table' (High-Density Table)
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pageSize = viewMode === 'split' ? 7 : 10;

  const fetchOrders = async (selectTargetId = null) => {
    setIsLoading(true);
    try {
      const list = await api.getUserOrders();
      setOrders(list);

      const target = selectTargetId || initialOrderId;
      if (target) {
        const found = list.find((o) => o.id.toLowerCase() === target.toLowerCase());
        if (found) {
          const detailed = await api.getOrder(found.id);
          setSelectedOrder(detailed);
        } else if (list.length > 0) {
          const detailed = await api.getOrder(list[0].id);
          setSelectedOrder(detailed);
        }
      } else if (list.length > 0 && !selectedOrder) {
        const detailed = await api.getOrder(list[0].id);
        setSelectedOrder(detailed);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(initialOrderId);
  }, [initialOrderId]);

  const handleSelectOrder = async (orderId) => {
    if (selectedOrder?.id === orderId) return;
    setIsLoading(true);
    try {
      const detailed = await api.getOrder(orderId);
      setSelectedOrder(detailed);
      if (viewMode === 'table') {
        setViewMode('split');
      }
    } catch (err) {
      console.error('Failed to load order detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compute status counts for filter badges
  const statusCounts = useMemo(() => {
    const total = orders.length;
    const inProduction = orders.filter((o) =>
      ['SUBMITTED', 'DFM_APPROVED', 'PRINTING', 'HEAT_TREATMENT', 'SECONDARY_MACHINING', 'QUALITY_INSPECTION'].includes(o.status)
    ).length;
    const shipped = orders.filter((o) => o.status === 'SHIPPED').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    return { total, inProduction, shipped, delivered };
  }, [orders]);

  // Filter & Sort orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((ord) => {
        // Status tab filter
        if (statusFilter === 'PRODUCTION') {
          if (!['SUBMITTED', 'DFM_APPROVED', 'PRINTING', 'HEAT_TREATMENT', 'SECONDARY_MACHINING', 'QUALITY_INSPECTION'].includes(ord.status)) {
            return false;
          }
        } else if (statusFilter === 'SHIPPED') {
          if (ord.status !== 'SHIPPED') return false;
        } else if (statusFilter === 'DELIVERED') {
          if (ord.status !== 'DELIVERED') return false;
        }

        // Search query filter (Order ID, filename, material, tracking number)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = ord.id?.toLowerCase().includes(q);
          const matchesFile = ord.filename?.toLowerCase().includes(q);
          const matchesMat = ord.material_name?.toLowerCase().includes(q);
          const matchesTrk = ord.tracking_number?.toLowerCase().includes(q);
          if (!matchesId && !matchesFile && !matchesMat && !matchesTrk) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
        if (sortOption === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
        if (sortOption === 'PRICE_HIGH') return b.total_price - a.total_price;
        if (sortOption === 'PRICE_LOW') return a.total_price - b.total_price;
        return 0;
      });
  }, [orders, statusFilter, searchQuery, sortOption]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortOption, viewMode]);

  // Paginated slice
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const getCurrentStageIndex = (status) => {
    const idx = STAGES.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentIdx = selectedOrder ? getCurrentStageIndex(selectedOrder.status) : 0;
  const isPrintingActive = selectedOrder?.status === 'PRINTING';

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Package className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Live Production <span className="text-cyan-400 font-mono text-sm font-semibold">& Telemetry Tracker</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SLM Sensor Stream Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time telemetry from DMLS powder bed fusion chambers, 5-axis CNC machining, and automated logistics tracking.
          </p>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
            <div className="text-sm font-bold font-mono text-white">{statusCounts.total}</div>
          </div>
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-center min-w-[85px]">
            <div className="text-[10px] text-cyan-400 uppercase font-semibold">In Sintering</div>
            <div className="text-sm font-bold font-mono text-cyan-300">{statusCounts.inProduction}</div>
          </div>
          <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl px-3 py-1.5 text-center min-w-[75px]">
            <div className="text-[10px] text-purple-400 uppercase font-semibold">Shipped</div>
            <div className="text-sm font-bold font-mono text-purple-300">{statusCounts.shipped}</div>
          </div>
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-center min-w-[80px]">
            <div className="text-[10px] text-emerald-400 uppercase font-semibold">Delivered</div>
            <div className="text-sm font-bold font-mono text-emerald-300">{statusCounts.delivered}</div>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Refresh Order Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Status Filters, View Mode Toggle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, CAD part, alloy, or tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'All Orders', count: statusCounts.total },
            { key: 'PRODUCTION', label: 'In Production', count: statusCounts.inProduction },
            { key: 'SHIPPED', label: 'Shipped', count: statusCounts.shipped },
            { key: 'DELIVERED', label: 'Delivered', count: statusCounts.delivered }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.key ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort & View Mode Switcher */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="NEWEST">Date: Newest First</option>
            <option value="OLDEST">Date: Oldest First</option>
            <option value="PRICE_HIGH">Total: High to Low</option>
            <option value="PRICE_LOW">Total: Low to High</option>
          </select>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'split' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Master-Detail Split View"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Telemetry</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="High-Density Directory Table"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'split' ? (
        /* MASTER-DETAIL SPLIT VIEW (Scalable for 100+ orders) */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT COLUMN: Order Queue with Pagination */}
          <div className="w-full lg:w-96 shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Order Directory</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Scrollable / Paginated List */}
            {paginatedOrders.length > 0 ? (
              <div className="space-y-2.5 min-h-[460px]">
                {paginatedOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  const stageBadgeClass = STAGE_COLORS[ord.status] || 'bg-slate-800 text-slate-300';

                  return (
                    <div
                      key={ord.id}
                      onClick={() => handleSelectOrder(ord.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group ${
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      {/* Top Row: Order ID & Status */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`font-mono text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                          {ord.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${stageBadgeClass}`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Part Filename */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium truncate mb-1">
                        <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate" title={ord.filename}>{ord.filename}</span>
                      </div>

                      {/* Material & Date & Price */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 truncate max-w-[150px]">{ord.material_name}</span>
                        <span className="font-mono font-bold text-cyan-400">${ord.total_price.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Placed {new Date(ord.created_at).toLocaleDateString()}</span>
                        {ord.tracking_number && (
                          <span className="text-purple-400 font-mono flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Waybill
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No orders match your filter criteria.
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                <span className="text-[11px] text-slate-400">
                  Page <strong className="text-white font-mono">{currentPage}</strong> of <strong className="text-white font-mono">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Full Telemetry & Stage Progress */}
          <div className="flex-1 min-w-0 space-y-6">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Main Order Header Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                          {selectedOrder.id}
                          <button
                            type="button"
                            onClick={() => handleCopyId(selectedOrder.id)}
                            className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Copy Order ID"
                          >
                            {copiedId === selectedOrder.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                            STAGE_COLORS[selectedOrder.status] || 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          }`}
                        >
                          {selectedOrder.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Placed on {new Date(selectedOrder.created_at).toLocaleString()} • Estimated Delivery: {selectedOrder.estimated_ship_date || 'Calculated at dispatch'}
                      </p>
                      {selectedOrder.ip_terms_accepted ? (
                        <div
                          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg"
                          title={`Clickwrap IP terms v${selectedOrder.ip_terms_version || '1.0'} certified at ${selectedOrder.ip_terms_accepted_at || 'checkout'}`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Legal IP & Indemnification Clickwrap (v{selectedOrder.ip_terms_version || '1.0'}) Verified</span>
                        </div>
                      ) : null}

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <a
                          href={`/api/orders/${selectedOrder.id}/certificate`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Download Cryptographic Certificate of Completion (PDF)</span>
                        </a>
                      </div>
                    </div>

                    {selectedOrder.tracking_number ? (
                      <div className="bg-slate-950 border border-purple-500/40 rounded-xl p-3 flex items-center gap-3 shadow-lg">
                        <Truck className="w-6 h-6 text-purple-400 shrink-0" />
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Carrier & Tracking Waybill:</div>
                          <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                            <span>{selectedOrder.carrier || 'Express Logistics'}:</span>
                            <span className="text-purple-300">{selectedOrder.tracking_number}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Waybill assigned upon final quality sign-off</span>
                      </div>
                    )}
                  </div>

                  {/* 8-Stage Progress Tracker */}
                  <div className="space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Additive Manufacturing Stage Progression</span>
                      <span className="text-[11px] font-mono text-cyan-400">Stage {currentIdx + 1} of {STAGES.length}</span>
                    </div>

                    <div className="relative">
                      {/* Desktop horizontal progression line */}
                      <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
                      <div
                        className="hidden lg:block absolute top-1/2 left-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${(currentIdx / (STAGES.length - 1)) * 100}%` }}
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 relative z-10">
                        {STAGES.map((stg, idx) => {
                          const IconComponent = stg.icon;
                          const isDone = idx < currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div
                              key={stg.key}
                              className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                                isCurrent
                                  ? 'bg-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-950/80 ring-2 ring-cyan-500/30 scale-105'
                                  : isDone
                                  ? 'bg-slate-950/80 border-slate-700 text-slate-300'
                                  : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                                  isCurrent
                                    ? 'bg-cyan-500 text-slate-950 animate-pulse'
                                    : isDone
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <IconComponent className="w-4 h-4" />
                                )}
                              </div>
                              <div
                                className={`text-[11px] font-semibold leading-tight ${
                                  isCurrent ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {stg.label}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{stg.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Laser Telemetry & Chamber Sensor Stream (If in Sintering or Machining) */}
                  {['PRINTING', 'HEAT_TREATMENT', 'SECONDARY_MACHINING'].includes(selectedOrder.status) && (
                    <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span>Laser Powder Bed Telemetry Stream (EOS M290 Chamber #2)</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          TELEMETRY SYNC: 100%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-cyan-400" />
                            Inert O2 Atmosphere
                          </div>
                          <div className="text-sm font-bold font-mono text-white mt-1">98 ppm</div>
                          <div className="text-[9px] text-emerald-400">Argon Purge Active</div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-amber-400" />
                            Build Plate Temp
                          </div>
                          <div className="text-sm font-bold font-mono text-white mt-1">185.4 °C</div>
                          <div className="text-[9px] text-slate-500">Target: 185.0 °C</div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            Fiber Laser Galvo
                          </div>
                          <div className="text-sm font-bold font-mono text-white mt-1">420 W</div>
                          <div className="text-[9px] text-cyan-400">Scan speed 1,200 mm/s</div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            Layer Progress
                          </div>
                          <div className="text-sm font-bold font-mono text-white mt-1">840 / 1,250</div>
                          <div className="text-[9px] text-emerald-400">67.2% complete</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Two Column Section: Chronological Audit Log & Part Specs */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                    {/* Production Telemetry Log (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        Chronological Production Log & CMM Quality Notes
                      </h4>

                      <div className="space-y-3">
                        {selectedOrder.status_history &&
                          selectedOrder.status_history.map((log, i) => (
                            <div
                              key={i}
                              className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1 relative pl-5"
                            >
                              <div className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-200">{log.title || log.status}</span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{log.note}</p>
                              {log.updated_by && (
                                <div className="text-[10px] text-slate-500 pt-0.5">Updated by: {log.updated_by}</div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Order Specs & Delivery Address (1 col) */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        Order Specifications & Delivery
                      </h4>

                      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 space-y-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">CAD Model:</span>
                          <span className="text-slate-200 font-medium">{selectedOrder.filename}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Alloy Material:</span>
                          <span className="text-cyan-300 font-semibold">{selectedOrder.material_name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Volume:</span>
                            <span className="font-mono text-slate-300">{selectedOrder.volume_cm3} cm³</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Batch Qty:</span>
                            <span className="font-mono text-slate-300">{selectedOrder.quantity} units</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/60">
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                            Machining Operations:
                          </span>
                          <ul className="text-slate-300 space-y-0.5 mt-1 list-disc list-inside text-[11px]">
                            {selectedOrder.machining_options?.tapped_holes > 0 && (
                              <li>{selectedOrder.machining_options.tapped_holes}x Thread Tapping</li>
                            )}
                            {selectedOrder.machining_options?.datum_faces > 0 && (
                              <li>{selectedOrder.machining_options.datum_faces}x CNC Face Milling</li>
                            )}
                            {selectedOrder.machining_options?.wire_edm_cutoff && (
                              <li>Wire EDM Baseplate Separation</li>
                            )}
                            {selectedOrder.machining_options?.heat_treatment && selectedOrder.machining_options.heat_treatment !== 'none' && (
                              <li>Heat Treatment: {selectedOrder.machining_options.heat_treatment}</li>
                            )}
                          </ul>
                        </div>

                        {selectedOrder.shipping_address && (
                          <div className="pt-2 border-t border-slate-800/60">
                            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                              Shipping Address:
                            </span>
                            <div className="text-slate-300 text-[11px] leading-tight mt-1">
                              <div>{selectedOrder.shipping_address.full_name}</div>
                              <div>{selectedOrder.shipping_address.street}</div>
                              <div>
                                {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                                {selectedOrder.shipping_address.zip_code}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
                          <span className="text-slate-400 font-semibold">Total Paid:</span>
                          <span className="text-base font-bold font-mono text-cyan-400">
                            ${selectedOrder.total_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h4 className="text-base font-semibold text-slate-300">Select an Order to Inspect</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Choose any order from the directory queue on the left to inspect its live DMLS chamber telemetry and production history.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HIGH-DENSITY DIRECTORY TABLE VIEW (Ideal for scanning 50-100+ orders) */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <LayoutList className="w-4 h-4 text-cyan-400" />
              <span>Full Order Spreadsheet Directory</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {paginatedOrders.length} of {filteredOrders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order ID / Date</th>
                  <th className="py-3 px-4">CAD Part Filename</th>
                  <th className="py-3 px-4">Alloy Material</th>
                  <th className="py-3 px-4">Batch Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tracking Waybill</th>
                  <th className="py-3 px-4 font-mono">Total Paid</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedOrders.map((ord) => {
                  const stageBadgeClass = STAGE_COLORS[ord.status] || 'bg-slate-800 text-slate-300';
                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-cyan-300">{ord.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </div>
                        {ord.ip_terms_accepted ? (
                          <div
                            className="mt-1 inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded"
                            title={`IP terms v${ord.ip_terms_version || '1.0'} certified at ${ord.ip_terms_accepted_at || 'checkout'}`}
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>IP Verified v{ord.ip_terms_version || '1.0'}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="truncate max-w-xs" title={ord.filename}>
                          {ord.filename}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {ord.material_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {ord.quantity} pcs
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${stageBadgeClass}`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {ord.tracking_number ? (
                          <span className="text-purple-300 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-purple-400" />
                            {ord.tracking_number}
                          </span>
                        ) : (
                          <span className="text-slate-500">Processing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ${ord.total_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSelectOrder(ord.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Directory Pagination Bar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-950/50">
              <span className="text-slate-400">
                Page <strong className="text-white font-mono">{currentPage}</strong> of <strong className="text-white font-mono">{totalPages}</strong> ({filteredOrders.length} total orders)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
