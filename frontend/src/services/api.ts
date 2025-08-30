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
  (response) => {
    // If backend returned a refreshed token (e.g., after username change), store it
    const authHeader = (response.headers?.['authorization'] as string) || (response.headers as any)?.['Authorization']
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const newToken = authHeader.substring(7)
      try {
        localStorage.setItem('token', newToken)
        // Notify app to update in-memory auth state
        window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: { token: newToken } }))
      } catch (e) {
        // non-blocking; continue
      }
    }
    return response
  },
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

  getRestaurantOwners: async () => {
    const response = await api.get('/admin/users/restaurant-owners')
    return response.data
  },

  getUserById: async (id: number) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },

  updateUser: async (userId: number, data: UpdateUserRequest) => {
    const response = await api.put(`/admin/users/${userId}`, data)
    return response.data
  },

  updateUserPlan: async (userId: number, plan: 'BASIC' | 'PRO') => {
    const response = await api.put(`/admin/users/${userId}/plan`, { subscriptionPlan: plan })
    return response.data
  },

  activateUser: async (userId: number) => {
    const response = await api.post(`/admin/users/${userId}/activate`)
    return response.data
  },

  deactivateUser: async (userId: number) => {
    const response = await api.post(`/admin/users/${userId}/deactivate`)
    return response.data
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  switchToUser: async (userId: number) => {
    const response = await api.post(`/admin/users/${userId}/switch`)
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
    const response = await api.get(`/admin/restaurants/${id}`, { params: { _ts: Date.now() } })
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

  getBasicAnalytics: async (restaurantId?: number, date?: string) => {
    const url = restaurantId ? `/analytics/restaurant/${restaurantId}/basic` : '/analytics/restaurant/basic'
    const response = await api.get(url, {
      params: date ? { date } : undefined
    })
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

// Admin Tools API (Super Admin only)
export const adminAPI = {
sendTestPush: async (payload?: { title?: string; body?: string; data?: Record<string, any> }) => {
const response = await api.post('/admin/notifications/test-push', payload || {})
return response.data as { success: boolean; notificationId?: number; error?: string }
},

broadcast: async (payload: { title: string; body: string; target: 'RESTAURANT_OWNERS' | 'ALL_ACTIVE' | string; data?: Record<string, any> }) => {
const response = await api.post('/admin/notifications/broadcast', payload)
return response.data as { success: boolean; recipients?: number; created?: number; error?: string }
},

  listRecentNotifications: async (page = 0, size = 20) => {
    const response = await api.get('/admin/notifications/recent', { params: { page, size } })
    return response.data as {
      content: Array<{
        id: number
        targetUserId?: number
        type: string
        title: string
        body: string
        data?: string
        priority: string
        status: string
        readAt?: string
        createdAt: string
      }>
      page: number
      size: number
      totalElements: number
      totalPages: number
      hasNext: boolean
    }
  },

  getDeliveryAttempts: async (notificationId: number) => {
    const response = await api.get(`/admin/notifications/${notificationId}/delivery-attempts`)
    return response.data as Array<{
      id: number
      notificationId: number
      channel: string
      status: string
      providerMessageId?: string
      responseCode?: string
      errorMessage?: string
      attemptAt: string
      retryCount: number
    }>
  },

  // Get system health data
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health')
    return response.data
  },

  // Get user details for notification context
  getUserDetails: async (userId: number) => {
    const response = await api.get(`/admin/users/${userId}/details`)
    return response.data as {
      id: number
      fullName: string
      email: string
      role: string
    }
  },

  // Get restaurant details for notification context
  getRestaurantDetails: async (restaurantId: number) => {
    const response = await api.get(`/admin/restaurants/${restaurantId}/details`)
    return response.data as {
      id: number
      name: string
      address?: string
      phone?: string
    }
  }
}

// Notification Admin (Super Admin): Templates, Segments, Campaigns, Analytics
export const notificationAdminAPI = {
  // Templates
  listTemplates: async (): Promise<Array<{ id: number; name: string; channel: 'push' | 'email' | 'in_app'; title?: string; body: string; variables?: string[]; enabled: boolean; updatedAt?: string }>> => {
    const res = await api.get('/admin/notifications/templates')
    return res.data
  },
  createTemplate: async (payload: { name: string; channel: 'push' | 'email' | 'in_app'; title?: string; body: string; variables?: string[]; enabled?: boolean }) => {
    const res = await api.post('/admin/notifications/templates', payload)
    return res.data
  },
  updateTemplate: async (id: number, payload: { name?: string; channel?: 'push' | 'email' | 'in_app'; title?: string; body?: string; variables?: string[]; enabled?: boolean }) => {
    const res = await api.put(`/admin/notifications/templates/${id}`, payload)
    return res.data
  },
  deleteTemplate: async (id: number) => {
    const res = await api.delete(`/admin/notifications/templates/${id}`)
    return res.data
  },

  // Segments
  listSegments: async (): Promise<Array<{ id: number; name: string; description?: string; filters: Record<string, any>; estimatedCount?: number; updatedAt?: string }>> => {
    const res = await api.get('/admin/notifications/segments')
    return res.data
  },
  createSegment: async (payload: { name: string; description?: string; filters: Record<string, any> }) => {
    const res = await api.post('/admin/notifications/segments', payload)
    return res.data
  },
  updateSegment: async (id: number, payload: { name?: string; description?: string; filters?: Record<string, any> }) => {
    const res = await api.put(`/admin/notifications/segments/${id}`, payload)
    return res.data
  },
  deleteSegment: async (id: number) => {
    const res = await api.delete(`/admin/notifications/segments/${id}`)
    return res.data
  },
  previewSegment: async (payload: { filters: Record<string, any> }) => {
    const res = await api.post('/admin/notifications/segments/preview', payload)
    return res.data as { estimatedCount: number }
  },

  // Campaigns (Scheduling + A/B testing)
  listCampaigns: async (): Promise<Array<{ id: number; name: string; templateId?: number; segmentId?: number; status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED'; scheduleAt?: string | null; variants?: Array<{ key: string; templateId?: number; weight?: number }>; requireApproval?: boolean; createdAt?: string; updatedAt?: string }>> => {
    const res = await api.get('/admin/notifications/campaigns')
    return res.data
  },
  createCampaign: async (payload: { name: string; templateId?: number; segmentId?: number; scheduleAt?: string | null; variants?: Array<{ key: string; templateId?: number; weight?: number }>; requireApproval?: boolean }) => {
    const res = await api.post('/admin/notifications/campaigns', payload)
    return res.data
  },
  updateCampaign: async (id: number, payload: Partial<{ name: string; templateId: number; segmentId: number; scheduleAt: string | null; status: string; variants: Array<{ key: string; templateId?: number; weight?: number }>; requireApproval: boolean }>) => {
    const res = await api.put(`/admin/notifications/campaigns/${id}`, payload)
    return res.data
  },
  scheduleCampaign: async (id: number, payload: { scheduleAt: string }) => {
    const res = await api.post(`/admin/notifications/campaigns/${id}/schedule`, payload)
    return res.data
  },
  pauseCampaign: async (id: number) => {
    const res = await api.post(`/admin/notifications/campaigns/${id}/pause`)
    return res.data
  },
  resumeCampaign: async (id: number) => {
    const res = await api.post(`/admin/notifications/campaigns/${id}/resume`)
    return res.data
  },

  // Delivery & Engagement Analytics
  getAnalyticsSummary: async (params: { from?: string; to?: string } = {}) => {
    const res = await api.get('/admin/notifications/analytics/summary', { params })
    return res.data as { sent: number; delivered: number; failed: number; opened?: number; clicked?: number; unsubscribed?: number }
  },
  getAnalyticsSeries: async (params: { metric: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked'; from?: string; to?: string; interval?: 'hour' | 'day' | 'week' }) => {
    const res = await api.get('/admin/notifications/analytics/series', { params })
    return res.data as Array<{ ts: string; value: number }>
  },

  // Get delivery attempts for a notification
  getDeliveryAttempts: async (notificationId: number) => {
    const res = await api.get(`/admin/notifications/${notificationId}/delivery-attempts`)
    return res.data
  },

  // Clear notifications by date range
  clearNotifications: async (dateRange: { from?: string; to?: string }) => {
    const res = await api.delete('/admin/notifications/clear', { params: dateRange })
    return res.data
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

// Public Settings API (no auth required)
export const publicSettingsAPI = {
  getAll: async (): Promise<Array<{ key: string; value: string }>> => {
    const response = await api.get('/public/settings')
    return response.data
  },
  getSetting: async (key: string): Promise<{ key: string; value: string } | null> => {
    try {
      const response = await api.get(`/public/settings/${encodeURIComponent(key)}`)
      return response.data
    } catch (_) {
      return null
    }
  }
}

// Manual Payments API (Manual bKash)
export interface ManualPaymentSubmitRequest {
  amount: number
  trxId: string
  senderMsisdn: string
  screenshotPath?: string
}

export interface ManualPaymentDto {
  id: number
  ownerId: number
  restaurantId: number
  method?: string | null
  amount: number
  currency?: string | null
  trxId: string
  senderMsisdn: string
  screenshotPath?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  note?: string | null
  createdAt: string
  verifiedAt?: string | null
  verifiedBy?: number | null
}

export const paymentsAPI = {
  submitManualBkash: async (payload: ManualPaymentSubmitRequest): Promise<ManualPaymentDto> => {
    const response = await api.post('/payments/manual-bkash', payload)
    return response.data
  },
  submitManualPayment: async (payload: ManualPaymentSubmitRequest): Promise<ManualPaymentDto> => {
    const response = await api.post('/payments/manual-bkash', payload)
    return response.data
  },
  listMyPayments: async (): Promise<ManualPaymentDto[]> => {
    const response = await api.get('/payments/my')
    return response.data
  }
}

export const adminPaymentsAPI = {
  list: async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<ManualPaymentDto[]> => {
    const response = await api.get('/admin/payments/manual-bkash', {
      params: status ? { status } : undefined
    })
    return response.data
  },
  approve: async (id: number, note?: string): Promise<ManualPaymentDto> => {
    const response = await api.post(`/admin/payments/manual-bkash/${id}/approve`, note ? { note } : {})
    return response.data
  },

  reject: async (id: number, note?: string): Promise<ManualPaymentDto> => {
    const response = await api.post(`/admin/payments/manual-bkash/${id}/reject`, note ? { note } : {})
    return response.data
  }
}

// Admin Approvals API
export interface ApprovalDto {
  id: number
  type: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedBy: number
  approverId?: number | null
  reason?: string | null
  payload?: any
  createdAt: string
  decidedAt?: string | null
}

export const adminApprovalsAPI = {
  list: async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<ApprovalDto[]> => {
    const response = await api.get('/admin/approvals', {
      params: status ? { status } : undefined
    })
    return response.data
  },
  approve: async (id: number, note?: string): Promise<ApprovalDto> => {
    const response = await api.post(`/admin/approvals/${id}/approve`, note ? { note } : {})
    return response.data
  },
  reject: async (id: number, note?: string): Promise<ApprovalDto> => {
    const response = await api.post(`/admin/approvals/${id}/reject`, note ? { note } : {})
    return response.data
  },
}

// Subscription API (Owner + Admin)
export interface RestaurantSubscriptionDTO {
  id: number
  restaurantId: number
  plan?: 'BASIC' | 'PRO' | null
  status?: 'TRIALING' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELED' | 'SUSPENDED' | null
  trialStartAt?: string | null
  trialEndAt?: string | null
  // Added for parity with Admin view and countdown precedence
  graceEndAt?: string | null
  currentPeriodStartAt?: string | null
  currentPeriodEndAt?: string | null
  cancelAtPeriodEnd?: boolean | null
  canceledAt?: string | null
  trialDaysRemaining?: number | null
  paidDaysRemaining?: number | null
  graceDaysRemaining?: number | null
}

export interface RestaurantSubscriptionEventDTO {
  id: number
  subscriptionId: number
  eventType: string
  metadata?: string | null
  createdAt: string
}

export const subscriptionAPI = {
  getStatus: async (): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.get('/owner/subscription', { params: { _ts: Date.now() } })
    return res.data
  },
  startTrial: async (): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post('/owner/subscription/start-trial')
    return res.data
  },
  getEvents: async (): Promise<RestaurantSubscriptionEventDTO[]> => {
    const res = await api.get('/owner/subscription/events', { params: { _ts: Date.now() } })
    return res.data
  },
  cancelSubscription: async (): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post('/owner/subscription/cancel')
    return res.data
  }
}

export const adminSubscriptionAPI = {
  get: async (restaurantId: number): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.get(`/admin/subscriptions/${restaurantId}`, { params: { _ts: Date.now() } })
    return res.data
  },
  grant: async (restaurantId: number, days: number): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post(`/admin/subscriptions/${restaurantId}/grant`, { days })
    return res.data
  },
  startTrial: async (restaurantId: number): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post(`/admin/subscriptions/${restaurantId}/start-trial`)
    return res.data
  },
  setTrialDays: async (restaurantId: number, days: number): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post(`/admin/subscriptions/${restaurantId}/set-trial-days`, { days })
    return res.data
  },
  setPaidDays: async (restaurantId: number, days: number): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post(`/admin/subscriptions/${restaurantId}/set-paid-days`, { days })
    return res.data
  },
  suspend: async (restaurantId: number, reason?: string): Promise<RestaurantSubscriptionDTO> => {
    const payload = reason && reason.trim().length > 0 ? { reason } : {}
    const res = await api.post(`/admin/subscriptions/${restaurantId}/suspend`, payload)
    return res.data
  },
  unsuspend: async (restaurantId: number): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post(`/admin/subscriptions/${restaurantId}/unsuspend`)
    return res.data
  },
  cancel: async (restaurantId: number): Promise<RestaurantSubscriptionDTO> => {
    const res = await api.post(`/admin/subscriptions/${restaurantId}/cancel`)
    return res.data
  },
  getEvents: async (restaurantId: number): Promise<RestaurantSubscriptionEventDTO[]> => {
    const res = await api.get(`/admin/subscriptions/${restaurantId}/events`, { params: { _ts: Date.now() } })
    return res.data
  },
  debugRunDaily: async (): Promise<{ status: string }> => {
    const res = await api.post('/admin/subscriptions/debug/run-daily')
    return res.data
  }
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

