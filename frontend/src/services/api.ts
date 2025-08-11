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
  }
}

// Restaurant Management API
export const restaurantAPI = {
  getAllRestaurants: async () => {
    const response = await api.get('/admin/restaurants')
    return response.data
  },

  getRestaurantById: async (id: number) => {
    const response = await api.get(`/restaurants/${id}`)
    return response.data
  },

  updateRestaurant: async (id: number, data: any) => {
    const response = await api.put(`/restaurants/${id}`, data)
    return response.data
  },

  getCurrentRestaurant: async () => {
    const response = await api.get('/restaurants/current')
    return response.data
  }
}

// Menu Management API
export const menuAPI = {
  getMenuItems: async (restaurantId?: number) => {
    const url = restaurantId ? `/restaurants/${restaurantId}/menu` : '/menu'
    const response = await api.get(url)
    return response.data
  },

  createMenuItem: async (data: any) => {
    const response = await api.post('/menu', data)
    return response.data
  },

  updateMenuItem: async (id: number, data: any) => {
    const response = await api.put(`/menu/${id}`, data)
    return response.data
  },

  deleteMenuItem: async (id: number) => {
    const response = await api.delete(`/menu/${id}`)
    return response.data
  }
}

// Order Management API
export const orderAPI = {
  getOrders: async (restaurantId?: number) => {
    const url = restaurantId ? `/restaurants/${restaurantId}/orders` : '/orders'
    const response = await api.get(url)
    return response.data
  },

  getOrderById: async (id: number) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status })
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

export default api
