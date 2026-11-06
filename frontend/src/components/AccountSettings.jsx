import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  User,
  Shield,
  Key,
  Wallet,
  CreditCard,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Lock
} from 'lucide-react';

export default function AccountSettings({ currentUser, onProfileUpdated, onOpenWalletModal }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'wallet'
  const [profile, setProfile] = useState({
    full_name: currentUser?.full_name || '',
    company: currentUser?.company || '',
    phone: '',
    email: currentUser?.email || '',
    default_shipping: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'United States'
    }
  });

  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });

  const loadProfile = async () => {
    try {
      const data = await api.getUserProfile();
      setProfile({
        full_name: data.full_name || '',
        company: data.company || '',
        phone: data.phone || '',
        email: data.email || '',
        default_shipping: data.default_shipping?.street ? data.default_shipping : {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'United States'
        }
      });
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadWallet = async () => {
    try {
      const data = await api.getWallet();
      setWalletData(data);
    } catch (err) {
      console.error('Error loading wallet:', err);
    }
  };

  useEffect(() => {
    loadProfile();
    loadWallet();
  }, [currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg({ text: '', type: '' });

    try {
      const res = await api.updateUserProfile({
        full_name: profile.full_name,
        company: profile.company,
        phone: profile.phone,
        default_shipping: profile.default_shipping
      });
      setProfileMsg({ text: res.message, type: 'success' });
      if (onProfileUpdated) {
        onProfileUpdated({
          ...currentUser,
          full_name: profile.full_name,
          company: profile.company
        });
      }
    } catch (err) {
      setProfileMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPassMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPassMsg({ text: res.message, type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({ text: err.message, type: 'error' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Account Credentials & Digital Wallet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal credentials, contact info, security keys, and corporate printing wallet.
          </p>
        </div>

        {/* Quick Wallet Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-cyan-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Wallet Balance</div>
              <div className="text-sm font-bold font-mono text-white">
                ${walletData.balance.toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenWalletModal}
              className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Refill
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-semibold max-w-md">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'profile' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Profile & Address
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'security' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Credentials & Security
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'wallet' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Wallet & Cards
        </button>
      </div>

      {/* Tab 1: Profile & Address */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Engineering Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address (Login ID)</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-3 border-t border-slate-800 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Default Delivery & Shipping Destination
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 100 Aerospace Parkway, Suite 400"
                value={profile.default_shipping.street || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    default_shipping: { ...profile.default_shipping, street: e.target.value }
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Cape Canaveral"
                  value={profile.default_shipping.city || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      default_shipping: { ...profile.default_shipping, city: e.target.value }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">State / Province</label>
                <input
                  type="text"
                  placeholder="FL"
                  value={profile.default_shipping.state || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      default_shipping: { ...profile.default_shipping, state: e.target.value }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">ZIP / Postal Code</label>
                <input
                  type="text"
                  placeholder="32920"
                  value={profile.default_shipping.zip_code || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      default_shipping: { ...profile.default_shipping, zip_code: e.target.value }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {profileMsg.text && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800 text-rose-300'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
            >
              {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Update Access Password & Credentials
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">New Password (min 6 characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {passMsg.text && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                passMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800 text-rose-300'
              }`}
            >
              {passMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{passMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
            >
              {isChangingPass ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Wallet & Cards */}
      {activeTab === 'wallet' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Wallet Overview & Saved Payment Cards
              </h3>
              <p className="text-xs text-slate-400">
                Pre-funded balance used to pay for additive builds, wire EDM, and CNC machining.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenWalletModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              Refill Balance
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium">Current Balance:</span>
              <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                ${walletData.balance.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Available for immediate manufacturing checkout
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Primary Credit Card:</span>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  VISA ending in •••• 4242
                </div>
                <div className="text-[11px] text-slate-500">Exp: 12/28 • Active</div>
              </div>
              <button
                type="button"
                onClick={onOpenWalletModal}
                className="text-xs text-cyan-400 hover:underline"
              >
                Manage
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recent Wallet Ledger
            </h4>
            <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
              {walletData.transactions && walletData.transactions.length > 0 ? (
                walletData.transactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{tx.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(tx.created_at).toLocaleString()} • ID: {tx.id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono font-bold ${
                          tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Bal: ${tx.balance_after.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  No wallet transactions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
