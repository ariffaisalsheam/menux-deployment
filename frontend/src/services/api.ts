import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // If sending FormData, let the browser set the multipart boundary automatically
    if (config.data instanceof FormData) {
      if (config.headers && 'Content-Type' in config.headers) {
        delete (config.headers as any)['Content-Type']
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors and improve error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('originalAdminUser')
      window.location.href = '/login'
    }

    // Enhance error messages for better user experience
    if (error.response?.status === 403) {
      error.message = 'Access denied. You do not have permission to perform this action.'
    } else if (error.response?.status === 404) {
      error.message = 'The requested resource was not found.'
    } else if (error.response?.status === 503) {
      // Service unavailable - often AI services
      const backendMessage = error.response?.data?.error || error.response?.data?.message;
      if (backendMessage) {
        error.message = backendMessage;
      } else {
        error.message = 'Service temporarily unavailable. Please try again later.';
      }
    } else if (error.response?.status === 429) {
      // Too Many Requests - respect Retry-After header when present
      const retryAfterHeader = error.response?.headers?.['retry-after'] || error.response?.headers?.['Retry-After'];
      const retryAfterSeconds = parseInt(retryAfterHeader) || 60;
      error.message = `Too many requests. Please wait ${retryAfterSeconds}s and try again.`;
      (error as any).isRetryable = true;
      (error as any).retryAfterSeconds = retryAfterSeconds;
    } else if (error.response?.status >= 500) {
      error.message = 'Server error occurred. Please contact support if this issue persists.'
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      error.message = 'Unable to connect to server. Please check your internet connection.'
    }

    // Add retry information for certain errors
    if (error.response?.status === 503 || error.response?.status === 429 || error.code === 'NETWORK_ERROR') {
      (error as any).isRetryable = true;
    }

    return Promise.reject(error)
  }
)

// Auth API
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  fullName: string
  phoneNumber?: string
  role: 'DINER' | 'RESTAURANT_OWNER' | 'SUPER_ADMIN'
  restaurantName?: string
  restaurantAddress?: string
  restaurantDescription?: string
  restaurantPhone?: string
  restaurantEmail?: string
}

export interface AuthResponse {
  token: string
  type: string
  id: number
  username: string
  email: string
  fullName: string
  role: 'DINER' | 'RESTAURANT_OWNER' | 'SUPER_ADMIN'
  restaurantId?: number
  restaurantName?: string
  subscriptionPlan?: 'BASIC' | 'PRO'
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
}

// User Management API (Admin only)
export const userAPI = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users')
    return response.data
  },

  getUserById: async (id: number) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },

  updateUserPlan: async (userId: number, plan: 'BASIC' | 'PRO') => {
    const response = await api.put(`/admin/users/${userId}/plan`, { subscriptionPlan: plan })
    return response.data
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  getCurrentProfile: async () => {
    const response = await api.get('/user/profile')
    return response.data
  }
}

// Restaurant Management API
export const restaurantAPI = {
  getAllRestaurants: async () => {
    const response = await api.get('/admin/restaurants')
    return response.data
  },

  getRestaurantById: async (id: number) => {
    const response = await api.get(`/admin/restaurants/${id}`)
    return response.data
  },

  updateRestaurant: async (data: any) => {
    const response = await api.put('/restaurant/current', data)
    return response.data
  },

  updateCurrentRestaurant: async (data: any) => {
    const response = await api.put('/restaurant/current', data)
    return response.data
  },

  getCurrentRestaurant: async () => {
    const response = await api.get('/restaurant/current')
    return response.data
  }
}

// Menu Management API
export const menuAPI = {
  getMenuItems: async (restaurantId?: number) => {
    const url = restaurantId ? `/menu/restaurant/${restaurantId}/items` : '/menu/manage/items'
    const response = await api.get(url)
    return response.data
  },

  createMenuItem: async (data: any) => {
    const response = await api.post('/menu/manage/items', data)
    return response.data
  },

  updateMenuItem: async (id: number, data: any) => {
    const response = await api.put(`/menu/manage/items/${id}`, data)
    return response.data
  },

  deleteMenuItem: async (id: number) => {
    const response = await api.delete(`/menu/manage/items/${id}`)
    return response.data
  },

  reorderMenuItems: async (items: { id: number; displayOrder: number }[]) => {
    const response = await api.post('/menu/manage/items/reorder', { items })
    return response.data
  }
}

// Order Management API
export const orderAPI = {
  getOrders: async (restaurantId?: number) => {
    if (restaurantId) {
      // For admin accessing specific restaurant - try both endpoints for compatibility
      try {
        const response = await api.get(`/orders/restaurant/${restaurantId}`)
        return response.data
      } catch (error) {
        // Fallback to manage endpoint with restaurantId parameter for admin impersonation
        const response = await api.get(`/orders/manage?restaurantId=${restaurantId}`)
        return response.data
      }
    } else {
      // For restaurant owner accessing their own orders
      const response = await api.get('/orders/manage')
      return response.data
    }
  },

  getOrderById: async (id: number) => {
    const response = await api.get(`/orders/manage/${id}`)
    return response.data
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await api.put(`/orders/manage/${id}/status`, { status })
    return response.data
  },

  updatePaymentStatus: async (id: number, paymentStatus: string) => {
    const response = await api.put(`/orders/manage/${id}/payment-status`, { paymentStatus })
    return response.data
  }
}

