'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  Zap,
  Box,
  Truck,
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; badge: string }> = {
  LEVITATION: {
    label: 'Levitation & Physics',
    icon: Zap,
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    badge: 'bg-cyan-100 text-cyan-800',
  },
  STUDIO_AI: {
    label: '3D Studio & AI',
    icon: Sparkles,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  PRINTING: {
    label: 'Materials & Lighting',
    icon: Box,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
  },
  ORDERS: {
    label: 'Orders & Shipping',
    icon: Truck,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  WALLET: {
    label: 'Wallet & Pricing',
    icon: Wallet,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
};

export default function CustomerFaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadFaqs() {
      try {
        setLoading(true);
        const data = await api.getPublicFaqs();
        setFaqs(data || []);
        // By default open the first two FAQs
        if (data && data.length > 0) {
          setOpenIds(new Set([data[0].id, data[1]?.id].filter(Boolean)));
        }
      } catch (err) {
        console.error('Failed to load public FAQs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 animate-fadeIn">
      {/* 1. HERO HEADER */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
          <span>Levitate3D Knowledge Center</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-normal">
          Explore how our active electromagnetic levitation, wireless inductive micro-LEDs,
          instant AI 3D mesh reconstruction, and WORM legal ledger certificates work together.
        </p>

        {/* Search input */}
        <div className="pt-2 relative max-w-lg mx-auto">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search questions by topic (e.g. magnets, LEDs, resin, shipping)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. TOPIC FILTER PILLS */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Questions ({faqs.length})
        </button>

        {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
          const Icon = cat.icon;
          const count = faqs.filter(f => f.category === key).length;
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isSelected
                  ? `${cat.color} font-black shadow-md`
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 3. ACCORDION LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading answers from Levitate3D database...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No matching questions found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search terms or selecting another category.</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              View All Questions
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map(faq => {
              const isOpen = openIds.has(faq.id);
              const catInfo = CATEGORY_MAP[faq.category] || {
                label: faq.category,
                color: 'text-slate-700 bg-slate-50 border-slate-200',
                badge: 'bg-slate-100 text-slate-800',
              };

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
                    isOpen ? 'border-cyan-300 ring-1 ring-cyan-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 focus:outline-none"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${catInfo.badge}`}>
                          {catInfo.label}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 transition-transform ${
                        isOpen ? 'rotate-180 bg-cyan-100 text-cyan-700' : 'text-slate-500'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 pt-0 animate-fadeIn">
                      <div className="pt-3 border-t border-slate-100 text-sm text-slate-600 leading-relaxed font-normal">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. CALL TO ACTION BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 rounded-3xl text-center space-y-5 text-white shadow-xl relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 bg-white/10 px-3.5 py-1 rounded-full text-xs font-bold text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Still Have Questions?</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight max-w-xl mx-auto">
          Experience the Physics for Yourself
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-normal">
          Jump into our live interactive 3D Studio and generate your first floating statue in under a minute.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/studio"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-cyan-400/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>Launch 3D Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/showcase/share_alex_cyberpunk_samurai_2026"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20"
          >
            Inspect Showcase Kit
          </Link>
        </div>
      </div>
    </div>
  );
}