// Notifications API
export interface NotificationFilters {
  unreadOnly?: boolean
  page?: number
  size?: number
}

export const notificationAPI = {
  getNotifications: async (filters: NotificationFilters = {}) => {
    const params: any = {}
    if (typeof filters.unreadOnly === 'boolean') params.unreadOnly = filters.unreadOnly
    if (typeof filters.page === 'number') params.page = filters.page
    if (typeof filters.size === 'number') params.size = filters.size
    const response = await api.get('/notifications', { params })
    return response.data
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },

  markRead: async (id: number) => {
    const response = await api.post(`/notifications/${id}/read`)
    return response.data
  },

  markAllRead: async () => {
    const response = await api.post('/notifications/read-all')
    return response.data
  },

  // Clear/dismiss a single notification with graceful fallback endpoints
  clear: async (id: number) => {
    try {
      // Preferred RESTful delete
      const response = await api.delete(`/notifications/${id}`)
      return response.data
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404 || status === 405) {
        // Fallback to explicit dismiss endpoint if delete not available
        const response = await api.post(`/notifications/${id}/dismiss`)
        return response.data
      }
      throw e
    }
  },

  // Clear/dismiss all notifications with graceful fallback endpoints
  clearAll: async () => {
    try {
      // Try collection delete first
      const response = await api.delete('/notifications')
      return response.data
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404 || status === 405) {
        // Try common fallbacks
        try {
          const res = await api.post('/notifications/clear-all')
          return res.data
        } catch (e2: any) {
          const status2 = e2?.response?.status
          if (status2 === 404 || status2 === 405) {
            const res3 = await api.post('/notifications/dismiss-all')
            return res3.data
          }
          throw e2
        }
      }
      throw e
    }
  },

  getPreferences: async () => {
    const response = await api.get('/notifications/preferences')
    return response.data
  },

  updatePreferences: async (prefs: any) => {
    const response = await api.put('/notifications/preferences', prefs)
    return response.data
  },

  // FCM device token registration (requires JWT)
  registerFcmToken: async (payload: { token: string; platform: 'web' | 'ios' | 'android'; deviceId?: string; deviceModel?: string }) => {
    // Backend will trim/normalize and set lastUsedAt
    const response = await api.post('/notifications/fcm-tokens', payload)
    return response.data
  },

  // FCM token removal by token value (requires JWT)
  removeFcmToken: async (token: string) => {
    const response = await api.delete('/notifications/fcm-tokens', { params: { token } })
    return response.data
  },
}

