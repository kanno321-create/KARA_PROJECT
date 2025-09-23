/**
 * KARA PROJECT API Service
 * Backend 연동 서비스
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002/api/v1';

// API 요청 헬퍼
async function apiRequest(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error);
    throw error;
  }
}

// ===========================
// AI Manager API
// ===========================
export const aiManagerAPI = {
  getDashboard: () => apiRequest('/ai-manager/dashboard'),
};

// ===========================
// Estimate API (FIX-4 Pipeline)
// ===========================
export const estimateAPI = {
  // FIX-4: 외함 선택
  calculateEnclosure: (data: {
    brand: string;
    form: string;
    device: any;
    main: any;
    branches: any[];
  }) => apiRequest('/estimate/enclosure', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // FIX-4: 배치 최적화
  optimizePlacement: (data: {
    enclosure: any;
    devices: any[];
  }) => apiRequest('/estimate/placement', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // FIX-4: 양식 생성
  generateFormat: (data: {
    customer: any;
    project: any;
    items: any[];
  }) => apiRequest('/estimate/format', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // FIX-4: 표지 완성
  createCover: (data: {
    estimate_id: string;
    cover_data: any;
  }) => apiRequest('/estimate/cover', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 견적 검증
  validate: (data: {
    estimate: any;
  }) => apiRequest('/estimate/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ===========================
// ERP API (읽기 전용)
// ===========================
export const erpAPI = {
  getLedger: (params?: {
    from_date?: string;
    to_date?: string;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/erp/ledger${queryString}`);
  },

  getKPI: () => apiRequest('/erp/kpi'),
};

// ===========================
// Calendar API
// ===========================
export const calendarAPI = {
  getEvents: (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/calendar/events${queryString}`);
  },
};

// ===========================
// Email API
// ===========================
export const emailAPI = {
  classifyEmail: (data: {
    email_content: string;
  }) => apiRequest('/email/classify', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ===========================
// Drawing API
// ===========================
export const drawingAPI = {
  extractDrawing: (data: {
    drawing_file: string;
  }) => apiRequest('/drawing/extract', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ===========================
// Evidence API
// ===========================
export const evidenceAPI = {
  getBundle: (id: string) => apiRequest(`/evidence/${id}`),
};

// ===========================
// Customer & Product API
// ===========================
export const dataAPI = {
  getCustomers: () => apiRequest('/customers'),
  getProducts: () => apiRequest('/products'),
};

// 전체 API export
export default {
  aiManager: aiManagerAPI,
  estimate: estimateAPI,
  erp: erpAPI,
  calendar: calendarAPI,
  email: emailAPI,
  drawing: drawingAPI,
  evidence: evidenceAPI,
  data: dataAPI,
};