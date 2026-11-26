'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Factory,
  Plus,
  Shield,
  Layers,
  Search,
  Key,
  Copy,
  Check,
  RotateCw,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit,
  Power,
  Palette,
  Printer,
  Sparkles,
  ExternalLink,
  Globe,
  DollarSign,
  Coins,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

const CURRENCY_CONFIG: Record<string, { symbol: string; name: string; flag: string; defaultRate: number }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', defaultRate: 1.0 },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', defaultRate: 7.24 },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', defaultRate: 154.5 },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺', defaultRate: 0.92 },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧', defaultRate: 0.79 },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', defaultRate: 1.38 },
};

const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  CNY: 7.24,
  JPY: 154.5,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.38,
};

const getNumericRate = (val: any): number => {
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object') {
    if ('rate_to_usd' in val) return Number(val.rate_to_usd);
    if ('defaultRate' in val) return Number(val.defaultRate);
  }
  return 1.0;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | '3D_PRINTING' | 'DESIGNER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // Copy token feedback
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [rotatingVendor, setRotatingVendor] = useState<any | null>(null);
  const [togglingVendor, setTogglingVendor] = useState<any | null>(null);

  // Currency & FX Rates modal state
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [editingRateCode, setEditingRateCode] = useState('JPY');
  const [editingRateValue, setEditingRateValue] = useState(154.5);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState<{ source?: string; time?: string } | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'3D_PRINTING' | 'DESIGNER'>('3D_PRINTING');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formCountry, setFormCountry] = useState('United States');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formTurnaround, setFormTurnaround] = useState(3);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Toggle status reason
  const [toggleReason, setToggleReason] = useState('Routine operational review');

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminVendors();
      setVendors(data || []);
    } catch (err) {
      console.warn('Failed to load vendors from API, fallback to getAdminManufacturers:', err);
      try {
        const fallback = await api.getAdminManufacturers();
        setVendors(fallback || []);
      } catch (e) {
        console.error('Failed to load fallback vendors:', e);
      }
    } finally {
      setLoading(false);
    }

    try {
      const rateData = await api.getExchangeRates();
      if (rateData?.currencies) {
        const parsed: Record<string, number> = {};
        for (const [code, info] of Object.entries(rateData.currencies)) {
          parsed[code] = getNumericRate(info);
        }
        setExchangeRates(parsed);
      }
    } catch (e) {
      console.warn('Could not load dynamic exchange rates:', e);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleCopyToken = (tokenId: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const handleOpenAddModal = (defaultCat: '3D_PRINTING' | 'DESIGNER' = '3D_PRINTING') => {
    setFormName('');
    setFormCategory(defaultCat);
    setFormCurrency(defaultCat === 'DESIGNER' ? 'JPY' : 'CNY');
    setFormCountry(defaultCat === 'DESIGNER' ? 'Japan' : 'China');
    setFormEmail('');
    setFormPhone('');
    setFormContactPerson('');
    setFormLocation('');
    setFormSpecialty(
      defaultCat === 'DESIGNER'
        ? '3D Character Sculpt Fine-Tuning & N52 Cavity Hollowing'
        : 'High-Precision SLA Resin & Electroless Nickel Plating',
    );
    setFormTurnaround(defaultCat === 'DESIGNER' ? 1 : 3);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (v: any) => {
    setEditingVendor(v);
    setFormName(v.name || '');
    setFormCategory(v.category || '3D_PRINTING');
    setFormCurrency(v.currency || 'USD');
    setFormCountry(
      v.country ||
        (v.facility_location?.includes('Japan') || v.facility_location?.includes('Tokyo')
          ? 'Japan'
          : v.facility_location?.includes('CN') || v.facility_location?.includes('Shenzhen')
          ? 'China'
          : v.facility_location?.includes('Canada') || v.facility_location?.includes('Vancouver')
          ? 'Canada'
          : 'United States'),
    );
    setFormEmail(v.email || '');
    setFormPhone(v.phone || '');
    setFormContactPerson(v.contact_person || '');
    setFormLocation(v.facility_location || '');
    setFormSpecialty(v.specialty || '');
    setFormTurnaround(v.avg_turnaround_days || 3);
    setFormNotes(v.notes || '');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingForm(true);
    try {
      const res = await api.createVendor({
        name: formName,
        category: formCategory,
        currency: formCurrency,
        country: formCountry,
        email: formEmail,
        phone: formPhone,
        contact_person: formContactPerson,
        facility_location: formLocation,
        specialty: formSpecialty,
        avg_turnaround_days: Number(formTurnaround),
        notes: formNotes,
      });
      alert(
        `✓ Vendor "${res.manufacturer?.name || res.vendor?.name || formName}" (${
          formCategory === 'DESIGNER' ? '3D CAD Designer' : '3D Printing'
        } - ${formCurrency}) successfully registered! Hardware token issued and sealed in WORM ledger.`,
      );
      setIsAddModalOpen(false);
      loadVendors();
    } catch (err: any) {
      alert('Error registering vendor: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setIsSubmittingForm(true);
    try {
      await api.updateVendor(editingVendor.id, {
        name: formName,
        category: formCategory,
        currency: formCurrency,
        country: formCountry,
        email: formEmail,
        phone: formPhone,
        contact_person: formContactPerson,
        facility_location: formLocation,
        specialty: formSpecialty,
        avg_turnaround_days: Number(formTurnaround),
        notes: formNotes,
      });
      alert(`✓ Vendor "${formName}" information updated (Currency: ${formCurrency}) and logged in WORM audit trail.`);
      setEditingVendor(null);
      loadVendors();
    } catch (err: any) {
      alert('Error updating vendor: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleUpdateExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingRate(true);
    try {
      const res = await api.updateExchangeRate({
        currency: editingRateCode,
        rate_to_usd: Number(editingRateValue),
      });
      alert(`✓ FX Rate updated: 1 USD = ${editingRateValue} ${editingRateCode}. Chained in WORM audit ledger.`);
      if (res.currencies) {
        const parsed: Record<string, number> = {};
        for (const [code, info] of Object.entries(res.currencies)) {
          parsed[code] = getNumericRate(info);
        }
        setExchangeRates(parsed);
      }
      setIsRatesModalOpen(false);
    } catch (err: any) {
      alert('Error updating FX exchange rate: ' + (err.message || 'Server error'));
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const handleSyncLiveRates = async () => {
    setIsSyncingRates(true);
    try {
      const res = await api.syncLiveExchangeRates();
      if (res.success && res.currencies) {
        const parsed: Record<string, number> = {};
        for (const [code, info] of Object.entries(res.currencies)) {
          parsed[code] = getNumericRate(info);
        }
        setExchangeRates(parsed);
        setLastSyncInfo({ source: res.source, time: new Date().toLocaleTimeString() });
        alert(
          `✓ Real-time FX exchange rates successfully synced!\n\n` +
            `Source: ${res.source}\n` +
            `Timestamp: ${res.feed_timestamp_utc || new Date().toISOString()}\n\n` +
            `Updated Rates (1 USD =):\n` +
            `• CNY: ${parsed.CNY} ¥\n` +
            `• JPY: ${parsed.JPY} ¥\n` +
            `• EUR: ${parsed.EUR} €\n` +
            `• GBP: ${parsed.GBP} £\n` +
            `• CAD: ${parsed.CAD} CA$\n\n` +
            `All rates cryptographically hashed and chained into the WORM legal audit ledger.`,
        );
      } else {
        alert('Notice: ' + (res.message || 'Retained existing exchange rates.'));
      }
    } catch (err: any) {
      alert('Error syncing live exchange rates: ' + (err.message || 'Network error'));
    } finally {
      setIsSyncingRates(false);
    }
  };

  const handleConfirmRotateToken = async () => {
    if (!rotatingVendor) return;
    try {
      const res = await api.rotateVendorDeviceToken(rotatingVendor.id);
      alert(
        `✓ New Device Token issued for "${rotatingVendor.name}":\n\n${res.device_token}\n\nThe old token has been revoked. Provide this new token to the partner for their Windows Desktop Terminal.`,
      );
      setRotatingVendor(null);
      loadVendors();
    } catch (err: any) {
      alert('Error rotating token: ' + (err.message || 'Server error'));
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!togglingVendor) return;
    const targetStatus = togglingVendor.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.toggleVendorStatus(togglingVendor.id, {
        status: targetStatus,
        reason: toggleReason,
      });
      alert(`✓ Vendor "${togglingVendor.name}" is now ${targetStatus}. Recorded in WORM legal ledger.`);
      setTogglingVendor(null);
      loadVendors();
    } catch (err: any) {
      alert('Error updating vendor status: ' + (err.message || 'Server error'));
    }
  };

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.facility_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.specialty?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL'
        ? true
        : categoryFilter === 'DESIGNER'
        ? v.category === 'DESIGNER'
        : v.category === '3D_PRINTING' || !v.category;

    const matchesStatus =
      statusFilter === 'ALL' ? true : statusFilter === 'ACTIVE' ? v.status === 'ACTIVE' : v.status === 'DISABLED';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCount = vendors.length;
  const printingCount = vendors.filter((v) => v.category === '3D_PRINTING' || !v.category).length;
  const designerCount = vendors.filter((v) => v.category === 'DESIGNER').length;
  const activeCount = vendors.filter((v) => v.status === 'ACTIVE').length;
  const disabledCount = vendors.filter((v) => v.status === 'DISABLED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>ADMIN OPERATIONS</span>
                <span>/</span>
                <span className="text-cyan-700">VENDOR DIRECTORY & GATEWAY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
                <span>Vendor Directory & Bidding Network</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage verified <strong>3D Printing Facilities</strong> and <strong>3D CAD Designers</strong>, contact persons, SLA ratings, operational status, and hardware-bound Windows desktop tokens.
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setIsRatesModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 shadow-sm transition-all"
              >
                <Globe className="w-4 h-4 text-amber-600" />
                <span>Bidding Currencies & FX Rates</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal('DESIGNER')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 shadow-sm transition-all"
              >
                <Palette className="w-4 h-4 text-purple-600" />
                <span>+ Add Designer</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal('3D_PRINTING')}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all hover:scale-[1.02]"
              >
                <Printer className="w-4 h-4" />
                <span>+ Add 3D Printer</span>
              </button>
            </div>
          </div>

          {/* Subnav Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-5 border-t border-slate-100 pt-3 text-xs font-semibold">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Production Pipeline & RFQ Bids</span>
            </Link>
            <Link
              href="/admin/vendors"
              className="px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800 font-bold border border-cyan-200 flex items-center space-x-1.5"
            >
              <Factory className="w-3.5 h-3.5 text-cyan-600" />
              <span>Vendor Directory ({totalCount})</span>
            </Link>
            <Link
              href="/admin/worm"
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-amber-800 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>WORM Legal Audit Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL VENDORS</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active Network Partners</div>
          </div>

          <div
            onClick={() => setCategoryFilter('3D_PRINTING')}
            className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
              categoryFilter === '3D_PRINTING'
                ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-200'
                : 'bg-white border-slate-200 hover:border-cyan-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">3D PRINTING</span>
              <Printer className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-cyan-900 mt-1">{printingCount}</div>
            <div className="text-[10px] text-cyan-700 mt-0.5">Fabrication facilities</div>
          </div>

          <div
            onClick={() => setCategoryFilter('DESIGNER')}
            className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
              categoryFilter === 'DESIGNER'
                ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-200'
                : 'bg-white border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">3D CAD DESIGNERS</span>
              <Palette className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-900 mt-1">{designerCount}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Sculpt & mesh fine-tune</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">ACTIVE STATUS</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Eligible for RFQ bidding</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">AVG SLA ADHERENCE</div>
            <div className="text-2xl font-black text-slate-900 mt-1">99.4%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across design & print</div>
          </div>
        </div>

        {/* International Currencies & FX Rates Ribbon */}
        <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-amber-50 p-4 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Globe className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 flex items-center space-x-2">
                <span>Multi-Currency Bidding & FX Engine Active</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                  Base: USD ($)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                CAD designers & 3D printers submit RFQ bids in their local currency; platform auto-converts to normalized USD for retail margins.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(exchangeRates).map(([curr, rate]) => (
              <button
                key={curr}
                type="button"
                onClick={() => {
                  setEditingRateCode(curr);
                  setEditingRateValue(rate);
                  setIsRatesModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-[11px] font-medium transition-all shadow-xs"
                title={`Click to adjust: 1 USD = ${rate} ${curr}`}
              >
                <span>{CURRENCY_CONFIG[curr]?.flag || '🌐'}</span>
                <span className="font-bold text-slate-800">{curr}:</span>
                <span className="font-mono text-slate-600 font-semibold">
                  {rate} {CURRENCY_CONFIG[curr]?.symbol}
                </span>
              </button>
            ))}
            <button
              type="button"
              disabled={isSyncingRates}
              onClick={handleSyncLiveRates}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
              title="Query live international interbank feed and update currency database in real-time"
            >
              <RotateCw className={`w-3 h-3 ${isSyncingRates ? 'animate-spin' : ''}`} />
              <span>{isSyncingRates ? 'Syncing...' : 'Sync Live Rates'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRatesModalOpen(true)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-200/70 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
            >
              Configure FX →
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor name, contact person, specialty, or city..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Role & Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Role:</span>
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                  categoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Roles ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('3D_PRINTING')}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center space-x-1 transition-all ${
                  categoryFilter === '3D_PRINTING'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                }`}
              >
                <Printer className="w-3 h-3" />
                <span>3D Printing ({printingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('DESIGNER')}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center space-x-1 transition-all ${
                  categoryFilter === 'DESIGNER'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <Palette className="w-3 h-3" />
                <span>Designers ({designerCount})</span>
              </button>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Status:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active ({activeCount})
              </button>
              {disabledCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('DISABLED')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                    statusFilter === 'DISABLED' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Disabled ({disabledCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Loading verified vendor network...
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <Factory className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No matching vendors found</div>
            <p className="text-xs text-slate-400">
              Try adjusting your search query, role filter, or register a new partner.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVendors.map((vendor) => {
              const isDesigner = vendor.category === 'DESIGNER';
              const isActive = vendor.status === 'ACTIVE';

              return (
                <div
                  key={vendor.id}
                  className={`bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                    !isActive
                      ? 'border-rose-200 bg-rose-50/20'
                      : isDesigner
                      ? 'border-purple-200 hover:border-purple-400'
                      : 'border-slate-200 hover:border-cyan-400'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {/* Role Category Badge */}
                        <div className="mb-1.5 flex items-center space-x-1.5">
                          {isDesigner ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                              <Palette className="w-3 h-3 text-purple-600" />
                              <span>3D CAD DESIGNER</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-200">
                              <Printer className="w-3 h-3 text-cyan-600" />
                              <span>3D PRINTING & FABRICATION</span>
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{vendor.status || 'ACTIVE'}</span>
                          </span>

                          {/* Bidding Currency & Country Tag */}
                          <span
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 shadow-xs"
                            title={`Vendor submits RFQ bids in ${vendor.currency || 'USD'} (${CURRENCY_CONFIG[vendor.currency || 'USD']?.name || 'US Dollar'})`}
                          >
                            <span>{CURRENCY_CONFIG[vendor.currency || 'USD']?.flag || '🌐'}</span>
                            <span>{vendor.currency || 'USD'} ({CURRENCY_CONFIG[vendor.currency || 'USD']?.symbol || '$'})</span>
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base text-slate-900 tracking-tight">{vendor.name}</h3>
                        <div className="flex items-center space-x-1 text-slate-500 text-xs mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{vendor.facility_location || 'Global Partner Hub'}</span>
                        </div>
                      </div>

                      {/* Rating & SLA adherence */}
                      <div className="text-right">
                        <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-bold">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{vendor.rating ? Number(vendor.rating).toFixed(1) : '5.0'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          SLA: <strong className="text-slate-700">{vendor.sla_adherence_pct || 99.4}%</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ~{vendor.avg_turnaround_days || (isDesigner ? 1 : 3)}d turnaround
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Contact & Specialty */}
                  <div className="p-5 py-4 space-y-3.5 text-xs flex-1">
                    {/* Primary Contact Person */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Primary Contact Person:
                      </div>
                      <div className="font-bold text-slate-800">{vendor.contact_person || 'Engineering Lead'}</div>
                      <div className="flex flex-col space-y-0.5 text-[11px] text-slate-500 pt-0.5">
                        <a
                          href={`mailto:${vendor.email}`}
                          className="flex items-center space-x-1.5 text-cyan-700 hover:underline"
                        >
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{vendor.email}</span>
                        </a>
                        {vendor.phone && (
                          <div className="flex items-center space-x-1.5 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Materials & Specialty */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isDesigner ? 'Design & Fine-Tune Expertise:' : 'Materials & Specialty:'}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                        {vendor.specialty || 'General fabrication & engineering'}
                      </p>
                    </div>

                    {/* Windows Desktop Device Token */}
                    <div className="bg-slate-900 text-slate-100 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                          <Key className="w-3 h-3" />
                          <span>Windows Desktop Device Token</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyToken(vendor.id, vendor.device_token)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center space-x-1 transition-colors"
                          title="Copy Token"
                        >
                          {copiedTokenId === vendor.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="font-mono text-[11px] text-cyan-200 truncate select-all bg-slate-950/60 p-1.5 rounded border border-slate-800">
                        {vendor.device_token || 'TOKEN-UNINITIALIZED'}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Hardware fingerprint bound</span>
                        <button
                          type="button"
                          onClick={() => setRotatingVendor(vendor)}
                          className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                          <span>Rotate Token</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Action Buttons */}
                  <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2 pt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(vendor)}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit Info</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTogglingVendor(vendor);
                        setToggleReason(
                          vendor.status === 'ACTIVE'
                            ? 'Temporarily disabling vendor due to maintenance / QA audit'
                            : 'Re-activating vendor partner',
                        );
                      }}
                      className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm ${
                        isActive
                          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Disable' : 'Enable'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Add New Vendor */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  {formCategory === 'DESIGNER' ? <Palette className="w-5 h-5 text-purple-600" /> : <Printer className="w-5 h-5 text-cyan-600" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Register New Vendor Partner</h3>
                  <div className="text-xs text-slate-400">Issue bound Windows Desktop Token and record in WORM</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs mt-4">
              {/* Vendor Role Category Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Vendor Role & Specialization <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('3D_PRINTING');
                      if (formSpecialty.includes('Sculpt')) {
                        setFormSpecialty('High-Precision SLA Resin & Electroless Nickel Plating');
                      }
                      setFormTurnaround(3);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all ${
                      formCategory === '3D_PRINTING'
                        ? 'bg-cyan-50 border-cyan-600 ring-2 ring-cyan-200 text-cyan-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">3D Printing Partner</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Fabrication, SLA/SLS resin & assembly</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('DESIGNER');
                      if (formSpecialty.includes('SLA Resin')) {
                        setFormSpecialty('3D Character Sculpt Fine-Tuning, Mesh Topology & N52 Cavity Hollowing');
                      }
                      setFormTurnaround(1);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all ${
                      formCategory === 'DESIGNER'
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200 text-purple-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">3D CAD Designer</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Sculpt repair, magnet cavities & LED conduits</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vendor / Studio Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={formCategory === 'DESIGNER' ? 'e.g. Apex 3D Sculpt Studio' : 'e.g. Tokyo HyperResin Works'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>

              {/* Bidding Currency & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Bidding Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                  >
                    {Object.entries(CURRENCY_CONFIG).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {code} ({info.symbol}) - {info.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Vendor will quote bids in this currency (auto-converted to USD)
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Country / Region
                  </label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="e.g. Japan, China, United States, Canada"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    Geographic origin of designer / print facility
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="partner@facility.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Person Name & Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Mei Ling (Lead CAD Specialist)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Facility / Studio Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Kyoto, JP or Austin, TX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Materials & Technical Capabilities <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  placeholder={
                    formCategory === 'DESIGNER'
                      ? 'e.g. Mesh topology cleanup, magnet cavity hollowing, 3D character sculpting'
                      : 'e.g. High-temperature SLA photopolymers, nickel electroplating, 0.05mm tolerance'
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Avg SLA Turnaround (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={formTurnaround}
                    onChange={(e) => setFormTurnaround(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-bold">
                    ✓ ACTIVE (Immediate Bidding Eligible)
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Facility equipment, verified certifications, or special logistics arrangements..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isSubmittingForm ? 'Registering & Generating Token...' : 'Register Vendor & Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Vendor */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Edit Vendor Profile</h3>
                  <div className="text-xs text-slate-400">Updates will be hashed into WORM audit ledger</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Vendor Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormCategory('3D_PRINTING')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 ${
                      formCategory === '3D_PRINTING'
                        ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-200'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>3D Printing Partner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('DESIGNER')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 ${
                      formCategory === 'DESIGNER'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-200'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>3D CAD Designer</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor / Studio Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>

              {/* Bidding Currency & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Bidding Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                  >
                    {Object.entries(CURRENCY_CONFIG).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {code} ({info.symbol}) - {info.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Vendor will quote bids in this currency
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Country / Region
                  </label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="e.g. Japan, China, United States, Canada"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    Geographic origin
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Materials & Capabilities</label>
                <input
                  type="text"
                  required
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isSubmittingForm ? 'Saving...' : 'Save & Record in WORM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Rotate Device Token Confirmation */}
      {rotatingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Rotate Hardware Device Token?</h3>
                <div className="text-xs text-slate-500">
                  For <strong className="text-slate-800">{rotatingVendor.name}</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
              <strong className="text-amber-900 block mb-0.5">Security Notice:</strong>
              The current device token will be immediately invalidated. The partner must update the new token in their Windows Desktop App to connect and bid.
            </p>

            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setRotatingVendor(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRotateToken}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20"
              >
                Confirm & Issue New Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Toggle Status (Disable / Enable) Confirmation */}
      {togglingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  togglingVendor.status === 'ACTIVE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {togglingVendor.status === 'ACTIVE' ? 'Disable / Suspend Vendor?' : 'Re-Activate Vendor?'}
                </h3>
                <div className="text-xs text-slate-500">
                  For <strong className="text-slate-800">{togglingVendor.name}</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {togglingVendor.status === 'ACTIVE'
                ? 'Disabling this partner will prevent them from participating in open RFQs or taking new jobs. Active assignments will remain accessible for fulfillment.'
                : 'Re-enabling this partner will immediately restore their eligibility for RFQ invitations and job assignments.'}
            </p>

            <div className="mb-4">
              <label className="block font-bold text-slate-700 text-xs mb-1">Reason for Status Change:</label>
              <input
                type="text"
                value={toggleReason}
                onChange={(e) => setToggleReason(e.target.value)}
                placeholder="e.g. Scheduled machine maintenance or quality audit"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setTogglingVendor(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md ${
                  togglingVendor.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {togglingVendor.status === 'ACTIVE' ? 'Confirm Disable' : 'Confirm Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: FX Exchange Rates Configuration */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Platform FX Exchange Rates</h3>
                  <div className="text-xs text-slate-400">All foreign bids convert to USD for retail margin calculation</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRatesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Real-Time Live Sync Action Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    <RotateCw className={`w-4 h-4 text-emerald-600 ${isSyncingRates ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="font-extrabold text-emerald-950 text-xs flex items-center space-x-1.5">
                      <span>Real-Time Foreign Exchange Oracle</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[10px] text-emerald-800 mt-0.5">
                      {lastSyncInfo ? (
                        <span>Synced from {lastSyncInfo.source} at {lastSyncInfo.time}</span>
                      ) : (
                        <span>Syncs live rates from interbank exchange markets & European Central Bank feed</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSyncingRates}
                  onClick={handleSyncLiveRates}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50 shrink-0"
                >
                  {isSyncingRates ? 'Fetching Live Rates...' : '🔄 Sync Live FX Rates'}
                </button>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Configured Currency Rates (Base: 1.00 USD)</span>
                  <span className="text-[10px] text-slate-400">Click a currency to adjust</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(exchangeRates).map(([code, rate]) => (
                    <div
                      key={code}
                      onClick={() => {
                        setEditingRateCode(code);
                        setEditingRateValue(rate);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        editingRateCode === code
                          ? 'bg-amber-100/90 border-amber-400 font-bold text-amber-950 ring-2 ring-amber-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{CURRENCY_CONFIG[code]?.flag || '🌐'}</span>
                        <div>
                          <div className="font-extrabold text-slate-900">{code}</div>
                          <div className="text-[10px] text-slate-400">{CURRENCY_CONFIG[code]?.name}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="font-bold text-slate-900">{rate}</span>
                        <span className="text-slate-400 ml-1">{CURRENCY_CONFIG[code]?.symbol}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Selected Rate Form */}
              <form onSubmit={handleUpdateExchangeRate} className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="font-bold text-amber-950 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Adjust Rate for:</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-mono font-extrabold">
                      {CURRENCY_CONFIG[editingRateCode]?.flag} {editingRateCode} ({CURRENCY_CONFIG[editingRateCode]?.name})
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-normal">Base: 1 USD</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Exchange Rate (1 USD = ? {editingRateCode})
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      value={editingRateValue}
                      onChange={(e) => setEditingRateValue(Number(e.target.value))}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isUpdatingRate}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 disabled:opacity-50"
                    >
                      {isUpdatingRate ? 'Saving...' : 'Update Rate'}
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  Rate adjustments are committed to the SHA-256 WORM audit ledger for financial compliance.
                </div>
              </form>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRatesModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
