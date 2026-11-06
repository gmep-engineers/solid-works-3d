const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('titanforge_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('titanforge_token', token);
  } else {
    localStorage.removeItem('titanforge_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('titanforge_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('titanforge_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('titanforge_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if FormData is used
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (data) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  demoLogin: (role) =>
    request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    }),
  getMe: () => request('/auth/me'),

  // User Profile & Credentials
  getUserProfile: () => request('/user/profile'),
  updateUserProfile: (data) =>
    request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  changePassword: (data) =>
    request('/user/change-password', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Wallet & Credit Card Refill
  getWallet: () => request('/user/wallet'),
  refillWallet: (data) =>
    request('/user/wallet/refill', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // User Uploaded Projects
  getUserProjects: () => request('/user/projects'),

  // CAD
  uploadCad: (formData) =>
    request('/cad/upload', {
      method: 'POST',
      body: formData
    }),
  loadSample: (sampleKey) => {
    const form = new FormData();
    form.append('sample_key', sampleKey);
    return request('/cad/load-sample', {
      method: 'POST',
      body: form
    });
  },
  getUserModels: () => request('/cad/models'),
  getModel: (modelId) => request(`/cad/models/${modelId}`),
  autoThickenModel: (modelId, data) =>
    request(`/cad/models/${modelId}/auto-thicken`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    }),

  // Quoting
  getQuoteConfig: () => request('/quote/config'),
  calculateQuote: (data) =>
    request('/quote/calculate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  saveQuote: (data) =>
    request('/quote/save', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getQuote: (quoteId) => request(`/quote/${quoteId}`),

  // Quote Projects (Save & Load in Quote & DFM)
  saveQuoteProject: (data) =>
    request('/quote/projects/save', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  listQuoteProjects: () => request('/quote/projects'),
  getQuoteProject: (projectId) => request(`/quote/projects/${projectId}`),
  deleteQuoteProject: (projectId) =>
    request(`/quote/projects/${projectId}`, {
      method: 'DELETE'
    }),

  // Orders
  createOrder: (data) =>
    request('/orders/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getUserOrders: () => request('/orders'),
  getOrder: (orderId) => request(`/orders/${orderId}`),

  // Admin
  getDashboardStats: () => request('/admin/dashboard-stats'),
  getAllOrders: (statusFilter) =>
    request(`/admin/orders${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  updateOrderStatus: (orderId, data) =>
    request(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getUsersList: () => request('/admin/users'),

  // Admin Materials Management
  adminGetMaterials: () => request('/admin/materials'),
  adminCreateMaterial: (data) =>
    request('/admin/materials', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  adminUpdateMaterial: (id, data) =>
    request(`/admin/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  adminToggleMaterial: (id) =>
    request(`/admin/materials/${id}`, {
      method: 'DELETE'
    }),

  // Admin Machining Services Management
  adminGetServices: () => request('/admin/services'),
  adminCreateService: (data) =>
    request('/admin/services', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  adminUpdateService: (id, data) =>
    request(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  adminToggleService: (id) =>
    request(`/admin/services/${id}`, {
      method: 'DELETE'
    }),

  // Admin Post-Processing Techniques Management
  adminGetPostProcessing: () => request('/admin/post-processing'),
  adminCreatePostProcessing: (data) =>
    request('/admin/post-processing', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  adminUpdatePostProcessing: (id, data) =>
    request(`/admin/post-processing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  adminTogglePostProcessing: (id) =>
    request(`/admin/post-processing/${id}`, {
      method: 'DELETE'
    }),

  // Admin Product Add-On Features Management
  adminGetAddons: () => request('/admin/addons'),
  adminCreateAddon: (data) =>
    request('/admin/addons', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  adminUpdateAddon: (id, data) =>
    request(`/admin/addons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  adminToggleAddon: (id) =>
    request(`/admin/addons/${id}`, {
      method: 'DELETE'
    }),

  // Admin Bank Account & Gateway Setup
  adminGetBankConfig: () => request('/admin/bank-config'),
  adminUpdateBankConfig: (data) =>
    request('/admin/bank-config', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  adminVerifyBank: () =>
    request('/admin/bank-config/verify', {
      method: 'POST'
    }),
  adminGetPayouts: () => request('/admin/payouts'),
  adminTriggerPayout: () =>
    request('/admin/payouts/trigger', {
      method: 'POST'
    }),

  // Admin Machines & DFM Limits Management
  adminGetMachines: () => request('/admin/machines'),
  adminCreateMachine: (data) =>
    request('/admin/machines', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  adminUpdateMachine: (id, data) =>
    request(`/admin/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  adminToggleMachine: (id) =>
    request(`/admin/machines/${id}`, {
      method: 'DELETE'
    }),

  // Admin IP & Legal Disclaimer Settings
  adminGetDisclaimer: () => request('/admin/disclaimer'),
  adminUpdateDisclaimer: (data) =>
    request('/admin/disclaimer', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getLegalDisclaimer: () => request('/quote/disclaimer'),

  // Admin TitanForge 3D & Tripo3D API Billing Settings
  adminGetTitanForgeConfig: () => request('/admin/titanforge-config'),
  adminUpdateTitanForgeConfig: (data) =>
    request('/admin/titanforge-config', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  adminTestTripoConnection: () =>
    request('/admin/titanforge-config/test', {
      method: 'POST'
    }),
  forgeGetPricing: () => request('/forge/pricing'),

  // ForgeAI Customizer Studio
  forgeCheckIp: (prompt) =>
    request('/forge/ip-guard/check', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    }),
  forgeGetPresets: () => request('/forge/presets'),
  forgeGetTripoKey: () => request('/forge/tripo-key'),
  forgeSaveTripoKey: (apiKey) =>
    request('/forge/tripo-key', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey })
    }),
  forgeGetAiStatus: (geminiApiKey, tripoApiKey) => {
    const params = new URLSearchParams();
    if (geminiApiKey) params.append('gemini_api_key', geminiApiKey);
    if (tripoApiKey) params.append('tripo_api_key', tripoApiKey);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/forge/ai-status${qs}`);
  },
  forgeCreateSession: (data) =>
    request('/forge/sessions/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  forgeGetSession: (sessionId) => request(`/forge/sessions/${sessionId}`),
  forgeApplyFeature: (sessionId, data) =>
    request(`/forge/sessions/${sessionId}/apply-feature`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  forgeUndo: (sessionId) =>
    request(`/forge/sessions/${sessionId}/undo`, {
      method: 'POST'
    }),
  forgeRedo: (sessionId) =>
    request(`/forge/sessions/${sessionId}/redo`, {
      method: 'POST'
    }),
  forgeChatCommand: (sessionId, command, geminiApiKey = null, tripoApiKey = null, enginePreference = 'auto') =>
    request(`/forge/sessions/${sessionId}/chat-command`, {
      method: 'POST',
      body: JSON.stringify({
        command,
        gemini_api_key: geminiApiKey,
        tripo_api_key: tripoApiKey,
        engine_preference: enginePreference
      })
    }),
  forgeTransferToQuote: (sessionId) =>
    request(`/forge/sessions/${sessionId}/transfer-to-quote`, {
      method: 'POST'
    }),
  forgePlaceOrder: (sessionId, data) =>
    request(`/forge/sessions/${sessionId}/order`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  forgeSaveProject: (data) =>
    request('/forge/projects/save', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  forgeListProjects: () => request('/forge/projects'),
  forgeLoadProject: (projectId) =>
    request(`/forge/projects/${projectId}/load`, {
      method: 'POST'
    }),
  forgeDeleteProject: (projectId) =>
    request(`/forge/projects/${projectId}`, {
      method: 'DELETE'
    }),

  // WORM Cryptographic Ledger & Storage Configuration
  getWormLedger: (limit = 100) => request(`/admin/ledger?limit=${limit}`),
  getWormLedgerDetail: (ledgerId) => request(`/admin/ledger/${ledgerId}`),
  verifyMerkleChain: () => request('/admin/ledger/verify-chain'),
  toggleLegalHold: (ledgerId, reason) =>
    request(`/admin/ledger/${ledgerId}/legal-hold`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  getStorageConfig: () => request('/admin/storage-config'),
  updateStorageConfig: (data) =>
    request('/admin/storage-config', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  testStorageConnection: () =>
    request('/admin/storage-config/test', {
      method: 'POST'
    }),
  downloadOrderCertificateUrl: (orderId) => {
    const token = getAuthToken();
    return `/api/orders/${orderId}/certificate${token ? `?token=${token}` : ''}`;
  },
  downloadLedgerCertificateUrl: (ledgerId) => {
    const token = getAuthToken();
    return `/api/admin/ledger/${ledgerId}/certificate${token ? `?token=${token}` : ''}`;
  },
  downloadQuoteCertificateUrl: (quoteId) => {
    const token = getAuthToken();
    return `/api/quote/${quoteId}/certificate${token ? `?token=${token}` : ''}`;
  }
};

