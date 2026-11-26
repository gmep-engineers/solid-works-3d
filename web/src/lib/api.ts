const isRemoteBrowser =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (isRemoteBrowser ? '/api/v1' : 'http://localhost:4000/api/v1');

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${res.status} ${res.statusText}`);
  }
  const rawText = await res.text();
  const normalizedText = isRemoteBrowser
    ? rawText.replace(/http:\/\/localhost:4000/g, '')
    : rawText;
  return normalizedText ? JSON.parse(normalizedText) : ({} as T);
}

export const api = {
  // Tripo3D Generation
  startGeneration: (data: {
    prompt_type: 'TEXT' | 'IMAGE' | 'SKETCH' | 'REFINE';
    prompt_text?: string;
    image_url?: string;
    draft_task_id?: string;
    user_email?: string;
  }) =>
    apiFetch<{
      task_id: string;
      generation_id: string;
      status: string;
      fee: number;
      credits_used: number;
      new_balance: number;
      message: string;
    }>('/generations/tripo', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTripoPricing: () =>
    apiFetch<{
      exchange_rate: string;
      credit_unit_usd: number;
      markup_multiplier: number;
      tasks: Record<
        string,
        {
          name: string;
          tripo_credits: number;
          tripo_wholesale_usd: number;
          retail_credits: number;
          retail_price_usd: number;
          description: string;
        }
      >;
    }>('/generations/tripo/pricing'),

  pollGenerationStatus: (taskId: string) =>
    apiFetch<{
      task_id: string;
      status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
      progress: number;
      model_glb_url?: string;
      thumbnail_url?: string;
    }>(`/generations/tripo/${taskId}/status`),

  // Orders
  createOrder: (data: any) =>
    apiFetch<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrder: (id: string) => apiFetch<any>(`/orders/${id}`),
  getMyOrders: () => apiFetch<any[]>('/orders'),

  checkoutOrder: (id: string, testMode = true) =>
    apiFetch<any>(`/orders/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ test_mode: testMode }),
    }),

  // Tracking & Client Approval
  getOrderTracking: (id: string) => apiFetch<any>(`/orders/${id}/tracking`),
  clientApproveRefinedModel: (orderId: string, feedback?: string) =>
    apiFetch<any>(`/orders/${orderId}/approve-refined`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),

  // Social Share Kit
  getShareKit: (orderId: string) => apiFetch<any>(`/orders/${orderId}/share-kit`),
  updateShowcase: (orderId: string, data: any) =>
    apiFetch<any>(`/orders/${orderId}/showcase`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Public Showcase by token
  getShowcaseByToken: (token: string) => apiFetch<any>(`/orders/showcase/${token}`).catch(() => null),

  // Admin Endpoints
  getFinancialAnalytics: () => apiFetch<any>('/admin/analytics/financials'),
  getAdminOrders: (status?: string) => apiFetch<any[]>(`/admin/orders${status ? `?status=${status}` : ''}`),
  adminApproveOrder: (orderId: string, notes?: string) =>
    apiFetch<any>(`/admin/orders/${orderId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  adminRejectOrder: (orderId: string, reason?: string, notes?: string) =>
    apiFetch<any>(`/admin/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    }),
  // RFQ Manufacturer Competitive Bidding
  releaseToBidding: (
    orderId: string,
    data: {
      base_bid_usd?: number;
      base_price?: number;
      duration_hours?: number;
      bidding_category?: '3D_PRINTING' | 'DESIGNER' | 'ALL';
      eligible_supplier_ids?: string[];
      notes?: string;
    },
  ) =>
    apiFetch<any>(`/admin/orders/${orderId}/release-bidding`, {
      method: 'POST',
      body: JSON.stringify({
        base_bid_usd: data.base_bid_usd ?? data.base_price ?? 65,
        duration_hours: data.duration_hours || 24,
        bidding_category: data.bidding_category || 'ALL',
        eligible_supplier_ids: data.eligible_supplier_ids,
        notes: data.notes,
      }),
    }),
  releaseOrderToBidding: (
    orderId: string,
    data: {
      base_bid_usd?: number;
      base_price?: number;
      duration_hours?: number;
      bidding_category?: '3D_PRINTING' | 'DESIGNER' | 'ALL';
      eligible_supplier_ids?: string[];
      notes?: string;
    },
  ) =>
    apiFetch<any>(`/admin/orders/${orderId}/release-bidding`, {
      method: 'POST',
      body: JSON.stringify({
        base_bid_usd: data.base_bid_usd ?? data.base_price ?? 65,
        duration_hours: data.duration_hours || 24,
        bidding_category: data.bidding_category || 'ALL',
        eligible_supplier_ids: data.eligible_supplier_ids,
        notes: data.notes,
      }),
    }),
  awardBid: (orderId: string, data: { bid_id: string; notes?: string }) =>
    apiFetch<any>(`/admin/orders/${orderId}/award-bid`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrderBids: (orderId: string) => apiFetch<any>(`/admin/orders/${orderId}/bids`),
  getManufacturers: () => apiFetch<any[]>('/supplier/manufacturers'),
  getVendors: () => apiFetch<any[]>('/supplier/manufacturers'),
  submitSupplierBid: (
    orderId: string,
    data: { supplier_id: string; supplier_name?: string; bid_amount: number; turnaround_days: number; notes?: string },
  ) =>
    apiFetch<any>(`/supplier/jobs/${orderId}/bid`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Vendor Directory & Device Tokens Management (3D Printing & 3D Designers)
  getAdminVendors: () => apiFetch<any[]>('/admin/vendors'),
  getAdminVendor: (id: string) => apiFetch<any>(`/admin/vendors/${id}`),
  createVendor: (data: {
    name: string;
    category?: '3D_PRINTING' | 'DESIGNER';
    email: string;
    phone: string;
    contact_person: string;
    facility_location: string;
    specialty: string;
    rating?: number;
    avg_turnaround_days?: number;
    notes?: string;
  }) =>
    apiFetch<any>('/admin/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVendor: (id: string, data: any) =>
    apiFetch<any>(`/admin/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  toggleVendorStatus: (id: string, data?: { status?: 'ACTIVE' | 'DISABLED'; reason?: string }) =>
    apiFetch<any>(`/admin/vendors/${id}/toggle-status`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  rotateVendorDeviceToken: (id: string) =>
    apiFetch<any>(`/admin/vendors/${id}/rotate-token`, {
      method: 'POST',
    }),

  // Backwards-compatible aliases
  getAdminManufacturers: () => apiFetch<any[]>('/admin/manufacturers'),
  getAdminManufacturer: (id: string) => apiFetch<any>(`/admin/manufacturers/${id}`),
  createManufacturer: (data: any) =>
    apiFetch<any>('/admin/manufacturers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateManufacturer: (id: string, data: any) =>
    apiFetch<any>(`/admin/manufacturers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  toggleManufacturerStatus: (id: string, data?: { status?: 'ACTIVE' | 'DISABLED'; reason?: string }) =>
    apiFetch<any>(`/admin/manufacturers/${id}/toggle-status`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  rotateManufacturerDeviceToken: (id: string) =>
    apiFetch<any>(`/admin/manufacturers/${id}/rotate-token`, {
      method: 'POST',
    }),

  verifyWormChain: (orderId: string) => apiFetch<any>(`/admin/worm/verify/${orderId}`),
  getWormEvents: (limit = 50, offset = 0, orderId?: string) =>
    apiFetch<{ events: any[]; total: number }>(
      `/admin/worm/events?limit=${limit}&offset=${offset}${orderId ? `&orderId=${orderId}` : ''}`,
    ),
  issueSupplierToken: (email: string) =>
    apiFetch<any>('/admin/suppliers/tokens', {
      method: 'POST',
      body: JSON.stringify({ supplier_email: email }),
    }),
  updateOrderHub: (
    orderId: string,
    hubData: { hub_facility: string; hub_address: string; hub_city: string; hub_zip: string; notes?: string },
  ) =>
    apiFetch<any>(`/admin/orders/${orderId}/hub`, {
      method: 'POST',
      body: JSON.stringify(hubData),
    }),
  receiveAtUsHub: (orderId: string, notes?: string) =>
    apiFetch<any>(`/admin/orders/${orderId}/receive-at-us-hub`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  shipToClient: (orderId: string, carrier?: string, trackingNumber?: string) =>
    apiFetch<any>(`/admin/orders/${orderId}/ship-to-client`, {
      method: 'POST',
      body: JSON.stringify({ carrier, tracking_number: trackingNumber }),
    }),

  // User Feature Tags
  getUserTags: (email: string) =>
    apiFetch<{ email: string; tags: string[] }>(`/auth/tags?email=${encodeURIComponent(email)}`),
  saveUserTags: (tags: string[], email: string) =>
    apiFetch<{ success: boolean; email: string; tags: string[] }>('/auth/tags', {
      method: 'POST',
      body: JSON.stringify({ email, tags }),
    }),

  // Tripo3D Account Credit Balance & Admin API Key Management
  getTripoBalance: () =>
    apiFetch<{ balance: number; frozen: number; is_live: boolean }>('/generations/tripo/balance'),
  getAdminTripoSettings: () =>
    apiFetch<{ api_key_masked: string; api_key_configured: boolean; api_url: string; mock_mode: boolean; balance: any }>(
      '/admin/settings/tripo',
    ),
  updateAdminTripoSettings: (data: { api_key?: string; mock_mode?: boolean }) =>
    apiFetch<any>('/admin/settings/tripo', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // User Credentials, Wallet & Profile Management
  getUserProfile: (email?: string) =>
    apiFetch<any>(`/auth/profile${email ? `?email=${encodeURIComponent(email)}` : ''}`),
  updateUserProfile: (data: { email: string; full_name?: string; phone?: string; shipping_address?: any }) =>
    apiFetch<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (data: { email: string; current_password?: string; new_password: string }) =>
    apiFetch<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  topUpWallet: (data: { email: string; amount: number; payment_method_id?: string; note?: string }) =>
    apiFetch<{ success: boolean; balance: number; transaction: any; message: string }>('/auth/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addPaymentMethod: (data: { email: string; number: string; exp_month: number; exp_year: number; brand?: string; is_default?: boolean }) =>
    apiFetch<any[]>('/auth/wallet/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removePaymentMethod: (id: string, email: string) =>
    apiFetch<any[]>(`/auth/wallet/payment-methods/${id}?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),

  // Admin User Management
  getAdminUsers: () => apiFetch<any[]>('/admin/users'),
  createAdminUser: (data: { email: string; full_name?: string; role?: string; phone?: string; initial_wallet_balance?: number }) =>
    apiFetch<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminUser: (id: string, data: { full_name?: string; role?: string; status?: string; phone?: string; shipping_address?: any }) =>
    apiFetch<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  adjustAdminUserWallet: (id: string, data: { amount: number; reason: string; note?: string }) =>
    apiFetch<{ success: boolean; user: any; transaction: any; message: string }>(`/admin/users/${id}/wallet-adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetAdminUserPassword: (id: string, newPassword?: string) =>
    apiFetch<{ success: boolean; user_id: string; email: string; temporary_password?: string; message: string }>(
      `/admin/users/${id}/reset-password`,
      {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      },
    ),

  // FAQ Management & Public Content
  getPublicFaqs: () => apiFetch<any[]>('/faq'),
  getAdminFaqs: () => apiFetch<any[]>('/admin/faq'),
  createAdminFaq: (data: { question: string; answer: string; category?: string; is_published?: boolean; order_index?: number }) =>
    apiFetch<any>('/admin/faq', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminFaq: (id: string, data: { question?: string; answer?: string; category?: string; is_published?: boolean; order_index?: number }) =>
    apiFetch<any>(`/admin/faq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdminFaq: (id: string) =>
    apiFetch<any>(`/admin/faq/${id}`, {
      method: 'DELETE',
    }),
  toggleAdminFaq: (id: string) =>
    apiFetch<any>(`/admin/faq/${id}/toggle`, {
      method: 'PATCH',
    }),
  reorderAdminFaqs: (orderedIds: string[]) =>
    apiFetch<any[]>('/admin/faq/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
  resetAdminFaqs: () =>
    apiFetch<any[]>('/admin/faq/reset', {
      method: 'POST',
    }),

  // International Currencies & FX Rates
  getExchangeRates: () =>
    apiFetch<{ base_currency: string; updated_at: string; currencies: Record<string, any> }>('/admin/settings/currencies'),
  updateExchangeRate: (data: { currency: string; rate_to_usd: number }) =>
    apiFetch<{ success: boolean; currency: string; rate_to_usd: number; currencies: Record<string, any>; message: string }>(
      '/admin/settings/currencies',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  syncLiveExchangeRates: () =>
    apiFetch<{
      success: boolean;
      source: string;
      feed_timestamp_utc: string;
      synced_at: string;
      currencies: Record<string, any>;
      message: string;
    }>('/admin/settings/currencies/sync-live', {
      method: 'POST',
    }),
};
