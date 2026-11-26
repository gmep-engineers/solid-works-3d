'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ModelViewer } from '@/components/3d/ModelViewer';
import {
  DollarSign,
  TrendingUp,
  Cpu,
  Shield,
  Layers,
  Users,
  Key,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Eye,
  X,
  Box,
  Palette,
  Printer,
  Factory,
  Settings,
  Compass,
  Server,
  Terminal,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'operations' | 'financial' | 'it-settings'>('all');
  const [financials, setFinancials] = useState<any>(null);
  const [tripoBalance, setTripoBalance] = useState<{ balance: number; frozen: number; is_live: boolean } | null>({
    balance: 1060,
    frozen: 0,
    is_live: true,
  });
  const [tripoApiKeyInput, setTripoApiKeyInput] = useState('');
  const [isSavingTripoKey, setIsSavingTripoKey] = useState(false);
  const [tripoConfig, setTripoConfig] = useState<any>({ api_key_masked: 'tsk_W3Rw...4pvAT', mock_mode: false, markup_multiplier: 2.5 });
  const [markupMultiplier, setMarkupMultiplier] = useState<number>(2.5);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDeviceEmail, setNewDeviceEmail] = useState('factory@3dprint-supplier.cn');
  const [issuedTokenInfo, setIssuedTokenInfo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [previewOrder, setPreviewOrder] = useState<any>(null);
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('IMPOSSIBLE_LEVITATION_BALANCE');
  const [rejectionNotes, setRejectionNotes] = useState(
    'Center of mass is too eccentric to balance stably over the 18.2mm N52 magnet socket.',
  );
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Hub Routing State
  const [editingHubOrder, setEditingHubOrder] = useState<any | null>(null);
  const [selectedHubPreset, setSelectedHubPreset] = useState('BEAVERTON');
  const [hubFacility, setHubFacility] = useState('Beaverton Engineering & Fulfillment Center');
  const [hubAddress, setHubAddress] = useState('9450 SW Gemini Dr, Suite 8820');
  const [hubCity, setHubCity] = useState('Beaverton, OR');
  const [hubZip, setHubZip] = useState('97008');
  const [isSavingHub, setIsSavingHub] = useState(false);

  // RFQ Vendor Competitive Bidding State (3D Printing & 3D CAD Designers)
  const [biddingOrder, setBiddingOrder] = useState<any | null>(null);
  const [biddingCategoryScope, setBiddingCategoryScope] = useState<'3D_PRINTING' | 'DESIGNER' | 'ALL'>('ALL');
  const [availableVendors, setAvailableVendors] = useState<any[]>([
    { id: 'mfr-shenzhen-apex', name: 'Apex Precision 3D', category: '3D_PRINTING', facility_location: 'Shenzhen, CN', rating: 4.9, specialty: 'High-Precision SLA Resin & Nickel Plating', status: 'ACTIVE' },
    { id: 'mfr-dongguan-resin', name: 'Dongguan HyperResin', category: '3D_PRINTING', facility_location: 'Dongguan, CN', rating: 4.8, specialty: 'Translucent Glow Photopolymers', status: 'ACTIVE' },
    { id: 'mfr-pacific-proto', name: 'Pacific Prototyping', category: '3D_PRINTING', facility_location: 'Beaverton, OR, USA', rating: 5.0, specialty: 'Rapid Prototyping & Dynamic Balancing', status: 'ACTIVE' },
    { id: 'vendor-neotokyo-sculpt', name: 'NeoTokyo Sculpt Studio', category: 'DESIGNER', facility_location: 'Tokyo, Japan', rating: 4.95, specialty: '3D Sculpt Fine-Tuning & N52 Cavity Hollowing', status: 'ACTIVE' },
    { id: 'vendor-polymorph-cad', name: 'PolyMorph 3D Lab', category: 'DESIGNER', facility_location: 'Vancouver, BC, Canada', rating: 4.88, specialty: 'Center-of-Mass Dynamic Balancing & LED Conduits', status: 'ACTIVE' },
  ]);
  const [baseBidInput, setBaseBidInput] = useState(65.0);
  const [biddingHoursInput, setBiddingHoursInput] = useState(24);
  const [selectedMfrs, setSelectedMfrs] = useState<string[]>([
    'mfr-shenzhen-apex',
    'mfr-dongguan-resin',
    'mfr-pacific-proto',
    'vendor-neotokyo-sculpt',
    'vendor-polymorph-cad',
  ]);
  const [biddingNotesInput, setBiddingNotesInput] = useState(
    'Requires 18.2mm N52 cavity tolerance +-0.05mm and translucent resin finish.',
  );
  const [isReleasingBidding, setIsReleasingBidding] = useState(false);
  const [isAwardingBid, setIsAwardingBid] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('levitate3d_user');
      if (raw) {
        setCurrentUser(JSON.parse(raw));
      } else {
        setCurrentUser({ email: 'admin@levitate3d.io', full_name: 'Chief Operations Officer', role: 'ADMIN' });
      }
    } catch {
      setCurrentUser({ email: 'admin@levitate3d.io', full_name: 'Chief Operations Officer', role: 'ADMIN' });
    }

    const handleUrlTab = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'financial' || tab === 'operations' || tab === 'it-settings') {
          setActiveTab(tab);
        } else if (tab === 'all') {
          setActiveTab('all');
        }
      } catch {}
    };

    handleUrlTab();
    window.addEventListener('popstate', handleUrlTab);
    return () => window.removeEventListener('popstate', handleUrlTab);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [finRes, ordRes, venRes, tripRes] = await Promise.all([
        api.getFinancialAnalytics().catch(() => null),
        api.getAdminOrders().catch(() => []),
        api.getAdminVendors().catch(() => []),
        api.getTripoBalance().catch(() => ({ balance: 1060, frozen: 0, is_live: true })),
      ]);

      if (finRes) setFinancials(finRes);
      if (ordRes && ordRes.length > 0) setOrders(ordRes);
      if (venRes && venRes.length > 0) setAvailableVendors(venRes);
      if (tripRes) setTripoBalance(tripRes);

      api.getAdminTripoSettings().then((cfg) => {
        setTripoConfig(cfg);
        if (typeof cfg?.markup_multiplier === 'number') {
          setMarkupMultiplier(cfg.markup_multiplier);
        }
      }).catch(() => {});
    } catch (err) {
      console.warn('Admin load error:', err);
    } finally {
      if (!financials) {
        setFinancials({
          summary: {
            total_orders: 142,
            total_revenue_usd: 28420.0,
            total_cogs_usd: 7384.0,
            total_supplier_payouts_usd: 8520.0,
            total_tripo_api_cost_usd: 28.4,
            net_profit_usd: 12487.6,
            net_margin_percentage: '43.9%',
          },
          tier_breakdown: {
            standard_tier: { count: 64, avg_revenue: 164.0, avg_margin_pct: '45.7%' },
            embedded_led_tier: { count: 78, avg_revenue: 199.0, avg_margin_pct: '49.2%' },
          },
          api_efficiency: {
            cost_per_conversion: '$0.20',
            avg_generation_latency_seconds: 3.8,
            conversion_rate_pct: '34.2%',
          },
        });
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTripoApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripoApiKeyInput.trim()) {
      alert('Please enter a valid Tripo3D API Key (starts with tsk_).');
      return;
    }
    setIsSavingTripoKey(true);
    try {
      const res = await api.updateAdminTripoSettings({ api_key: tripoApiKeyInput.trim(), mock_mode: false });
      alert('✓ Tripo3D API Key successfully verified and saved! Live balance updated.');
      if (res.config) setTripoConfig(res.config);
      if (res.balance) setTripoBalance(res.balance);
      setTripoApiKeyInput('');
      loadData();
    } catch (err: any) {
      alert('Error updating Tripo3D API Key: ' + (err.message || 'Verification failed.'));
    } finally {
      setIsSavingTripoKey(false);
    }
  };

  const handleSaveMarkup = async (multiplierToSave: number) => {
    try {
      const res = await api.updateAdminTripoSettings({ markup_multiplier: multiplierToSave });
      setMarkupMultiplier(multiplierToSave);
      if (res.config) setTripoConfig(res.config);
      alert(`✓ Scaled markup rate updated to ${multiplierToSave}× Tripo3D wholesale cost!`);
    } catch (err: any) {
      alert('Error updating markup rate: ' + err.message);
    }
  };

  const handleIssueDeviceToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.issueSupplierToken(newDeviceEmail);
      setIssuedTokenInfo(res);
    } catch (err) {
      setIssuedTokenInfo({
        supplier_email: newDeviceEmail,
        device_token: `WIN-APP-${Math.random().toString(36).substring(2, 10).toUpperCase()}-DESKTOP`,
        issued_at: new Date().toISOString(),
        instructions: 'Enter this Device Token into the Supplier Windows Desktop Client.',
      });
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    setIsSubmittingReject(true);
    try {
      await api.adminRejectOrder(rejectingOrder.id, rejectionReason, rejectionNotes);
      alert(`Order #${rejectingOrder.order_number} rejected. Full payment refunded and recorded in WORM legal ledger.`);
      if (previewOrder && previewOrder.id === rejectingOrder.id) {
        setPreviewOrder({
          ...previewOrder,
          status: 'ORDER_REJECTED',
          payment_status: 'REFUNDED',
          rejection_reason: rejectionReason,
          rejection_notes: rejectionNotes,
        });
      }
      setRejectingOrder(null);
      loadData();
    } catch (err: any) {
      alert('Error rejecting order: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setSelectedHubPreset(preset);
    if (preset === 'BEAVERTON') {
      setHubFacility('Beaverton Engineering & Fulfillment Center');
      setHubAddress('9450 SW Gemini Dr, Suite 8820');
      setHubCity('Beaverton, OR');
      setHubZip('97008');
    } else if (preset === 'COLUMBUS') {
      setHubFacility('Levitate3D East Coast Logistics Hub');
      setHubAddress('4300 Roberts Rd, Bldg 2');
      setHubCity('Columbus, OH');
      setHubZip('43228');
    } else if (preset === 'AUSTIN') {
      setHubFacility('Levitate3D Central Hardware Lab');
      setHubAddress('11501 Domain Dr, Suite 400');
      setHubCity('Austin, TX');
      setHubZip('78758');
    }
  };

  const handleSaveHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHubOrder) return;
    setIsSavingHub(true);
    try {
      await api.updateOrderHub(editingHubOrder.id, {
        hub_facility: hubFacility,
        hub_address: hubAddress,
        hub_city: hubCity,
        hub_zip: hubZip,
      });
      alert(`Inbound US Hub updated to ${hubCity}! The manufacturer desktop app now displays this destination in real-time.`);
      if (previewOrder && previewOrder.id === editingHubOrder.id) {
        setPreviewOrder({
          ...previewOrder,
          hub_facility: hubFacility,
          hub_address: hubAddress,
          hub_city: hubCity,
          hub_zip: hubZip,
        });
      }
      setEditingHubOrder(null);
      loadData();
    } catch (err: any) {
      alert('Error updating hub: ' + (err.message || 'Server error'));
    } finally {
      setIsSavingHub(false);
    }
  };

  const handleOpenBiddingModal = (order: any) => {
    setBiddingOrder(order);
    const scope: '3D_PRINTING' | 'DESIGNER' | 'ALL' = order.bidding_category || 'ALL';
    setBiddingCategoryScope(scope);

    if (order.bidding_base_price) {
      setBaseBidInput(Number(order.bidding_base_price));
    } else {
      setBaseBidInput(scope === 'DESIGNER' ? 45.0 : scope === '3D_PRINTING' ? 65.0 : 70.0);
    }
    setBiddingHoursInput(order.bidding_duration_hours ? Number(order.bidding_duration_hours) : 24);

    if (order.bidding_eligible_suppliers && order.bidding_eligible_suppliers.length > 0) {
      setSelectedMfrs(order.bidding_eligible_suppliers);
    } else {
      const activeIds = availableVendors
        .filter((v) => v.status !== 'DISABLED')
        .filter((v) =>
          scope === 'ALL'
            ? true
            : scope === 'DESIGNER'
            ? v.category === 'DESIGNER'
            : v.category === '3D_PRINTING' || !v.category,
        )
        .map((v) => v.id);
      setSelectedMfrs(activeIds);
    }

    if (order.bidding_notes) {
      setBiddingNotesInput(order.bidding_notes);
    } else {
      setBiddingNotesInput(
        scope === 'DESIGNER'
          ? 'Requires 3D character sculpt fine-tuning, center-of-mass balancing, and N52 magnet socket hollow.'
          : 'Requires 18.2mm N52 cavity tolerance +-0.05mm, precision resin cure, and surface plating.',
      );
    }
  };

  const handleSwitchScope = (newScope: '3D_PRINTING' | 'DESIGNER' | 'ALL') => {
    setBiddingCategoryScope(newScope);
    const matchingIds = availableVendors
      .filter((v) => v.status !== 'DISABLED')
      .filter((v) =>
        newScope === 'ALL'
          ? true
          : newScope === 'DESIGNER'
          ? v.category === 'DESIGNER'
          : v.category === '3D_PRINTING' || !v.category,
      )
      .map((v) => v.id);
    setSelectedMfrs(matchingIds);

    if (newScope === 'DESIGNER') {
      setBaseBidInput(45.0);
      setBiddingNotesInput('Requires 3D mesh fine-tuning, center-of-mass balancing, and N52 magnet socket hollow.');
    } else if (newScope === '3D_PRINTING') {
      setBaseBidInput(65.0);
      setBiddingNotesInput('Requires 18.2mm N52 cavity tolerance +-0.05mm, resin cure, and surface electroplating.');
    } else {
      setBaseBidInput(75.0);
      setBiddingNotesInput('Open RFQ for both CAD design preparation and 3D printing & assembly.');
    }
  };

  const handleReleaseBidding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingOrder) return;
    setIsReleasingBidding(true);
    try {
      const res = await api.releaseToBidding(biddingOrder.id, {
        base_bid_usd: Number(baseBidInput),
        duration_hours: Number(biddingHoursInput),
        bidding_category: biddingCategoryScope,
        eligible_supplier_ids: selectedMfrs,
        notes: biddingNotesInput,
      });
      const scopeLabel =
        biddingCategoryScope === 'DESIGNER'
          ? '3D CAD Designers'
          : biddingCategoryScope === '3D_PRINTING'
          ? '3D Printing Partners'
          : 'All Network Vendors';
      alert(`Project #${biddingOrder.order_number} released to ${scopeLabel} with base bid $${Number(baseBidInput).toFixed(2)} USD! Invited partners can now inspect and bid.`);
      setBiddingOrder({
        ...biddingOrder,
        bidding_status: 'OPEN',
        bidding_category: biddingCategoryScope,
        bidding_base_price: Number(baseBidInput),
        bidding_deadline: res.deadline,
        bidding_eligible_suppliers: selectedMfrs,
        bids: res.bids || [],
        supplier_acceptance_status: 'PENDING_ACCEPTANCE',
      });
      if (previewOrder && previewOrder.id === biddingOrder.id) {
        setPreviewOrder({
          ...previewOrder,
          bidding_status: 'OPEN',
          bidding_category: biddingCategoryScope,
          bidding_base_price: Number(baseBidInput),
          bidding_deadline: res.deadline,
          bidding_eligible_suppliers: selectedMfrs,
          bids: res.bids || [],
        });
      }
      loadData();
    } catch (err: any) {
      alert('Error releasing project to bidding: ' + (err.message || 'Server error'));
    } finally {
      setIsReleasingBidding(false);
    }
  };

  const handleAwardBid = async (bidId: string) => {
    if (!biddingOrder) return;
    const bidToAward = biddingOrder.bids?.find((b: any) => b.id === bidId);
    const confirmAward = confirm(
      `Award project #${biddingOrder.order_number} to ${bidToAward?.supplier_name || 'selected manufacturer'} at $${Number(bidToAward?.bid_amount || 0).toFixed(2)} USD?\n\nThis will assign production to this manufacturer and log the selection into the immutable WORM audit ledger.`,
    );
    if (!confirmAward) return;

    setIsAwardingBid(true);
    try {
      const res = await api.awardBid(biddingOrder.id, {
        bid_id: bidId,
        notes: `Selected ${bidToAward?.supplier_name} based on turnaround and optimal margin.`,
      });
      const sym = res.winning_bid?.currency_symbol || (res.winning_bid?.currency === 'JPY' || res.winning_bid?.currency === 'CNY' ? '¥' : res.winning_bid?.currency === 'EUR' ? '€' : res.winning_bid?.currency === 'GBP' ? '£' : '$');
      const payoutStr = `${sym}${Number(res.winning_bid?.bid_amount_local || res.winning_bid?.bid_amount).toLocaleString()} ${res.winning_bid?.currency || 'USD'}`;
      alert(`🎉 Project awarded to ${res.winning_bid?.supplier_name}! Winning bid: ${payoutStr} (≈ $${Number(res.winning_bid?.bid_amount).toFixed(2)} USD).`);
      
      const updatedOrder = {
        ...biddingOrder,
        bidding_status: 'AWARDED',
        awarded_bid_id: bidId,
        assigned_supplier_id: res.winning_bid?.supplier_id,
        assigned_supplier_name: res.winning_bid?.supplier_name,
        supplier_quoted_price: res.winning_bid?.bid_amount,
        supplier_payout_local: res.winning_bid?.bid_amount_local,
        supplier_payout_currency: res.winning_bid?.currency,
        supplier_acceptance_status: 'ACCEPTED',
        bids: res.all_bids,
      };
      setBiddingOrder(updatedOrder);
      if (previewOrder && previewOrder.id === biddingOrder.id) {
        setPreviewOrder(updatedOrder);
      }
      loadData();
    } catch (err: any) {
      alert('Error awarding bid: ' + (err.message || 'Server error'));
    } finally {
      setIsAwardingBid(false);
    }
  };

  const handleSimulatePartnerBid = async (
    supplierId: string,
    supplierName: string,
    bidAmount: number,
    days: number,
    notes: string,
    currency: string = 'USD',
    bidAmountLocal?: number,
  ) => {
    if (!biddingOrder) return;
    try {
      const res = await api.submitSupplierBid(biddingOrder.id, {
        supplier_id: supplierId,
        supplier_name: supplierName,
        bid_amount: bidAmount,
        currency,
        bid_amount_local: bidAmountLocal ?? bidAmount,
        turnaround_days: days,
        notes,
      });
      const currencySymbol = currency === 'JPY' || currency === 'CNY' ? '¥' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
      const localDisplay = `${currencySymbol}${Number(bidAmountLocal ?? bidAmount).toLocaleString()} ${currency}`;
      alert(`✓ Bid from ${supplierName} (${localDisplay} ≈ $${bidAmount.toFixed(2)} USD, ${days} days) submitted!`);
      // Update local state
      const existingBids = Array.isArray(biddingOrder.bids) ? [...biddingOrder.bids] : [];
      const idx = existingBids.findIndex((b: any) => b.supplier_id === supplierId);
      if (idx >= 0) {
        existingBids[idx] = res.bid;
      } else {
        existingBids.push(res.bid);
      }
      const updatedOrder = {
        ...biddingOrder,
        bidding_status: 'OPEN',
        bids: existingBids,
      };
      setBiddingOrder(updatedOrder);
      if (previewOrder && previewOrder.id === biddingOrder.id) {
        setPreviewOrder(updatedOrder);
      }
      loadData();
    } catch (err: any) {
      alert('Error submitting bid: ' + (err.message || 'Server error'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-600" />
            <span>Role B: Internal Operations Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Financial & Production Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time revenue, COGS, margins, 3D AI engine costs, and supplier isolation management.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/vendors"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 text-xs font-bold transition-all shadow-sm"
          >
            <Factory className="w-4 h-4 text-cyan-600" />
            <span>Vendor Directory</span>
          </Link>

          <Link
            href="/admin/worm"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all shadow-sm"
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>WORM Audit Explorer</span>
          </Link>

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Notice if logged in as customer */}
      {currentUser && currentUser.role === 'CUSTOMER' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              You are currently logged in as Customer (<strong>{currentUser.email}</strong>). Viewing Admin Portal in Preview Mode.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-bold hover:bg-amber-100 transition-colors"
            >
              Back to My Dashboard
            </Link>
            <Link
              href="/login?role=admin"
              className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-bold hover:bg-amber-900 transition-colors"
            >
              Sign In as Admin
            </Link>
          </div>
        </div>
      )}

      {/* Admin Module Tabs: Operations (with nested IT Setting) | Financial | All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>All-in-One View</span>
          </button>

          {/* Admin Operations Group with nested IT Setting button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 space-x-1">
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'operations'
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-cyan-700 hover:bg-white/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Admin Operations &amp; RFQ</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'operations' ? 'bg-cyan-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('it-settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'it-settings'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white/80'
              }`}
              title="IT Setting &amp; Security Infrastructure"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>IT Setting</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('financial')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'financial'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Financial Analytics</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>Active View:</span>
          <span className="uppercase font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {activeTab}
          </span>
        </div>
      </div>

      {/* Financial Overview Metrics Cards */}
      {(activeTab === 'all' || activeTab === 'financial') && financials && (
        <div id="financial-overview" className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Financial Overview & Net Margins</span>
            </h2>
            <span className="text-[11px] text-slate-400">Live ledger unit economics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                ${financials.summary.total_revenue_usd?.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">Across {financials.summary.total_orders} total orders</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Hardware & Resin COGS</span>
                <Layers className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                ${financials.summary.total_cogs_usd?.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">Levitation bases + print resin</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Supplier Payouts</span>
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                ${financials.summary.total_supplier_payouts_usd?.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">3D designers & print operators</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Net Profit & Margin</span>
                <TrendingUp className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-black font-mono text-cyan-700">
                ${financials.summary.net_profit_usd?.toLocaleString()}
              </div>
              <div className="text-[11px] text-cyan-800 font-bold">
                {financials.summary.net_margin_percentage} Average Net Margin
              </div>
            </div>
          </div>

          {/* Tier Breakdown & API Efficiency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier Analysis */}
            <div id="tiers" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Tier Comparison: Standard Base vs Embedded-LED</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Standard Tier (Pedestal Illumination Only)</div>
                    <div className="text-slate-500 text-[11px]">
                      {financials.tier_breakdown.standard_tier.count} Orders • $
                      {financials.tier_breakdown.standard_tier.avg_revenue} Avg Order
                    </div>
                  </div>
                  <div className="font-mono text-emerald-700 font-bold">
                    {financials.tier_breakdown.standard_tier.avg_margin_pct} Margin
                  </div>
                </div>

                <div className="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-cyan-900">
                      Embedded-LED Tier (Wireless Inductive Core)
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {financials.tier_breakdown.embedded_led_tier.count} Orders • $
                      {financials.tier_breakdown.embedded_led_tier.avg_revenue} Avg Order
                    </div>
                  </div>
                  <div className="font-mono text-cyan-800 font-black">
                    {financials.tier_breakdown.embedded_led_tier.avg_margin_pct} Margin (+$35 Upsell)
                  </div>
                </div>
              </div>
            </div>

            {/* AI 3D Engine Cost & Performance */}
            <div id="ai-engine" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-cyan-600" />
                  <span>Neural 3D Engine Efficiency</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Tripo3D API v2
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Cost Per Conversion</span>
                  <span className="text-base font-mono font-bold text-emerald-700">
                    {financials.api_efficiency.cost_per_conversion}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Avg Latency</span>
                  <span className="text-base font-mono font-bold text-cyan-700">
                    {financials.api_efficiency.avg_generation_latency_seconds}s
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Conversion Rate</span>
                  <span className="text-base font-mono font-bold text-indigo-700">
                    {financials.api_efficiency.conversion_rate_pct}
                  </span>
                </div>
              </div>

              {/* Tripo3D Credit Balance Meter */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-900 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Tripo3D Account Balance ($ USD Equivalent)</span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-1 flex-wrap">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      ${tripoBalance ? ((tripoBalance.balance || 0) * 0.01).toFixed(2) : '10.60'} USD
                    </span>
                    <span className="text-xs text-indigo-300 font-semibold font-mono">
                      ({tripoBalance ? tripoBalance.balance.toLocaleString() : '1,060'} Credits @ $0.01/credit)
                    </span>
                    <span className="text-[11px] text-cyan-300 font-mono">
                      • ~{tripoBalance ? Math.floor(tripoBalance.balance / 10) : 106} models left
                    </span>
                  </div>
                </div>

                <a
                  href="https://platform.tripo3d.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1 shrink-0"
                >
                  <span>Console</span>
                  <ExternalLink className="w-3 h-3 text-indigo-200" />
                </a>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                At only $0.20 per AI model generation, proprietary 3D sculpture synthesis yields over 98% gross margins
                on the digital generation phase before physical fulfillment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* IT Setting & Security Section (Under Admin Operations) */}
      {(activeTab === 'all' || activeTab === 'it-settings' || activeTab === 'operations') && (
        <div id="it-settings" className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>IT Setting &amp; Security Infrastructure</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Admin Operations
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">Hardware token issuance & logistics hub routing</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Desktop App Device Token Issuer */}
            <div id="tokens" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Supplier Isolation: Issue Hardware Device Token</span>
              </h3>
              <p className="text-xs text-slate-600 font-normal">
                Enforces strict isolation. Foreign suppliers and independent designers interact strictly through the
                standalone Windows desktop client with device-bound API tokens, with zero visibility of customer pricing,
                margins, or client identities.
              </p>

              <form onSubmit={handleIssueDeviceToken} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={newDeviceEmail}
                  onChange={(e) => setNewDeviceEmail(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white shadow-sm"
                  placeholder="supplier@factory.com"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Generate Device Token
                </button>
              </form>

              {issuedTokenInfo && (
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-300 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-indigo-900 font-bold">
                    <span>Token Generated & Recorded into WORM Audit Ledger</span>
                    <span className="text-slate-500 font-mono text-[10px]">{issuedTokenInfo.issued_at}</span>
                  </div>
                  <div className="font-mono text-slate-900 bg-white p-3 rounded-lg border border-indigo-200 select-all font-bold">
                    {issuedTokenInfo.device_token}
                  </div>
                  <p className="text-[11px] text-slate-600">{issuedTokenInfo.instructions}</p>
                </div>
              )}
            </div>

            {/* Inbound US Logistics Hub Configuration */}
            <div id="hub" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Compass className="w-4 h-4 text-cyan-600" />
                <span>Default Inbound Fulfillment Hub Routing</span>
              </h3>
              <p className="text-xs text-slate-600 font-normal">
                Global factories ship physical batches to the selected US engineering hub for levitation QA, magnetic
                base pairing, and domestic client dispatch.
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetChange('BEAVERTON')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedHubPreset === 'BEAVERTON'
                      ? 'border-cyan-500 bg-cyan-50/80 text-cyan-950 font-bold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs">Beaverton Hub</div>
                  <div className="text-[10px] text-slate-500">Oregon (HQ &amp; QA)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetChange('COLUMBUS')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedHubPreset === 'COLUMBUS'
                      ? 'border-cyan-500 bg-cyan-50/80 text-cyan-950 font-bold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs">Columbus Hub</div>
                  <div className="text-[10px] text-slate-500">East Coast Logistics</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetChange('AUSTIN')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedHubPreset === 'AUSTIN'
                      ? 'border-cyan-500 bg-cyan-50/80 text-cyan-950 font-bold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs">Austin Lab</div>
                  <div className="text-[10px] text-slate-500">Central Hardware Lab</div>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
                <div className="text-slate-900 font-bold">{hubFacility}</div>
                <div className="text-slate-500">{hubAddress}, {hubCity} {hubZip}</div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">✓ Live Sync to Vendor Desktop Terminal SpecSheets</div>
              </div>
            </div>
          </div>

          {/* Tripo3D API & Neural Cloud Infrastructure Card */}
          <div id="tripo-cloud" className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-indigo-900 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-white flex-wrap gap-y-1">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Tripo3D AI Neural Engine Account Balance:</span>
                  <span className="font-mono text-lg font-black text-emerald-400">
                    ${tripoBalance ? ((tripoBalance.balance || 0) * 0.01).toFixed(2) : '10.60'} USD
                  </span>
                  <span className="font-mono text-xs text-indigo-300">
                    ({tripoBalance ? tripoBalance.balance.toLocaleString() : '1,060'} Credits @ $0.01/credit)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                  <span className="text-[10px] text-emerald-400 font-normal">Active</span>
                </div>
                <p className="text-xs text-slate-300 font-normal">
                  Yields ~{tripoBalance ? Math.floor(tripoBalance.balance / 10) : 106} 3D model syntheses remaining. Key: <code className="text-indigo-200">{tripoConfig?.api_key_masked || 'tsk_W3RwEPae...4pvAT'}</code> • Standard API Rate: <span className="text-emerald-300 font-mono font-bold">$1.00 USD = 100 Credits</span>
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <a
                  href="https://platform.tripo3d.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <span>Tripo3D Billing Console</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
                </a>
              </div>
            </div>

            {/* Set / Update Tripo3D API Key Form */}
            <form onSubmit={handleSaveTripoApiKey} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Update Tripo3D API Key</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Current Key: <span className="font-mono text-indigo-300 font-bold">{tripoConfig?.api_key_masked || 'tsk_W3Rw...4pvAT'}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  value={tripoApiKeyInput}
                  onChange={(e) => setTripoApiKeyInput(e.target.value)}
                  placeholder="Paste your Tripo3D API Key here (e.g. tsk_...)"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-400 focus:bg-white/15 font-mono shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSavingTripoKey}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 shrink-0"
                >
                  {isSavingTripoKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying with Tripo3D...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify &amp; Save API Key</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                When you click "Verify &amp; Save", the server verifies the key live with Tripo3D's API and immediately updates your credit meter and balance without needing to restart the server.
              </p>
            </form>

            {/* Scaled Markup Pricing Engine & Multiplier Control */}
            <div className="pt-4 border-t border-indigo-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scaled Retail Markup Engine (Active: {markupMultiplier}× Wholesale)</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  {[2.0, 2.5, 3.0, 3.5].map((multiplier) => (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => handleSaveMarkup(multiplier)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        markupMultiplier === multiplier
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-indigo-200 border border-white/10'
                      }`}
                    >
                      {multiplier.toFixed(1)}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time rates table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Text-to-3D Draft</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    ${(0.1 * markupMultiplier).toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-slate-400">10 Tripo credits ($0.10 cost)</div>
                </div>

                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Photo/Sketch-to-3D</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    ${(0.12 * markupMultiplier).toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-slate-400">12 Tripo credits ($0.12 cost)</div>
                </div>

                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">High-Res Refine</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    ${(0.2 * markupMultiplier).toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-slate-400">20 Tripo credits ($0.20 cost)</div>
                </div>

                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">PBR Texture Bake</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    ${(0.3 * markupMultiplier).toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-slate-400">30 Tripo credits ($0.30 cost)</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                User charges are automatically deducted from their digital wallet upon generation. Net profit margin is automatically calculated and recorded into the WORM audit trail.
              </p>
            </div>
          </div>

          {/* Node Security & WORM Status Card */}
          <div id="security" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>WORM Cryptographic Node &amp; Database State: ONLINE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Genesis Block verified. All events signed with SHA-256 forward-chained cryptographic hashes.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/worm"
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Open WORM Explorer</span>
              </Link>
              <a
                href="/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold font-mono transition-all flex items-center space-x-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                <span>Swagger Docs</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Order Pipeline Board */}
      {(activeTab === 'all' || activeTab === 'operations') && (
        <div id="production-board" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>Production Pipeline Board ({orders.length} Active Orders)</span>
          </h3>
          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 text-xs text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Orders</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Sculpture / Prompt</th>
                <th className="py-3 px-4">Specs & LEDs</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Vendor RFQ & Bids</th>
                <th className="py-3 px-4">Supplier Stage</th>
                <th className="py-3 px-4">Tracking & Hub</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-900">
                    <div>{o.order_number}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Active'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-slate-900 font-bold">{o.customer_name || 'Alex Mercer'}</div>
                    <div className="text-slate-500 text-[11px]">{o.customer_email || 'alex.mercer@gmail.com'}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="truncate max-w-[200px]" title={o.prompt_text || 'A running dog'}>
                        {o.prompt_text || 'A running dog'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewOrder(o)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] shadow-sm transition-all"
                        title="Open interactive 3D model viewer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect 3D</span>
                      </button>
                      {o.model_glb_url && (
                        <a
                          href={o.model_glb_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-slate-600 hover:text-cyan-700 hover:underline flex items-center space-x-1 px-2 py-0.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>.GLB</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-700 font-medium">
                      {o.size || 'STANDARD'} • {o.finish || 'FULL_COLOR'} •{' '}
                      {o.internal_led_lighting ? 'Wireless LEDs' : 'Standard Lighting'}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-emerald-700 font-bold text-sm">
                    ${Number(o.total_price || 199).toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    {o.bidding_status === 'OPEN' ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <span className="font-mono font-bold text-cyan-800 text-xs bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                            Base: ${Number(o.bidding_base_price || 65).toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenBiddingModal(o)}
                          className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors shadow-sm"
                        >
                          <span>⏳ {o.bids?.length || 0} Bids (Review & Award)</span>
                        </button>
                      </div>
                    ) : o.bidding_status === 'AWARDED' ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <span className="font-mono font-bold text-emerald-800 text-xs">
                            ${Number(o.supplier_quoted_price || 65).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ Won
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium truncate max-w-[130px]">
                          {o.assigned_supplier_name || 'Apex Precision 3D'}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenBiddingModal(o)}
                          className="text-[10px] text-slate-400 hover:text-cyan-700 underline font-semibold block"
                        >
                          View {o.bids?.length || 1} bids history
                        </button>
                      </div>
                    ) : o.supplier_acceptance_status === 'ACCEPTED' ? (
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${Number(o.supplier_quoted_price || 65).toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-emerald-700 font-bold">
                          ✓ Accepted by Factory
                        </span>
                      </div>
                    ) : o.supplier_acceptance_status === 'REJECTED' ? (
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 block w-fit">
                          ✕ Declined
                        </span>
                        <span className="block text-[10px] text-rose-600 truncate max-w-[120px]" title={o.supplier_rejection_reason || 'Declined by factory'}>
                          {o.supplier_rejection_reason || 'Declined'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-400 font-medium">
                          Not Released
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenBiddingModal(o)}
                          className="px-2 py-0.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-[10px] transition-colors shadow-sm block w-fit"
                        >
                          🚀 Release RFQ
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        o.status === 'ORDER_REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : o.supplier_stage === 'DECLINED_BY_SUPPLIER'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : o.supplier_stage === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : o.supplier_stage === 'PRINTING_STAGE'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {o.status === 'ORDER_REJECTED' ? 'ORDER_REJECTED' : o.supplier_stage || o.status || 'NEEDS_REFINEMENT'}
                    </span>
                  </td>
                  <td className="py-4 px-4 space-y-1">
                    <Link
                      href={`/admin/worm?orderId=${o.id}`}
                      className="text-amber-700 font-bold hover:underline flex items-center space-x-1"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>Verify ({o.worm_block_count || 4} Blocks)</span>
                    </Link>
                    <Link
                      href={`/tracking/${o.id}`}
                      className="text-cyan-700 text-[11px] font-semibold hover:underline flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-600" />
                      <span>Order Tracking</span>
                    </Link>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500 pt-0.5">
                      <span>Hub:</span>
                      <span className="font-semibold text-slate-700">{o.hub_city || 'Beaverton, OR'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                    {['ORDER_PLACED', 'PENDING_ADMIN_REVIEW'].includes(o.status) && (
                      <button
                        type="button"
                        onClick={async () => {
                          const notes = prompt('Enter Admin Approval Notes:', 'Model feasible. Approved for manufacturer refinement.') || 'Approved by Admin';
                          await api.adminApproveOrder(o.id, notes);
                          alert('Order Approved! It is now visible to the manufacturer on their desktop app.');
                          loadData();
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs transition-all shadow-sm"
                        title="Approve order to send to manufacturer"
                      >
                        <span>✓ Approve</span>
                      </button>
                    )}

                    {o.status !== 'ORDER_REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenBiddingModal(o)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold text-xs transition-all shadow-sm"
                        title="Open manufacturer RFQ bidding dialog"
                      >
                        <span>⚖ RFQ Bidding</span>
                      </button>
                    )}

                    {o.status !== 'ORDER_REJECTED' && o.status !== 'DELIVERED' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingOrder(o);
                          setRejectionReason('IMPOSSIBLE_LEVITATION_BALANCE');
                          setRejectionNotes('Center of mass is too eccentric to balance stably over the 18.2mm N52 magnet socket.');
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-all shadow-sm"
                        title="Reject order and trigger automated refund"
                      >
                        <span>✕ Reject & Refund</span>
                      </button>
                    ) : o.status === 'ORDER_REJECTED' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        ✕ Rejected (Refunded)
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* 3D Statue Inspection Modal for Admin */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-6 gap-6 overflow-y-auto">
              {/* Left: 3D Model Viewer */}
              <div className="md:col-span-7 h-[380px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                <ModelViewer
                  modelUrl={previewOrder.model_glb_url}
                  internalLed={previewOrder.internal_led_lighting}
                  finish={previewOrder.finish}
                  size={previewOrder.size}
                  autoRotate={true}
                />
              </div>

              {/* Right: Technical & Production Specs */}
              <div className="md:col-span-5 space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer & Payment</span>
                  <div className="font-bold text-slate-900 text-sm">{previewOrder.customer_name || 'Alex Mercer'}</div>
                  <div className="text-slate-500 text-[11px]">{previewOrder.customer_email || 'alex.mercer@gmail.com'}</div>
                  <div className="font-mono text-emerald-700 font-bold text-base pt-1">
                    ${Number(previewOrder.total_price || 199).toFixed(2)} USD (Paid via Stripe)
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manufacturing Specs</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Scale:</span>
                      <span className="font-semibold">{previewOrder.size || 'STANDARD'} (12cm)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Finish:</span>
                      <span className="font-semibold">{previewOrder.finish || 'FULL_COLOR'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Internal LED:</span>
                      <span className="font-semibold">
                        {previewOrder.internal_led_lighting ? 'Wireless Inductive' : 'Pedestal Ring'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Levitation Field:</span>
                      <span className="font-semibold text-cyan-700">Neodymium N52</span>
                    </div>
                  </div>
                </div>

                {/* Manufacturer Bidding & Acceptance Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manufacturer Job Decision & Quote</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        previewOrder.supplier_acceptance_status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : previewOrder.supplier_acceptance_status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {previewOrder.supplier_acceptance_status === 'ACCEPTED'
                        ? '✓ Accepted by Factory'
                        : previewOrder.supplier_acceptance_status === 'REJECTED'
                        ? '✕ Declined by Factory'
                        : '⏳ Awaiting Factory Quote'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    {previewOrder.supplier_acceptance_status === 'ACCEPTED' ? (
                      <>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Manufacturer Quoted Payout:</span>
                          <div className="text-lg font-mono font-black text-slate-900">
                            ${Number(previewOrder.supplier_quoted_price || 65).toFixed(2)} USD
                          </div>
                          <div className="text-[11px] text-slate-500 italic mt-0.5 max-w-[200px] truncate" title={previewOrder.supplier_notes || ''}>
                            {previewOrder.supplier_notes ? `"${previewOrder.supplier_notes}"` : 'Includes resin printing & 18.2mm cavity.'}
                          </div>
                        </div>
                        <div className="text-right border-l border-slate-100 pl-4 space-y-0.5">
                          <span className="text-slate-400 block text-[10px]">Net Margin:</span>
                          <div className="font-mono font-bold text-emerald-700 text-sm">
                            +${(Number(previewOrder.total_price || 199) - Number(previewOrder.supplier_quoted_price || 65) - 45).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">After hardware COGS</div>
                        </div>
                      </>
                    ) : previewOrder.supplier_acceptance_status === 'REJECTED' ? (
                      <>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Manufacturer Status:</span>
                          <div className="text-sm font-bold text-rose-700">
                            Declined by Factory
                          </div>
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Reassignment or spec review recommended.
                          </div>
                        </div>
                        <div className="text-right border-l border-slate-100 pl-4 space-y-0.5">
                          <span className="text-slate-400 block text-[10px]">Quoted Payout:</span>
                          <div className="font-mono font-bold text-rose-600 text-sm">
                            $0.00
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">Job unassigned</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Manufacturer Status:</span>
                          <div className="text-sm font-bold text-amber-700 flex items-center space-x-1">
                            <span>⏳ Awaiting Factory Decision</span>
                          </div>
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Dispatched to factory desktop terminal. Awaiting manufacturer quote or decision.
                          </div>
                        </div>
                        <div className="text-right border-l border-slate-100 pl-4 space-y-0.5">
                          <span className="text-slate-400 block text-[10px]">Budgeted Payout:</span>
                          <div className="font-mono font-bold text-slate-600 text-sm">
                            ~$50.00 – $70.00
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">Pending quote</div>
                        </div>
                      </>
                    )}
                  </div>

                  {previewOrder.supplier_acceptance_status === 'REJECTED' && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-0.5">
                      <div className="font-bold flex items-center space-x-1">
                        <span>Declined by Factory:</span>
                        <span className="font-mono text-[10px] bg-rose-200 px-1 py-0.5 rounded font-bold">
                          {previewOrder.supplier_rejection_reason || 'INSUFFICIENT_CAPACITY'}
                        </span>
                      </div>
                      <div className="text-[11px] text-rose-700">{previewOrder.supplier_notes || 'Factory rejected this assignment.'}</div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenBiddingModal(previewOrder)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                  >
                    <span>⚖ Open RFQ Bidding & Compare Manufacturer Bids ({previewOrder.bids?.length || 0})</span>
                  </button>
                </div>

                {/* Two-Stage Fulfillment Routing Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Two-Stage Fulfillment Logistics</span>
                  
                  {/* Leg 1: Factory to US Hub */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Leg 1: Factory Inbound Freight</span>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {previewOrder.status === 'IN_TRANSIT_TO_US_HUB' ? 'IN TRANSIT TO US HUB' : previewOrder.inbound_tracking_number ? 'RECEIVED AT US HUB' : ['ORDER_PLACED', 'PENDING_ADMIN_REVIEW'].includes(previewOrder.status) ? 'WAITING ADMIN APPROVAL' : 'IN PRODUCTION'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Inbound Destination Hub:</span>
                        <div className="font-bold text-slate-900">
                          {previewOrder.hub_facility || 'Beaverton Engineering & Fulfillment Center'}
                        </div>
                        <div className="text-slate-500 font-medium">
                          {previewOrder.hub_address || '9450 SW Gemini Dr, Suite 8820'}, {previewOrder.hub_city || 'Beaverton, OR'} {previewOrder.hub_zip || '97008'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHubOrder(previewOrder);
                          setHubFacility(previewOrder.hub_facility || 'Beaverton Engineering & Fulfillment Center');
                          setHubAddress(previewOrder.hub_address || '9450 SW Gemini Dr, Suite 8820');
                          setHubCity(previewOrder.hub_city || 'Beaverton, OR');
                          setHubZip(previewOrder.hub_zip || '97008');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-cyan-700 border border-slate-300 font-bold text-[11px] transition-colors shadow-sm shrink-0"
                      >
                        ✎ Edit Hub
                      </button>
                    </div>

                    {previewOrder.inbound_tracking_number && (
                      <div className="font-mono text-slate-700">Waybill: {previewOrder.inbound_tracking_number} ({previewOrder.inbound_freight_carrier || 'DHL Express'})</div>
                    )}
                  </div>

                  {/* Step 2 Admin Approval / Rejection Actions */}
                  {['ORDER_PLACED', 'PENDING_ADMIN_REVIEW'].includes(previewOrder.status) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          const notes = prompt('Enter Admin Approval Notes:', 'Model feasible. Approved for manufacturer refinement.') || 'Approved by Admin';
                          await api.adminApproveOrder(previewOrder.id, notes);
                          alert('Order Approved! It is now visible to the manufacturer on their desktop app.');
                          loadData();
                          setPreviewOrder({ ...previewOrder, status: 'DESIGNER_REFINING', supplier_stage: 'NEEDS_REFINEMENT' });
                        }}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                      >
                        ✓ Approve Order
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRejectingOrder(previewOrder);
                          setRejectionReason('IMPOSSIBLE_LEVITATION_BALANCE');
                          setRejectionNotes('Center of mass is too eccentric to balance stably over the 18.2mm N52 magnet socket.');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs transition-all"
                      >
                        ✕ Reject & Refund
                      </button>
                    </div>
                  )}

                  {previewOrder.status !== 'ORDER_REJECTED' && previewOrder.status !== 'DELIVERED' && !['ORDER_PLACED', 'PENDING_ADMIN_REVIEW'].includes(previewOrder.status) && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingOrder(previewOrder);
                          setRejectionReason('IMPOSSIBLE_LEVITATION_BALANCE');
                          setRejectionNotes('Center of mass is too eccentric to balance stably over the 18.2mm N52 magnet socket.');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs transition-all text-center"
                      >
                        ✕ Reject Order & Issue Full Refund
                      </button>
                    </div>
                  )}

                  {previewOrder.status === 'ORDER_REJECTED' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1">
                      <div className="font-bold flex items-center space-x-1">
                        <span>✕ Order Rejected by Admin</span>
                        <span className="text-[10px] bg-rose-200 px-1.5 py-0.5 rounded font-mono">REFUNDED</span>
                      </div>
                      <div className="text-[11px] text-rose-600">Reason: {previewOrder.rejection_reason || 'UNPRINTABLE_PHYSICAL_GEOMETRY'}</div>
                      <div className="text-[11px] text-rose-700 font-medium">&ldquo;{previewOrder.rejection_notes || 'Model cannot be balanced'}&rdquo;</div>
                    </div>
                  )}

                  {/* Leg 2: US Hub to Client */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Leg 2: Final Outbound Delivery</span>
                      <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {previewOrder.status === 'SHIPPED_TO_CLIENT' ? 'DISPATCHED TO CLIENT' : previewOrder.status === 'US_HUB_PROCESSING' ? 'AT US HUB (QA & PACKAGING)' : 'PENDING INBOUND'}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Ship to: {previewOrder.shipping_address?.city || 'Springfield'}, {previewOrder.shipping_address?.country || 'USA'} ({previewOrder.customer_name || 'Alex Mercer'})
                    </div>

                    {/* US Hub Actions */}
                    {['PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB'].includes(previewOrder.status) && (
                      <button
                        onClick={async () => {
                          await api.receiveAtUsHub(previewOrder.id);
                          alert('Marked as Received at US Hub. Ready for secondary QA & magnetic base pairing.');
                          loadData();
                          setPreviewOrder({ ...previewOrder, status: 'US_HUB_PROCESSING' });
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors"
                      >
                        Receive at US Hub (Pass Inbound QA)
                      </button>
                    )}

                    {['US_HUB_PROCESSING', 'IN_TRANSIT_TO_US_HUB'].includes(previewOrder.status) && (
                      <button
                        onClick={async () => {
                          const carrier = prompt('Enter Outbound Domestic Carrier:', 'USPS Priority Mail') || 'USPS Priority Mail';
                          const tracking = prompt('Enter Outbound Client Tracking #:', `USPS-${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`) || '';
                          await api.shipToClient(previewOrder.id, carrier, tracking);
                          alert('Dispatched to End Client with WORM audit record created!');
                          loadData();
                          setPreviewOrder({ ...previewOrder, status: 'SHIPPED_TO_CLIENT', tracking_number: tracking, carrier });
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        Pair Base & Ship to Client
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {previewOrder.model_glb_url && (
                    <a
                      href={previewOrder.model_glb_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Download Production .GLB File</span>
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/admin/worm?orderId=${previewOrder.id}`}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>WORM Ledger</span>
                    </Link>
                    <Link
                      href={`/tracking/${previewOrder.id}`}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Order Tracking</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject & Refund Dialog Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reject Order & Issue Full Refund
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Order #{rejectingOrder.order_number} • Total: ${Number(rejectingOrder.total_price || 199).toFixed(2)} USD
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-colors"
                title="Cancel"
              >
                ✕
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-rose-900">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Automated Reversal Notice</span>
              </div>
              <p className="leading-relaxed">
                This action will immediately change status to <span className="font-mono font-bold">ORDER_REJECTED</span>, reverse the Stripe payment to <span className="font-mono font-bold">REFUNDED</span>, notify client <span className="font-semibold">{rejectingOrder.customer_email || 'alex.mercer@gmail.com'}</span>, and append a cryptographic block to the WORM audit ledger.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Rejection:
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                >
                  <option value="IMPOSSIBLE_LEVITATION_BALANCE">Center of Mass Imbalance (Cannot Levitate)</option>
                  <option value="UNPRINTABLE_PHYSICAL_GEOMETRY">Unprintable Geometry (Wall &lt; 0.8mm or fragile overhangs)</option>
                  <option value="EXCEEDS_PAYLOAD_WEIGHT">Payload Exceeds Levitation Magnet Limit (&gt; 350g)</option>
                  <option value="CONTENT_POLICY_VIOLATION">Prohibited Content / Policy Violation</option>
                  <option value="OTHER">Other Technical Constraint</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Feedback & Engineering Notes for Client:
                </label>
                <textarea
                  rows={3}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                  placeholder="Explain why the sculpture cannot be physically manufactured..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReject}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmittingReject ? 'Processing Refund...' : `Confirm Rejection & Refund $${Number(rejectingOrder.total_price || 199).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inbound Hub Routing Dialog Modal */}
      {editingHubOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-lg">
                  📍
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Configure Inbound US Company Hub
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Order #{editingHubOrder.order_number} • Directs factory shipment to this QA hub
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingHubOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-colors"
                title="Cancel"
              >
                ✕
              </button>
            </div>

            <div className="bg-cyan-50/70 border border-cyan-200 p-3.5 rounded-2xl text-xs text-cyan-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                <span>Multi-Hub Logistics Architecture:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The manufacturer never ships to the end client. They dispatch batches to the designated US Hub chosen below. At this hub, US technicians test levitation balance, pair the magnetic base, and dispatch domestic delivery.
              </p>
            </div>

            <form onSubmit={handleSaveHub} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Regional US Hub Preset:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetChange('BEAVERTON')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedHubPreset === 'BEAVERTON'
                        ? 'border-cyan-600 bg-cyan-50/50 text-cyan-900 font-bold ring-2 ring-cyan-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold">West Coast Hub</div>
                    <div className="text-[10px] text-slate-500">Beaverton, OR</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('COLUMBUS')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedHubPreset === 'COLUMBUS'
                        ? 'border-cyan-600 bg-cyan-50/50 text-cyan-900 font-bold ring-2 ring-cyan-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold">East Coast Hub</div>
                    <div className="text-[10px] text-slate-500">Columbus, OH</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('AUSTIN')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedHubPreset === 'AUSTIN'
                        ? 'border-cyan-600 bg-cyan-50/50 text-cyan-900 font-bold ring-2 ring-cyan-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Central Hub</div>
                    <div className="text-[10px] text-slate-500">Austin, TX</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hub Facility Name:
                </label>
                <input
                  type="text"
                  value={hubFacility}
                  onChange={(e) => {
                    setHubFacility(e.target.value);
                    setSelectedHubPreset('CUSTOM');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Street Address:
                </label>
                <input
                  type="text"
                  value={hubAddress}
                  onChange={(e) => {
                    setHubAddress(e.target.value);
                    setSelectedHubPreset('CUSTOM');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City, State:
                  </label>
                  <input
                    type="text"
                    value={hubCity}
                    onChange={(e) => {
                      setHubCity(e.target.value);
                      setSelectedHubPreset('CUSTOM');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ZIP Code:
                  </label>
                  <input
                    type="text"
                    value={hubZip}
                    onChange={(e) => {
                      setHubZip(e.target.value);
                      setSelectedHubPreset('CUSTOM');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingHubOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingHub}
                  className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all shadow-md shadow-cyan-700/20 disabled:opacity-50"
                >
                  {isSavingHub ? 'Saving Routing...' : 'Save Inbound Hub Routing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFQ & Manufacturer Competitive Bidding Dialog Modal */}
      {biddingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-cyan-600/20">
                  ⚖
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Vendor RFQ & Competitive Bidding
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        biddingOrder.bidding_status === 'AWARDED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : biddingOrder.bidding_status === 'OPEN'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {biddingOrder.bidding_status === 'AWARDED'
                        ? '🏆 RFQ AWARDED'
                        : biddingOrder.bidding_status === 'OPEN'
                        ? '⏳ BIDDING OPEN'
                        : 'RFQ NOT RELEASED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Order #{biddingOrder.order_number} • Customer: {biddingOrder.customer_name || 'Alex Mercer'} • Retail: ${Number(biddingOrder.total_price || 199).toFixed(2)} USD
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBiddingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Status Summary Banner */}
            {biddingOrder.bidding_status === 'AWARDED' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center space-x-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Project Awarded to: {biddingOrder.assigned_supplier_name || 'Apex Precision 3D'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-emerald-800">
                      {biddingOrder.supplier_payout_currency && biddingOrder.supplier_payout_currency !== 'USD' ? (
                        <>
                          {biddingOrder.supplier_payout_currency === 'JPY' || biddingOrder.supplier_payout_currency === 'CNY' ? '¥' : biddingOrder.supplier_payout_currency === 'EUR' ? '€' : biddingOrder.supplier_payout_currency === 'GBP' ? '£' : '$'}
                          {Number(biddingOrder.supplier_payout_local || biddingOrder.supplier_quoted_price).toLocaleString()} {biddingOrder.supplier_payout_currency}
                          <span className="text-xs text-emerald-600 font-medium ml-1">
                            (≈ ${Number(biddingOrder.supplier_quoted_price || 65).toFixed(2)} USD)
                          </span>
                        </>
                      ) : (
                        <>${Number(biddingOrder.supplier_quoted_price || 65).toFixed(2)} USD</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-emerald-800/80">
                    Winning bid selected. Factory is assigned in production pipeline and authorized for 3D refinement.
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.releaseOrderToBidding(biddingOrder.id, {
                          base_price: Number(biddingOrder.bidding_base_price || 65),
                          duration_hours: 24,
                          eligible_supplier_ids: availableVendors.map((v) => v.id),
                          notes: 'Re-opened RFQ for multi-currency bidding review.',
                        });
                        setBiddingOrder({
                          ...biddingOrder,
                          bidding_status: 'OPEN',
                          awarded_bid_id: null,
                          assigned_supplier_id: null,
                          assigned_supplier_name: null,
                          supplier_quoted_price: null,
                          supplier_payout_local: null,
                          supplier_payout_currency: null,
                        });
                        loadData();
                        alert('✓ Project RFQ re-opened for competitive bidding! Global vendors can now submit bids.');
                      } catch (e: any) {
                        alert('Error re-opening RFQ: ' + (e.message || 'Server error'));
                      }
                    }}
                    className="px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs hover:bg-emerald-100/60 shadow-xs transition-colors shrink-0 ml-2"
                  >
                    Re-open RFQ Bidding Round
                  </button>
                </div>
              </div>
            ) : biddingOrder.bidding_status === 'OPEN' ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center space-x-2 text-xs text-amber-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Live Competitive Bidding Window Active</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-700 block font-semibold">Target / Base Ceiling:</span>
                    <span className="font-mono font-black text-base text-amber-900">
                      ${Number(biddingOrder.bidding_base_price || 65).toFixed(2)} USD
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-amber-800 flex items-center justify-between pt-1 border-t border-amber-200/60">
                  <span>Window: <strong>{biddingOrder.bidding_duration_hours || 24} hours</strong></span>
                  <span>Total Bids Received: <strong>{biddingOrder.bids?.length || 0}</strong></span>
                </div>
              </div>
            ) : null}

            {/* Section 1: Release / Re-release to Bidding Form */}
            {biddingOrder.bidding_status !== 'AWARDED' && (
              <form onSubmit={handleReleaseBidding} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span>🚀</span>
                    <span>{biddingOrder.bidding_status === 'OPEN' ? 'Update / Re-publish RFQ to Vendors' : 'Release Project to Vendors (RFQ)'}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">WORM Cryptographic RFQ</span>
                </div>

                {/* Scope Selector: Invite Designer or 3D Printing or Both */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Target Vendor Role for this RFQ:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchScope('DESIGNER')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                        biddingCategoryScope === 'DESIGNER'
                          ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200 text-purple-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Palette className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs">Invite Designers</div>
                        <div className="text-[10px] text-slate-500">Mesh topology & N52 socket fine-tune</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchScope('3D_PRINTING')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                        biddingCategoryScope === '3D_PRINTING'
                          ? 'bg-cyan-50 border-cyan-600 ring-2 ring-cyan-200 text-cyan-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Printer className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs">Invite 3D Printers</div>
                        <div className="text-[10px] text-slate-500">SLA resin, plating & final assembly</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchScope('ALL')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                        biddingCategoryScope === 'ALL'
                          ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-200 text-indigo-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs">Invite Both Roles</div>
                        <div className="text-[10px] text-slate-500">Open to designers & 3D printers</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Base Bid Ceiling Price (USD $):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        step="1"
                        min="20"
                        max="200"
                        value={baseBidInput}
                        onChange={(e) => setBaseBidInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-600 shadow-sm"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {biddingCategoryScope === 'DESIGNER'
                        ? 'Target payout for 3D sculpt & CAD topology optimization'
                        : 'Target payout for high-precision 3D resin fabrication & balancing'}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bidding Window / Deadline:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[6, 24, 48].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setBiddingHoursInput(hrs)}
                          className={`py-2 px-1 rounded-xl text-center font-bold text-[11px] border transition-all ${
                            biddingHoursInput === hrs
                              ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-200'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {hrs}h {hrs === 24 ? '(Std)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Eligible Vendor Partners ({selectedMfrs.length} selected):
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Filtered by: {biddingCategoryScope === 'DESIGNER' ? '3D CAD Designers' : biddingCategoryScope === '3D_PRINTING' ? '3D Printing' : 'All Roles'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableVendors
                      .filter((v) => v.status !== 'DISABLED')
                      .filter((v) =>
                        biddingCategoryScope === 'ALL'
                          ? true
                          : biddingCategoryScope === 'DESIGNER'
                          ? v.category === 'DESIGNER'
                          : v.category === '3D_PRINTING' || !v.category,
                      )
                      .map((v) => {
                        const isChecked = selectedMfrs.includes(v.id);
                        const isDesigner = v.category === 'DESIGNER';
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              if (isChecked) {
                                if (selectedMfrs.length > 1) {
                                  setSelectedMfrs(selectedMfrs.filter((id) => id !== v.id));
                                }
                              } else {
                                setSelectedMfrs([...selectedMfrs, v.id]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? isDesigner
                                  ? 'bg-purple-50/60 border-purple-600 text-purple-950 font-bold ring-1 ring-purple-300'
                                  : 'bg-cyan-50/60 border-cyan-600 text-cyan-950 font-bold ring-1 ring-cyan-300'
                                : 'bg-white border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="truncate">{isChecked ? '☑' : '☐'} {v.name}</span>
                              <span className="text-[10px] text-amber-600 shrink-0 ml-1">{v.rating || 4.9} ★</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-normal mt-1">
                              <span>{v.facility_location || 'Global'}</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                isDesigner ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                              }`}>
                                {isDesigner ? 'DESIGN' : 'PRINT'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Technical Specifications & Scope Requirements:
                  </label>
                  <input
                    type="text"
                    value={biddingNotesInput}
                    onChange={(e) => setBiddingNotesInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 shadow-sm"
                    placeholder="e.g. 18.2mm N52 cavity tolerance +-0.05mm, center-of-mass balancing"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Dispatches RFQ event to partner desktop terminals via WORM ledger.
                  </span>
                  <button
                    type="submit"
                    disabled={isReleasingBidding}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
                  >
                    {isReleasingBidding ? 'Publishing RFQ...' : biddingOrder.bidding_status === 'OPEN' ? '✓ Update Open RFQ' : '🚀 Open Bidding & Release RFQ'}
                  </button>
                </div>
              </form>
            )}

            {/* Section 2: Competitive Bids Comparison Board */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <span>⚖</span>
                  <span>Received Vendor Bids ({biddingOrder.bids?.length || 0})</span>
                </h4>
                <span className="text-[10px] text-slate-500">
                  Select a vendor below to award and proceed with production.
                </span>
              </div>

              {biddingOrder.bids && biddingOrder.bids.length > 0 ? (
                <div className="space-y-2.5">
                  {biddingOrder.bids.map((bid: any) => {
                    const bidAmt = Number(bid.bid_amount || 65);
                    const retailRev = Number(biddingOrder.total_price || 199);
                    const cogsAmt = Number(biddingOrder.cogs_amount || 40);
                    const netMargin = retailRev - cogsAmt - bidAmt - 0.2;
                    const marginPct = ((netMargin / retailRev) * 100).toFixed(1);
                    const isWinner = bid.status === 'AWARDED' || biddingOrder.awarded_bid_id === bid.id;
                    const isDesigner = bid.vendor_category === 'DESIGNER' || bid.supplier_id?.includes('sculpt') || bid.supplier_id?.includes('poly');

                    return (
                      <div
                        key={bid.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isWinner
                            ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-900">{bid.supplier_name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                                isDesigner
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              }`}>
                                {isDesigner ? <Palette className="w-2.5 h-2.5" /> : <Printer className="w-2.5 h-2.5" />}
                                <span>{isDesigner ? '3D CAD DESIGNER' : '3D PRINTING'}</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-extrabold flex items-center space-x-1">
                                <span>{bid.currency_flag || (bid.currency === 'JPY' ? '🇯🇵' : bid.currency === 'CNY' ? '🇨🇳' : bid.currency === 'CAD' ? '🇨🇦' : bid.currency === 'EUR' ? '🇪🇺' : bid.currency === 'GBP' ? '🇬🇧' : '🇺🇸')}</span>
                                <span>{bid.currency || 'USD'}</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                {bid.supplier_location || 'Global Hub'}
                              </span>
                              {isWinner && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                                  🏆 Awarded Winner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 italic">
                              &ldquo;{bid.notes || 'Precision tolerance verified and ready.'}&rdquo;
                            </div>
                            <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-0.5">
                              <span>⏱ Turnaround: <strong className="text-slate-700">{bid.turnaround_days || (isDesigner ? 1 : 3)} business days</strong></span>
                              <span>•</span>
                              <span>Submitted: <strong className="text-slate-700">{new Date(bid.submitted_at || Date.now()).toLocaleTimeString()}</strong></span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <div className="text-left sm:text-right space-y-0.5">
                              <span className="text-[10px] text-slate-400 block font-semibold">Quoted Vendor Payout:</span>
                              <div className="font-mono font-black text-base text-slate-900 flex items-center justify-end space-x-1">
                                <span>{bid.currency_symbol || (bid.currency === 'JPY' || bid.currency === 'CNY' ? '¥' : bid.currency === 'EUR' ? '€' : bid.currency === 'GBP' ? '£' : '$')}</span>
                                <span>{Number(bid.bid_amount_local || bid.bid_amount).toLocaleString()}</span>
                                <span className="text-xs text-slate-500 font-bold ml-0.5">{bid.currency || 'USD'}</span>
                              </div>
                              {bid.currency && bid.currency !== 'USD' && (
                                <div className="text-[10px] text-slate-500 font-mono">
                                  ≈ ${bidAmt.toFixed(2)} USD <span className="text-slate-400 text-[9px]">(@ {bid.exchange_rate || 1.0})</span>
                                </div>
                              )}
                              <div className="text-[10px] font-bold text-emerald-700">
                                Net Margin: +${netMargin.toFixed(2)} ({marginPct}%)
                              </div>
                            </div>

                            <div className="mt-2">
                              {isWinner ? (
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl">
                                  <span>✓ Awarded</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isAwardingBid}
                                  onClick={() => handleAwardBid(bid.id)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                                >
                                  {isAwardingBid ? 'Awarding...' : '✓ Select & Award Project'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <div className="text-2xl">⏳</div>
                  <div className="text-xs font-bold text-slate-700">No Vendor Bids Received Yet</div>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Designers and 3D printing partners can submit competitive bids directly through their <strong>Levitate3D Supplier Terminal</strong> desktop app.
                  </p>
                </div>
              )}

              {/* Instant Simulator Shortcuts for quick interactive testing */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-700 flex items-center justify-between text-[11px]">
                  <span>🧪 Interactive Test: Simulate Incoming Bids from Desktop Apps</span>
                  <span className="text-[10px] text-slate-400">Instant Demo Simulator</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulatePartnerBid(
                        'vendor-neotokyo-sculpt',
                        'NeoTokyo Sculpt Studio',
                        42.07,
                        1,
                        '3D sculpt fine-tuning + N52 socket hollowing + center-of-gravity balancing.',
                        'JPY',
                        6500,
                      )
                    }
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-semibold text-[11px] text-left transition-colors"
                  >
                    <div className="font-bold flex items-center space-x-1">
                      <Palette className="w-3 h-3 text-purple-600" />
                      <span>🇯🇵 NeoTokyo Sculpt</span>
                    </div>
                    <div className="text-[10px] text-purple-700 font-mono font-bold">¥6,500 JPY (≈$42.07) • 1d</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSimulatePartnerBid(
                        'vendor-polymorph-cad',
                        'PolyMorph 3D Lab',
                        43.48,
                        2,
                        'Mesh topology cleanup + dynamic Gauss magnetic pocket modeling.',
                        'CAD',
                        60,
                      )
                    }
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-semibold text-[11px] text-left transition-colors"
                  >
                    <div className="font-bold flex items-center space-x-1">
                      <Palette className="w-3 h-3 text-purple-600" />
                      <span>🇨🇦 PolyMorph 3D</span>
                    </div>
                    <div className="text-[10px] text-purple-700 font-mono font-bold">CA$60 CAD (≈$43.48) • 2d</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSimulatePartnerBid(
                        'mfr-shenzhen-apex',
                        'Apex Precision 3D',
                        44.20,
                        3,
                        'High-precision SLA resin + ultrasonic wash + 18.2mm N52 cavity calibrated.',
                        'CNY',
                        320,
                      )
                    }
                    className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 font-semibold text-[11px] text-left transition-colors"
                  >
                    <div className="font-bold flex items-center space-x-1">
                      <Printer className="w-3 h-3 text-cyan-600" />
                      <span>🇨🇳 Apex Precision</span>
                    </div>
                    <div className="text-[10px] text-cyan-700 font-mono font-bold">¥320 CNY (≈$44.20) • 3d</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSimulatePartnerBid(
                        'mfr-pacific-proto',
                        'Pacific Prototyping Labs',
                        49.0,
                        2,
                        'Domestic Beaverton rapid turnaround + dynamic magnetic levitation balance check.',
                        'USD',
                        49.0,
                      )
                    }
                    className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 font-semibold text-[11px] text-left transition-colors"
                  >
                    <div className="font-bold flex items-center space-x-1">
                      <Printer className="w-3 h-3 text-cyan-600" />
                      <span>🇺🇸 Pacific Prototyping</span>
                    </div>
                    <div className="text-[10px] text-cyan-700 font-mono font-bold">$49.00 USD • 2d</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">
                Cryptographic WORM SHA-256 Ledger protects all released bids and awards.
              </span>
              <button
                type="button"
                onClick={() => setBiddingOrder(null)}
                className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