// Profile & Security API (Owner + Admin)
export interface OwnerProfile {
  id: number
  username: string
  email: string
  fullName: string
  phoneNumber?: string | null
  photoPath?: string | null
  restaurant?: {
    id: number
    name: string
    address: string
    phoneNumber?: string | null
    email?: string | null
    subscriptionPlan: 'BASIC' | 'PRO'
  } | null
}

export interface UpdateOwnerProfileRequest {
  fullName?: string
  phoneNumber?: string
  email?: string
  username?: string
  business?: {
    name?: string
    address?: string
    phoneNumber?: string
    email?: string
    description?: string
  }
}

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AdminProfile {
  id: number
  username: string
  email: string
  fullName: string
  phoneNumber?: string | null
  photoPath?: string | null
  roles: string[]
}

export interface UsernameAvailabilityResponse {
  username: string
  available: boolean
  suggestions: string[]
}

export const profileAPI = {
  // Owner Self Profile
  getOwnerProfile: async (): Promise<OwnerProfile> => {
    const res = await api.get('/owner/profile')
    return res.data
  },
  updateOwnerProfile: async (payload: UpdateOwnerProfileRequest): Promise<OwnerProfile> => {
    const res = await api.put('/owner/profile', payload)
    return res.data
  },
  updateOwnerPassword: async (payload: UpdatePasswordRequest): Promise<void> => {
    await api.put('/owner/profile/password', payload)
  },
  setOwnerProfilePhoto: async (path: string): Promise<OwnerProfile> => {
    const res = await api.put('/owner/profile/photo', { path })
    return res.data
  },
  uploadOwnerProfilePhoto: async (file: File): Promise<OwnerProfile> => {
    const uploaded = await mediaAPI.uploadImage(file)
    const res = await api.put('/owner/profile/photo', { path: uploaded.path })
    return res.data
  },
  checkOwnerUsernameAvailability: async (username: string): Promise<UsernameAvailabilityResponse> => {
    const res = await api.get('/owner/profile/username-availability', { params: { username } })
    return res.data
  },
  // Owner Self Delete
  deleteOwnerAccount: async (): Promise<void> => {
    await api.delete('/owner/profile')
  },

  // Super Admin Self Profile
  getAdminProfile: async (): Promise<AdminProfile> => {
    const res = await api.get('/admin/profile')
    return res.data
  },
  updateAdminProfile: async (payload: Partial<AdminProfile>): Promise<AdminProfile> => {
    const res = await api.put('/admin/profile', payload)
    return res.data
  },
  updateAdminPassword: async (payload: UpdatePasswordRequest): Promise<void> => {
    await api.put('/admin/profile/password', payload)
  },
  setAdminProfilePhoto: async (path: string): Promise<AdminProfile> => {
    const res = await api.put('/admin/profile/photo', { path })
    return res.data
  },
}

