'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Shield,
  ShieldCheck,
  Wallet,
  Sparkles,
  ExternalLink,
  Terminal,
  LogOut,
  User,
  LayoutDashboard,
  Compass,
  ArrowRight,
  ChevronDown,
  Factory,
  Layers,
  Key,
  DollarSign,
  TrendingUp,
  Settings,
  Cpu,
  Users,
  Globe,
  HelpCircle,
  Eye,
  Camera,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [financialDropdownOpen, setFinancialDropdownOpen] = useState(false);
  const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false);

  const checkAuth = () => {
    try {
      const stored = localStorage.getItem('levitate3d_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkAuth();

    // Listen for storage events or custom login event
    const handleStorage = () => checkAuth();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('levitate3d_auth_change', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('levitate3d_auth_change', handleStorage);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('levitate3d_token');
    localStorage.removeItem('levitate3d_user');
    window.dispatchEvent(new Event('levitate3d_auth_change'));
    setUser(null);
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isAdmin = (mounted && user?.role === 'ADMIN') || pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo -> Always Home */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Box className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center space-x-1">
              <span>LEVITATE</span>
              <span className="text-cyan-600">3D</span>
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Custom Physics Platform</span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-4 text-xs font-semibold">
          {/* 3D Studio - Only displayed for Customer / Storefront pages, hidden in Admin mode */}
          {!isAdmin && (
            <Link
              href="/studio"
              className={`transition-colors py-1.5 px-2.5 rounded-lg flex items-center space-x-1.5 ${
                isActive('/studio') ? 'text-cyan-700 bg-cyan-50 font-bold' : 'text-slate-700 hover:text-cyan-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>3D Studio</span>
            </Link>
          )}

          {mounted && user?.role === 'CUSTOMER' && (
            <Link
              href="/dashboard"
              className={`transition-colors py-1.5 px-2.5 rounded-lg flex items-center space-x-1.5 ${
                isActive('/dashboard') ? 'text-cyan-700 bg-cyan-50 font-bold' : 'text-slate-700 hover:text-cyan-600'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-600" />
              <span>Customer Dashboard</span>
            </Link>
          )}

          {/* Credential - For Users to manage password, contact info, payment methods, wallet balance, transaction history, and usage */}
          {!isAdmin && (
            <Link
              href="/credentials"
              className={`transition-colors py-1.5 px-2.5 rounded-lg flex items-center space-x-1.5 ${
                isActive('/credentials') ? 'text-cyan-700 bg-cyan-50 font-bold' : 'text-slate-700 hover:text-cyan-600'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Credential</span>
            </Link>
          )}

          {/* Admin-Only Navigation Menus: Operations (with nested IT Setting), Financial */}
          {isAdmin && (
            <>
              {/* 1. Admin Operations Pull-Down Menu (Encompassing Operations, RFQ, Vendors, IT Setting & WORM) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(!adminDropdownOpen);
                    setFinancialDropdownOpen(false);
                    setWebsiteDropdownOpen(false);
                  }}
                  onMouseEnter={() => {
                    setAdminDropdownOpen(true);
                    setFinancialDropdownOpen(false);
                    setWebsiteDropdownOpen(false);
                  }}
                  className={`transition-colors py-1.5 px-2.5 rounded-lg flex items-center space-x-1.5 font-bold ${
                    pathname.startsWith('/admin') && !pathname.includes('tab=financial')
                      ? 'text-cyan-800 bg-cyan-50 border border-cyan-200'
                      : 'text-slate-700 hover:text-cyan-700 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Admin Operations</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${adminDropdownOpen ? 'rotate-180 text-cyan-600' : ''}`} />
                </button>

                {adminDropdownOpen && (
                  <div
                    onMouseLeave={() => setAdminDropdownOpen(false)}
                    className="absolute left-0 mt-1 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn"
                  >
                    <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Operations &amp; Factory Management
                    </div>

                    <Link
                      href="/admin?tab=operations"
                      onClick={() => setAdminDropdownOpen(false)}
                      className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                        pathname === '/admin' && !pathname.includes('tab=it-settings') ? 'bg-cyan-50/70 text-cyan-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Production &amp; RFQ Bids</div>
                        <div className="text-[10px] text-slate-400 font-normal">Order pipeline, 3D inspection &amp; margins</div>
                      </div>
                    </Link>

                    <Link
                      href="/admin/vendors"
                      onClick={() => setAdminDropdownOpen(false)}
                      className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                        pathname === '/admin/vendors' || pathname === '/admin/manufacturers' ? 'bg-cyan-50/70 text-cyan-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Factory className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Vendor Directory</div>
                        <div className="text-[10px] text-slate-400 font-normal">3D Printing &amp; CAD Design partners</div>
                      </div>
                    </Link>

                    <Link
                      href="/admin/users"
                      onClick={() => setAdminDropdownOpen(false)}
                      className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                        pathname === '/admin/users' ? 'bg-purple-50/70 text-purple-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">User Management</div>
                        <div className="text-[10px] text-slate-400 font-normal">Customer directory, wallet reserves &amp; roles</div>
                      </div>
                    </Link>

                    {/* IT Setting - Placed directly under Admin Operations */}
                    <div className="pt-1.5 mt-1 border-t border-slate-100">
                      <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        IT &amp; Security Settings
                      </div>

                      <Link
                        href="/admin?tab=it-settings"
                        onClick={() => setAdminDropdownOpen(false)}
                        className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                          pathname.includes('tab=it-settings') ? 'bg-indigo-50/70 text-indigo-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">IT Setting &amp; Infrastructure</div>
                          <div className="text-[10px] text-slate-400 font-normal">Hardware tokens, hub routing &amp; Tripo3D API</div>
                        </div>
                      </Link>

                      <Link
                        href="/admin/worm"
                        onClick={() => setAdminDropdownOpen(false)}
                        className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                          pathname === '/admin/worm' ? 'bg-amber-50/70 text-amber-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">WORM Legal Ledger</div>
                          <div className="text-[10px] text-slate-400 font-normal">Immutable SHA-256 chain verifier</div>
                        </div>
                      </Link>

                      <Link
                        href="/camera-test"
                        onClick={() => setAdminDropdownOpen(false)}
                        className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                          pathname === '/camera-test' ? 'bg-cyan-50/70 text-cyan-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Dual Camera Testing Lab</div>
                          <div className="text-[10px] text-slate-400 font-normal">Live stereo feed, FPS &amp; calibration HUD</div>
                        </div>
                      </Link>

                      <a
                        href="/api/v1/docs"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setAdminDropdownOpen(false)}
                        className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 border-t border-slate-100"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Terminal className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center space-x-1">
                            <span>REST API Swagger</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">OpenAPI v3.0 developer specs</div>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Financial Pull-Down Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setFinancialDropdownOpen(!financialDropdownOpen);
                    setAdminDropdownOpen(false);
                    setWebsiteDropdownOpen(false);
                  }}
                  onMouseEnter={() => {
                    setFinancialDropdownOpen(true);
                    setAdminDropdownOpen(false);
                    setWebsiteDropdownOpen(false);
                  }}
                  className={`transition-colors py-1.5 px-2.5 rounded-lg flex items-center space-x-1.5 font-bold ${
                    pathname.includes('tab=financial')
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                      : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Financial</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${financialDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>

                {financialDropdownOpen && (
                  <div
                    onMouseLeave={() => setFinancialDropdownOpen(false)}
                    className="absolute left-0 mt-1 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn"
                  >
                    <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Revenue, Margins &amp; Unit Economics
                    </div>

                    <Link
                      href="/admin?tab=financial#overview"
                      onClick={() => setFinancialDropdownOpen(false)}
                      className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-slate-700"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Revenue &amp; Profit Margins</div>
                        <div className="text-[10px] text-slate-400 font-normal">Gross revenue, COGS, and 45%+ net margins</div>
                      </div>
                    </Link>

                    <Link
                      href="/admin?tab=financial#tiers"
                      onClick={() => setFinancialDropdownOpen(false)}
                      className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-slate-700"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Tier Profitability</div>
                        <div className="text-[10px] text-slate-400 font-normal">Standard base vs Embedded-LED (+$35 upsell)</div>
                      </div>
                    </Link>

                    <Link
                      href="/admin?tab=financial#ai-engine"
                      onClick={() => setFinancialDropdownOpen(false)}
                      className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-slate-700"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center space-x-1.5">
                          <span>Tripo3D Account Balance</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-mono font-bold">$10.40 USD</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">1,040 credits remaining (~104 models)</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Website Pull-Down Menu (Encompassing FAQ Management and Showcase Kit) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setWebsiteDropdownOpen(!websiteDropdownOpen);
                    setAdminDropdownOpen(false);
                    setFinancialDropdownOpen(false);
                  }}
                  onMouseEnter={() => {
                    setWebsiteDropdownOpen(true);
                    setAdminDropdownOpen(false);
                    setFinancialDropdownOpen(false);
                  }}
                  className={`transition-colors py-1.5 px-2.5 rounded-lg flex items-center space-x-1.5 font-bold ${
                    pathname === '/admin/faq' || pathname.startsWith('/showcase') || pathname === '/faq'
                      ? 'text-purple-800 bg-purple-50 border border-purple-200'
                      : 'text-slate-700 hover:text-purple-700 hover:bg-slate-50'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                  <span>Website</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${websiteDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
                </button>

                {websiteDropdownOpen && (
                  <div
                    onMouseLeave={() => setWebsiteDropdownOpen(false)}
                    className="absolute left-0 mt-1 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn"
                  >
                    <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Website &amp; Content Management
                    </div>

                    <Link
                      href="/admin/faq"
                      onClick={() => setWebsiteDropdownOpen(false)}
                      className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                        pathname === '/admin/faq' ? 'bg-purple-50/70 text-purple-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">FAQ Management</div>
                        <div className="text-[10px] text-slate-400 font-normal">Edit, publish &amp; reorder customer Q&amp;As</div>
                      </div>
                    </Link>

                    <Link
                      href="/showcase/share_alex_cyberpunk_samurai_2026"
                      onClick={() => setWebsiteDropdownOpen(false)}
                      className={`flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors ${
                        pathname.startsWith('/showcase') ? 'bg-indigo-50/70 text-indigo-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Showcase Kit</div>
                        <div className="text-[10px] text-slate-400 font-normal">360° turntable social preview &amp; marketing assets</div>
                      </div>
                    </Link>

                    <div className="pt-1.5 mt-1 border-t border-slate-100">
                      <Link
                        href="/faq"
                        target="_blank"
                        onClick={() => setWebsiteDropdownOpen(false)}
                        className="flex items-start space-x-3 px-3.5 py-2 hover:bg-slate-50 transition-colors text-slate-600"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center space-x-1">
                            <span>Live Public FAQ Page</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">View customer knowledge hub</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <Link
            href="/tracking/44444444-4444-4444-4444-444444444444"
            className={`transition-colors py-1.5 px-2.5 rounded-lg ${
              isActive('/tracking') ? 'text-cyan-700 bg-cyan-50 font-bold' : 'text-slate-600 hover:text-cyan-600'
            }`}
          >
            Order Tracking
          </Link>

          {!isAdmin && (
            <>
              <Link
                href="/showcase/share_alex_cyberpunk_samurai_2026"
                className={`transition-colors py-1.5 px-2.5 rounded-lg ${
                  isActive('/showcase') ? 'text-cyan-700 bg-cyan-50 font-bold' : 'text-slate-600 hover:text-cyan-600'
                }`}
              >
                Showcase Kit
              </Link>
              <Link
                href="/faq"
                className={`transition-colors py-1.5 px-2.5 rounded-lg ${
                  isActive('/faq') ? 'text-cyan-700 bg-cyan-50 font-bold' : 'text-slate-600 hover:text-cyan-600'
                }`}
              >
                FAQ
              </Link>
            </>
          )}
        </nav>

        {/* Right Section Actions & User Status */}
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <a
              href="/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-all font-mono"
              title="Open Swagger OpenAPI Documentation"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-600" />
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          {mounted && user ? (
            <div className="flex items-center space-x-2">
              <Link
                href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center text-[10px]">
                  {user.full_name ? user.full_name[0] : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.full_name || 'My Account'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 uppercase font-mono">
                  {user.role === 'ADMIN' ? 'Admin' : 'User'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                Sign In
              </Link>

              <Link
                href="/studio"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