// Analytics API
export const analyticsAPI = {
  getRestaurantAnalytics: async (restaurantId?: number) => {
    const url = restaurantId ? `/analytics/restaurant/${restaurantId}` : '/analytics/restaurant'
    const response = await api.get(url)
    return response.data
  },

  getBasicAnalytics: async (restaurantId?: number) => {
    const url = restaurantId ? `/analytics/restaurant/${restaurantId}/basic` : '/analytics/restaurant/basic'
    const response = await api.get(url)
    return response.data
  },

  getFeedbackAnalytics: async (restaurantId?: number) => {
    const url = restaurantId
      ? `/analytics/restaurant/${restaurantId}/feedback`
      : '/analytics/restaurant/feedback'
    const response = await api.get(url)
    return response.data
  },

  getRecentActivity: async (restaurantId?: number) => {
    const url = restaurantId
      ? `/analytics/restaurant/${restaurantId}/activity`
      : '/analytics/restaurant/activity'
    const response = await api.get(url)
    return response.data
  },

  getPlatformAnalytics: async () => {
    const response = await api.get('/admin/analytics')
    return response.data
  }
}

// AI Services API
export const aiAPI = {
  generateDescription: async (itemName: string) => {
    const response = await api.post('/ai/menu-description', { itemName })
    return response.data
  },

  analyzeFeedback: async (feedback: string) => {
    const response = await api.post('/ai/feedback-analysis', { feedback })
    return response.data
  }
}

// AI Configuration API (Admin only)
export const aiConfigAPI = {
  getAllProviders: async () => {
    const response = await api.get('/admin/ai-config')
    return response.data
  },

  getActiveProviders: async () => {
    const response = await api.get('/admin/ai-config/active')
    return response.data
  },

  getProviderById: async (id: number) => {
    const response = await api.get(`/admin/ai-config/${id}`)
    return response.data
  },

  createProvider: async (data: any) => {
    const response = await api.post('/admin/ai-config', data)
    return response.data
  },

  updateProvider: async (id: number, data: any) => {
    const response = await api.put(`/admin/ai-config/${id}`, data)
    return response.data
  },

  deleteProvider: async (id: number) => {
    const response = await api.delete(`/admin/ai-config/${id}`)
    return response.data
  },

  testProvider: async (id: number | { type: string; apiKey: string; endpoint?: string; model?: string; settings?: string }) => {
    if (typeof id === 'number') {
      const response = await api.post(`/admin/ai-config/${id}/test`)
      return response.data
    } else {
      const response = await api.post('/admin/ai-config/test', id)
      return response.data
    }
  },

  setPrimaryProvider: async (id: number) => {
    const response = await api.post(`/admin/ai-config/${id}/set-primary`)
    return response.data
  },

  getAvailableModels: async () => {
    const response = await api.get('/admin/ai-config/models')
    return response.data
  },

  getUsageStatistics: async () => {
    const response = await api.get('/admin/ai-config/usage')
    return response.data
  }
}

// Media API
export const mediaAPI = {
  uploadImage: async (file: File, restaurantId?: number) => {
    const form = new FormData()
    form.append('file', file)
    if (restaurantId !== undefined) form.append('restaurantId', String(restaurantId))
    const response = await api.post('/media/upload', form)
    return response.data as { url?: string; path: string; proxyUrl?: string; signedUrl?: string }
  }
}

// Helper to build media proxy URL for displaying images via backend
export const mediaProxyUrl = (pathOrUrl?: string) => {
  if (!pathOrUrl) return ''
  const base = (API_BASE_URL || '').replace(/\/$/, '') // ensure no trailing slash
  return `${base}/media/stream?path=${encodeURIComponent(pathOrUrl)}`
}

// Platform Config API (Admin only)
export const platformConfigAPI = {
  getPlatformSettings: async () => {
    const response = await api.get('/admin/platform-config')
    return response.data
  },

  getPlatformSettingByKey: async (key: string) => {
    const response = await api.get(`/admin/platform-config/${encodeURIComponent(key)}`)
    return response.data
  },

  createPlatformSetting: async (data: any) => {
    const response = await api.post('/admin/platform-config', data)
    return response.data
  },

  updatePlatformSetting: async (key: string, data: any) => {
    const response = await api.put(`/admin/platform-config/${encodeURIComponent(key)}`, data)
    return response.data
  },

  deletePlatformSetting: async (key: string) => {
    const response = await api.delete(`/admin/platform-config/${encodeURIComponent(key)}`)
    return response.data
  },

  initializePlatformSettings: async () => {
    const response = await api.post('/admin/platform-config/initialize')
    return response.data
  }
}