// RBAC (Super Admin)
export interface RbacRole {
  id: number;
  name: string;
  description?: string | null;
  permissions: RbacPermission[];
  users?: any[]; // Optional users array for role assignment tracking
}
export interface RbacPermission { key: string; description?: string | null }

// Admin User Management Types
export interface CreateAdminUserRequest {
  username: string
  password: string
  confirmPassword: string
  email?: string
  fullName: string
  phoneNumber?: string
  roleIds: number[]
  isActive?: boolean
}

export interface UpdateUserRequest {
  email?: string
  fullName?: string
  phoneNumber?: string
  isActive?: boolean
}

export interface UpdateAdminUserRequest {
  email?: string
  fullName?: string
  phoneNumber?: string
  roleIds?: number[]
  isActive?: boolean
  newPassword?: string
  confirmNewPassword?: string
}

export interface AdminUserDTO {
  id: number
  username: string
  email?: string
  fullName: string
  phoneNumber?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  rbacRoles: RbacRole[]
  permissions: string[]
}



// Audit Logs (Super Admin)
export interface AuditLogDto {
  id: number
  actorId?: number | null
  actorUsername?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  metadata?: any
  ip?: string | null
  userAgent?: string | null
  createdAt: string
}

export const auditAPI = {
  list: async (filters: { actorId?: number; action?: string; resourceType?: string; from?: string; to?: string; page?: number; size?: number } = {}): Promise<{ content: AuditLogDto[]; page: number; size: number; totalElements: number; totalPages: number; hasNext: boolean }> => {
    const res = await api.get('/admin/audit', { params: filters })
    return res.data
  },
  get: async (id: number): Promise<AuditLogDto> => {
    const res = await api.get(`/admin/audit/${id}`)
    return res.data
  },
  deleteLog: async (id: number): Promise<void> => {
    await api.delete(`/admin/audit/${id}`)
  },
  clearAllLogs: async (): Promise<void> => {
    await api.delete('/admin/audit/clear-all')
  },
  clearLogsByCriteria: async (filters: { actorId?: number; action?: string; resourceType?: string; from?: string; to?: string }): Promise<void> => {
    await api.delete('/admin/audit/clear-by-criteria', { params: filters })
  },
}

