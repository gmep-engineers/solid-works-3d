import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Shield, Cpu } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Levitate3D — Custom Magnetic Levitating & Illuminated 3D Statue Platform',
  description:
    'Generate custom 3D sculptures with AI, refine with human 3D designers, and manufacture custom magnetic levitating & embedded-LED statues protected by WORM legal ledger.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 antialiased selection:bg-cyan-500 selection:text-white">
        {/* Top Announcement Bar */}
        <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-b border-slate-200/80 px-4 py-2 text-center text-xs font-medium text-slate-700 flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Levitation & WORM Legal Ledger v2.4 Online — All files & transactions cryptographic hash-locked</span>
        </div>

        {/* Global Navigation Header */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-10 mt-16 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col space-y-1 text-center md:text-left">
              <div className="font-bold text-slate-800 text-sm">Levitate3D Platform</div>
              <div className="text-slate-600">Custom Magnetic Levitating & Illuminated 3D Statues powered by Levitate3D Neural Engine.</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Stateless REST API ready for future iOS & Android Native Mobile Apps.
              </div>
              <div className="pt-2 flex items-center space-x-4 text-xs font-semibold text-slate-600">
                <Link href="/" className="hover:text-cyan-700 transition-colors">Home</Link>
                <span>•</span>
                <Link href="/studio" className="hover:text-cyan-700 transition-colors">3D Studio</Link>
                <span>•</span>
                <Link href="/faq" className="hover:text-cyan-700 transition-colors">FAQ &amp; Knowledge Base</Link>
                <span>•</span>
                <Link href="/showcase/share_alex_cyberpunk_samurai_2026" className="hover:text-cyan-700 transition-colors">Showcase Kit</Link>
              </div>
            </div>

            <div className="flex items-center space-x-6 font-medium">
              <span className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>WORM Immutable Audit Protected</span>
              </span>
              <span className="flex items-center space-x-1.5 text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                <span>Isolated Supplier Desktop Gateway</span>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