// QR Code API
export const qrCodeAPI = {
  generateQRCode: async (size?: number, branded?: boolean) => {
    const params: any = {}
    if (size !== undefined) params.size = size
    if (branded !== undefined) params.branded = branded

    const response = await api.get('/qr/generate', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  getQRCodeInfo: async () => {
    const response = await api.get('/qr/info')
    return response.data
  },

  downloadQRCode: async (format: string, size?: number, branded?: boolean) => {
    const params: any = {}
    if (size !== undefined) params.size = size
    if (branded !== undefined) params.branded = branded

    const response = await api.get(`/qr/download/${format}`, {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  previewQRCode: async (size: number = 256, branded: boolean = false, customizationSettings?: any) => {
    const response = await api.get('/qr/preview', {
      params: { size, branded, ...customizationSettings },
      responseType: 'blob'
    })
    return response.data
  },

  saveQRCustomizationSettings: async (settings: any) => {
    const response = await api.post('/qr/customization-settings', settings)
    return response.data
  },

  getQRCustomizationSettings: async () => {
    const response = await api.get('/qr/customization-settings')
    return response.data
  }
}

// Public Menu API (no authentication required)
export const publicMenuAPI = {
  getPublicMenu: async (restaurantId: string, tableNumber: string) => {
    const response = await api.get(`/public/menu/${restaurantId}?table=${encodeURIComponent(tableNumber)}`)
    return response.data
  },

  getRestaurantInfo: async (restaurantId: string) => {
    const response = await api.get(`/public/menu/${restaurantId}/info`)
    return response.data
  },

  getRestaurantFeatures: async (restaurantId: string) => {
    const response = await api.get(`/public/menu/${restaurantId}/features`)
    return response.data
  },

  getFeedbackList: async (restaurantId: string) => {
    const response = await api.get(`/public/menu/${restaurantId}/feedback`)
    return response.data
  },

  submitFeedback: async (restaurantId: string, feedback: {
    customerName?: string;
    customerEmail?: string;
    rating: number;
    comment: string;
    orderNumber?: string;
  }) => {
    const response = await api.post(`/public/menu/${restaurantId}/feedback`, feedback)
    return response.data
  },

  placeOrder: async (restaurantId: string, orderData: any) => {
    const response = await api.post(`/public/menu/${restaurantId}/order`, orderData)
    return response.data
  }
  ,

  trackOrder: async (restaurantId: string, orderNumber: string) => {
    const response = await api.get(`/public/menu/${restaurantId}/order/${encodeURIComponent(orderNumber)}`)
    return response.data
  },

  trackOrdersByTable: async (restaurantId: string, tableNumber: string) => {
    const response = await api.get(`/public/menu/${restaurantId}/orders/by-table`, {
      params: { table: tableNumber }
    })
    return response.data
  },

  trackOrdersByCustomer: async (restaurantId: string, phone: string) => {
    const response = await api.get(`/public/menu/${restaurantId}/orders/by-customer`, {
      params: { phone }
    })
    return response.data
  },

  requestBill: async (restaurantId: string, orderNumber: string) => {
    const response = await api.post(`/public/menu/${restaurantId}/order/${encodeURIComponent(orderNumber)}/request-bill`)
    return response.data
  }
}

// Table Management API
export const tableAPI = {
  getAllTables: async () => {
    const response = await api.get('/tables')
    return response.data
  },

  getTable: async (tableId: number) => {
    const response = await api.get(`/tables/${tableId}`)
    return response.data
  },

  createTable: async (tableData: {
    tableNumber: string;
    tableName?: string;
    capacity?: number;
    locationDescription?: string;
  }) => {
    const response = await api.post('/tables', tableData)
    return response.data
  },

  updateTable: async (tableId: number, tableData: {
    tableNumber: string;
    tableName?: string;
    capacity?: number;
    locationDescription?: string;
  }) => {
    const response = await api.put(`/tables/${tableId}`, tableData)
    return response.data
  },

  updateTableStatus: async (tableId: number, status: string) => {
    const response = await api.patch(`/tables/${tableId}/status`, { status })
    return response.data
  },

  deleteTable: async (tableId: number) => {
    const response = await api.delete(`/tables/${tableId}`)
    return response.data
  },

  createBulkTables: async (data: {
    tableNumbers: string[];
    defaultCapacity?: number;
    defaultLocation?: string;
  }) => {
    const response = await api.post('/tables/bulk', data)
    return response.data
  },

  getTableStatistics: async () => {
    const response = await api.get('/tables/statistics')
    return response.data
  },

  generateTableQRCode: async (tableId: number, size?: number, branded?: boolean) => {
    const params: any = {}
    if (size !== undefined) params.size = size
    if (branded !== undefined) params.branded = branded

    const response = await api.get(`/tables/${tableId}/qr-code`, {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  generateQRCodeSheet: async (data: {
    tableNumbers: string[];
    qrSize?: number;
    tablesPerRow?: number;
  }) => {
    const response = await api.post('/tables/qr-code-sheet', data, {
      responseType: 'blob'
    })
    return response.data
  }
}

export default api
