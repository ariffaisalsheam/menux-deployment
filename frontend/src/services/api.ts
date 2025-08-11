import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

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
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
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
  }
}

// Order Management API
export const orderAPI = {
  getOrders: async (restaurantId?: number) => {
    const url = restaurantId ? `/orders/restaurant/${restaurantId}` : '/orders/manage'
    const response = await api.get(url)
    return response.data
  },

  getOrderById: async (id: number) => {
    const response = await api.get(`/orders/manage/${id}`)
    return response.data
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await api.put(`/orders/manage/${id}/status`, { status })
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

  testProvider: async (id: number) => {
    const response = await api.post(`/admin/ai-config/${id}/test`)
    return response.data
  },

  setPrimaryProvider: async (id: number) => {
    const response = await api.post(`/admin/ai-config/${id}/set-primary`)
    return response.data
  }
}

export default api
