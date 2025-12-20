/**
 * API Service - Comunicação com o backend FastAPI
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ==================== TYPES ====================

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    specialty?: string;
  };
}

// ==================== TOKEN MANAGEMENT ====================

let authToken: string | null = localStorage.getItem('osmech_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('osmech_token', token);
  } else {
    localStorage.removeItem('osmech_token');
  }
};

export const getAuthToken = () => authToken;

// ==================== FETCH WRAPPER ====================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - Token inválido
    if (response.status === 401) {
      setAuthToken(null);
      window.location.href = '/login';
      return { status: 401, error: 'Sessão expirada' };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        status: response.status,
        error: data?.detail || 'Erro na requisição',
      };
    }

    return { status: response.status, data };
  } catch (error) {
    console.error('API Error:', error);
    return {
      status: 0,
      error: 'Erro de conexão com o servidor',
    };
  }
}

// ==================== AUTH API ====================

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.access_token) {
      setAuthToken(response.data.access_token);
    }

    return response;
  },

  logout: () => {
    setAuthToken(null);
  },

  verify: () => apiFetch('/auth/verify'),

  register: (userData: { name: string; email: string; password: string; phone?: string }) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// ==================== USERS API ====================

export const usersApi = {
  list: (activeOnly = true) => 
    apiFetch(`/users/?active_only=${activeOnly}`),

  getMe: () => 
    apiFetch('/users/me'),

  getMechanics: () => 
    apiFetch('/users/mechanics'),

  getById: (id: number) => 
    apiFetch(`/users/${id}`),

  create: (userData: any) =>
    apiFetch('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  update: (id: number, userData: any) =>
    apiFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),

  delete: (id: number) =>
    apiFetch(`/users/${id}`, { method: 'DELETE' }),
};

// ==================== ORDERS API ====================

export const ordersApi = {
  list: (params?: { status?: string; plate?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.plate) searchParams.append('plate', params.plate);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiFetch(`/orders/${query ? `?${query}` : ''}`);
  },

  getStats: () => 
    apiFetch('/orders/stats'),

  getById: (id: number) => 
    apiFetch(`/orders/${id}`),

  create: (orderData: any) =>
    apiFetch('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  update: (id: number, orderData: any) =>
    apiFetch(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    }),

  delete: (id: number) =>
    apiFetch(`/orders/${id}`, { method: 'DELETE' }),

  addItem: (orderId: number, itemData: any) =>
    apiFetch(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
};

// ==================== FINANCE API ====================

export const financeApi = {
  getDashboard: (month?: number, year?: number) => {
    const searchParams = new URLSearchParams();
    if (month) searchParams.append('month', month.toString());
    if (year) searchParams.append('year', year.toString());
    
    const query = searchParams.toString();
    return apiFetch(`/finance/dashboard${query ? `?${query}` : ''}`);
  },

  listExpenses: (params?: { category?: string; status?: string; month?: number; year?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.month) searchParams.append('month', params.month.toString());
    if (params?.year) searchParams.append('year', params.year.toString());
    
    const query = searchParams.toString();
    return apiFetch(`/finance/expenses${query ? `?${query}` : ''}`);
  },

  createExpense: (expenseData: any) =>
    apiFetch('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  updateExpense: (id: number, expenseData: any) =>
    apiFetch(`/finance/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expenseData),
    }),

  deleteExpense: (id: number) =>
    apiFetch(`/finance/expenses/${id}`, { method: 'DELETE' }),

  getMonthlyReport: (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return apiFetch(`/finance/reports/monthly${query}`);
  },
};

// ==================== INVENTORY API ====================

export const inventoryApi = {
  list: (params?: { category?: string; lowStock?: boolean; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.lowStock) searchParams.append('low_stock', 'true');
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return apiFetch(`/inventory/${query ? `?${query}` : ''}`);
  },

  getCategories: () => 
    apiFetch('/inventory/categories'),

  getLowStock: () => 
    apiFetch('/inventory/low-stock'),

  getById: (id: number) => 
    apiFetch(`/inventory/${id}`),

  create: (itemData: any) =>
    apiFetch('/inventory/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),

  update: (id: number, itemData: any) =>
    apiFetch(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(itemData),
    }),

  adjustStock: (id: number, quantity: number, operation: 'add' | 'remove') =>
    apiFetch(`/inventory/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ quantity, operation }),
    }),

  delete: (id: number) =>
    apiFetch(`/inventory/${id}`, { method: 'DELETE' }),
};

// ==================== LOGS API ====================

export const logsApi = {
  list: (params?: { action?: string; userId?: number; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.append('action', params.action);
    if (params?.userId) searchParams.append('user_id', params.userId.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiFetch(`/logs/${query ? `?${query}` : ''}`);
  },

  getActions: () => 
    apiFetch('/logs/actions'),

  getByOrder: (orderNumber: string) =>
    apiFetch(`/logs/by-order/${orderNumber}`),
};

// ==================== COMPANY API ====================

export const companyApi = {
  get: () => 
    apiFetch('/company'),

  update: (companyData: any) =>
    apiFetch('/company', {
      method: 'PATCH',
      body: JSON.stringify(companyData),
    }),
};

// ==================== HEALTH CHECK ====================

export const healthApi = {
  check: () => apiFetch('/health'),
  root: () => apiFetch('/'),
};

// ==================== DEFAULT EXPORT ====================

const api = {
  auth: authApi,
  users: usersApi,
  orders: ordersApi,
  finance: financeApi,
  inventory: inventoryApi,
  logs: logsApi,
  company: companyApi,
  health: healthApi,
  setToken: setAuthToken,
  getToken: getAuthToken,
};

export default api;
