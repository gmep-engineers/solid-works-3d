'use client';

import React from 'react';
import Link from 'next/link';
import { ModelViewer } from '@/components/3d/ModelViewer';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Layers,
  ArrowRight,
  CheckCircle2,
  Box,
  Eye,
  Star,
  Cpu,
  Truck,
  RotateCw,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6 sm:py-12">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Text & CTA */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
              <span>Proprietary AI 3D Sculpting & Active Magnetic Levitation</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Sculpt in AI. <br />
              <span className="gradient-text">Levitate on Your Desk.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
              Turn any photo, sketch, or text idea into a museum-grade 3D statue engineered to float and illuminate
              in mid-air via active electromagnetic suspension and wireless inductive lighting.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/studio"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Launch 3D Studio</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 transition-all shadow-sm"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Trust badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Assembly Required</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>N52 Active Magnetic Base</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>WORM Legal Protected</span>
              </span>
            </div>
          </div>

          {/* Right Hero: Live Interactive 3D Levitation Viewer */}
          <div className="lg:col-span-6 relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10" />
            <ModelViewer internalLed={true} finish="TRANSLUCENT_GLOW" size="STANDARD" autoRotate={true} />
            <div className="text-center mt-3 text-xs text-slate-400 font-medium">
              Interactive 3D Demo: Left-click drag to rotate • Scroll to zoom
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE-STEP PROCESS */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-cyan-700 text-xs font-bold uppercase tracking-wider">Simple 3-Step Journey</div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">From Imagination to Floating Reality</h2>
            <p className="text-sm text-slate-600 font-normal">
              No CAD or 3D modeling experience needed. Our AI and master sculptors handle the physics and engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-700 font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-black text-slate-900">1. Create with AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Upload a photo of your pet, character, or loved one; draw a sketch on our canvas; or enter a descriptive text prompt. Our neural engine generates a watertight 3D model in seconds.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-black text-slate-900">2. Customize & Refine</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Choose your scale (12cm or 18cm), select Translucent Glow or Full Color, and toggle internal wireless inductive LEDs. Dedicated 3D designers calibrate the center of gravity and magnet cavity.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-black text-slate-900">3. Fast Checkout & Levitate</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                One-page checkout with Stripe payment security and WORM legal hash lock. Your custom sculpture is precision resin 3D-printed, quality tested, and delivered ready to float.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE TECHNOLOGY PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-cyan-700 text-xs font-bold uppercase tracking-wider">Advanced Physics Engineering</div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">The Science Behind the Magic</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Active Hall-Effect Levitation</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              High-frequency electromagnet sensors sample magnetic field equilibrium 1,000 times per second to keep your statue stably suspended without wobble.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Wireless Inductive Glow</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Internal micro-LEDs are powered wirelessly through the air gap using resonant inductive coupling. No batteries, no charging, no wires.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Human 3D Refinements</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Professional 3D modelers inspect every AI generation, hollow internal cavities with 2.0mm wall tolerance, and balance the mass distribution.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">WORM Cryptographic Ledger</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Every design prompt, 3D model file, payment receipt, and milestone transition is cryptographically chained via SHA-256 for audit and dispute protection.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TRANSPARENT PRICING CARDS */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-cyan-700 text-xs font-bold uppercase tracking-wider">Transparent Pricing</div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Choose Your Sculpture Tier</h2>
            <p className="text-sm text-slate-600 font-normal">
              Every tier includes the custom active magnetic floating base, 12V power supply, and precision 3D manufacturing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Standard Tier */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Essential Desk Tier</span>
                <div className="text-3xl font-black text-slate-900 font-mono">$149</div>
                <p className="text-xs text-slate-600">Standard 12cm statue with illuminated halo floating base.</p>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-200 font-medium">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Standard 12cm Scale Sculpture</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Illuminated Magnetic Base & Adapter</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Neodymium N52 Magnet Socket</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>WORM Cryptographic Certificate</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/studio"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs text-center transition-all shadow-sm block"
              >
                Create Standard Statue
              </Link>
            </div>

            {/* Embedded LED Tier (Most Popular) */}
            <div className="bg-cyan-50/50 p-8 rounded-3xl border-2 border-cyan-500 shadow-xl space-y-6 flex flex-col justify-between relative transform -translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                Most Popular
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">Wireless Glowing Core</span>
                <div className="text-3xl font-black text-slate-900 font-mono">$184</div>
                <p className="text-xs text-slate-600">Standard 12cm statue with internal inductive micro-LEDs.</p>
                <ul className="space-y-2.5 text-xs text-slate-800 pt-4 border-t border-cyan-200 font-semibold">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    <span>Everything in Standard Tier</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    <span>Wireless Inductive Internal LEDs (+$35)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    <span>Custom 3mm Wire Conduits Hollowed</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    <span>Translucent Glow Resin Finish</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    <span>360° Turntable Social Share Kit</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/studio"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs text-center transition-all shadow-md shadow-indigo-500/20 block"
              >
                Create Glowing Statue
              </Link>
            </div>

            {/* Large Collector's Edition */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Large Collector Tier</span>
                <div className="text-3xl font-black text-slate-900 font-mono">$224</div>
                <p className="text-xs text-slate-600">Large 18cm statement piece with embedded internal LEDs.</p>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-200 font-medium">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Large 18cm Statement Scale</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>High-Payload Electromagnetic Base</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dual Inductive LED Coils</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Priority Designer Queue Dispatch</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/studio"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs text-center transition-all shadow-sm block"
              >
                Create Large Statue
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION FOOTER BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-10 sm:p-14 rounded-3xl text-center space-y-6 text-white shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to see your creation float?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-xl mx-auto">
            Design Your Levitating Statue in Under 60 Seconds
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto font-normal">
            No registration barrier. Start generating 3D models right in your browser now.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/studio"
              className="px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-400/20 transition-all transform hover:-translate-y-0.5"
            >
              Start in 3D Studio Now
            </Link>
            <Link
              href="/login"
              className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20"
            >
              Customer & Admin Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
