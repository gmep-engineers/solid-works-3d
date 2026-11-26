'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Users,
  UserCheck,
  Shield,
  Key,
  Wallet,
  DollarSign,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ArrowRight,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  History,
  TrendingUp,
  Package,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'ADMIN' | 'SUPPLIER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isAdjustingWallet, setIsAdjustingWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState<string>('25');
  const [walletReason, setWalletReason] = useState<string>('Customer Service Goodwill Credit');
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<'CUSTOMER' | 'ADMIN' | 'SUPPLIER'>('CUSTOMER');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'CUSTOMER' | 'ADMIN' | 'SUPPLIER'>('CUSTOMER');
  const [newPhone, setNewPhone] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('50');
  const [isCreating, setIsCreating] = useState(false);

  // Success alert
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotification = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 4000);
  };

  // Handle Wallet Adjustment
  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amt = parseFloat(walletAmount);
    if (isNaN(amt) || amt === 0) {
      alert('Please enter a valid non-zero adjustment amount.');
      return;
    }

    setIsSubmittingWallet(true);
    try {
      const res = await api.adjustAdminUserWallet(selectedUser.id, {
        amount: amt,
        reason: walletReason,
      });
      showNotification(`✓ Successfully adjusted wallet by ${amt >= 0 ? `+$${amt.toFixed(2)}` : `-$${Math.abs(amt).toFixed(2)}`} USD!`);
      setIsAdjustingWallet(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert('Error adjusting wallet: ' + err.message);
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  // Handle Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.updateAdminUser(editingUser.id, {
        role: editRole,
        status: editStatus,
        full_name: editFullName,
        phone: editPhone,
      });
      showNotification(`✓ Successfully updated user "${editFullName || editingUser.email}"`);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert('Error updating user: ' + err.message);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (user: any) => {
    if (!confirm(`Are you sure you want to reset the password for ${user.email}?`)) return;
    try {
      const res = await api.resetAdminUserPassword(user.id);
      alert(`✓ Password successfully reset for ${user.email}!\n\nTemporary Password: ${res.temporary_password}\n(A cryptographic audit entry has been recorded into WORM)`);
    } catch (err: any) {
      alert('Error resetting password: ' + err.message);
    }
  };

  // Handle Create User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert('Email is required.');
      return;
    }
    setIsCreating(true);
    try {
      await api.createAdminUser({
        email: newEmail.trim(),
        full_name: newName.trim(),
        role: newRole,
        phone: newPhone.trim(),
        initial_wallet_balance: parseFloat(newInitialBalance) || 0,
      });
      showNotification(`✓ Successfully registered user "${newEmail}"`);
      setShowCreateModal(false);
      setNewEmail('');
      setNewName('');
      setNewPhone('');
      loadUsers();
    } catch (err: any) {
      alert('Error creating user: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalWalletCirculation = users.reduce((sum, u) => sum + (Number(u.wallet_balance) || 0), 0);
  const totalCustomerSpend = users.reduce((sum, u) => sum + (Number(u.total_spend_usd) || 0), 0);
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const supplierCount = users.filter((u) => u.role === 'SUPPLIER').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200 text-cyan-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-2">
            <Users className="w-3.5 h-3.5 text-cyan-600" />
            <span>Admin Operations &bull; Central Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Management &amp; Wallet Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer profiles, grant promotional wallet balances, audit user spend, and control role-based access.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadUsers}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {flashMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{flashMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{users.length}</div>
          <div className="text-[11px] text-slate-400 font-medium">
            {customerCount} Customers &bull; {adminCount} Admins &bull; {supplierCount} Suppliers
          </div>
        </div>

        {/* Total Wallet Circulation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Customer Wallet Reserves</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">${totalWalletCirculation.toFixed(2)} USD</div>
          <div className="text-[11px] text-slate-400 font-medium">Total active credits in customer wallets</div>
        </div>

        {/* Total Order Spend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Lifetime Order Inflow</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600">${totalCustomerSpend.toFixed(2)} USD</div>
          <div className="text-[11px] text-slate-400 font-medium">Gross fulfilled customer sculptures</div>
        </div>

        {/* Security & Audit Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Security Governance</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">100% WORM</div>
          <div className="text-[11px] text-slate-400 font-medium">All wallet adjustments SHA-256 hashed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold whitespace-nowrap">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-600" />
            <span>Registered User Directory ({filteredUsers.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">User &amp; Identity</th>
                <th className="py-3 px-4">Role &amp; Status</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Order Spend</th>
                <th className="py-3 px-4">Shipping Destination</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCustomer = u.role === 'CUSTOMER';
                const isAdmin = u.role === 'ADMIN';
                const isSupplier = u.role === 'SUPPLIER';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {u.full_name ? u.full_name[0] : (u.email ? u.email[0].toUpperCase() : 'U')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{u.full_name || 'Anonymous User'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          {u.phone && <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Role & Status */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isSupplier
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                          }`}
                        >
                          {u.role || 'CUSTOMER'}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            u.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </div>
                    </td>

                    {/* Wallet Balance */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-emerald-600">
                          ${Number(u.wallet_balance || 0).toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsAdjustingWallet(true);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors"
                          title="Credit or debit funds"
                        >
                          &plusmn; Adjust
                        </button>
                      </div>
                    </td>

                    {/* Order Spend */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        ${Number(u.total_spend_usd || 0).toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {u.orders_count || 0} physical order{(u.orders_count || 0) === 1 ? '' : 's'}
                      </div>
                    </td>

                    {/* Shipping Destination */}
                    <td className="py-3.5 px-4">
                      {u.shipping_address ? (
                        <div className="text-[11px] text-slate-600 max-w-[180px] truncate">
                          {u.shipping_address.street}, {u.shipping_address.city}, {u.shipping_address.state}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No address on file</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                          title="View user details & ledger"
                        >
                          Inspect
                        </button>

                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditRole(u.role || 'CUSTOMER');
                            setEditStatus(u.status || 'ACTIVE');
                            setEditFullName(u.full_name || '');
                            setEditPhone(u.phone || '');
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Edit role and status"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Reset Password"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADJUST WALLET BALANCE */}
      {isAdjustingWallet && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Adjust Customer Wallet Balance</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">User: {selectedUser.email}</p>
              </div>
              <button onClick={() => setIsAdjustingWallet(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-500 font-medium">Current Balance:</span>
              <span className="font-mono font-bold text-sm text-slate-900">
                ${Number(selectedUser.wallet_balance || 0).toFixed(2)} USD
              </span>
            </div>

            <form onSubmit={handleWalletAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Adjustment Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder="e.g. 50 (to credit) or -20 (to debit)"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Positive number credits funds (+$); negative number debits (-$).
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for Adjustment</label>
                <select
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="Customer Service Goodwill Credit">Customer Service Goodwill Credit</option>
                  <option value="Physical Statue Order Delay Refund">Physical Statue Order Delay Refund</option>
                  <option value="Promotional Campaign Bonus">Promotional Campaign Bonus</option>
                  <option value="Manual Offline Cash Deposit Topup">Manual Offline Cash Deposit Topup</option>
                  <option value="Chargeback or Ledger Correction">Chargeback or Ledger Correction</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustingWallet(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWallet}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingWallet ? 'Saving Adjustment...' : 'Commit Adjustment & Sign WORM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT USER PROFILE & WALLET LEDGER */}
      {selectedUser && !isAdjustingWallet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-cyan-600" />
                  <span>Customer Ledger &amp; Profile Audit</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Wallet Balance</span>
                <div className="font-mono font-bold text-base text-emerald-600 mt-1">
                  ${Number(selectedUser.wallet_balance || 0).toFixed(2)} USD
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Orders Spend</span>
                <div className="font-mono font-bold text-base text-indigo-600 mt-1">
                  ${Number(selectedUser.total_spend_usd || 0).toFixed(2)} USD
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Account Role</span>
                <div className="font-mono font-bold text-base text-slate-800 mt-1 uppercase">
                  {selectedUser.role || 'CUSTOMER'}
                </div>
              </div>
            </div>

            {/* Contact & Physical Address */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Verified Physical Shipping Address</span>
              </div>
              {selectedUser.shipping_address ? (
                <div className="text-slate-600 font-medium">
                  {selectedUser.full_name || selectedUser.email} &bull; {selectedUser.phone || 'No phone'}
                  <br />
                  {selectedUser.shipping_address.street}
                  <br />
                  {selectedUser.shipping_address.city}, {selectedUser.shipping_address.state} {selectedUser.shipping_address.postal_code}
                  <br />
                  {selectedUser.shipping_address.country || 'United States'}
                </div>
              ) : (
                <p className="text-slate-400 italic">No shipping destination recorded.</p>
              )}
            </div>

            {/* Wallet Transactions Ledger */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Wallet Transaction Ledger</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {(selectedUser.wallet_transactions || []).length} Records
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedUser.wallet_transactions || []).map((txn: any) => {
                      const isPos = Number(txn.amount) > 0;
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                            {new Date(txn.date || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{txn.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={isPos ? 'text-emerald-600' : 'text-slate-800'}>
                              {isPos ? `+$${Number(txn.amount).toFixed(2)}` : `-$${Math.abs(Number(txn.amount)).toFixed(2)}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT ROLE & STATUS */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit User Access &amp; Role</h3>
                <p className="text-xs text-slate-500">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPPLIER">Supplier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Access Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE USER */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register New Account</h3>
                <p className="text-xs text-slate-500">Add an administrator, supplier, or customer</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address (ID)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPPLIER">Supplier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Wallet Grant ($)</label>
                  <input
                    type="number"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 (503) 555-0199"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {isCreating ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