// Approvals (Super Admin)
export interface ApprovalRequestDto {
  id: number
  type: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedBy: number
  approverId?: number | null
  reason?: string | null
  payload?: any
  createdAt: string
  decidedAt?: string | null
}

export const approvalsAPI = {
  list: async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<ApprovalRequestDto[]> => {
    const res = await api.get('/admin/approvals', { params: status ? { status } : undefined })
    return res.data
  },
  approve: async (id: number, note?: string): Promise<ApprovalRequestDto> => {
    const res = await api.post(`/admin/approvals/${id}/approve`, note ? { note } : {})
    return res.data
  },
  reject: async (id: number, note?: string): Promise<ApprovalRequestDto> => {
    const res = await api.post(`/admin/approvals/${id}/reject`, note ? { note } : {})
    return res.data
  },
}

// Billing & Payment Methods (Owner)
export interface BillingInvoice {
  id: number
  periodStart: string
  periodEnd: string
  amount: number
  status: 'PAID' | 'DUE' | 'VOID'
  createdAt: string
  paidAt?: string | null
  method?: string | null
  reference?: string | null
}

export interface PaymentMethodDto {
  id: number
  type: 'BKASH' | 'CARD' | 'CASH'
  label?: string | null
  last4?: string | null
  isDefault: boolean
  createdAt: string
}

