'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Layers,
  Globe,
  Tag,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_published: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; badge: string }> = {
  LEVITATION: {
    label: 'Levitation & Magnetic Physics',
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    badge: 'bg-cyan-100 text-cyan-800',
  },
  STUDIO_AI: {
    label: '3D Studio & AI Generation',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  PRINTING: {
    label: 'Materials & Inductive Lighting',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
  },
  ORDERS: {
    label: 'Orders, Shipping & WORM Ledger',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  WALLET: {
    label: 'Pricing & Prepaid Wallet',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
};

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'LEVITATION',
    is_published: true,
    order_index: 0,
  });
  const [saving, setSaving] = useState(false);

  // Confirmation modal for reset
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminFaqs();
      setFaqs(data || []);
    } catch (err: any) {
      console.error('Failed to load FAQs:', err);
      showToast('Error loading FAQ catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingFaq(null);
    const maxOrder = faqs.reduce((max, f) => Math.max(max, f.order_index || 0), 0);
    setFormData({
      question: '',
      answer: '',
      category: 'LEVITATION',
      is_published: true,
      order_index: maxOrder + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'LEVITATION',
      is_published: faq.is_published,
      order_index: faq.order_index || 0,
    });
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      showToast('Please provide both question and answer');
      return;
    }

    try {
      setSaving(true);
      if (editingFaq) {
        await api.updateAdminFaq(editingFaq.id, formData);
        showToast('FAQ updated successfully');
      } else {
        await api.createAdminFaq(formData);
        showToast('New FAQ created successfully');
      }
      setIsModalOpen(false);
      await fetchFaqs();
    } catch (err: any) {
      console.error('Failed to save FAQ:', err);
      showToast(err.message || 'Failed to save FAQ item');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (faq: FaqItem) => {
    try {
      // Optimistic update
      setFaqs(prev =>
        prev.map(f => (f.id === faq.id ? { ...f, is_published: !f.is_published } : f))
      );
      await api.toggleAdminFaq(faq.id);
      showToast(`FAQ ${!faq.is_published ? 'published' : 'hidden from public view'}`);
    } catch (err: any) {
      console.error('Failed to toggle publish status:', err);
      showToast('Failed to update status');
      await fetchFaqs();
    }
  };

  const handleDeleteFaq = async (faq: FaqItem) => {
    if (!window.confirm(`Are you sure you want to delete this FAQ?\n\n"${faq.question}"`)) {
      return;
    }

    try {
      setFaqs(prev => prev.filter(f => f.id !== faq.id));
      await api.deleteAdminFaq(faq.id);
      showToast('FAQ deleted');
    } catch (err: any) {
      console.error('Failed to delete FAQ:', err);
      showToast('Failed to delete FAQ');
      await fetchFaqs();
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredFaqs.length) return;

    const newFaqs = [...faqs];
    const itemA = filteredFaqs[index];
    const itemB = filteredFaqs[targetIndex];

    const idxA = newFaqs.findIndex(f => f.id === itemA.id);
    const idxB = newFaqs.findIndex(f => f.id === itemB.id);

    // Swap order_index
    const tempOrder = newFaqs[idxA].order_index;
    newFaqs[idxA].order_index = newFaqs[idxB].order_index;
    newFaqs[idxB].order_index = tempOrder;

    // Sort by order_index
    newFaqs.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    setFaqs(newFaqs);

    try {
      const orderedIds = newFaqs.map(f => f.id);
      await api.reorderAdminFaqs(orderedIds);
      showToast('Display sequence updated');
    } catch (err) {
      console.error('Failed to reorder FAQs:', err);
      showToast('Failed to persist sequence');
      await fetchFaqs();
    }
  };

  const handleResetDefaults = async () => {
    try {
      setLoading(true);
      await api.resetAdminFaqs();
      setIsResetConfirmOpen(false);
      showToast('FAQ catalog restored to standard curated defaults');
      await fetchFaqs();
    } catch (err) {
      console.error('Failed to reset FAQs:', err);
      showToast('Failed to reset FAQs');
    } finally {
      setLoading(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && faq.is_published) ||
      (statusFilter === 'HIDDEN' && !faq.is_published);
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const totalCount = faqs.length;
  const publishedCount = faqs.filter(f => f.is_published).length;
  const hiddenCount = totalCount - publishedCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-purple-700 mb-1">
            <Globe className="w-4 h-4" />
            <span>Website &amp; Content Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            FAQ &amp; Customer Help Center
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mt-1">
            Manage customer questions, physics explanations, 3D printing guides, order fulfillment, and wallet policies.
            Published items immediately sync to the customer FAQ portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/faq"
            target="_blank"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>View Public FAQ</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all shadow-sm"
            title="Reset catalog back to curated default questions"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total FAQ Items</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">Across 5 content topics</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live on Website</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{publishedCount}</div>
            <div className="text-xs text-emerald-700 font-medium mt-0.5">Visible to customers</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Drafts / Hidden</div>
            <div className="text-2xl font-black text-slate-700 mt-1">{hiddenCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Unpublished drafts</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <EyeOff className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Website Navigation</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">Website</div>
            <div className="text-xs text-slate-500 mt-0.5">FAQ &amp; Showcase Kit linked</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search question, keyword, or answer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Statuses ({totalCount})</option>
              <option value="PUBLISHED">Published Only ({publishedCount})</option>
              <option value="HIDDEN">Drafts / Hidden Only ({hiddenCount})</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Topics ({totalCount})
          </button>

          {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
            const count = faqs.filter(f => f.category === key).length;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? `${cat.color} font-black shadow-sm`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. FAQ List Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Showing {filteredFaqs.length} of {totalCount} FAQ entries</span>
          <span className="text-slate-400 font-normal">Use arrow controls to reorder display sequence</span>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading FAQ catalog...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">No FAQ entries match your filters</h3>
              <p className="text-xs text-slate-500">Try clearing your search query or selecting another category.</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => {
              const catInfo = CATEGORY_MAP[faq.category] || {
                label: faq.category,
                color: 'text-slate-700 bg-slate-50 border-slate-200',
                badge: 'bg-slate-100 text-slate-800',
              };

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-3.5 ${
                    faq.is_published ? 'border-slate-200 hover:border-purple-300' : 'border-dashed border-slate-300 bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Sequence, Category, Question */}
                    <div className="flex items-start space-x-3">
                      {/* Sequence Badge */}
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{faq.order_index || index + 1}
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catInfo.badge}`}>
                            {catInfo.label}
                          </span>

                          {faq.is_published ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Live on Website</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                              <span>Draft / Hidden</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-start">
                      {/* Move Up/Down */}
                      <button
                        onClick={() => handleMoveOrder(index, 'UP')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move question up in display sequence"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleMoveOrder(index, 'DOWN')}
                        disabled={index === filteredFaqs.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move question down in display sequence"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Visibility */}
                      <button
                        onClick={() => handleTogglePublish(faq)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors border ${
                          faq.is_published
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={faq.is_published ? 'Click to hide from public' : 'Click to publish to public'}
                      >
                        {faq.is_published ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(faq)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors"
                        title="Edit question & answer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteFaq(faq)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-400 transition-colors"
                        title="Delete FAQ item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Answer Text */}
                  <div className="pl-10 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    {faq.answer}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Create / Edit FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingFaq ? 'Edit FAQ Item' : 'Create New FAQ Item'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingFaq
                      ? 'Update the question, answer, category, or public visibility.'
                      : 'Add a new answer to the customer knowledge base and portal.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Content Topic / Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Customer Question
                </label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. How does the wireless inductive LED lighting work?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Answer
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer}
                  onChange={e => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide an informative, clear explanation explaining the technology, physics, pricing, or order policy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Order Index & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Display Sequence Index
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Lower numbers appear first on the FAQ page.</p>
                </div>

                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    id="is_published_checkbox"
                    checked={formData.is_published}
                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <label htmlFor="is_published_checkbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Publish immediately (Visible to website visitors)
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : editingFaq ? 'Save Changes' : 'Create FAQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Reset Defaults Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reset to Standard Defaults?</h3>
              <p className="text-xs text-slate-600 mt-1">
                This will overwrite existing questions with the standard 9 curated FAQs covering Levitation physics,
                3D Studio AI reconstruction, inductive lighting, physical fabrication, and prepaid wallet rules.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Yes, Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
