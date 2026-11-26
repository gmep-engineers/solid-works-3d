'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Key,
  CreditCard,
  Wallet,
  History,
  PieChart,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Sparkles,
  Zap,
  Box,
  Layers,
  Truck,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function CredentialsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'wallet' | 'contact' | 'security' | 'history'>('all');

  // Contact Info State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [savingContact, setSavingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  // Wallet Top-Up State
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState('');

  // Add Card State
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2028');
  const [isAddingCard, setIsAddingCard] = useState(false);

  // Load Profile Data
  const loadProfile = async () => {
    try {
      setLoading(true);
      let userEmail = 'alex.mercer@gmail.com';
      try {
        const stored = localStorage.getItem('levitate3d_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.email) userEmail = u.email;
        }
      } catch (e) {
        // fallback
      }

      const data = await api.getUserProfile(userEmail);
      setProfile(data);

      // Populate form states
      setFullName(data.full_name || 'Alex Mercer');
      setPhone(data.phone || '+1 (503) 555-0199');
      if (data.shipping_address) {
        setStreet(data.shipping_address.street || '742 Evergreen Terrace');
        setCity(data.shipping_address.city || 'Portland');
        setState(data.shipping_address.state || 'OR');
        setPostalCode(data.shipping_address.postal_code || '97201');
        setCountry(data.shipping_address.country || 'United States');
      }
      if (data.payment_methods && data.payment_methods.length > 0) {
        const defaultCard = data.payment_methods.find((p: any) => p.is_default) || data.payment_methods[0];
        setSelectedCardId(defaultCard.id);
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Contact Update
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setContactSuccess('');
    try {
      const updated = await api.updateUserProfile({
        email: profile?.email || 'alex.mercer@gmail.com',
        full_name: fullName,
        phone,
        shipping_address: {
          street,
          city,
          state,
          postal_code: postalCode,
          country,
        },
      });
      setProfile(updated);
      setContactSuccess('✓ Contact information and shipping address saved successfully!');
      setTimeout(() => setContactSuccess(''), 4000);
    } catch (err: any) {
      alert('Error updating contact information: ' + err.message);
    } finally {
      setSavingContact(false);
    }
  };

  // Handle Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters long.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg({ text: '', isError: false });
    try {
      const res = await api.changePassword({
        email: profile?.email || 'alex.mercer@gmail.com',
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg({ text: '✓ Password updated securely with SHA-256 audit entry!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg({ text: '', isError: false }), 5000);
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Failed to update password.', isError: true });
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Wallet Top-Up
  const handleTopUp = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : topUpAmount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Please enter a valid top-up amount.');
      return;
    }

    setIsTopUpLoading(true);
    setTopUpSuccess('');
    try {
      const res = await api.topUpWallet({
        email: profile?.email || 'alex.mercer@gmail.com',
        amount: finalAmount,
        payment_method_id: selectedCardId,
      });

      setProfile((prev: any) => ({
        ...prev,
        wallet_balance: res.balance,
        wallet_transactions: [res.transaction, ...(prev?.wallet_transactions || [])],
      }));
      setTopUpSuccess(`✓ Successfully added $${finalAmount.toFixed(2)} USD to your wallet!`);
      setCustomAmount('');
      setTimeout(() => setTopUpSuccess(''), 4000);
    } catch (err: any) {
      alert('Top-up failed: ' + err.message);
    } finally {
      setIsTopUpLoading(false);
    }
  };

  // Handle Add Card
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.replace(/\s+/g, '').length < 12) {
      alert('Please enter a valid card number.');
      return;
    }

    setIsAddingCard(true);
    try {
      const updatedMethods = await api.addPaymentMethod({
        email: profile?.email || 'alex.mercer@gmail.com',
        number: cardNumber,
        brand: cardBrand,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10),
        is_default: (profile?.payment_methods || []).length === 0,
      });

      setProfile((prev: any) => ({
        ...prev,
        payment_methods: updatedMethods,
      }));
      setCardNumber('');
      setShowAddCard(false);
    } catch (err: any) {
      alert('Failed to add card: ' + err.message);
    } finally {
      setIsAddingCard(false);
    }
  };

  // Handle Delete Card
  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment card?')) return;
    try {
      const updatedMethods = await api.removePaymentMethod(id, profile?.email || 'alex.mercer@gmail.com');
      setProfile((prev: any) => ({
        ...prev,
        payment_methods: updatedMethods,
      }));
    } catch (err: any) {
      alert('Failed to delete card: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
        <p className="text-slate-500 font-medium">Loading your credential & wallet profile...</p>
      </div>
    );
  }

  const walletBalance = Number(profile?.wallet_balance || 0);
  const transactions = profile?.wallet_transactions || [];
  const usage = profile?.wallet_usage || {
    sculptures_total: 199.0,
    led_upgrades_total: 35.0,
    ai_generations_total: 26.0,
    shipping_total: 24.0,
    total_spent: 284.0,
  };
  const totalSpent = Number(usage.total_spent || 284.0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200 text-cyan-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Customer Credential & Account Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account Credentials & Digital Wallet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your password security, contact details, payment cards, wallet balance, and real-time usage.
          </p>
        </div>

        {/* Quick Balance Header Badge */}
        <div className="flex items-center space-x-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-indigo-900">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">Wallet Balance</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">${walletBalance.toFixed(2)} USD</div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All-in-One Overview
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'wallet' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Wallet & Top-Up</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'history' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Transactions & Usage</span>
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'contact' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Contact & Address</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'security' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Password & Security</span>
        </button>
      </div>

      {/* SECTION 1: WALLET & PAYMENT METHOD TOP-UP */}
      {(activeTab === 'all' || activeTab === 'wallet') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Wallet Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-900 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span>Levitate3D Instant Wallet</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  ACTIVE • 1-CLICK PAY
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-400">Remaining Balance</div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-1">
                  ${walletBalance.toFixed(2)} <span className="text-xs font-sans text-indigo-300 font-semibold">USD</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-xs text-indigo-200 space-y-1.5">
                <div className="font-semibold text-white flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Purchasing Power Overview</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Your funds are stored locally and ready for 1-click checkout on custom levitating statues, inductive LED core upgrades, or instant Tripo3D neural model syntheses.
                </p>
              </div>
            </div>

            {/* Quick Balance Status */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-mono">Total Deposited</div>
                <div className="font-mono font-bold text-white text-sm">
                  ${((walletBalance || 0) + totalSpent).toFixed(2)} USD
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-mono">Total Utilized</div>
                <div className="font-mono font-bold text-indigo-300 text-sm">
                  ${totalSpent.toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>

          {/* Fill Wallet Top-Up Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-cyan-600" />
                  <span>Fill Wallet & Manage Payment Methods</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a top-up preset or custom dollar amount to reload your balance.
                </p>
              </div>

              <button
                onClick={() => setShowAddCard(!showAddCard)}
                className="text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>{showAddCard ? 'Cancel' : 'Add Card'}</span>
              </button>
            </div>

            {/* Success notification */}
            {topUpSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{topUpSuccess}</span>
              </div>
            )}

            {/* Add New Card Form (Collapsible) */}
            {showAddCard && (
              <form onSubmit={handleAddCard} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn text-xs">
                <div className="font-bold text-slate-800">Add New Payment Card</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Brand</label>
                    <select
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Exp Month / Year</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="MM (12)"
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        className="w-1/2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="YYYY (2028)"
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        className="w-1/2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isAddingCard}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isAddingCard ? 'Saving...' : 'Save Payment Card'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Saved Payment Methods List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Funding Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(profile?.payment_methods || []).map((pm: any) => (
                  <div
                    key={pm.id}
                    onClick={() => setSelectedCardId(pm.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedCardId === pm.id
                        ? 'border-cyan-600 bg-cyan-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <CreditCard className="w-4 h-4 text-cyan-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{pm.brand || 'Card'} •••• {pm.last4}</span>
                          {pm.is_default && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Exp: {pm.exp_month}/{pm.exp_year}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(pm.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Top-Up Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Choose Deposit Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTopUpAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                      topUpAmount === amt && !customAmount
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="pt-2 flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Or custom:</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="Other amount (e.g. 75)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-6 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleTopUp}
              disabled={isTopUpLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>
                {isTopUpLoading
                  ? 'Charging Card & Depositing...'
                  : `Deposit $${(customAmount ? parseFloat(customAmount) || 0 : topUpAmount).toFixed(2)} USD to Wallet`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: USAGE & TRANSACTION HISTORY */}
      {(activeTab === 'all' || activeTab === 'history') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Wallet Usage Breakdown */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-cyan-600" />
                <span>Wallet Usage Breakdown</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed category analysis of all wallet credits spent.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Item 1: 3D Sculpture Production */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Box className="w-3.5 h-3.5 text-cyan-600" />
                    <span>3D Sculptures & Resin Prints</span>
                  </span>
                  <span className="font-mono">${Number(usage.sculptures_total || 199.0).toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((usage.sculptures_total || 199.0) / totalSpent) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Item 2: Wireless Inductive LED Upgrades */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Wireless Inductive LED Coils</span>
                  </span>
                  <span className="font-mono">${Number(usage.led_upgrades_total || 35.0).toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((usage.led_upgrades_total || 35.0) / totalSpent) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Item 3: AI Model Generations */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tripo3D AI Model Generations</span>
                  </span>
                  <span className="font-mono">${Number(usage.ai_generations_total || 26.0).toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((usage.ai_generations_total || 26.0) / totalSpent) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Item 4: Shipping & QA Logistics */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Express Domestic Shipping & QA</span>
                  </span>
                  <span className="font-mono">${Number(usage.shipping_total || 24.0).toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((usage.shipping_total || 24.0) / totalSpent) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Total Lifetime Outlay:</span>
              <span className="font-mono font-bold text-slate-900">${totalSpent.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Transaction History Ledger */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <History className="w-4 h-4 text-cyan-600" />
                  <span>Wallet Transaction History</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete immutable ledger of all top-ups, deductions, and credits.
                </p>
              </div>

              <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-mono font-bold">
                {transactions.length} Records
              </span>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3.5">Txn ID & Date</th>
                    <th className="py-2.5 px-3.5">Activity Description</th>
                    <th className="py-2.5 px-3.5 text-right">Amount</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((txn: any) => {
                    const isPositive = Number(txn.amount) > 0;
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-slate-800">{txn.id}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(txn.date || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 font-medium text-slate-800">
                          <div className="flex items-center space-x-1.5">
                            {isPositive ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="line-clamp-1">{txn.description}</span>
                          </div>
                          {txn.reference_id && (
                            <span className="text-[10px] text-slate-400 font-mono">Ref: {txn.reference_id}</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-600' : 'text-slate-800'}>
                            {isPositive ? `+$${Number(txn.amount).toFixed(2)}` : `-$${Math.abs(Number(txn.amount)).toFixed(2)}`}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-bold">
                            {txn.status || 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CONTACT INFO & SHIPPING ADDRESS */}
      {(activeTab === 'all' || activeTab === 'contact') && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <User className="w-4 h-4 text-cyan-600" />
                <span>Contact Information & Default Shipping Address</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your primary recipient name, contact phone, and verified shipping destination for statue deliveries.
              </p>
            </div>
          </div>

          {contactSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{contactSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address (Account ID)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={profile?.email || 'alex.mercer@gmail.com'}
                    disabled
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Primary Physical Shipping Destination</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="742 Evergreen Terrace"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Portland"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">State / Zip</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="OR"
                      className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                    />
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="97201"
                      className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingContact}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {savingContact ? 'Saving Changes...' : 'Save Contact Information'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 4: PASSWORD & CREDENTIAL SECURITY */}
      {(activeTab === 'all' || activeTab === 'security') && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-600" />
                <span>Password & Authentication Security</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your account password. All changes are cryptographically signed into the WORM audit trail.
              </p>
            </div>

            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-mono font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              <span>SHA-256 HASH PROTECTED</span>
            </span>
          </div>

          {passwordMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
                passwordMsg.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {passwordMsg.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Password changes invalidate all older JWT sessions.
              </span>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