export const billingAPI = {
  listInvoices: async (): Promise<BillingInvoice[]> => {
    const res = await api.get('/owner/subscription/invoices')
    return res.data
  },
}

export const paymentMethodsAPI = {
  list: async (): Promise<PaymentMethodDto[]> => {
    const res = await api.get('/owner/payment-methods')
    return res.data
  },
  add: async (payload: { type: 'BKASH' | 'CARD' | 'CASH'; label?: string; tokenOrNumber?: string; last4?: string }): Promise<PaymentMethodDto> => {
    const res = await api.post('/owner/payment-methods', payload)
    return res.data
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/owner/payment-methods/${id}`)
  },
  setDefault: async (id: number): Promise<void> => {
    await api.post(`/owner/payment-methods/${id}/default`)
  },
}

// RBAC API
export const rbacAPI = {
  // Roles
  listRoles: () => api.get('/admin/rbac/roles'),
  createRole: (data: { name: string; description?: string }) => api.post('/admin/rbac/roles', data),
  updateRole: (id: number, data: { name: string; description?: string }) => api.put(`/admin/rbac/roles/${id}`, data),
  deleteRole: (id: number) => api.delete(`/admin/rbac/roles/${id}`),

  // Permissions
  listPermissions: () => api.get('/admin/rbac/permissions'),
  createPermission: (data: { key: string; description?: string }) => api.post('/admin/rbac/permissions', data),
  deletePermission: (key: string) => api.delete(`/admin/rbac/permissions/${key}`),

  // Role-Permission assignments
  getRolePermissions: (roleId: number) => api.get(`/admin/rbac/roles/${roleId}/permissions`),
  assignPermissionsToRole: (roleId: number, permissionKeys: string[]) =>
    api.post(`/admin/rbac/roles/${roleId}/permissions`, { permissionKeys }),
  setRolePermissions: (roleId: number, data: { permissionKeys: string[] }) =>
    api.put(`/admin/rbac/roles/${roleId}/permissions`, data),
  removePermissionFromRole: (roleId: number, permissionKey: string) =>
    api.delete(`/admin/rbac/roles/${roleId}/permissions/${permissionKey}`),

  // User-Role assignments
  getUserRoles: (userId: number) => api.get(`/admin/rbac/users/${userId}/roles`),
  assignRoleToUser: (userId: number, roleId: number) =>
    api.post(`/admin/rbac/users/${userId}/roles/${roleId}`),
  removeRoleFromUser: (userId: number, roleId: number) =>
    api.delete(`/admin/rbac/users/${userId}/roles/${roleId}`)
}

// Admin User Management API
export const adminUserAPI = {
  // List and search admin users
  listAdminUsers: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) =>
    api.get('/admin/admin-users', { params }),
  searchAdminUsers: (searchTerm?: string) =>
    api.get('/admin/admin-users/search', { params: { q: searchTerm } }),

  // CRUD operations
  getAdminUser: (userId: number) => api.get(`/admin/admin-users/${userId}`),
  createAdminUser: (data: CreateAdminUserRequest) => api.post('/admin/admin-users', data),
  updateAdminUser: (userId: number, data: UpdateAdminUserRequest) =>
    api.put(`/admin/admin-users/${userId}`, data),
  deleteAdminUser: (userId: number) => api.delete(`/admin/admin-users/${userId}`),

  // Role management
  assignRolesToUser: (userId: number, roleIds: number[]) =>
    api.post(`/admin/admin-users/${userId}/roles`, roleIds),
  updateUserRoles: (userId: number, roleIds: number[]) =>
    api.put(`/admin/admin-users/${userId}/roles`, roleIds),
  removeUserFromAllRoles: (userId: number) =>
    api.delete(`/admin/admin-users/${userId}/roles`)
}

// Permission Checking API
export const permissionAPI = {
  getCurrentUserPermissions: () => api.get('/permissions/current'),
  checkPermissions: (permissions: string[]) => api.post('/permissions/check', permissions),
  checkPermission: (permission: string) => api.get(`/permissions/check/${permission}`),
  getPermissionCategories: () => api.get('/permissions/categories'),
  getUserPermissions: (userId: number) => api.get(`/permissions/user/${userId}`),
  canManageUser: (userId: number) => api.get(`/permissions/can-manage/${userId}`),
  getAdminStatus: () => api.get('/permissions/admin-status')
}

export default api
