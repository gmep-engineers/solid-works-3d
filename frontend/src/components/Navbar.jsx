import React from 'react';
import {
  Layers,
  Shield,
  Package,
  User,
  LogOut,
  Sparkles,
  FolderGit2,
  Wallet,
  PlusCircle,
  Key,
  Wrench,
  Boxes,
  Cpu
} from 'lucide-react';
import { setAuthToken, setStoredUser } from '../api';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  onOpenAuth,
  walletBalance = 0,
  onOpenWalletModal
}) {
  const isAdmin = currentUser?.role === 'admin';

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setCurrentUser(null);
  };

  const handleRoleToggle = () => {
    onOpenAuth();
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setActiveTab(isAdmin ? 'admin' : 'quote')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20 ${
            isAdmin
              ? 'bg-gradient-to-tr from-rose-600 via-red-600 to-amber-600 shadow-rose-500/20'
              : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 shadow-cyan-500/20'
          }`}>
            {isAdmin ? <Shield className="w-5 h-5 text-white" /> : <Layers className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">TitanForge</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isAdmin
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}>
                {isAdmin ? 'ADMIN CONSOLE' : '3D METAL'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wide">
              {isAdmin ? 'Production, Materials & Machining Operations' : 'Additive DMLS & CNC Machining'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Role-Separated */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/90">
          {!isAdmin ? (
            /* General User (Customer) Tabs ONLY */
            <>
              <button
                onClick={() => setActiveTab('forgeai')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                  activeTab === 'forgeai'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                    : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>ForgeAI Studio</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  AI
                </span>
              </button>

              <button
                onClick={() => setActiveTab('quote')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'quote'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quote & DFM
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'projects'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                My Projects
              </button>

              <button
                onClick={() => setActiveTab('tracker')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'tracker'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Order Tracker
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'account'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Account & Wallet
              </button>
            </>
          ) : (
            /* Admin Operations Console ONLY */
            <div className="flex items-center gap-2 px-3 py-1 text-xs text-rose-300 font-semibold font-mono">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>Additive Production, Materials & Machining Operations</span>
            </div>
          )}
        </nav>

        {/* User Account, Live Wallet Pill (Customers Only), and Role Controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* Wallet Pill - Customer View Only */}
              {!isAdmin && (
                <button
                  type="button"
                  onClick={onOpenWalletModal}
                  className="bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 rounded-xl px-2.5 py-1.5 flex items-center gap-2 transition-all group"
                  title="Click to refill wallet with credit card"
                >
                  <Wallet className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-slate-400 block leading-none">Wallet</span>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                      ${walletBalance.toFixed(2)}
                    </span>
                  </div>
                  <PlusCircle className="w-3 h-3 text-cyan-400 shrink-0" />
                </button>
              )}

              {/* User badge */}
              <div className="text-right hidden lg:block">
                <div className="text-xs font-semibold text-slate-200">{currentUser.full_name}</div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold uppercase ${
                      isAdmin
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {currentUser.company || currentUser.email}
                  </span>
                </div>
              </div>

              {/* Switch Role Button */}
              <button
                type="button"
                onClick={handleRoleToggle}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                  isAdmin
                    ? 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40'
                    : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/40'
                }`}
                title="Switch between Admin and Customer roles"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Switch to Customer' : 'Switch to Admin'}</span>
              </button>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Sign In / Demo Accounts
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav for customers */}
      {!isAdmin && (
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 p-2 bg-slate-950/90 text-xs">
          <button
            onClick={() => setActiveTab('quote')}
            className={`py-1 px-2 rounded-md font-medium ${
              activeTab === 'quote' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Quote
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-1 px-2 rounded-md font-medium ${
              activeTab === 'projects' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`py-1 px-2 rounded-md font-medium ${
              activeTab === 'tracker' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Tracker
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-1 px-2 rounded-md font-medium ${
              activeTab === 'account' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Account
          </button>
        </div>
      )}
    </header>
  );
}
